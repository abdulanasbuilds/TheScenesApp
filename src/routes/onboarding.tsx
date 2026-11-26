import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { getCurrentViewer } from "@/features/auth/auth.functions";
import { resolveRuntimeDataMode } from "@/features/shared/runtime-mode";

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "creator" ? ("creator" as const) : ("learner" as const),
  }),
  loader: async () => {
    if ((await resolveRuntimeDataMode()) === "fixtures") return;
    const result = await getCurrentViewer({ data: undefined });
    if (!result.ok || !result.data) {
      throw redirect({
        to: "/login",
        search: { confirmation: undefined, reset: undefined, next: "/onboarding" },
      });
    }
  },
  head: () => ({ meta: [{ title: "Set up your Scenes profile" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { role } = Route.useSearch();
  return <OnboardingWizard initialRole={role} />;
}
