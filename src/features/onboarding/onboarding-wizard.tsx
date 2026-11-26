import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Compass,
  GraduationCap,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";
import { Brand } from "@/components/layout/public-shell";
import { Avatar, Badge, Button, Card, Chip, Field, Input, Progress } from "@/components/ui";
import { updateOwnProfile } from "@/features/auth/auth.functions";
import { useApp, useToast } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  AVATAR_HUES,
  FOCUS_AREAS,
  ROLE_OPTIONS,
  courseIsFreeToStart,
  focusAreaLabels,
  firstLessonHref,
  recommendedCourses,
  type OnboardingProfile,
  type OnboardingRole,
} from "./contracts";
import { saveOnboardingProfile } from "./profile-store";

const STEP_LABELS = ["Goals & focus", "Profile", "First step"] as const;

function hueGradient(hue: number) {
  return `linear-gradient(140deg, hsl(${hue} 46% 42%), hsl(${(hue + 38) % 360} 54% 30%))`;
}

export function OnboardingWizard({ initialRole }: { initialRole: OnboardingRole }) {
  const router = useRouter();
  const { signInDemo, joinCommunity, currentMember, dataMode, communities, courses, enroll } =
    useApp();
  const { toast } = useToast();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<OnboardingRole>(initialRole);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [name, setName] = useState(
    currentMember?.name ?? (dataMode === "fixtures" ? "Ama Boateng" : ""),
  );
  const [handle, setHandle] = useState(
    currentMember?.handle ?? (dataMode === "fixtures" ? "amaboateng" : ""),
  );
  const [avatarHue, setAvatarHue] = useState<number>(AVATAR_HUES[0]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const recommendations = useMemo(
    () =>
      recommendedCourses(
        courses,
        focusAreas,
        (course) => courseIsFreeToStart(course, communities),
        3,
      ),
    [communities, courses, focusAreas],
  );
  const selectedCourse =
    recommendations.find((course) => course.id === selectedCourseId) ?? recommendations[0] ?? null;

  const toggleFocus = (id: string) =>
    setFocusAreas((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const next = () => {
    if (step === 2 && name.trim().length < 2) {
      setError("Add a display name with at least 2 characters.");
      return;
    }
    setError("");
    setStep((value) => Math.min(3, value + 1));
  };

  const back = () => {
    setError("");
    setStep((value) => Math.max(1, value - 1));
  };

  const finish = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setStep(2);
      setError("Add a display name with at least 2 characters.");
      return;
    }
    const profile: OnboardingProfile = {
      role,
      focusAreas,
      displayName: trimmed,
      avatarHue,
      firstCourseId: selectedCourse?.id ?? null,
      completedAt: new Date().toISOString(),
    };
    saveOnboardingProfile(profile);

    if (dataMode === "fixtures") {
      signInDemo();
      if (selectedCourse) {
        try {
          await joinCommunity(selectedCourse.communitySlug);
          await enroll(selectedCourse.id);
        } catch {
          // Preview state errors must never block the handoff to the home screen.
        }
      }
      toast(
        role === "creator" ? "Creator workspace ready" : "You're all set",
        role === "creator"
          ? "Your first-course checklist is waiting in the workspace."
          : selectedCourse
            ? `Your first course is ready: ${selectedCourse.title}.`
            : "Browse the catalogue to pick your first course.",
      );
      await router.navigate({ href: role === "creator" ? "/dashboard/creator" : "/home" });
      return;
    }

    setSubmitting(true);
    const result = await updateOwnProfile({ data: { displayName: trimmed } });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await router.invalidate();
    toast(
      "Profile updated",
      role === "creator"
        ? "Your creator workspace is ready to open."
        : "Your first lessons are ready on your home page.",
    );
    await router.navigate({ href: role === "creator" ? "/dashboard/creator" : "/home" });
  };

  const focusLabel = focusAreaLabels(focusAreas).join(", ");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <span className="text-xs font-semibold text-slate-500" aria-live="polite">
            Step {step} of {STEP_LABELS.length}
          </span>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10"
      >
        <Stepper step={step} />

        <div key={step} className="mt-6 animate-[onboarding-step-in_160ms_ease-out]">
          {step === 1 ? (
            <div>
              <div className="max-w-xl">
                <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                  Make The Scenes yours
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 focus:outline-none sm:text-4xl"
                >
                  What brings you here?
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Two quick choices. You can change both later.
                </p>
              </div>

              <fieldset className="mt-6">
                <legend className="sr-only">Your goal</legend>
                <div role="radiogroup" aria-label="Your goal" className="grid gap-3 sm:grid-cols-2">
                  {ROLE_OPTIONS.map((option) => {
                    const active = role === option.value;
                    const Icon = option.value === "learner" ? GraduationCap : MessageSquareText;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRole(option.value)}
                        className={cn(
                          "relative rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-200"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            active ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600",
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="mt-3 block pr-7 text-sm font-bold text-slate-900">
                          {option.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                          {option.description}
                        </span>
                        {active ? (
                          <Check
                            className="absolute top-4 right-4 h-5 w-5 text-indigo-700"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-7">
                <legend className="text-[13px] font-semibold text-slate-800">
                  What do you want to focus on?
                </legend>
                <p className="mt-1 text-xs text-slate-500">
                  Pick any that fit. We use this to choose your first course.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FOCUS_AREAS.map((area) => {
                    const active = focusAreas.includes(area.id);
                    return (
                      <Chip
                        key={area.id}
                        active={active}
                        onClick={() => toggleFocus(area.id)}
                        className="px-4 py-2.5 text-sm"
                      >
                        {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                        {area.label}
                      </Chip>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {focusAreas.length
                    ? `${focusAreas.length} selected · free to change later`
                    : "No pressure — skip and we will start you with a popular free course."}
                </p>
              </fieldset>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <Card className="p-5 text-center">
                <div className="flex justify-center">
                  <Avatar name={name || "New member"} size={88} hue={avatarHue} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {name.trim() || "Your name"}
                </p>
                <p className="text-xs text-slate-500">@{handle || "handle"}</p>
                <fieldset className="mt-4">
                  <legend className="sr-only">Avatar tint</legend>
                  <div className="flex flex-wrap justify-center gap-2">
                    {AVATAR_HUES.map((hue, index) => {
                      const active = avatarHue === hue;
                      return (
                        <button
                          key={hue}
                          type="button"
                          aria-pressed={active}
                          aria-label={`Avatar tint ${index + 1}`}
                          onClick={() => setAvatarHue(hue)}
                          className={cn(
                            "h-8 w-8 rounded-full ring-offset-2 transition-shadow",
                            active
                              ? "ring-2 ring-slate-900"
                              : "ring-1 ring-slate-200 hover:ring-slate-400",
                          )}
                          style={{ background: hueGradient(hue) }}
                        />
                      );
                    })}
                  </div>
                </fieldset>
                <p className="mt-3 text-[11px] leading-4 text-slate-500">
                  Generated avatar. Photo upload activates when storage is connected.
                </p>
              </Card>

              <Card className="p-5 sm:p-6">
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-2xl font-extrabold tracking-tight text-slate-950 focus:outline-none"
                >
                  How should we introduce you?
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  This is how people recognise you in the rooms you join.
                </p>
                <div className="mt-5 space-y-4">
                  <Field label="Display name" htmlFor="onboarding-name" required>
                    <Input
                      id="onboarding-name"
                      autoComplete="name"
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
                </div>
              </Card>
            </div>
          ) : null}

          {step === 3 && role === "learner" ? (
            <div>
              <div className="max-w-xl">
                <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                  Your first step
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 focus:outline-none sm:text-4xl"
                >
                  Start with one useful lesson.
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {focusLabel
                    ? `Free-to-start courses matched to ${focusLabel}.`
                    : "Popular free-to-start courses from working practitioners."}{" "}
                  Pick one — it will be waiting on your home page.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {recommendations.map((course) => {
                  const active = selectedCourse?.id === course.id;
                  const free = courseIsFreeToStart(course, communities);
                  const lessons = course.modules.flatMap((module) => module.lessons);
                  return (
                    <Card
                      as="article"
                      key={course.id}
                      className={cn(
                        "p-4 transition-colors sm:p-5",
                        active ? "border-indigo-300 ring-1 ring-indigo-200" : "",
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedCourseId(course.id)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                          <BookOpen className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{course.title}</span>
                            <Badge tone={free ? "green" : "outline"}>
                              {free ? "Free to start" : `${course.hours}h`}
                            </Badge>
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">
                            {course.subtitle}
                          </span>
                          <span className="mt-2 block text-[11px] font-semibold text-slate-500">
                            {course.modules.length} modules · {lessons.length} lessons
                          </span>
                        </span>
                        {active ? (
                          <CheckCircle2
                            className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="mt-0.5 h-5 w-5 shrink-0 text-slate-300"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </Card>
                  );
                })}

                {!recommendations.length ? (
                  <Card className="p-6 text-center">
                    <Compass className="mx-auto h-6 w-6 text-indigo-700" aria-hidden="true" />
                    <p className="mt-3 font-bold text-slate-900">Explore the catalogue next</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Your home page will point you at the best free starting point.
                    </p>
                  </Card>
                ) : null}

                {selectedCourse ? (
                  <p className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs leading-5 text-indigo-900">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    First up: {selectedCourse.modules[0]?.lessons[0]?.title ??
                      "the opening lesson"}{" "}
                    in {selectedCourse.title}.{" "}
                    <a
                      href={firstLessonHref(selectedCourse)}
                      className="font-bold underline underline-offset-2"
                    >
                      Preview it now
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 3 && role === "creator" ? (
            <div>
              <div className="max-w-xl">
                <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                  Your first step
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 focus:outline-none sm:text-4xl"
                >
                  Turn your knowledge into a course.
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {focusLabel
                    ? `We will set up your workspace around ${focusLabel}.`
                    : "We will set up your workspace and point you at the first lesson to draft."}
                </p>
              </div>

              <Card className="mt-6 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-700 text-white">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                      Create your first course
                    </p>
                    <p className="text-sm font-bold text-slate-900">Four short steps</p>
                  </div>
                </div>
                <ol className="mt-4 space-y-3">
                  {[
                    ["Outline the promise", "One sentence: what will a member be able to do?"],
                    ["Draft the first lesson", "Ten minutes of teaching is enough to publish."],
                    ["Add outcomes and a cover", "Help people decide this course is for them."],
                    ["Publish and share the link", "Your community is the first audience."],
                  ].map(([title, hint], index) => (
                    <li key={title} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-800">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{title}</span>
                        <span className="block text-xs leading-5 text-slate-500">{hint}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-500">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Publishing, payments and live sessions stay in preview until their integrations
                  are connected.
                </p>
              </Card>
            </div>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {step > 1 ? (
              <Button variant="secondary" onClick={back} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
              </Button>
            ) : null}
          </div>
          {step < 3 ? (
            <Button onClick={next} className="w-full sm:w-auto">
              Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              onClick={() => void finish()}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting
                ? "Saving..."
                : role === "creator"
                  ? "Open creator workspace"
                  : "Enter The Scenes"}{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          About 30 seconds · everything can change later
        </p>
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div>
      <Progress
        value={(step / STEP_LABELS.length) * 100}
        label={`Onboarding step ${step} of ${STEP_LABELS.length}`}
      />
      <ol className="mt-3 flex items-center gap-2" aria-label="Onboarding progress">
        {STEP_LABELS.map((label, index) => {
          const value = index + 1;
          const done = value < step;
          const current = value === step;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  done
                    ? "bg-indigo-700 text-white"
                    : current
                      ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300"
                      : "bg-slate-100 text-slate-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : value}
              </span>
              <span
                className={cn(
                  "hidden truncate text-xs font-semibold sm:block",
                  current ? "text-slate-900" : done ? "text-slate-600" : "text-slate-400",
                )}
              >
                {label}
              </span>
              {index < STEP_LABELS.length - 1 ? (
                <span
                  className={cn("h-px flex-1", done ? "bg-indigo-300" : "bg-slate-200")}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
