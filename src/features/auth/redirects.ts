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
 * Local development is pinned to loopback port 5000. A hosted request must match the explicitly
 * configured HTTPS `APP_ORIGIN`; accepting an arbitrary request host would make a forged Host header
 * part of an account-email link. An unapproved origin fails closed.
 */
export function resolveApprovedAccountEmailOrigin(
  requestUrl: URL,
  configuredHostedOrigin?: unknown,
): string {
  if (
    requestUrl.protocol === "http:" &&
    (requestUrl.hostname === "127.0.0.1" || requestUrl.hostname === "localhost") &&
    requestUrl.port === "5000"
  ) {
    return "http://127.0.0.1:5000";
  }
  const approvedHostedOrigin = normalizeApprovedHostedOrigin(configuredHostedOrigin);
  if (requestUrl.protocol === "https:" && requestUrl.origin === approvedHostedOrigin) {
    return approvedHostedOrigin;
  }
  throw new Error("The application origin is not approved for account email.");
}

/** Return a canonical HTTPS origin, or null when a configured value is absent or unsafe. */
export function normalizeApprovedHostedOrigin(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function buildEmailConfirmationRedirect(
  requestUrl: URL,
  configuredHostedOrigin?: unknown,
): string {
  const redirect = new URL(
    "/auth/confirm",
    resolveApprovedAccountEmailOrigin(requestUrl, configuredHostedOrigin),
  );
  redirect.searchParams.set("next", "/onboarding");
  return redirect.toString();
}

/** The recovery email must return to the recovery-only route. No other path or parameter is allowed. */
export function buildPasswordRecoveryRedirect(
  requestUrl: URL,
  configuredHostedOrigin?: unknown,
): string {
  return new URL(
    "/reset-password",
    resolveApprovedAccountEmailOrigin(requestUrl, configuredHostedOrigin),
  ).toString();
}
