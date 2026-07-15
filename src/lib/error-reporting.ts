type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Central place to hook up an error-tracking service (Sentry, etc.) later.
 * For now it just logs to the console so errors aren't lost silently.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorReportOptions = {},
) {
  if (typeof window === "undefined") return;
  console.error("[app error]", error, {
    route: window.location.pathname,
    ...context,
    ...options,
  });
}
