import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  PlayCircle,
  Link2,
  ExternalLink,
  GraduationCap,
  ArrowLeft,
  Lock,
  Clock,
} from "lucide-react";
import { useAppStore, type Course, type Lesson, getVideoEmbed } from "@/lib/app-store";

export const Route = createFileRoute("/app/classroom")({
  head: () => ({ meta: [{ title: "Classroom · SukaSpace" }] }),
  component: Classroom,
});

const SOURCE_META: Record<string, { label: string; color: string }> = {
  gdrive: { label: "Google Drive", color: "bg-green-100 text-green-700" },
  dropbox: { label: "Dropbox", color: "bg-blue-100 text-blue-700" },
  onedrive: { label: "OneDrive", color: "bg-sky-100 text-sky-700" },
  notion: { label: "Notion", color: "bg-slate-100 text-slate-700" },
  github: { label: "GitHub", color: "bg-gray-100 text-gray-700" },
  canva: { label: "Canva", color: "bg-violet-100 text-violet-700" },
  figma: { label: "Figma", color: "bg-orange-100 text-orange-700" },
  other: { label: "Link", color: "bg-slate-100 text-slate-500" },
};

type View = "catalog" | "player";

function Classroom() {
  const store = useAppStore();
  const [view, setView] = useState<View>("catalog");
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  const openCourse = (courseId: number) => {
    const course = store.courses.find((c) => c.id === courseId);
    if (!course) return;
    // Auto-select first unlocked lesson, or first lesson if none unlocked yet
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const firstUnlocked = allLessons.find((l) => store.isLessonUnlocked(courseId, l.id));
    const firstLesson = firstUnlocked ?? allLessons[0] ?? null;
    setActiveCourseId(courseId);
    setActiveLessonId(firstLesson?.id ?? null);
    setView("player");
  };

  if (view === "player" && activeCourseId) {
    const course = store.courses.find((c) => c.id === activeCourseId);
    if (!course) return null;
    return (
      <CoursePlayer
        course={course}
        activeLessonId={activeLessonId}
        onSelectLesson={setActiveLessonId}
        onBack={() => setView("catalog")}
      />
    );
  }

  return <CourseCatalog onOpen={openCourse} />;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

function CourseCatalog({ onOpen }: { onOpen: (id: number) => void }) {
  const store = useAppStore();
  const [tab, setTab] = useState<"my" | "all">("my");

  const myCourseIds = store.enrollments.map((e) => e.courseId);
  const myCourses = store.courses.filter((c) => myCourseIds.includes(c.id));
  const allCourses = store.courses.filter((c) => c.published);

  const courses = tab === "my" ? myCourses : allCourses;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Classroom</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your enrolled courses and available curriculum.
        </p>
      </div>
      <div className="flex gap-1 mb-6 rounded-xl bg-accent p-1 w-fit">
        {(["my", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "my" ? "My courses" : "All courses"}
          </button>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap size={36} className="text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {tab === "my" ? "No enrolled courses yet" : "No published courses"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tab === "my"
              ? "Explore communities to find and enroll in courses."
              : "Check back later."}
          </p>
          {tab === "my" && (
            <button
              onClick={() => setTab("all")}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Browse all courses
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const allLessons = course.modules.flatMap((m) => m.lessons);
            const enrollment = store.enrollments.find(
              (e) => e.courseId === course.id && e.userEmail === store.session?.email,
            );
            const completed = enrollment
              ? allLessons.filter((l) => enrollment.completedLessonIds.includes(l.id)).length
              : 0;
            const pct = allLessons.length > 0 ? (completed / allLessons.length) * 100 : 0;
            const isEnrolled = !!enrollment;

            return (
              <button
                key={course.id}
                onClick={() => onOpen(course.id)}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 transition"
              >
                <div className="flex items-start gap-2">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {course.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{allLessons.length} lessons</div>
                  </div>
                </div>
                {isEnrolled && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {completed}/{allLessons.length} complete
                      </span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
                {!isEnrolled && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Enroll <ChevronRight size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────

function CoursePlayer({
  course,
  activeLessonId,
  onSelectLesson,
  onBack,
}: {
  course: Course;
  activeLessonId: number | null;
  onSelectLesson: (id: number) => void;
  onBack: () => void;
}) {
  const store = useAppStore();
  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id })),
  );
  const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const lesson: (Lesson & { moduleId: number }) | null = allLessons[currentIndex] ?? null;
  const prevLesson = allLessons[currentIndex - 1] ?? null;
  const nextLesson = allLessons[currentIndex + 1] ?? null;
  const embedUrl = lesson ? getVideoEmbed(lesson.videoUrl) : null;
  const isComplete = lesson ? store.isLessonComplete(course.id, lesson.id) : false;
  const isUnlocked = lesson ? store.isLessonUnlocked(course.id, lesson.id) : true;

  /** Days remaining until the lesson unlocks (0 if already unlocked) */
  function daysLeft(lessonOrId: Lesson): number {
    if (lessonOrId.dripDays === 0) return 0;
    const enrollment = store.enrollments.find(
      (e) => e.courseId === course.id && e.userEmail === store.session?.email,
    );
    if (!enrollment) return lessonOrId.dripDays;
    const daysSince = (Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(lessonOrId.dripDays - daysSince));
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar — course outline */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card overflow-y-auto md:flex">
        <div className="border-b border-border p-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft size={13} /> All courses
          </button>
          <h2 className="text-sm font-semibold text-foreground leading-tight">{course.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{allLessons.length} lessons</p>
          {allLessons.length > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(allLessons.filter((l) => store.isLessonComplete(course.id, l.id)).length / allLessons.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {course.modules.map((mod, mi) => (
            <div key={mod.id} className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {mi + 1}. {mod.title}
              </div>
              <ul className="space-y-0.5">
                {mod.lessons.map((l, li) => {
                  const done = store.isLessonComplete(course.id, l.id);
                  const active = l.id === activeLessonId;
                  const unlocked = store.isLessonUnlocked(course.id, l.id);
                  const remaining = !unlocked ? daysLeft(l) : 0;
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => unlocked && onSelectLesson(l.id)}
                        disabled={!unlocked}
                        title={
                          !unlocked
                            ? `Unlocks in ${remaining} day${remaining !== 1 ? "s" : ""}`
                            : undefined
                        }
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                          active
                            ? "bg-sky-50 font-semibold text-primary"
                            : !unlocked
                              ? "cursor-not-allowed opacity-50"
                              : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {unlocked ? (
                          <>
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${done ? "border-emerald-400 bg-emerald-400 text-white" : active ? "border-primary text-primary" : "border-slate-300 text-slate-400"}`}
                            >
                              {done ? <Check size={9} /> : li + 1}
                            </span>
                            <span className="flex-1 leading-tight">{l.title}</span>
                            {l.videoUrl && <PlayCircle size={11} className="shrink-0 opacity-50" />}
                            {l.resources.length > 0 && (
                              <Link2 size={10} className="shrink-0 opacity-50" />
                            )}
                          </>
                        ) : (
                          <>
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50">
                              <Lock size={9} className="text-slate-400" />
                            </span>
                            <span className="flex-1 leading-tight text-slate-400">{l.title}</span>
                            <span className="shrink-0 text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Clock size={9} />
                              {remaining}d
                            </span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {!lesson ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <GraduationCap size={32} className="mx-auto text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">This course has no lessons yet.</p>
              <button
                onClick={onBack}
                className="mt-3 text-sm font-semibold text-primary hover:underline"
              >
                Back to courses
              </button>
            </div>
          </div>
        ) : !isUnlocked ? (
          /* ── Locked state ── */
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-1 text-xs text-muted-foreground">{course.title}</div>
            <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-border bg-card p-10 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
                <Lock size={28} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Content locked</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                This lesson unlocks in{" "}
                <strong className="text-foreground">
                  {daysLeft(lesson)} day{daysLeft(lesson) !== 1 ? "s" : ""}
                </strong>{" "}
                after enrollment.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drip scheduling keeps content fresh and prevents overwhelm.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} className="text-primary" />
                <span>
                  Available in <strong className="text-foreground">{daysLeft(lesson)}</strong> days
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Normal lesson content ── */
          <div className="mx-auto max-w-3xl px-4 py-8">
            {/* Lesson header */}
            <div className="mb-1 text-xs text-muted-foreground">{course.title}</div>
            <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>

            {/* Video */}
            {embedUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-border aspect-video bg-black shadow-sm">
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            ) : lesson.videoUrl ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <PlayCircle size={20} className="shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Video available</div>
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {lesson.videoUrl}
                  </a>
                </div>
              </div>
            ) : null}

            {/* Description */}
            {lesson.description && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">About this lesson</h2>
                <div
                  className="text-sm text-muted-foreground leading-relaxed
                    [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground
                    [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground
                    [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5
                    [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_li]:my-1
                    [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                    [&_pre]:my-3 [&_pre]:rounded-xl [&_pre]:bg-accent [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs
                    [&_code]:rounded [&_code]:bg-accent [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs
                    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-80
                    [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: lesson.description }}
                />
              </div>
            )}

            {/* Resources */}
            {lesson.resources.length > 0 && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-foreground mb-2">Resources</h2>
                <div className="space-y-2">
                  {lesson.resources.map((r) => {
                    const meta = SOURCE_META[r.source];
                    return (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent transition"
                      >
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {r.title}
                        </span>
                        <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete + nav */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
              <button
                onClick={() =>
                  prevLesson &&
                  store.isLessonUnlocked(course.id, prevLesson.id) &&
                  onSelectLesson(prevLesson.id)
                }
                disabled={!prevLesson || !store.isLessonUnlocked(course.id, prevLesson?.id ?? 0)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:enabled:bg-accent"
              >
                ← Previous
              </button>

              <button
                onClick={() => {
                  if (!isComplete) store.completeLesson(course.id, lesson.id);
                  if (nextLesson && store.isLessonUnlocked(course.id, nextLesson.id))
                    onSelectLesson(nextLesson.id);
                  else if (nextLesson && !store.isLessonUnlocked(course.id, nextLesson.id))
                    onSelectLesson(nextLesson.id);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold ${isComplete ? "border border-border text-muted-foreground" : "bg-primary text-white hover:bg-primary/90"}`}
              >
                {isComplete ? (
                  <>
                    <Check size={14} />
                    Completed
                  </>
                ) : nextLesson ? (
                  "Mark complete & next →"
                ) : (
                  "Mark complete ✓"
                )}
              </button>
            </div>

            {/* Mobile outline */}
            <div className="mt-6 md:hidden">
              <h2 className="text-sm font-semibold text-foreground mb-2">Course outline</h2>
              {course.modules.map((mod, mi) => (
                <div key={mod.id} className="mb-3">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                    {mi + 1}. {mod.title}
                  </div>
                  {mod.lessons.map((l, li) => {
                    const done = store.isLessonComplete(course.id, l.id);
                    const unlocked = store.isLessonUnlocked(course.id, l.id);
                    const remaining = !unlocked ? daysLeft(l) : 0;
                    return (
                      <button
                        key={l.id}
                        onClick={() => unlocked && onSelectLesson(l.id)}
                        disabled={!unlocked}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs mb-0.5 ${l.id === activeLessonId ? "bg-sky-50 text-primary font-semibold" : !unlocked ? "cursor-not-allowed opacity-50" : "text-muted-foreground hover:bg-accent"}`}
                      >
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] ${done ? "border-emerald-400 bg-emerald-400 text-white" : "border-slate-300"}`}
                        >
                          {!unlocked ? (
                            <Lock size={7} className="text-slate-400" />
                          ) : done ? (
                            <Check size={8} />
                          ) : (
                            li + 1
                          )}
                        </span>
                        <span className="flex-1">{l.title}</span>
                        {!unlocked ? (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={9} />
                            {remaining}d
                          </span>
                        ) : (
                          <ChevronRight size={11} className="ml-auto shrink-0 opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
