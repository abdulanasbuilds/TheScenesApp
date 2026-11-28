import "@tanstack/react-start/server-only";
import type {
  FeedbackProviderKind,
  FeedbackProviderState,
} from "../../features/feedback/contracts";
import { normalizeWhatsAppNumber } from "../../features/feedback/whatsapp";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";

/**
 * Server-only feedback configuration (P4-S4 / ADR-048).
 *
 * `FEEDBACK_PROVIDER` selects the implementation:
 * - `memory` (default) keeps a deterministic, bounded in-process inbox for fixture/local mode and
 *   tests. It never claims a human received the note;
 * - `whatsapp` builds a direct `wa.me` handoff to the founder's WhatsApp number. No business API,
 *   webhook or paid provider is involved.
 *
 * A selected-but-incomplete WhatsApp configuration is never silently downgraded to memory. It is
 * reported as `misconfigured`, and submissions fail with the safe `UNAVAILABLE` contract. Problems
 * list variable names only; values are never read back out of this module.
 */

export type FeedbackConfig =
  | Readonly<{ provider: "memory" }>
  /** `number` is normalized to digits only (no `+`), ready for `wa.me`. */
  | Readonly<{ provider: "whatsapp"; number: string }>
  | Readonly<{ provider: "misconfigured"; problems: readonly string[] }>;

export function readFeedbackConfig(source: RuntimeEnvSource = readRuntimeEnv()): FeedbackConfig {
  const provider = (source.FEEDBACK_PROVIDER ?? "memory").trim().toLowerCase();

  if (provider === "memory") return Object.freeze({ provider: "memory" as const });

  if (provider !== "whatsapp") {
    // Includes the retired `telegram` value: fail closed instead of silently switching channels.
    return Object.freeze({ provider: "misconfigured" as const, problems: ["FEEDBACK_PROVIDER"] });
  }

  const number = normalizeWhatsAppNumber(source.WHATSAPP_FEEDBACK_NUMBER);
  if (!number) {
    return Object.freeze({
      provider: "misconfigured" as const,
      problems: ["WHATSAPP_FEEDBACK_NUMBER"],
    });
  }

  return Object.freeze({ provider: "whatsapp" as const, number });
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
  if (config.provider === "whatsapp") {
    return Object.freeze({ state: "ready" as const, provider: "whatsapp" as FeedbackProviderKind });
  }
  if (config.provider === "memory") {
    if (dataMode === "supabase-staging") {
      return Object.freeze({ state: "disabled" as const, provider: "none" as const });
    }
    return Object.freeze({ state: "ready" as const, provider: "memory" as FeedbackProviderKind });
  }
  return Object.freeze({
    state: "misconfigured" as const,
    provider: "whatsapp" as const,
    problems: config.problems,
  });
}
