import { Outlet, createFileRoute, notFound, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Search } from "lucide-react";
import { CourseCard, MiniLearningCard } from "@/components/domain/cards";
import { CommunityShell } from "@/components/layout/community-shell";
import { Card, Chip, EmptyState, Progress } from "@/components/ui";
import { courses, getCommunity } from "@/data/seed";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/classroom")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.community.name ?? "Community"} classroom — The Scenes` }],
  }),
  component: ClassroomRoute,
});

function ClassroomRoute() {
  const { community } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, ""),
  });
  const basePath = `/c/${community.slug}/classroom`;
  const isLibrary = pathname === basePath;

  return (
    <CommunityShell community={community} active="classroom">
      {isLibrary ? <CourseLibrary communitySlug={community.slug} /> : <Outlet />}
    </CommunityShell>
  );
}

function CourseLibrary({ communitySlug }: { communitySlug: string }) {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const library = courses.filter((course) => course.communitySlug === communitySlug);
  const visible = useMemo(
    () =>
      library.filter(
        (course) =>
          (level === "All" || course.level === level) &&
          (!query.trim() ||
            `${course.title} ${course.subtitle}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [library, level, query],
  );
  const enrolled = library.filter((course) => state.enrolledCourses.includes(course.id));
  const firstEnrolled = enrolled[0];
  const completedForCourse = firstEnrolled
    ? firstEnrolled.modules
        .flatMap((module) => module.lessons)
        .filter((lesson) => state.completedLessons.includes(lesson.id)).length
    : 0;
  const totalForCourse = firstEnrolled?.modules.flatMap((module) => module.lessons).length ?? 0;
  const progress = totalForCourse ? Math.round((completedForCourse / totalForCourse) * 100) : 0;

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Classroom
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
                Learn in sequence.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Short courses, working resources and progress you can see.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="course-search" className="sr-only">
                Search courses
              </label>
              <input
                id="course-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this classroom"
                className="h-10 w-full rounded-lg border border-slate-300 pr-3 pl-9 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {firstEnrolled ? (
          <Card className="mb-7 overflow-hidden">
            <div className="grid md:grid-cols-[1.2fr_0.8fr]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Continue learning
                </div>
                <h2 className="mt-2 font-display text-xl font-extrabold text-slate-900">
                  {firstEnrolled.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{firstEnrolled.subtitle}</p>
                <div className="mt-5 flex items-center gap-3">
                  <Progress value={progress} className="max-w-sm flex-1" />
                  <span className="text-xs font-bold text-slate-600">{progress}%</span>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 p-4 md:border-t-0 md:border-l">
                <MiniLearningCard
                  title={
                    firstEnrolled.modules[0]?.lessons[
                      Math.min(
                        completedForCourse,
                        (firstEnrolled.modules[0]?.lessons.length ?? 1) - 1,
                      )
                    ]?.title ?? "Continue course"
                  }
                  community={firstEnrolled.title}
                  progress={progress}
                  href={`/c/${communitySlug}/classroom/${firstEnrolled.slug}/${firstEnrolled.modules[0]?.lessons[0]?.id}`}
                />
              </div>
            </div>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", "Beginner", "Intermediate", "Advanced"].map((item) => (
              <Chip key={item} active={level === item} onClick={() => setLevel(item)}>
                {item}
              </Chip>
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500">{visible.length} courses</p>
        </div>

        {visible.length ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((course) => {
              const allLessons = course.modules.flatMap((module) => module.lessons);
              const done = allLessons.filter((item) =>
                state.completedLessons.includes(item.id),
              ).length;
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={
                    state.enrolledCourses.includes(course.id) && allLessons.length
                      ? Math.round((done / allLessons.length) * 100)
                      : 0
                  }
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            icon={<BookOpen className="h-5 w-5" />}
            title="No courses in this view"
            description="Try another level or clear your classroom search."
          />
        )}
      </div>
    </>
  );
}
