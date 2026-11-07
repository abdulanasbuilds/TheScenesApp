const APPROVED_AUTH_NEXT_PATHS = ["/home", "/onboarding", "/settings"] as const;

export type AuthNextPath = (typeof APPROVED_AUTH_NEXT_PATHS)[number];

export function normalizeAuthNext(value: unknown, fallback: AuthNextPath = "/home"): AuthNextPath {
  return typeof value === "string" &&
    (APPROVED_AUTH_NEXT_PATHS as readonly string[]).includes(value)
    ? (value as AuthNextPath)
    : fallback;
}

export function buildEmailConfirmationRedirect(requestUrl: URL): string {
  let origin: string;

  if (
    requestUrl.protocol === "http:" &&
    (requestUrl.hostname === "127.0.0.1" || requestUrl.hostname === "localhost") &&
    requestUrl.port === "5000"
  ) {
    origin = "http://127.0.0.1:5000";
  } else if (requestUrl.protocol === "https:") {
    origin = requestUrl.origin;
  } else {
    throw new Error("The application origin is not approved for email confirmation.");
  }

  const redirect = new URL("/auth/confirm", origin);
  redirect.searchParams.set("next", "/onboarding");
  return redirect.toString();
}
