import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  GraduationCap,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { EventCard, ProductCard } from "@/components/domain/cards";
import { MemberShell } from "@/components/layout/member-shell";
import {
  Badge,
  Button,
  Card,
  Chip,
  CoverArt,
  EmptyState,
  Input,
  Progress,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  buttonClass,
} from "@/components/ui";
import { communities, courses, events, getCommunity, products } from "@/data/seed";
import { formatCompact } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/my-learning")({
  head: () => ({
    meta: [
      { title: "My learning — The Scenes" },
      {
        name: "description",
        content: "Courses, saved resources and events in one place.",
      },
    ],
  }),
  component: MyLearningPage,
});

type CourseFilter = "all" | "in-progress" | "completed" | "not-started";

function MyLearningPage() {
  const { state } = useApp();
  const [tab, setTab] = useState("courses");
  const [filter, setFilter] = useState<CourseFilter>("all");
  const [query, setQuery] = useState("");

  const enrolled = useMemo(
    () =>
      courses
        .filter((course) => state.enrolledCourses.includes(course.id))
        .map((course) => {
          const lessons = course.modules.flatMap((module) => module.lessons);
          const done = lessons.filter((lesson) => state.completedLessons.includes(lesson.id));
          const next = lessons.find((lesson) => !state.completedLessons.includes(lesson.id));
          const progress = lessons.length ? Math.round((done.length / lessons.length) * 100) : 0;
          const minutes = done.reduce(
            (sum, lesson) => sum + (parseInt(lesson.duration, 10) || 0),
            0,
          );
          const status: Exclude<CourseFilter, "all"> =
            progress === 100 ? "completed" : progress > 0 ? "in-progress" : "not-started";
          return {
            course,
            lessons,
            done,
            next,
            progress,
            minutes,
            status,
            community: getCommunity(course.communitySlug),
          };
        }),
    [state.completedLessons, state.enrolledCourses],
  );

  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return enrolled.filter((item) => {
      const filterMatch = filter === "all" || item.status === filter;
      const queryMatch =
        !normalized ||
        `${item.course.title} ${item.course.subtitle} ${item.community?.name ?? ""}`
          .toLowerCase()
          .includes(normalized);
      return filterMatch && queryMatch;
    });
  }, [enrolled, filter, query]);

  const savedProducts = products.filter((product) => state.saved.includes(product.slug));
  const rsvpEvents = events.filter((event) => state.rsvps.includes(event.id));
  const totalMinutes = enrolled.reduce((sum, item) => sum + item.minutes, 0);
  const totalDone = enrolled.reduce((sum, item) => sum + item.done.length, 0);
  const active = enrolled.filter((item) => item.status === "in-progress").length;
  const completed = enrolled.filter((item) => item.status === "completed").length;
  const recommended = courses
    .filter(
      (course) =>
        state.joined.includes(course.communitySlug) &&
        !state.enrolledCourses.includes(course.id) &&
        course.status === "published",
    )
    .slice(0, 3);

  return (
    <MemberShell active="learning">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Your library
                </p>
                <Badge tone="outline">Progress saved in this session</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                My learning
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Every course you joined, the lesson you should open next, saved resources and the
                sessions you confirmed.
              </p>
            </div>
            <a href="/search?type=courses" className={buttonClass("secondary", "md")}>
              <Compass className="h-4 w-4" /> Find another course
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Active courses" value={active} hint={`${completed} completed`} />
          <Stat label="Lessons finished" value={totalDone} hint="Across enrolled courses" />
          <Stat
            label="Time in lessons"
            value={`${totalMinutes} min`}
            hint="Based on lesson lengths"
          />
          <Stat label="Saved resources" value={state.saved.length} hint="Local bookmark list" />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="courses">Courses ({enrolled.length})</TabsTrigger>
              <TabsTrigger value="saved">Saved ({savedProducts.length})</TabsTrigger>
              <TabsTrigger value="events">Events ({rsvpEvents.length})</TabsTrigger>
            </TabsList>
            <p className="text-xs text-slate-500">
              Progress is stored in browser memory for this preview.
            </p>
          </div>

          <TabsContent value="courses">
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-56 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <label htmlFor="learning-search" className="sr-only">
                  Search your courses
                </label>
                <Input
                  id="learning-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your courses or communities"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "All"],
                    ["in-progress", "In progress"],
                    ["completed", "Completed"],
                    ["not-started", "Not started"],
                  ] as const
                ).map(([value, label]) => (
                  <Chip key={value} active={filter === value} onClick={() => setFilter(value)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {visibleCourses.length ? (
              <div className="mt-4 space-y-4">
                {visibleCourses.map((item) => {
                  const nextLesson = item.next ?? item.lessons[0];
                  const href = nextLesson
                    ? `/c/${item.course.communitySlug}/classroom/${item.course.slug}/${nextLesson.id}`
                    : `/c/${item.course.communitySlug}/classroom/${item.course.slug}`;
                  return (
                    <Card key={item.course.id} className="overflow-hidden">
                      <div className="grid gap-0 sm:grid-cols-[190px_minmax(0,1fr)]">
                        <CoverArt
                          seed={item.course.slug}
                          hue={item.course.accentHue}
                          rounded="rounded-none"
                          className="h-36 w-full sm:h-full"
                          label={item.community?.name}
                        />
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  tone={
                                    item.status === "completed"
                                      ? "green"
                                      : item.status === "in-progress"
                                        ? "indigo"
                                        : "slate"
                                  }
                                >
                                  {item.status === "completed" ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : null}
                                  {item.status === "completed"
                                    ? "Completed"
                                    : item.status === "in-progress"
                                      ? "In progress"
                                      : "Not started"}
                                </Badge>
                                <Badge tone="outline">{item.course.level}</Badge>
                              </div>
                              <h2 className="mt-2 font-display text-xl font-extrabold leading-snug text-slate-900">
                                <a
                                  href={`/c/${item.course.communitySlug}/classroom/${item.course.slug}`}
                                  className="hover:text-indigo-700"
                                >
                                  {item.course.title}
                                </a>
                              </h2>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {item.community?.name ?? "Community"} · {item.course.modules.length}{" "}
                                modules · {item.lessons.length} lessons
                              </p>
                            </div>
                            <p className="font-display text-2xl font-extrabold text-slate-900">
                              {item.progress}%
                            </p>
                          </div>

                          <Progress value={item.progress} className="mt-4" />

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold tracking-[0.12em] text-slate-600 uppercase">
                                {item.status === "completed" ? "Course finished" : "Next lesson"}
                              </p>
                              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                                {item.status === "completed"
                                  ? "Review any lesson at your own pace"
                                  : (nextLesson?.title ?? "Open the course overview")}
                              </p>
                              {nextLesson ? (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                                  <Clock3 className="h-3 w-3" /> {nextLesson.duration}
                                </p>
                              ) : null}
                            </div>
                            <a href={href} className={buttonClass("primary", "sm")}>
                              <Play className="h-3.5 w-3.5" />
                              {item.status === "completed"
                                ? "Review"
                                : item.progress
                                  ? "Continue"
                                  : "Start"}
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                className="mt-4"
                icon={<BookOpen className="h-5 w-5" />}
                title="No courses match this view"
                description="Try another filter or clear the search. Your enrolled courses stay here."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            )}

            {recommended.length ? (
              <section className="mt-8" aria-labelledby="recommended-heading">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2
                      id="recommended-heading"
                      className="font-display text-xl font-extrabold text-slate-900"
                    >
                      Available in your communities
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      You have access, but have not enrolled yet.
                    </p>
                  </div>
                  <a href="/search?type=courses" className="text-xs font-bold text-indigo-700">
                    Browse all courses
                  </a>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recommended.map((course) => {
                    const community = getCommunity(course.communitySlug);
                    return (
                      <Card key={course.id} className="overflow-hidden">
                        <CoverArt
                          seed={course.slug}
                          hue={course.accentHue}
                          rounded="rounded-none"
                          className="h-28"
                        />
                        <div className="p-4">
                          <Badge tone="outline">{course.level}</Badge>
                          <h3 className="mt-2 font-display text-base font-extrabold leading-snug text-slate-900">
                            {course.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{community?.name}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <Clock3 className="h-3.5 w-3.5" /> {course.hours} hours
                            </span>
                            <a
                              href={`/c/${course.communitySlug}/classroom/${course.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700"
                            >
                              View course <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </TabsContent>

          <TabsContent value="saved">
            {savedProducts.length ? (
              <>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {savedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Saved resources are bookmarks only. No purchase or download is implied.
                </p>
              </>
            ) : (
              <EmptyState
                className="mt-4"
                icon={<Bookmark className="h-5 w-5" />}
                title="No saved resources yet"
                description="Use the bookmark button on any marketplace listing to keep it here."
                action={
                  <a href="/marketplace" className={buttonClass("primary", "md")}>
                    Browse marketplace
                  </a>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="events">
            {rsvpEvents.length ? (
              <>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {rsvpEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Confirmed events are local RSVPs. No calendar invite or reminder is sent.
                </p>
              </>
            ) : (
              <EmptyState
                className="mt-4"
                icon={<CalendarDays className="h-5 w-5" />}
                title="No confirmed events"
                description="Open a community calendar and confirm a session to see it here."
                action={
                  <a
                    href={`/c/${state.joined[0] ?? "ai-builders-guild"}/calendar`}
                    className={buttonClass("primary", "md")}
                  >
                    Open calendar
                  </a>
                }
              />
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8 grid gap-4 border-indigo-100 bg-indigo-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-950">
                Keep the next step small.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
                One lesson, one note, one question in the community. Progress is easier to continue
                when the next action is obvious.
              </p>
            </div>
          </div>
          <a
            href={`/c/${state.joined[0] ?? "ai-builders-guild"}`}
            className={buttonClass("secondary", "md")}
          >
            Open your community
          </a>
        </Card>

        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-slate-600">
          <GraduationCap className="h-3.5 w-3.5" />
          {formatCompact(communities.length)} communities · {formatCompact(courses.length)} courses
          in the preview catalogue
        </p>
      </div>
    </MemberShell>
  );
}
