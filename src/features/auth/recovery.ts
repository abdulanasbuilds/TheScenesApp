/**
 * Pure account-recovery helpers shared by the route, service and tests.
 *
 * This module performs no I/O, imports no provider or server module and never logs. Supabase Auth
 * remains the only confirmation/recovery token authority; the application only asks Auth to start a
 * reset and consumes the PKCE code it returns.
 */

/** The single acknowledgement shown for any recovery request, whether or not the account exists. */
export const RECOVERY_ACKNOWLEDGEMENT =
  "If an account exists for that address, we started a reset link.";

export type RecoveryRequestOutcome = "acknowledged" | "rate-limited" | "unavailable";

export type ProviderErrorShape = Readonly<{
  status?: number | null;
  code?: string | null;
}> | null;

/**
 * Classify a provider error without exposing account existence.
 *
 * - no error, or a 4xx other than 429: treated as acknowledged (Auth deliberately hides unknown
 *   accounts and malformed requests);
 * - 429: rate limited;
 * - network failure (status 0) or 5xx: a real availability problem the user may retry.
 */
export function classifyRecoveryRequestError(error: ProviderErrorShape): RecoveryRequestOutcome {
  if (!error) return "acknowledged";
  const status = error.status ?? 0;
  if (status === 429) return "rate-limited";
  if (status === 0 || status >= 500) return "unavailable";
  return "acknowledged";
}

const RECOVERY_CODE = /^[A-Za-z0-9._~-]{8,1024}$/;

/** PKCE recovery codes are URL-safe and bounded. Anything else is rejected before any Auth call. */
export function isRecoveryCodeWellFormed(value: unknown): value is string {
  return typeof value === "string" && RECOVERY_CODE.test(value);
}

export type RecoveryLinkState =
  Readonly<{ kind: "code"; code: string }> | Readonly<{ kind: "invalid" }>;

/**
 * Read the recovery link state from a raw query string.
 *
 * The caller must replace the visible URL with `cleanPath` immediately, before any network call, so
 * that the code or provider error parameters never remain in the address bar or in analytics.
 */
export function readRecoveryLink(search: string): Readonly<{
  state: RecoveryLinkState;
  cleanPath: string;
}> {
  const cleanPath = "/reset-password";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (
    params.has("error") ||
    params.has("error_code") ||
    params.has("error_description") ||
    params.has("token") ||
    params.has("token_hash")
  ) {
    return { state: { kind: "invalid" }, cleanPath };
  }
  const code = params.get("code");
  return isRecoveryCodeWellFormed(code)
    ? { state: { kind: "code", code }, cleanPath }
    : { state: { kind: "invalid" }, cleanPath };
}
