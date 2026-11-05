import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileText,
  ListTree,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { getCommunity, getCourse } from "@/data/seed";
import { cn } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/classroom/$courseId/$lessonId")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    const course = getCourse(params.courseId);
    if (!community || !course || course.communitySlug !== community.slug) throw notFound();
    const lessons = course.modules.flatMap((module) => module.lessons);
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === params.lessonId);
    if (lessonIndex < 0) throw notFound();
    return {
      community,
      course,
      lesson: lessons[lessonIndex],
      previous: lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined,
      next: lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : undefined,
      lessonIndex,
      lessonCount: lessons.length,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.lesson.title ?? "Lesson"} — ${loaderData?.course.title ?? "The Scenes"}`,
      },
    ],
  }),
  component: LessonViewerPage,
});

function LessonViewerPage() {
  const { community, course, lesson, previous, next, lessonIndex, lessonCount } =
    Route.useLoaderData();
  const { state, completeLesson } = useApp();
  const { toast } = useToast();
  const [playing, setPlaying] = useState(false);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const completed = state.completedLessons.includes(lesson.id);
  const totalCompleted = course.modules
    .flatMap((module) => module.lessons)
    .filter((item) => state.completedLessons.includes(item.id)).length;
  const courseProgress = Math.round((totalCompleted / lessonCount) * 100);

  const markComplete = () => {
    completeLesson(lesson.id);
    toast(
      "Lesson complete",
      next ? "Your next lesson is ready." : "You reached the end of this course.",
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <a
            href={`/c/${community.slug}/classroom/${course.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Course overview</span>
          </a>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{course.title}</p>
          <div className="hidden w-32 items-center gap-2 sm:flex">
            <Progress value={courseProgress} />
            <span className="text-[10px] font-bold text-slate-500">{courseProgress}%</span>
          </div>
          <a
            href="/my-learning"
            aria-label="My learning"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden xl:inline">My learning</span>
          </a>
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setCurriculumOpen((value) => !value)}
            aria-expanded={curriculumOpen}
          >
            <ListTree className="h-4 w-4" /> Lessons
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[minmax(0,1fr)_330px]">
        <main className="min-w-0 bg-white" aria-labelledby="lesson-title">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="outline">
                Lesson {lessonIndex + 1} of {lessonCount}
              </Badge>
              <Badge tone="slate">{lesson.type}</Badge>
              <span className="text-xs text-slate-500">{lesson.duration}</span>
            </div>
            <h1
              id="lesson-title"
              className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-slate-950 sm:text-4xl"
            >
              {lesson.title}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">{lesson.summary}</p>

            {lesson.type === "video" ? (
              <div className="mt-7 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-white shadow-sm">
                <div className="relative aspect-video">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#312e81_0,#0f172a_62%)]">
                    <button
                      type="button"
                      onClick={() => setPlaying((value) => !value)}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-800 shadow-xl transition-transform hover:scale-105"
                      aria-label={playing ? "Pause lesson preview" : "Play lesson preview"}
                    >
                      {playing ? (
                        <Pause className="h-6 w-6 fill-current" />
                      ) : (
                        <Play className="ml-1 h-6 w-6 fill-current" />
                      )}
                    </button>
                    <p className="mt-4 text-sm font-semibold">
                      {playing ? "Playing simulated lesson" : "Video presentation preview"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Media provider is intentionally not connected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-slate-800 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setPlaying((value) => !value)}
                    className="text-slate-300 hover:text-white"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                  </button>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={cn("h-full rounded-full bg-indigo-400", playing ? "w-2/5" : "w-0")}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    00:00 / {lesson.duration}
                  </span>
                </div>
              </div>
            ) : (
              <Card className="mt-7 flex items-center gap-4 border-indigo-100 bg-indigo-50 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-indigo-700 ring-1 ring-indigo-100">
                  {lesson.type === "exercise" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {lesson.type === "exercise" ? "Practical exercise" : "Reading lesson"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Work through the notes below at your own pace.
                  </p>
                </div>
              </Card>
            )}

            <article className="mt-8 space-y-5 text-[15px] leading-7 text-slate-700">
              {lesson.body.map((paragraph, index) => (
                <p key={`${lesson.id}-${index}`}>{paragraph}</p>
              ))}
              <div className="rounded-xl border-l-4 border-indigo-600 bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">
                <strong className="font-bold">Working note:</strong> Do the smallest version of the
                exercise before adding tools. Post the result to the community if you want feedback.
              </div>
            </article>

            {lesson.resources.length ? (
              <section className="mt-10" aria-labelledby="resources-heading">
                <h2
                  id="resources-heading"
                  className="font-display text-xl font-extrabold text-slate-900"
                >
                  Lesson resources
                </h2>
                <div className="mt-3 space-y-2">
                  {lesson.resources.map((resource) => (
                    <button
                      key={resource.label}
                      type="button"
                      onClick={() =>
                        toast(
                          "Resource preview",
                          `${resource.label} will download when file storage is connected.`,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-indigo-700">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {resource.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {resource.kind} · {resource.meta}
                        </span>
                      </span>
                      <Download className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
              {previous ? (
                <a
                  href={`/c/${community.slug}/classroom/${course.slug}/${previous.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"
                >
                  <ArrowLeft className="h-4 w-4" />{" "}
                  <span>
                    <span className="block text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                      Previous
                    </span>
                    {previous.title}
                  </span>
                </a>
              ) : (
                <span />
              )}
              <div className="ml-auto flex gap-2">
                {completed ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      toast("Already complete", "Lesson completion is recorded in preview state.")
                    }
                  >
                    <Check className="h-4 w-4 text-emerald-600" /> Completed
                  </Button>
                ) : (
                  <Button onClick={markComplete}>
                    <Check className="h-4 w-4" /> Mark complete
                  </Button>
                )}
                {next ? (
                  <a
                    href={`/c/${community.slug}/classroom/${course.slug}/${next.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </main>

        <aside
          className={cn(
            "border-l border-slate-200 bg-slate-50 lg:block",
            curriculumOpen ? "block" : "hidden",
          )}
          aria-label="Course curriculum"
        >
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Course curriculum</h2>
                <span className="text-xs text-slate-500">
                  {totalCompleted}/{lessonCount}
                </span>
              </div>
              <Progress value={courseProgress} className="mt-3" />
            </div>
            {course.modules.map((module, moduleIndex) => (
              <details key={module.id} open className="group border-b border-slate-200">
                <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700">
                  <span className="font-mono text-indigo-700">0{moduleIndex + 1}</span>
                  <span className="flex-1">{module.title}</span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                </summary>
                {module.lessons.map((item) => {
                  const isCurrent = item.id === lesson.id;
                  const isDone = state.completedLessons.includes(item.id);
                  return (
                    <a
                      key={item.id}
                      href={`/c/${community.slug}/classroom/${course.slug}/${item.id}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 border-t border-slate-200/70 px-4 py-3 text-xs",
                        isCurrent
                          ? "bg-indigo-50 text-indigo-900"
                          : "bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          isDone
                            ? "bg-emerald-50 text-emerald-700"
                            : isCurrent
                              ? "bg-indigo-700 text-white"
                              : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {isDone ? (
                          <Check className="h-3 w-3" />
                        ) : isCurrent ? (
                          <Play className="h-2.5 w-2.5 fill-current" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-5">{item.title}</span>
                        <span className="text-[10px] opacity-70">{item.duration}</span>
                      </span>
                    </a>
                  );
                })}
              </details>
            ))}
            <div className="p-4">
              <button
                type="button"
                onClick={() =>
                  toast(
                    "Progress preserved",
                    "Reset is disabled in this preview to protect your local completion state.",
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset course progress
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
