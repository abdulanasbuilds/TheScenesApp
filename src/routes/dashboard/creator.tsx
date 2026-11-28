import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  MessageSquareText,
  Palette,
  Tags,
  UserPlus,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import { Badge, Card, EmptyState, Progress, buttonClass } from "@/components/ui";
import { CreatorFirstCourseChecklist } from "@/features/onboarding/getting-started";
import { EARLY_ACCESS } from "@/lib/early-access";
import { useApp } from "@/store/app-store";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/creator")({
  head: () => ({ meta: [{ title: "Creator workspace — The Scenes" }] }),
  component: CreatorDashboardPage,
});

const setupSteps = [
  {
    id: "profile",
    title: "Write the community name and description",
    hint: "Members decide in seconds whether this room is for them.",
    href: "/dashboard/community",
    icon: MessageSquareText,
  },
  {
    id: "branding",
    title: "Upload an icon and a cover image",
    hint: "Discovery cards and the community page both use them.",
    href: "/dashboard/community",
    icon: Palette,
  },
  {
    id: "categories",
    title: "Create the categories you teach",
    hint: "Group knowledge the way your audience searches for it.",
    href: "/dashboard/categories",
    icon: Tags,
  },
  {
    id: "course",
    title: "Draft your first course",
    hint: "Turn your best explanation into a structured classroom.",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    id: "event",
    title: "Schedule the first live session",
    hint: "A calendar event gives members a reason to return.",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    id: "members",
    title: "Invite your first members",
    hint: "A scene is only real once people are talking in it.",
    href: "/dashboard/members",
    icon: UserPlus,
  },
];

function CreatorDashboardPage() {
  const { communities } = useApp();
  const [completed, setCompleted] = useState<string[]>([]);
  const done = completed.length;

  return (
    <CreatorShell active="overview">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Creator workspace
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Your workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Set up your community, publish a classroom and schedule a live session. Live member,
                learning and earnings numbers appear here once your community has real activity.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">
                  {EARLY_ACCESS.creatorBadge}
                </Badge>
              </div>
            </div>
            <a href="/dashboard/community" className={buttonClass("secondary", "md")}>
              Community settings <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {communities.length ? null : (
          <EmptyState
            icon={<MessageSquareText className="h-5 w-5" />}
            title="No community yet"
            description="You have not created a community. Analytics, a member directory and earnings all stay empty until one exists."
            action={
              <a href="/dashboard/community" className={buttonClass("primary", "md")}>
                Set up your community <ArrowRight className="h-4 w-4" />
              </a>
            }
          />
        )}

        <div className="mt-6 empty:hidden">
          <CreatorFirstCourseChecklist />
        </div>

        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Finish setting up your workspace
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Tick each step as you go. Progress is stored in this browser tab only.
              </p>
            </div>
            <Progress
              value={Math.round((done / setupSteps.length) * 100)}
              className="w-full sm:w-40"
              aria-label={`Setup ${done} of ${setupSteps.length} complete`}
            />
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {setupSteps.map((step) => {
              const isDone = completed.includes(step.id);
              const StepIcon = step.icon;
              return (
                <li
                  key={step.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <button
                    type="button"
                    aria-pressed={isDone}
                    onClick={() =>
                      setCompleted((current) =>
                        current.includes(step.id)
                          ? current.filter((item) => item !== step.id)
                          : [...current, step.id],
                      )
                    }
                    aria-label={`Mark ${step.title} as ${isDone ? "not done" : "done"}`}
                    className="mt-0.5 shrink-0 text-indigo-700"
                  >
                    <span
                      className={
                        isDone
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-700 text-[11px] font-bold text-white"
                          : "flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-400"
                      }
                    >
                      {isDone ? "✓" : ""}
                    </span>
                  </button>
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        isDone
                          ? "flex items-center gap-1.5 text-sm font-semibold text-slate-400 line-through"
                          : "flex items-center gap-1.5 text-sm font-semibold text-slate-900"
                      }
                    >
                      <StepIcon
                        className="h-3.5 w-3.5 shrink-0 text-indigo-600"
                        aria-hidden="true"
                      />
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                      {step.hint}
                    </span>
                    <a
                      href={step.href}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-700"
                    >
                      Open <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Live analytics, payments and payouts are coming soon. This workspace never shows
          fabricated numbers.
        </p>
      </div>
    </CreatorShell>
  );
}
