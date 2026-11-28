import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Compass, Sparkles, X } from "lucide-react";
import { Badge, Button, Card, Progress, buttonClass } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  courseIsFreeToStart,
  firstLessonHref,
  focusAreaLabels,
  recommendedCourses,
} from "./contracts";
import { useOnboardingProfile } from "./profile-store";

/**
 * Learner home quick-start.
 *
 * Returning or brand-new members see one clear action: open the first lesson of a free-to-start
 * course matched to their onboarding focus. The card is browser-local and dismissible; it never
 * blocks the rest of the home page.
 */
export function LearnerGettingStarted() {
  const router = useRouter();
  const { profile, hydrated } = useOnboardingProfile();
  const { courses, communities, currentMember, enroll, joinCommunity } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string[]>([]);

  if (!hydrated || dismissed) return null;

  if (!profile.completedAt) {
    return (
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
              New here?
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-900">
              Set up The Scenes in 30 seconds
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Tell us whether you want to learn or teach, pick a focus, and we will point you at
              your first useful lesson.
            </p>
          </div>
          <a href="/onboarding" className={buttonClass("primary", "md")}>
            Start setup <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </Card>
    );
  }

  const recommended =
    (profile.firstCourseId && courses.find((course) => course.id === profile.firstCourseId)) ||
    recommendedCourses(
      courses,
      profile.focusAreas,
      (course) => courseIsFreeToStart(course, communities),
      1,
    )[0];

  const labels = focusAreaLabels(profile.focusAreas);
  const firstName = (profile.displayName || currentMember?.name || "there").split(" ")[0];
  const firstLesson = recommended?.modules.flatMap((module) => module.lessons)[0];

  const start = async () => {
    if (!recommended) {
      await router.navigate({ href: "/explore" });
      return;
    }
    setBusy(true);
    try {
      await joinCommunity(recommended.communitySlug);
      await enroll(recommended.id);
    } catch {
      // Preview or connection errors should not block the learner from opening the lesson.
    }
    setBusy(false);
    await router.navigate({ href: firstLessonHref(recommended) });
  };

  const steps = [
    {
      id: "lesson",
      label: "Start your first lesson",
      hint: recommended ? recommended.title : "Browse the catalogue",
      href: recommended ? firstLessonHref(recommended) : "/explore",
    },
    {
      id: "community",
      label: "Join a room for your focus",
      hint: labels.length ? labels.join(" · ") : "Find people learning the same thing",
      href: recommended ? `/c/${recommended.communitySlug}` : "/explore",
    },
    {
      id: "profile",
      label: "Add your headline",
      hint: "Help people understand your context",
      href: "/settings",
    },
  ];
  const completed = done.length;

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
            Welcome to The Scenes, {firstName}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-900">
            {recommended ? "Start with one useful lesson" : "Find your first lesson"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss getting-started guide"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {labels.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <Badge key={label} tone="outline">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}

      {recommended ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-700 text-white">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{recommended.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                {firstLesson?.title ?? "Opening lesson"} ·{" "}
                {courseIsFreeToStart(recommended, communities)
                  ? "Free to start"
                  : `${recommended.hours}h`}
              </p>
            </div>
          </div>
          <Button onClick={() => void start()} disabled={busy} className="shrink-0">
            {busy ? "Opening..." : "Start first lesson"}{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <a href="/explore" className={buttonClass("primary", "md", "mt-4")}>
          <Compass className="h-4 w-4" aria-hidden="true" /> Explore the catalogue
        </a>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
            Getting started
          </p>
          <span className="text-[11px] font-semibold text-slate-500">
            {completed} of {steps.length} done
          </span>
        </div>
        <Progress
          value={(completed / steps.length) * 100}
          className="mt-2"
          label={`Getting started ${completed} of ${steps.length} complete`}
        />
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {steps.map((step) => {
            const complete = done.includes(step.id);
            return (
              <li key={step.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    aria-pressed={complete}
                    aria-label={`Mark ${step.label} as ${complete ? "not done" : "done"}`}
                    onClick={() =>
                      setDone((current) =>
                        current.includes(step.id)
                          ? current.filter((item) => item !== step.id)
                          : [...current, step.id],
                      )
                    }
                    className="shrink-0 rounded-full"
                  >
                    <CheckCircle2
                      className={cn("h-4 w-4", complete ? "text-emerald-600" : "text-slate-300")}
                      aria-hidden="true"
                    />
                  </button>
                  <a href={step.href} className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-xs font-semibold",
                        complete ? "text-slate-400 line-through" : "text-slate-800",
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {step.hint}
                    </span>
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

/**
 * Creator overview checklist that turns "I want to teach" into a first course.
 *
 * Kept separate from the wider community-setup checklist so a new creator always sees the single
 * most valuable action: publishing a first course.
 */
export function CreatorFirstCourseChecklist() {
  const { profile, hydrated } = useOnboardingProfile();
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState<string[]>([]);

  if (!hydrated || dismissed) return null;

  const labels = focusAreaLabels(profile.focusAreas);
  const steps = [
    {
      id: "outline",
      title: "Outline your course",
      hint: "Write the one-sentence promise a member will get.",
      href: "/dashboard/courses",
    },
    {
      id: "lesson",
      title: "Draft your first lesson",
      hint: "Ten minutes of teaching is enough to publish.",
      href: "/dashboard/courses",
    },
    {
      id: "outcomes",
      title: "Add outcomes and a cover",
      hint: "Help people decide this course is for them.",
      href: "/dashboard/courses",
    },
    {
      id: "publish",
      title: "Publish and share the link",
      hint: "Your community is the first audience.",
      href: "/dashboard/community",
    },
  ];
  const completed = done.length;

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
            {profile.role === "creator" ? "Because you chose to teach" : "Creator quick start"}
          </p>
          <h2 className="mt-1 font-display text-lg font-extrabold tracking-tight text-slate-900">
            Create your first course
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {labels.length
              ? `Turn your ${labels.join(" and ")} knowledge into a course members can finish.`
              : "Turn your best explanation into a structured classroom."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss create-your-first-course checklist"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <Badge tone={completed === steps.length ? "green" : "outline"}>
          {completed} of {steps.length} complete
        </Badge>
        <a href="/dashboard/courses" className="text-xs font-bold text-indigo-700">
          Open courses
        </a>
      </div>
      <Progress
        value={(completed / steps.length) * 100}
        className="mt-2"
        label={`First course ${completed} of ${steps.length} complete`}
      />

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const complete = done.includes(step.id);
          return (
            <li key={step.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  aria-pressed={complete}
                  aria-label={`Mark ${step.title} as ${complete ? "not done" : "done"}`}
                  onClick={() =>
                    setDone((current) =>
                      current.includes(step.id)
                        ? current.filter((item) => item !== step.id)
                        : [...current, step.id],
                    )
                  }
                  className="mt-0.5 shrink-0 rounded-full"
                >
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <a href={step.href} className="block">
                    <span
                      className={cn(
                        "block text-xs font-semibold",
                        complete ? "text-slate-400 line-through" : "text-slate-900",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                      {step.hint}
                    </span>
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-4 text-slate-500">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Progress here lasts this session. Publishing stays in preview until its integrations are
        connected.
      </p>
    </Card>
  );
}
