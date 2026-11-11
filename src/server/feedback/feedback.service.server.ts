import "@tanstack/react-start/server-only";
import { getRequestIP } from "@tanstack/react-start/server";
import type { FeedbackReceipt } from "../../features/feedback/contracts";
import type { FeedbackSubmissionInput } from "../../features/feedback/schemas";
import { PublicAppError } from "../../features/shared/safe-handler";
import { logServerEvent } from "../http/logger.server";
import {
  assertRateLimit,
  consumeRateLimit,
  type RateLimitDecision,
  type RateLimitPolicyName,
} from "../security/rate-limit.server";
import { getVerifiedPrincipal, type VerifiedPrincipal } from "../supabase/auth.server";
import { readFeedbackConfig, type FeedbackConfig } from "./feedback-config.server";
import {
  FeedbackProviderError,
  MemoryFeedbackProvider,
  TelegramFeedbackProvider,
  type FeedbackMessage,
  type FeedbackProvider,
} from "./feedback-provider.server";

/**
 * P4-S4 feedback service.
 *
 * The caller-bound submission is rate-limited, validated, and reduced to the minimum operator
 * context: message, route, pseudonymous user ID (signed-in only), timestamp and request ID. No
 * cookie, token, email address, browser storage, protected content or raw header is ever included.
 */

let memoryProvider = new MemoryFeedbackProvider();

function providerFor(config: FeedbackConfig): FeedbackProvider {
  if (config.provider === "telegram") {
    return new TelegramFeedbackProvider({ botToken: config.botToken, chatId: config.chatId });
  }
  return memoryProvider;
}

/** Test-only reset for the deterministic in-memory inbox. */
export function resetFeedbackProviderForTests(): void {
  memoryProvider = new MemoryFeedbackProvider();
}

async function signedInPrincipal(): Promise<VerifiedPrincipal | null> {
  const { getServerEnv } = await import("../env.server");
  let dataMode: string;
  try {
    dataMode = getServerEnv().dataMode;
  } catch {
    // No runtime mode is configured. Rendering treats that as the fixture path, and anonymous
    // feedback is the safe equivalent: there is no Supabase client to verify a principal with.
    dataMode = "fixtures";
  }
  if (dataMode === "fixtures") return null;
  return getVerifiedPrincipal();
}

function clientKey(): string | null {
  try {
    return getRequestIP({ xForwardedFor: false }) ?? null;
  } catch {
    return null;
  }
}

export type FeedbackServiceOptions = Readonly<{
  config?: FeedbackConfig;
  provider?: FeedbackProvider;
  principal?: VerifiedPrincipal | null;
  clientKey?: string | null;
  consumeLimit?: (policy: RateLimitPolicyName, subject: string) => Promise<RateLimitDecision>;
  now?: () => number;
  logger?: (
    level: "info" | "warn" | "error",
    event: string,
    detail: Record<string, unknown>,
  ) => void;
}>;

export async function submitFeedback(
  input: FeedbackSubmissionInput,
  options: FeedbackServiceOptions = {},
): Promise<FeedbackReceipt> {
  const config = options.config ?? readFeedbackConfig();
  const now = options.now ?? (() => Date.now());
  const log = options.logger ?? logServerEvent;

  if (config.provider === "misconfigured") {
    log("warn", "feedback_provider_misconfigured", { problems: config.problems });
    throw new PublicAppError(
      "UNAVAILABLE",
      "Feedback is temporarily unavailable. Please try again shortly.",
    );
  }

  const principal = options.principal !== undefined ? options.principal : await signedInPrincipal();
  const ip = options.clientKey !== undefined ? options.clientKey : clientKey();
  const subject = principal ? principal.userId : `anonymous:${ip ?? "unknown"}`;

  const consumeLimit = options.consumeLimit ?? consumeRateLimit;
  const decision = await consumeLimit("feedback", subject);
  assertRateLimit(
    decision,
    "You have sent several notes recently. Please wait before sending another.",
  );

  const message: FeedbackMessage = {
    text: input.message,
    route: input.route,
    pseudonymousUserId: principal?.userId ?? null,
    occurredAt: new Date(now()).toISOString(),
    requestId: crypto.randomUUID(),
  };

  const provider = options.provider ?? providerFor(config);

  try {
    const result = await provider.submit(message);
    log("info", "feedback_accepted", {
      provider: provider.kind,
      delivery: result.delivery,
      route: input.route,
      signedIn: principal !== null,
    });
    return Object.freeze({
      accepted: true as const,
      delivery: result.delivery,
      reference: result.reference,
    });
  } catch (error) {
    const cause = error instanceof FeedbackProviderError ? error.cause : "unknown";
    log("warn", "feedback_provider_failed", { provider: provider.kind, cause });
    throw new PublicAppError(
      "UNAVAILABLE",
      "Feedback could not be delivered. Please keep your note and try again shortly.",
    );
  }
}
