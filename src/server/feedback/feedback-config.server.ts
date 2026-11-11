import "@tanstack/react-start/server-only";
import type {
  FeedbackProviderKind,
  FeedbackProviderState,
} from "../../features/feedback/contracts";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";

/**
 * Server-only feedback configuration (P4-S4).
 *
 * `FEEDBACK_PROVIDER` selects the implementation:
 * - `memory` (default) keeps a deterministic, bounded in-process inbox for fixture/local mode and
 *   tests. It never claims a human received the note;
 * - `telegram` posts to the founder-approved internal Telegram chat.
 *
 * A selected-but-incomplete Telegram configuration is never silently downgraded to memory. It is
 * reported as `misconfigured`, and submissions fail with the safe `UNAVAILABLE` contract. Problems
 * list variable names only; values are never read back out of this module.
 */

export type FeedbackConfig =
  | Readonly<{ provider: "memory" }>
  | Readonly<{ provider: "telegram"; botToken: string; chatId: string }>
  | Readonly<{ provider: "misconfigured"; problems: readonly string[] }>;

/** Telegram bot tokens look like `123456789:AA...` (35+ characters after the colon). */
const TELEGRAM_BOT_TOKEN = /^\d{6,12}:[A-Za-z0-9_-]{30,64}$/;
/** Numeric chat IDs (possibly negative for groups/channels) or an `@channelusername`. */
const TELEGRAM_CHAT_ID = /^(?:-?\d{5,20}|@[A-Za-z0-9_]{5,32})$/;

export function readFeedbackConfig(source: RuntimeEnvSource = readRuntimeEnv()): FeedbackConfig {
  const provider = (source.FEEDBACK_PROVIDER ?? "memory").trim().toLowerCase();

  if (provider === "memory") return Object.freeze({ provider: "memory" as const });

  if (provider !== "telegram") {
    return Object.freeze({ provider: "misconfigured" as const, problems: ["FEEDBACK_PROVIDER"] });
  }

  const botToken = (source.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (source.TELEGRAM_FEEDBACK_CHAT_ID ?? "").trim();
  const problems: string[] = [];

  if (!TELEGRAM_BOT_TOKEN.test(botToken)) problems.push("TELEGRAM_BOT_TOKEN");
  if (!TELEGRAM_CHAT_ID.test(chatId)) problems.push("TELEGRAM_FEEDBACK_CHAT_ID");

  if (problems.length > 0) {
    return Object.freeze({ provider: "misconfigured" as const, problems: Object.freeze(problems) });
  }

  return Object.freeze({ provider: "telegram" as const, botToken, chatId });
}

/**
 * Report the feedback provider by name and state only. No value is ever returned.
 *
 * The in-memory provider is a local preview: in a connected deployment it is reported as `disabled`
 * so an operator sees that no delivery destination exists instead of assuming feedback is delivered.
 */
export function describeFeedbackProvider(
  config: FeedbackConfig,
  dataMode: "fixtures" | "supabase-local" | "supabase-staging" | string = "fixtures",
): FeedbackProviderState {
  if (config.provider === "telegram") {
    return Object.freeze({ state: "ready" as const, provider: "telegram" as FeedbackProviderKind });
  }
  if (config.provider === "memory") {
    if (dataMode === "supabase-staging") {
      return Object.freeze({ state: "disabled" as const, provider: "none" as const });
    }
    return Object.freeze({ state: "ready" as const, provider: "memory" as FeedbackProviderKind });
  }
  return Object.freeze({
    state: "misconfigured" as const,
    provider: "telegram" as const,
    problems: config.problems,
  });
}
