import "@tanstack/react-start/server-only";
import type {
  FeedbackProviderKind,
  FeedbackProviderState,
} from "../../features/feedback/contracts";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";

/**
 * Server-only feedback configuration (P4-S4 / ADR-049).
 *
 * `FEEDBACK_PROVIDER` selects the implementation:
 * - `memory` (default) keeps a deterministic, bounded in-process inbox for fixture/local mode and
 *   tests. It never claims a human received the note;
 * - `github` creates a GitHub Issue in the private feedback repository through the official REST API.
 *   It requires `GITHUB_FEEDBACK_REPO` (`owner/name`) and a fine-grained `GITHUB_FEEDBACK_TOKEN`
 *   scoped to that repository with Issues write permission.
 *
 * A selected-but-incomplete GitHub configuration is never silently downgraded to memory. It is
 * reported as `misconfigured`, and submissions fail with the safe `UNAVAILABLE` contract. Problems
 * list variable names only; the token value is read here but never returned to any caller or log.
 */

const REPO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;
const TOKEN_MIN_LENGTH = 20;

export type FeedbackConfig =
  | Readonly<{ provider: "memory" }>
  | Readonly<{
      provider: "github";
      owner: string;
      repo: string;
      token: string;
      apiBase: string;
    }>
  | Readonly<{ provider: "misconfigured"; problems: readonly string[] }>;

function parseApiBase(value: string | undefined): string {
  const candidate = (value ?? "").trim();
  if (!candidate) return "https://api.github.com";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return "https://api.github.com";
    return candidate.replace(/\/+$/, "");
  } catch {
    return "https://api.github.com";
  }
}

export function readFeedbackConfig(source: RuntimeEnvSource = readRuntimeEnv()): FeedbackConfig {
  const provider = (source.FEEDBACK_PROVIDER ?? "memory").trim().toLowerCase();

  if (provider === "memory") return Object.freeze({ provider: "memory" as const });

  if (provider !== "github") {
    // Includes the retired `whatsapp` and `telegram` values: fail closed instead of switching channels.
    return Object.freeze({ provider: "misconfigured" as const, problems: ["FEEDBACK_PROVIDER"] });
  }

  const problems: string[] = [];
  const repoValue = (source.GITHUB_FEEDBACK_REPO ?? "").trim();
  const token = (source.GITHUB_FEEDBACK_TOKEN ?? "").trim();

  if (!REPO_PATTERN.test(repoValue)) problems.push("GITHUB_FEEDBACK_REPO");
  if (token.length < TOKEN_MIN_LENGTH) problems.push("GITHUB_FEEDBACK_TOKEN");

  if (problems.length > 0) {
    return Object.freeze({ provider: "misconfigured" as const, problems });
  }

  const [owner, repo] = repoValue.split("/");
  return Object.freeze({
    provider: "github" as const,
    owner,
    repo,
    token,
    apiBase: parseApiBase(source.GITHUB_FEEDBACK_API_BASE),
  });
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
  if (config.provider === "github") {
    return Object.freeze({ state: "ready" as const, provider: "github" as FeedbackProviderKind });
  }
  if (config.provider === "memory") {
    if (dataMode === "supabase-staging") {
      return Object.freeze({ state: "disabled" as const, provider: "none" as const });
    }
    return Object.freeze({ state: "ready" as const, provider: "memory" as FeedbackProviderKind });
  }
  return Object.freeze({
    state: "misconfigured" as const,
    provider: "github" as const,
    problems: config.problems,
  });
}
