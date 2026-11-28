import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeAuthNext } from "@/features/auth/redirects";

/**
 * Supabase Auth confirmation return point.
 *
 * The approved email template uses Supabase's `{{ .ConfirmationURL }}`. Supabase verifies the token
 * at its `/auth/v1/verify` endpoint before redirecting here, so this route must not try to consume a
 * second token. It reduces any provider error to a safe state, normalizes the next path and redirects
 * without forwarding provider parameters to the login URL.
 */
export const Route = createFileRoute("/auth/confirm")({
  validateSearch: (search: Record<string, unknown>) => ({
    confirmation:
      typeof search.error === "string" || typeof search.error_code === "string"
        ? ("error" as const)
        : ("complete" as const),
    next: normalizeAuthNext(search.next, "/onboarding"),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/login",
      search: { confirmation: search.confirmation, reset: undefined, next: search.next },
      replace: true,
    });
  },
  component: () => null,
});
