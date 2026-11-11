import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeAuthNext } from "@/features/auth/redirects";

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
