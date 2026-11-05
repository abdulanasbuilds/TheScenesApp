import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  FilePlus2,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Badge,
  Button,
  Card,
  CoverArt,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Stat,
  Textarea,
  buttonClass,
} from "@/components/ui";
import { courses as seedCourses } from "@/data/seed";
import type { Course, Lesson } from "@/data/types";
import { createLocalId, formatCompact } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/courses")({
  head: () => ({ meta: [{ title: "Courses — The Scenes creator workspace" }] }),
  component: CourseManagementPage,
});

const workspaceCourses = () =>
  seedCourses.filter((course) => course.communitySlug === "ai-builders-guild");

function CourseManagementPage() {
  const { toast } = useToast();
  const [courseList, setCourseList] = useState<Course[]>(workspaceCourses);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courseList.filter((course) => {
      const queryMatch =
        !normalized || `${course.title} ${course.subtitle}`.toLowerCase().includes(normalized);
      const statusMatch = status === "all" || course.status === status;
      return queryMatch && statusMatch;
    });
  }, [courseList, query, status]);

  const learners = courseList.reduce((sum, course) => sum + course.students, 0);
  const lessons = courseList.reduce(
    (sum, course) =>
      sum + course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0),
    0,
  );
  const published = courseList.filter((course) => course.status === "published").length;

  const saveCourse = (updated: Course) => {
    setCourseList((current) =>
      current.map((course) => (course.id === updated.id ? updated : course)),
    );
    setEditing(updated);
    toast("Course saved locally", "No production course record was written.");
  };

  const togglePublish = (course: Course) => {
    const nextStatus = course.status === "published" ? "draft" : "published";
    setCourseList((current) =>
      current.map((item) => (item.id === course.id ? { ...item, status: nextStatus } : item)),
    );
    toast(
      nextStatus === "published" ? "Published in preview" : "Moved to draft in preview",
      "Publishing does not create a public route for locally created courses.",
    );
  };

  const duplicate = (course: Course) => {
    const duplicateId = createLocalId("course-local");
    const copy: Course = {
      ...course,
      id: duplicateId,
      slug: `${course.slug}-copy-${duplicateId.slice(-6)}`,
      title: `${course.title} (copy)`,
      status: "draft",
      students: 0,
      rating: 0,
      reviews: 0,
    };
    setCourseList((current) => [copy, ...current]);
    toast("Draft duplicated", "The copy lives only in this preview session.");
  };

  return (
    <CreatorShell active="courses">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Classroom management
                </p>
                <Badge tone="outline">AI Builders Guild</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Shape the curriculum members move through. Editing, duplicating and publishing here
                change local preview state only.
              </p>
            </div>
            <Button onClick={() => setCreating(true)}>
              <FilePlus2 className="h-4 w-4" /> New course
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Courses" value={courseList.length} hint={`${published} published`} />
          <Stat label="Learners" value={formatCompact(learners)} hint="Fixture enrolment total" />
          <Stat label="Lessons" value={lessons} hint="Across all modules" />
          <Stat
            label="Drafts"
            value={courseList.filter((course) => course.status === "draft").length}
            hint="Not visible to members"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="course-admin-search" className="sr-only">
              Search courses
            </label>
            <Input
              id="course-admin-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search course title or subtitle"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-36"
            aria-label="Filter courses"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </div>

        {visible.length ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {visible.map((course) => {
              const courseLessons = course.modules.reduce(
                (sum, module) => sum + module.lessons.length,
                0,
              );
              const isLocal = course.id.startsWith("course-local-");
              return (
                <Card key={course.id} className="overflow-hidden">
                  <div className="grid sm:grid-cols-[150px_1fr]">
                    <CoverArt
                      seed={course.slug}
                      hue={course.accentHue}
                      rounded="rounded-none"
                      className="h-32 w-full sm:h-full"
                    />
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={course.status === "published" ? "green" : "amber"}>
                          {course.status}
                        </Badge>
                        <Badge tone="outline">{course.level}</Badge>
                        {isLocal ? <Badge tone="slate">Local draft</Badge> : null}
                      </div>
                      <h2 className="mt-2 font-display text-lg font-extrabold leading-snug text-slate-900">
                        {course.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {course.subtitle}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" /> {course.modules.length} modules
                        </span>
                        <span>{courseLessons} lessons</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {formatCompact(course.students)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(course)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicate(course)}>
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(course)}>
                      {course.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    {!isLocal ? (
                      <a
                        href={`/c/${course.communitySlug}/classroom/${course.slug}`}
                        className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                      >
                        Public page <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="ml-auto text-[10px] font-semibold text-slate-600">
                        No public route for local draft
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            icon={<BookOpen className="h-5 w-5" />}
            title="No courses match"
            description="Clear the search or choose another status."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        )}

        <Card className="mt-6 border-indigo-100 bg-indigo-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Curriculum is a product surface, not a file upload.
              </p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                The builder edits modules and lessons in memory. Video hosting, file storage and
                learner progress persistence are deliberately outside this phase.
              </p>
            </div>
            <a href="/c/ai-builders-guild/classroom" className={buttonClass("secondary", "md")}>
              View member classroom
            </a>
          </div>
        </Card>
      </div>

      <CourseModal
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : undefined)}
        course={editing}
        onSave={saveCourse}
      />

      <CreateCourseModal
        open={creating}
        onOpenChange={setCreating}
        onCreate={(course) => {
          setCourseList((current) => [course, ...current]);
          setCreating(false);
          setEditing(course);
          toast("Draft created", "Add modules and lessons in the local builder.");
        }}
      />
    </CreatorShell>
  );
}

function CourseModal({
  open,
  onOpenChange,
  course,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSave: (course: Course) => void;
}) {
  const [draft, setDraft] = useState<Course | null>(course);
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  // Keep the modal aligned with the selected course without an effect.
  const active = draft?.id === course?.id ? draft : course;

  if (!open || !course || !active) return null;

  const update = (next: Course) => {
    setDraft(next);
    onSave(next);
  };

  const saveDetails = (event: FormEvent) => {
    event.preventDefault();
    if (active.title.trim().length < 5) {
      setError("Use a course title with at least 5 characters.");
      return;
    }
    setError("");
    update({ ...active, title: active.title.trim(), subtitle: active.subtitle.trim() });
    onOpenChange(false);
  };

  const addModule = () => {
    if (moduleTitle.trim().length < 3) return;
    update({
      ...active,
      modules: [
        ...active.modules,
        { id: createLocalId("mod-local"), title: moduleTitle.trim(), lessons: [] },
      ],
    });
    setModuleTitle("");
  };

  const addLesson = (moduleId: string) => {
    const title = lessonTitles[moduleId]?.trim();
    if (!title) return;
    const newLesson: Lesson = {
      id: createLocalId("les-local"),
      title,
      duration: "5 min",
      type: "reading",
      summary: "Draft lesson created in the preview builder.",
      body: ["Draft lesson content. Replace this in the production editor."],
      resources: [],
    };
    update({
      ...active,
      modules: active.modules.map((module) =>
        module.id === moduleId ? { ...module, lessons: [...module.lessons, newLesson] } : module,
      ),
    });
    setLessonTitles((current) => ({ ...current, [moduleId]: "" }));
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit course"
      description="Metadata and curriculum changes are stored in local preview state."
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" form="course-details-form">
            <Check className="h-4 w-4" /> Save details
          </Button>
        </div>
      }
    >
      <form id="course-details-form" onSubmit={saveDetails} className="space-y-4" noValidate>
        <Field label="Course title" htmlFor="edit-course-title" error={error} required>
          <Input
            id="edit-course-title"
            value={active.title}
            onChange={(event) => setDraft({ ...active, title: event.target.value })}
            invalid={Boolean(error)}
          />
        </Field>
        <Field label="Subtitle" htmlFor="edit-course-subtitle">
          <Input
            id="edit-course-subtitle"
            value={active.subtitle}
            onChange={(event) => setDraft({ ...active, subtitle: event.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Level" htmlFor="edit-course-level">
            <Select
              id="edit-course-level"
              value={active.level}
              onChange={(event) =>
                setDraft({ ...active, level: event.target.value as Course["level"] })
              }
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="edit-course-status">
            <Select
              id="edit-course-status"
              value={active.status}
              onChange={(event) =>
                setDraft({ ...active, status: event.target.value as Course["status"] })
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
        </div>
        <Field label="Description" htmlFor="edit-course-description">
          <Textarea
            id="edit-course-description"
            value={active.description}
            onChange={(event) => setDraft({ ...active, description: event.target.value })}
            className="min-h-24"
          />
        </Field>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-extrabold text-slate-900">Curriculum</h3>
            <p className="text-xs text-slate-500">
              {active.modules.length} modules ·{" "}
              {active.modules.reduce((sum, module) => sum + module.lessons.length, 0)} lessons
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
              placeholder="New module title"
              aria-label="New module title"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addModule}
              disabled={moduleTitle.trim().length < 3}
            >
              <Plus className="h-4 w-4" /> Module
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {active.modules.map((module, index) => (
            <div key={module.id} className="rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <span className="font-mono text-[10px] font-bold text-indigo-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">
                  {module.title}
                </p>
                <span className="text-[10px] text-slate-500">{module.lessons.length} lessons</span>
              </div>
              <div className="divide-y divide-slate-100">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-slate-700">{lesson.title}</span>
                    <span className="shrink-0 text-[10px] text-slate-600">{lesson.duration}</span>
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          ...active,
                          modules: active.modules.map((item) =>
                            item.id === module.id
                              ? {
                                  ...item,
                                  lessons: item.lessons.filter((entry) => entry.id !== lesson.id),
                                }
                              : item,
                          ),
                        })
                      }
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Remove ${lesson.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 p-2">
                  <Input
                    value={lessonTitles[module.id] ?? ""}
                    onChange={(event) =>
                      setLessonTitles((current) => ({
                        ...current,
                        [module.id]: event.target.value,
                      }))
                    }
                    placeholder="New lesson title"
                    aria-label={`New lesson in ${module.title}`}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addLesson(module.id)}
                    disabled={!(lessonTitles[module.id] ?? "").trim()}
                  >
                    <Plus className="h-3.5 w-3.5" /> Lesson
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!active.modules.length ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
              No modules yet. Add the first module above.
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function CreateCourseModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (course: Course) => void;
}) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [level, setLevel] = useState<Course["level"]>("Beginner");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 5) {
      setError("Use a course title with at least 5 characters.");
      return;
    }
    const courseId = createLocalId("course-local");
    onCreate({
      id: courseId,
      slug: `local-${courseId}`,
      communitySlug: "ai-builders-guild",
      title: title.trim(),
      subtitle: subtitle.trim() || "A new course draft.",
      description: "Draft course created in the local preview builder.",
      level,
      categorySlug: "ai-automation",
      instructorHandle: "nanaadjei",
      hours: 0,
      students: 0,
      rating: 0,
      reviews: 0,
      status: "draft",
      price: "included",
      modules: [],
      outcomes: [],
      accentHue: 246,
    });
    setTitle("");
    setSubtitle("");
    setError("");
  };

  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setError("");
      }}
      title="Create a course draft"
      description="Start with the promise. Curriculum comes next."
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-course-form">
            <FilePlus2 className="h-4 w-4" /> Create draft
          </Button>
        </div>
      }
    >
      <form id="create-course-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Course title" htmlFor="new-course-title" error={error} required>
          <Input
            id="new-course-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. Evals for small teams"
            invalid={Boolean(error)}
          />
        </Field>
        <Field label="Subtitle" htmlFor="new-course-subtitle" hint="One sentence on the outcome.">
          <Input
            id="new-course-subtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="What will a learner be able to do?"
          />
        </Field>
        <Field label="Level" htmlFor="new-course-level">
          <Select
            id="new-course-level"
            value={level}
            onChange={(event) => setLevel(event.target.value as Course["level"])}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </Select>
        </Field>
        <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          The draft is saved in memory. It will not appear in the member classroom until a
          production publishing flow exists.
        </div>
      </form>
    </Modal>
  );
}
