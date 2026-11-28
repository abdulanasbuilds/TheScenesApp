import { Outlet, createFileRoute, notFound, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  Check,
  ChevronDown,
  Clock3,
  ListChecks,
  Lock,
  Play,
  Star,
  Users,
} from "lucide-react";
import { MediaCover } from "@/components/domain/media-upload";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ComingSoonBadge,
  CoverArt,
  FeatureTeaserModal,
  Progress,
} from "@/components/ui";
import { getCreator } from "@/data/seed";
import { loadCatalogForRoute } from "@/features/learning/catalog-loader";
import { EARLY_ACCESS, courseAccessLabel } from "@/lib/early-access";
import { cn, formatCompact } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/classroom/$courseId")({
  loader: async ({ params }) => {
    const catalog = await loadCatalogForRoute();
    const community = catalog.communities.find((item) => item.slug === params.communityId);
    const course = catalog.courses.find((item) => item.slug === params.courseId);
    if (!community || !course || course.communitySlug !== community.slug) throw notFound();
    return { community, course };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.course.title ?? "Course"} — The Scenes` }],
  }),
  component: CourseRoute,
});

function CourseRoute() {
  const { community, course } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, ""),
  });
  const basePath = `/c/${community.slug}/classroom/${course.slug}`;
  return pathname === basePath ? <CourseOverview /> : <Outlet />;
}

function CourseOverview() {
  const { community, course } = Route.useLoaderData();
  const instructor = getCreator(course.instructorHandle);
  const { state, enroll } = useApp();
  const { toast } = useToast();
  const enrolled = state.enrolledCourses.includes(course.id);
  const allLessons = course.modules.flatMap((module) => module.lessons);
  const completed = allLessons.filter((lesson) =>
    state.completedLessons.includes(lesson.id),
  ).length;
  const progress = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;
  const firstIncomplete =
    allLessons.find((lesson) => !state.completedLessons.includes(lesson.id)) ?? allLessons[0];
  const [pending, setPending] = useState(false);
  const [teaser, setTeaser] = useState<"certificate" | "quizzes" | null>(null);

  const handleEnroll = async () => {
    if (pending) return;
    setPending(true);
    try {
      await enroll(course.id);
      toast("Enrolled for free", "Your enrolment is saved to your account.");
    } catch (error) {
      toast("Could not enrol", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <nav
            className="flex items-center gap-2 overflow-hidden text-xs font-medium text-slate-500"
            aria-label="Breadcrumb"
          >
            <a href={`/c/${community.slug}/classroom`} className="shrink-0 hover:text-indigo-700">
              Classroom
            </a>
            <span>/</span>
            <span className="truncate text-slate-700">{course.title}</span>
          </nav>
        </div>
      </div>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_380px] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-400/30">
                {course.level}
              </Badge>
              <Badge className="bg-white/10 text-slate-200 ring-1 ring-white/15">
                {course.hours} hours
              </Badge>
              {course.price === "included" ? (
                <Badge tone="green">Included with membership</Badge>
              ) : null}
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {course.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {formatCompact(course.students)} learners
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {course.rating} (
                {course.reviews})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" /> {allLessons.length} lessons
              </span>
            </div>
            <div className="mt-7 flex items-center gap-3">
              <Avatar
                name={course.instructorName ?? instructor?.name ?? "Instructor"}
                size={42}
                online
              />
              <div>
                <p className="text-sm font-semibold">
                  Taught by {course.instructorName ?? instructor?.name ?? "Instructor"}
                </p>
                <p className="text-xs text-slate-600">
                  {course.instructorHeadline ?? instructor?.headline}
                </p>
              </div>
            </div>
          </div>
          <MediaCover
            src={course.coverUrl}
            seed={course.slug}
            hue={course.accentHue}
            label={course.title}
            rounded="rounded-2xl"
            className="aspect-[16/10] border border-white/10"
          />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              What you will be able to do
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <div
                  key={outcome}
                  className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-6 text-slate-700"
                >
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> {outcome}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900">Curriculum</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {course.modules.length} modules · {allLessons.length} lessons
                </p>
              </div>
              {enrolled ? <Badge tone="green">{completed} complete</Badge> : null}
            </div>
            <div className="mt-4 space-y-3">
              {course.modules.map((module, moduleIndex) => (
                <details
                  key={module.id}
                  open={moduleIndex === 0}
                  className="group rounded-xl border border-slate-200 bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                    <span className="font-mono text-xs font-bold text-indigo-700">
                      0{moduleIndex + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-slate-900">{module.title}</span>
                    <span className="text-xs text-slate-500">{module.lessons.length} lessons</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-slate-100">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const done = state.completedLessons.includes(lesson.id);
                      const accessible = enrolled || lesson.free;
                      return (
                        <a
                          key={lesson.id}
                          href={
                            accessible
                              ? `/c/${community.slug}/classroom/${course.slug}/${lesson.slug ?? lesson.id}`
                              : undefined
                          }
                          aria-disabled={!accessible}
                          className={cn(
                            "flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0",
                            accessible ? "hover:bg-slate-50" : "cursor-not-allowed opacity-60",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full",
                              done
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {done ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : accessible ? (
                              <Play className="h-3 w-3 fill-current" />
                            ) : (
                              <Lock className="h-3 w-3" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800">
                              {lesson.title}
                            </span>
                            <span className="text-xs text-slate-500">
                              {lesson.type} · {lesson.duration}
                            </span>
                          </span>
                          {lesson.free ? <Badge tone="outline">Preview</Badge> : null}
                          <span className="font-mono text-[10px] text-slate-600">
                            {moduleIndex + 1}.{lessonIndex + 1}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            {enrolled ? (
              <>
                <p className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
                  Your progress
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="font-display text-3xl font-extrabold text-slate-900">{progress}%</p>
                  <p className="text-xs text-slate-500">
                    {completed} of {allLessons.length} lessons
                  </p>
                </div>
                <Progress value={progress} className="mt-3" tone="emerald" />
                <a
                  href={`/c/${community.slug}/classroom/${course.slug}/${firstIncomplete?.slug ?? firstIncomplete?.id}`}
                  className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
                >
                  <Play className="h-4 w-4 fill-white" />{" "}
                  {progress ? "Continue course" : "Start course"}
                </a>
              </>
            ) : (
              <>
                <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                  Course access
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                  {courseAccessLabel(course.price)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Free for early access. Enrol now and start learning — no payment is collected.
                </p>
                <Button className="mt-5 w-full" size="lg" onClick={handleEnroll} disabled={pending}>
                  {EARLY_ACCESS.enrollLabel}
                </Button>
                <p className="mt-3 text-center text-[11px] leading-4 text-slate-500">
                  Free for early access. Your enrolment is recorded on your account and no payment
                  is processed.
                </p>
              </>
            )}
          </Card>
          <Card className="mt-4 p-4">
            <h3 className="text-sm font-bold text-slate-900">About the instructor</h3>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={course.instructorName ?? instructor?.name ?? "Instructor"} size={40} />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {course.instructorName ?? instructor?.name ?? "Instructor"}
                </p>
                <p className="text-xs text-slate-500">
                  {course.instructorLocation ?? instructor?.location}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">
              {course.instructorBio ?? instructor?.bio}
            </p>
          </Card>
          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">Coming soon on this course</h3>
              <ComingSoonBadge>Not live yet</ComingSoonBadge>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              Two parts of the learning experience are not connected yet. Open either for details
              and an early-access request.
            </p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setTeaser("certificate")}
                className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">
                  <Award className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-xs font-semibold text-slate-900">
                  Certificate of completion
                </span>
                <ComingSoonBadge>Soon</ComingSoonBadge>
              </button>
              <button
                type="button"
                onClick={() => setTeaser("quizzes")}
                className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <ListChecks className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-xs font-semibold text-slate-900">
                  Quizzes &amp; knowledge checks
                </span>
                <ComingSoonBadge>Soon</ComingSoonBadge>
              </button>
            </div>
          </Card>
        </aside>
      </div>

      <FeatureTeaserModal
        open={teaser === "certificate"}
        onOpenChange={(open) => (!open ? setTeaser(null) : undefined)}
        feature="Certificates"
        title="Course certificates are coming soon"
        description="Completing a course does not issue a certificate yet."
        points={[
          "A certificate needs verified completion, a stable course record and a downloadable file.",
          "No certificate is created, stored or emailed in this preview.",
        ]}
      />
      <FeatureTeaserModal
        open={teaser === "quizzes"}
        onOpenChange={(open) => (!open ? setTeaser(null) : undefined)}
        feature="Quizzes"
        title="Quizzes and knowledge checks are coming soon"
        description="Lessons are reading and exercise content for now."
        points={[
          "Quizzes need question banks, scoring and a server-side record of attempts.",
          "Nothing is graded or saved when you complete a lesson today.",
        ]}
      />
    </>
  );
}
