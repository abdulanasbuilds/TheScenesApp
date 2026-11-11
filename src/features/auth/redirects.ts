const APPROVED_AUTH_NEXT_PATHS = ["/home", "/onboarding", "/settings"] as const;

export type AuthNextPath = (typeof APPROVED_AUTH_NEXT_PATHS)[number];

export function normalizeAuthNext(value: unknown, fallback: AuthNextPath = "/home"): AuthNextPath {
  return typeof value === "string" &&
    (APPROVED_AUTH_NEXT_PATHS as readonly string[]).includes(value)
    ? (value as AuthNextPath)
    : fallback;
}

/**
 * Resolve the only origins approved for account-email redirects.
 *
 * Local development is pinned to loopback port 5000; every hosted environment must use HTTPS. An
 * unapproved origin fails closed rather than silently redirecting somewhere unexpected.
 */
export function resolveApprovedAccountEmailOrigin(requestUrl: URL): string {
  if (
    requestUrl.protocol === "http:" &&
    (requestUrl.hostname === "127.0.0.1" || requestUrl.hostname === "localhost") &&
    requestUrl.port === "5000"
  ) {
    return "http://127.0.0.1:5000";
  }
  if (requestUrl.protocol === "https:") {
    return requestUrl.origin;
  }
  throw new Error("The application origin is not approved for account email.");
}

export function buildEmailConfirmationRedirect(requestUrl: URL): string {
  const redirect = new URL("/auth/confirm", resolveApprovedAccountEmailOrigin(requestUrl));
  redirect.searchParams.set("next", "/onboarding");
  return redirect.toString();
}

/** The recovery email must return to the recovery-only route. No other path or parameter is allowed. */
export function buildPasswordRecoveryRedirect(requestUrl: URL): string {
  return new URL("/reset-password", resolveApprovedAccountEmailOrigin(requestUrl)).toString();
}
