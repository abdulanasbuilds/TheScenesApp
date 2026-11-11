import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, UserRound } from "lucide-react";
import { Brand } from "@/components/layout/public-shell";
import { Button, Card, Chip, Field, Input, Progress } from "@/components/ui";
import { getCurrentViewer, updateOwnProfile } from "@/features/auth/auth.functions";
import { resolveRuntimeDataMode } from "@/features/shared/runtime-mode";
import { useApp, useToast } from "@/store/app-store";

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
  const router = useRouter();
  const search = Route.useSearch();
  const { signInDemo, joinCommunity, currentMember, dataMode, categories, communities } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(
    currentMember?.name ?? (dataMode === "fixtures" ? "Ama Boateng" : ""),
  );
  const [handle, setHandle] = useState(
    currentMember?.handle ?? (dataMode === "fixtures" ? "amaboateng" : ""),
  );
  const [role, setRole] = useState<"learner" | "creator">(search.role);
  const [interests, setInterests] = useState<string[]>(() =>
    dataMode === "fixtures"
      ? ["ai-automation", "design"]
      : categories.slice(0, 2).map((item) => item.slug),
  );
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [error, setError] = useState("");

  const next = () => {
    if (step === 1 && (name.trim().length < 2 || handle.trim().length < 3)) {
      setError("Add your name and a handle with at least 3 characters.");
      return;
    }
    if (step === 2 && !interests.length) {
      setError("Choose at least one interest.");
      return;
    }
    setError("");
    setStep((value) => Math.min(3, value + 1));
  };
  const toggleInterest = (slug: string) =>
    setInterests((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  const recommendations = communities
    .filter(
      (community) =>
        interests.includes(community.categorySlug) &&
        (dataMode === "fixtures" || community.privacy === "public"),
    )
    .slice(0, 3);

  const finish = async () => {
    if (dataMode === "fixtures") {
      signInDemo();
      recommendations.forEach((community) => joinCommunity(community.slug));
      toast("Setup complete", `Your ${role} preview is ready.`);
    } else {
      const result = await updateOwnProfile({ data: { displayName: name } });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      try {
        for (const slug of selectedCommunities) await joinCommunity(slug);
      } catch (joinError) {
        setError(joinError instanceof Error ? joinError.message : "Could not join the community.");
        return;
      }
      await router.invalidate();
      toast(
        "Profile updated",
        role === "creator"
          ? "Creator intent is saved only for this preview; no creator authority was granted."
          : dataMode === "supabase-staging"
            ? "Your pre-production profile is ready. Interests and recommendations are not connected yet."
            : "Your local profile is ready. Interests and recommendations are not connected yet.",
      );
    }
    await router.navigate({ href: role === "creator" ? "/dashboard/creator" : "/home" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <span className="text-xs font-semibold text-slate-500">Step {step} of 3</span>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Progress value={(step / 3) * 100} className="mx-auto max-w-2xl" />
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            Make The Scenes useful
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            {step === 1
              ? "Start with a name."
              : step === 2
                ? "What do you want to get better at?"
                : "Your first rooms are ready."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {step === 1
              ? dataMode === "fixtures"
                ? "This fixture profile is how people will recognise you in communities."
                : "Your display name can change, but your registered handle stays fixed."
              : step === 2
                ? "Pick a few subjects. The taxonomy stays broad outside and structured inside."
                : "Join any recommendation now or keep exploring after setup."}
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl">
          {step === 1 ? (
            <Card className="mx-auto max-w-xl p-5 sm:p-7">
              <div className="mb-6 flex justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                  <UserRound className="h-8 w-8" />
                </span>
              </div>
              <div className="space-y-4">
                <Field label="Display name" htmlFor="onboarding-name" required>
                  <Input
                    id="onboarding-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field
                  label="Profile handle"
                  htmlFor="onboarding-handle"
                  hint={
                    dataMode === "fixtures"
                      ? "Letters and numbers only"
                      : "Your registered handle cannot be changed"
                  }
                  required
                >
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">
                      @
                    </span>
                    <Input
                      id="onboarding-handle"
                      className="pl-7"
                      value={handle}
                      readOnly={dataMode !== "fixtures"}
                      onChange={(event) =>
                        setHandle(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
                      }
                    />
                  </div>
                </Field>
                <fieldset>
                  <legend className="text-[13px] font-semibold text-slate-800">
                    I am mainly here to
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        ["learner", "Learn and participate"],
                        ["creator", "Teach and build"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRole(value)}
                        className={`rounded-xl border p-3 text-left text-sm font-semibold ${role === value ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        {role === value ? (
                          <Check className="mb-2 h-4 w-4 text-indigo-700" />
                        ) : (
                          <span className="mb-2 block h-4" />
                        )}
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </Card>
          ) : null}
          {step === 2 ? (
            <Card className="p-5 sm:p-7">
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    active={interests.includes(category.slug)}
                    onClick={() => toggleInterest(category.slug)}
                    className="px-4 py-2.5 text-sm"
                  >
                    {interests.includes(category.slug) ? <Check className="h-3.5 w-3.5" /> : null}
                    {category.name}
                  </Chip>
                ))}
              </div>
              <p className="mt-6 text-center text-xs text-slate-500">
                Selected {interests.length} · you can change this later
              </p>
            </Card>
          ) : null}
          {step === 3 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {recommendations.map((community) => {
                const selected = selectedCommunities.includes(community.slug);
                return (
                  <Card key={community.id} className="p-5">
                    <p className="font-display text-lg font-extrabold text-slate-900">
                      {community.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{community.tagline}</p>
                    <Button
                      className="mt-4 w-full"
                      variant={selected ? "secondary" : "primary"}
                      onClick={() =>
                        setSelectedCommunities((current) =>
                          selected
                            ? current.filter((slug) => slug !== community.slug)
                            : [...current, community.slug],
                        )
                      }
                    >
                      {selected ? <Check className="h-4 w-4" /> : null}
                      {selected ? "Selected" : "Select community"}
                    </Button>
                  </Card>
                );
              })}
              {!recommendations.length ? (
                <Card className="col-span-full p-8 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-indigo-700" />
                  <p className="mt-3 font-bold text-slate-900">Explore the full catalogue next</p>
                </Card>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="mt-4 text-center text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
          <div className="mt-7 flex items-center justify-center gap-3">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((value) => value - 1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => void finish()}>
                {role === "creator" ? "Open creator workspace" : "Enter The Scenes"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
