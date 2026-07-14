import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronRight, Edit2, Trash2, Eye, EyeOff, Check,
  BookOpen, Video, Link2, X, GripVertical, ExternalLink, PlayCircle,
  MonitorPlay, Rocket, Users, FileText,
} from "lucide-react";
import { useAppStore, type Course, type CourseModule, type Lesson, getVideoEmbed, detectResourceSource } from "@/lib/app-store";

export const Route = createFileRoute("/app/courses")({
  head: () => ({ meta: [{ title: "Course Builder · SukaSpace" }] }),
  component: CoursesPage,
});

type View = "list" | "edit" | "preview";

const SOURCE_META: Record<string, { label: string; color: string }> = {
  gdrive: { label: "Drive", color: "bg-green-100 text-green-700" },
  dropbox: { label: "Dropbox", color: "bg-blue-100 text-blue-700" },
  onedrive: { label: "OneDrive", color: "bg-sky-100 text-sky-700" },
  notion: { label: "Notion", color: "bg-slate-100 text-slate-700" },
  github: { label: "GitHub", color: "bg-gray-100 text-gray-700" },
  canva: { label: "Canva", color: "bg-violet-100 text-violet-700" },
  figma: { label: "Figma", color: "bg-orange-100 text-orange-700" },
  other: { label: "Link", color: "bg-slate-100 text-slate-500" },
};

function CoursesPage() {
  const store = useAppStore();
  const [view, setView] = useState<View>("list");
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

  const myCourses = store.courses.filter(c => c.creatorEmail === store.session?.email);

  const openCourse = (id: number) => {
    setActiveCourseId(id);
    setView("edit");
  };

  if (view === "edit" && activeCourseId) {
    const course = store.courses.find(c => c.id === activeCourseId);
    if (!course) return null;
    return (
      <CourseEditor
        course={course}
        onBack={() => setView("list")}
        onPreview={() => setView("preview")}
      />
    );
  }

  if (view === "preview" && activeCourseId) {
    const course = store.courses.find(c => c.id === activeCourseId);
    if (!course) return null;
    return <CoursePreview course={course} onBack={() => setView("edit")} />;
  }

  return <CourseList courses={myCourses} onOpen={openCourse} onCreate={(id) => openCourse(id)} />;
}

// ─── Course List ──────────────────────────────────────────────────────────────

function CourseList({ courses, onOpen, onCreate }: { courses: Course[]; onOpen: (id: number) => void; onCreate: (id: number) => void }) {
  const store = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [publishedCourse, setPublishedCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState<number | null>(store.communities[0]?.id ?? null);

  const create = () => {
    if (!title.trim()) return;
    const course = store.createCourse({ title: title.trim(), description: description.trim(), communityId });
    setTitle(""); setDescription(""); setShowCreate(false);
    onCreate(course.id);
  };

  const handlePublish = (c: Course) => {
    store.publishCourse(c.id);
    setPublishedCourse(c);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build and publish courses for your community.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <Plus size={15} /> New course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <BookOpen size={32} className="mx-auto text-muted-foreground/40" />
          <h2 className="mt-3 text-base font-semibold text-foreground">No courses yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create your first course to start building a curriculum.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Create first course</button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {courses.map(c => {
            const totalLessons = c.modules.flatMap(m => m.lessons).length;
            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="h-20 bg-gradient-to-br from-sky-100 to-blue-50 flex items-center justify-center">
                  <BookOpen size={24} className="text-sky-400" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description || "No description."}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.modules.length} modules</span>
                    <span>{totalLessons} lessons</span>
                    <span>{c.enrollmentCount} enrolled</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => onOpen(c.id)} className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white text-center">
                      Edit course
                    </button>
                    <button onClick={() => c.published ? store.unpublishCourse(c.id) : handlePublish(c)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${c.published ? "border-border text-muted-foreground" : "border-primary text-primary"}`}>
                      {c.published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => { if (confirm("Delete this course?")) store.deleteCourse(c.id); }} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">New course</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Course title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Build with AI APIs" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What will learners achieve?" className="mt-1 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              {store.communities.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Attach to community (optional)</label>
                  <select value={communityId ?? ""} onChange={e => setCommunityId(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="">Standalone course</option>
                    {store.communities.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
              <button onClick={create} disabled={!title.trim()} className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                Create &amp; start building →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish confirmation modal */}
      <AnimatePresence>
        {publishedCourse && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white p-8 shadow-xl text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Rocket size={28} className="text-emerald-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Course published!</h2>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold">"{publishedCourse.title}"</span> is now live and visible to learners in your community.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Modules", value: publishedCourse.modules.length },
                  { label: "Lessons", value: publishedCourse.modules.flatMap(m => m.lessons).length },
                  { label: "Enrolled", value: publishedCourse.enrollmentCount },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    <div className="text-[11px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={() => setPublishedCourse(null)}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Done
                </button>
                <button
                  onClick={() => { setPublishedCourse(null); onOpen(publishedCourse.id); }}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Continue editing
                </button>
              </div>
              <p className="mt-4 text-[11px] text-slate-500">
                Learners can enroll from your community's Courses tab.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Course Editor ────────────────────────────────────────────────────────────

function CourseEditor({ course, onBack, onPreview }: { course: Course; onBack: () => void; onPreview: () => void }) {
  const store = useAppStore();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(course.modules[0]?.id ?? null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState(course.title);
  const [courseDesc, setCourseDesc] = useState(course.description);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const handlePublish = () => {
    store.publishCourse(course.id);
    setShowPublishConfirm(true);
  };

  const selectedModule = course.modules.find(m => m.id === selectedModuleId) ?? null;
  const selectedLesson = selectedModule?.lessons.find(l => l.id === selectedLessonId) ?? null;

  const addModule = () => {
    if (!newModuleTitle.trim()) return;
    const mod = store.addModule(course.id, newModuleTitle.trim());
    setSelectedModuleId(mod.id);
    setNewModuleTitle(""); setAddingModule(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      {/* Course header bar */}
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent">&larr;</button>
          {editingCourse ? (
            <div className="flex items-center gap-2 min-w-0">
              <input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="rounded border border-border px-2 py-1 text-sm font-semibold outline-none focus:border-primary min-w-0 flex-1" />
              <button onClick={() => { store.updateCourse(course.id, { title: courseTitle, description: courseDesc }); setEditingCourse(false); }} className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white"><Check size={12} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-sm font-semibold text-foreground">{course.title}</span>
              <button onClick={() => setEditingCourse(true)} className="shrink-0 text-muted-foreground hover:text-foreground"><Edit2 size={12} /></button>
            </div>
          )}
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${course.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {course.published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <MonitorPlay size={13} />Preview
          </button>
          <button
            onClick={() => course.published ? store.unpublishCourse(course.id) : handlePublish()}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${course.published ? "border border-border text-muted-foreground hover:bg-accent" : "bg-primary text-white hover:bg-primary/90"}`}
          >
            {course.published ? <><EyeOff size={13} />Unpublish</> : <><Eye size={13} />Publish</>}
          </button>
        </div>
      </div>

      {/* Publish confirmation modal (inside editor) */}
      <AnimatePresence>
        {showPublishConfirm && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="mx-4 w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-xl"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Rocket size={28} className="text-emerald-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Course published!</h2>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold">"{course.title}"</span> is now live and visible to learners.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Modules", value: course.modules.length, icon: <BookOpen size={14} /> },
                  { label: "Lessons", value: course.modules.flatMap(m => m.lessons).length, icon: <FileText size={14} /> },
                  { label: "Enrolled", value: course.enrollmentCount, icon: <Users size={14} /> },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mx-auto mb-1 text-slate-400">{s.icon}</div>
                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    <div className="text-[11px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => { setShowPublishConfirm(false); onPreview(); }} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                  <span className="inline-flex items-center justify-center gap-1.5"><MonitorPlay size={14} />Preview as learner</span>
                </button>
                <button onClick={() => setShowPublishConfirm(false)} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Keep editing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Course outline */}
        <aside className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Modules</span>
              <button onClick={() => setAddingModule(true)} className="grid h-5 w-5 place-items-center rounded bg-accent text-muted-foreground hover:text-foreground"><Plus size={12} /></button>
            </div>

            {addingModule && (
              <div className="mb-2 flex items-center gap-1">
                <input
                  autoFocus
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addModule(); if (e.key === "Escape") setAddingModule(false); }}
                  placeholder="Module name"
                  className="flex-1 rounded border border-border px-2 py-1 text-xs outline-none focus:border-primary"
                />
                <button onClick={addModule} className="rounded bg-primary p-1 text-white"><Check size={11} /></button>
                <button onClick={() => setAddingModule(false)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X size={11} /></button>
              </div>
            )}

            {course.modules.length === 0 && !addingModule && (
              <p className="text-xs text-muted-foreground px-1 mt-2">Add your first module to start building.</p>
            )}

            {course.modules.map((mod, mi) => (
              <ModuleRow
                key={mod.id}
                mod={mod}
                index={mi}
                courseId={course.id}
                isActive={selectedModuleId === mod.id}
                activeLessonId={selectedLessonId}
                onSelectModule={() => { setSelectedModuleId(mod.id); setSelectedLessonId(null); }}
                onSelectLesson={(lid) => { setSelectedModuleId(mod.id); setSelectedLessonId(lid); }}
              />
            ))}
          </div>
        </aside>

        {/* Right: Editor panel */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {!selectedLesson && !selectedModule && (
            <CourseSettingsPanel course={course} courseTitle={courseTitle} setCourseTitle={setCourseTitle} courseDesc={courseDesc} setCourseDesc={setCourseDesc} />
          )}
          {selectedModule && !selectedLesson && (
            <ModuleSettingsPanel mod={selectedModule} courseId={course.id} onAddLesson={(lesson) => setSelectedLessonId(lesson.id)} />
          )}
          {selectedLesson && selectedModule && (
            <LessonEditor courseId={course.id} moduleId={selectedModule.id} lesson={selectedLesson} />
          )}
        </main>
      </div>
    </div>
  );
}

function ModuleRow({ mod, index, courseId, isActive, activeLessonId, onSelectModule, onSelectLesson }: {
  mod: CourseModule; index: number; courseId: number; isActive: boolean; activeLessonId: number | null;
  onSelectModule: () => void; onSelectLesson: (id: number) => void;
}) {
  const store = useAppStore();
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(mod.title);
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");

  const addLesson = () => {
    if (!lessonTitle.trim()) return;
    const l = store.addLesson(courseId, mod.id, { title: lessonTitle.trim() });
    setLessonTitle(""); setAddingLesson(false);
    onSelectLesson(l.id);
  };

  return (
    <div className="mb-1">
      <div className={`flex items-center gap-1 rounded-lg px-2 py-1.5 group cursor-pointer ${isActive && !activeLessonId ? "bg-accent" : "hover:bg-accent"}`}>
        <GripVertical size={12} className="shrink-0 text-muted-foreground/50" />
        <button onClick={() => setExpanded(v => !v)} className="shrink-0 text-muted-foreground">
          <ChevronRight size={13} className={`transition ${expanded ? "rotate-90" : ""}`} />
        </button>
        {editingTitle ? (
          <input
            autoFocus value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={() => { store.updateModule(courseId, mod.id, titleVal); setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === "Enter") { store.updateModule(courseId, mod.id, titleVal); setEditingTitle(false); } }}
            className="flex-1 rounded border border-border px-1 py-0.5 text-xs outline-none"
          />
        ) : (
          <span onClick={onSelectModule} className="flex-1 truncate text-xs font-semibold text-foreground">
            {index + 1}. {mod.title}
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button onClick={e => { e.stopPropagation(); setEditingTitle(true); setTitleVal(mod.title); }} className="rounded p-0.5 hover:bg-accent text-muted-foreground"><Edit2 size={10} /></button>
          <button onClick={e => { e.stopPropagation(); setAddingLesson(true); }} className="rounded p-0.5 hover:bg-accent text-muted-foreground"><Plus size={10} /></button>
          <button onClick={e => { e.stopPropagation(); if (confirm("Delete module?")) store.deleteModule(courseId, mod.id); }} className="rounded p-0.5 hover:text-rose-600 text-muted-foreground"><Trash2 size={10} /></button>
        </div>
      </div>

      {expanded && (
        <div className="ml-5 space-y-0.5">
          {mod.lessons.map((l, li) => (
            <button
              key={l.id}
              onClick={() => onSelectLesson(l.id)}
              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs group ${activeLessonId === l.id ? "bg-sky-50 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}
            >
              {l.videoUrl ? <Video size={11} className="shrink-0" /> : <BookOpen size={11} className="shrink-0" />}
              <span className="flex-1 truncate">{li + 1}. {l.title}</span>
              {l.published && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
            </button>
          ))}

          {addingLesson && (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus value={lessonTitle}
                onChange={e => setLessonTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addLesson(); if (e.key === "Escape") setAddingLesson(false); }}
                placeholder="Lesson name"
                className="flex-1 rounded border border-border px-2 py-0.5 text-xs outline-none focus:border-primary"
              />
              <button onClick={addLesson} className="rounded bg-primary p-0.5 text-white"><Check size={11} /></button>
              <button onClick={() => setAddingLesson(false)} className="rounded p-0.5 text-muted-foreground"><X size={11} /></button>
            </div>
          )}

          <button onClick={() => setAddingLesson(true)} className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-[11px] text-muted-foreground hover:text-primary">
            <Plus size={10} /> Add lesson
          </button>
        </div>
      )}
    </div>
  );
}

function CourseSettingsPanel({ course, courseTitle, setCourseTitle, courseDesc, setCourseDesc }: {
  course: Course; courseTitle: string; setCourseTitle: (v: string) => void; courseDesc: string; setCourseDesc: (v: string) => void;
}) {
  const store = useAppStore();
  const totalLessons = course.modules.flatMap(m => m.lessons).length;
  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-foreground">Course settings</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} onBlur={() => store.updateCourse(course.id, { title: courseTitle })} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Description</label>
          <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} onBlur={() => store.updateCourse(course.id, { description: courseDesc })} rows={4} className="mt-1 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Modules", value: course.modules.length },
            { label: "Lessons", value: totalLessons },
            { label: "Enrolled", value: course.enrollmentCount },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          {course.modules.length === 0
            ? "👈 Add your first module in the panel on the left."
            : "Select a module or lesson on the left to start editing content."}
        </div>
      </div>
    </div>
  );
}

function ModuleSettingsPanel({ mod, courseId, onAddLesson }: { mod: CourseModule; courseId: number; onAddLesson: (l: Lesson) => void }) {
  const store = useAppStore();
  const [title, setTitle] = useState("");
  const addLesson = () => {
    if (!title.trim()) return;
    const l = store.addLesson(courseId, mod.id, { title: title.trim() });
    setTitle(""); onAddLesson(l);
  };
  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold">{mod.title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"}</p>
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground mb-3">Add a new lesson to this module:</p>
        <div className="flex gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addLesson(); }} placeholder="Lesson title" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          <button onClick={addLesson} disabled={!title.trim()} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Course Preview (learner view) ────────────────────────────────────────────

function CoursePreview({ course, onBack }: { course: Course; onBack: () => void }) {
  const allLessons = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })));
  const [activeLesson, setActiveLesson] = useState(allLessons[0] ?? null);
  const embedUrl = activeLesson?.videoUrl ? getVideoEmbed(activeLesson.videoUrl) : null;

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      {/* Preview banner */}
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MonitorPlay size={15} className="text-amber-600 shrink-0" />
          <span className="text-sm font-semibold text-amber-800">Creator preview</span>
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">LEARNER VIEW</span>
        </div>
        <button onClick={onBack} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50">
          ← Back to editor
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: course outline */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-blue-50">
                <BookOpen size={16} className="text-sky-500" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{course.title}</div>
                <div className="text-xs text-muted-foreground">{allLessons.length} lessons · {course.modules.length} modules</div>
              </div>
            </div>
          </div>
          <div className="p-3 space-y-4">
            {course.modules.map((mod, mi) => (
              <div key={mod.id}>
                <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {mi + 1}. {mod.title}
                </div>
                <div className="space-y-0.5">
                  {mod.lessons.map((lesson, li) => {
                    const embed = getVideoEmbed(lesson.videoUrl);
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson({ ...lesson, moduleTitle: mod.title })}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${isActive ? "bg-sky-50 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}
                      >
                        {embed ? <PlayCircle size={14} className="shrink-0" /> : <FileText size={14} className="shrink-0" />}
                        <span className="flex-1 truncate">{li + 1}. {lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {course.modules.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No modules in this course yet.</p>
            )}
          </div>
        </aside>

        {/* Main: lesson viewer */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {!activeLesson ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <BookOpen size={32} className="mx-auto text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No lessons to preview yet. Add lessons in the editor.</p>
                <button onClick={onBack} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Go to editor</button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{course.title}</span>
                <ChevronRight size={12} />
                <span>{activeLesson.moduleTitle}</span>
                <ChevronRight size={12} />
                <span className="font-medium text-foreground">{activeLesson.title}</span>
              </div>

              {/* Video */}
              {embedUrl ? (
                <div className="overflow-hidden rounded-xl border border-border aspect-video bg-black shadow-sm">
                  <iframe src={embedUrl} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={activeLesson.title} />
                </div>
              ) : activeLesson.videoUrl ? (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card">
                  <div className="text-center text-sm text-muted-foreground">
                    <PlayCircle size={24} className="mx-auto mb-2 text-primary" />
                    Video URL saved but not yet a recognized embed.<br />
                    <span className="text-xs">(YouTube, Vimeo, or Loom will auto-embed)</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card">
                  <div className="text-center text-sm text-muted-foreground">
                    <Video size={24} className="mx-auto mb-2 opacity-30" />
                    No video attached to this lesson.
                  </div>
                </div>
              )}

              {/* Title + description */}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{activeLesson.title}</h1>
                {activeLesson.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activeLesson.description}</p>
                )}
              </div>

              {/* Resources */}
              {activeLesson.resources.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson resources</h3>
                  <div className="space-y-2">
                    {activeLesson.resources.map(r => {
                      const meta = SOURCE_META[r.source];
                      return (
                        <a
                          key={r.id}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 hover:bg-sky-50 transition"
                        >
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
                          <span className="flex-1 truncate text-sm font-medium text-foreground">{r.title}</span>
                          <ExternalLink size={13} className="shrink-0 text-muted-foreground" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <button
                  onClick={() => {
                    const idx = allLessons.findIndex(l => l.id === activeLesson.id);
                    if (idx > 0) setActiveLesson(allLessons[idx - 1]);
                  }}
                  disabled={allLessons.findIndex(l => l.id === activeLesson.id) === 0}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-accent"
                >
                  ← Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Lesson {allLessons.findIndex(l => l.id === activeLesson.id) + 1} of {allLessons.length}
                </span>
                <button
                  onClick={() => {
                    const idx = allLessons.findIndex(l => l.id === activeLesson.id);
                    if (idx < allLessons.length - 1) setActiveLesson(allLessons[idx + 1]);
                  }}
                  disabled={allLessons.findIndex(l => l.id === activeLesson.id) === allLessons.length - 1}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LessonEditor({ courseId, moduleId, lesson }: { courseId: number; moduleId: number; lesson: Lesson }) {
  const store = useAppStore();
  const [title, setTitle] = useState(lesson.title);
  const [desc, setDesc] = useState(lesson.description);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl);
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [saved, setSaved] = useState(false);

  const embedUrl = getVideoEmbed(videoUrl);

  const save = () => {
    store.updateLesson(courseId, moduleId, lesson.id, { title, description: desc, videoUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const addResource = () => {
    if (!resourceUrl.trim() || !resourceTitle.trim()) return;
    store.addResourceToLesson(courseId, moduleId, lesson.id, { title: resourceTitle.trim(), url: resourceUrl.trim() });
    setResourceUrl(""); setResourceTitle("");
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Edit lesson</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => store.updateLesson(courseId, moduleId, lesson.id, { published: !lesson.published })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${lesson.published ? "border-border text-muted-foreground" : "border-primary text-primary"}`}
          >
            {lesson.published ? <><EyeOff size={12} />Hide</> : <><Eye size={12} />Publish</>}
          </button>
          <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">
            {saved ? <><Check size={12} />Saved!</> : "Save lesson"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Lesson title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="What will learners learn in this lesson?" className="mt-1 w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
      </div>

      {/* Video URL */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Video size={12} />Video URL</label>
        <input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="YouTube, Vimeo, or Loom URL"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">Supports: youtube.com, youtu.be, vimeo.com, loom.com</p>
        {videoUrl && !embedUrl && <p className="mt-1 text-[11px] text-amber-600">URL not recognized. Paste a YouTube, Vimeo, or Loom share URL.</p>}
        {embedUrl && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border aspect-video bg-black">
            <iframe src={embedUrl} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Lesson video" />
          </div>
        )}
        {videoUrl && !embedUrl && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            <PlayCircle size={14} className="shrink-0 text-primary" />
            Video will embed once a valid URL is saved.
          </div>
        )}
      </div>

      {/* Resources */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2"><Link2 size={12} />Resources</label>
        {lesson.resources.length > 0 && (
          <div className="mb-3 space-y-2">
            {lesson.resources.map(r => {
              const meta = SOURCE_META[r.source];
              return (
                <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
                  <span className="flex-1 truncate text-sm text-foreground">{r.title}</span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink size={13} /></a>
                  <button onClick={() => store.removeResourceFromLesson(courseId, moduleId, lesson.id, r.id)} className="text-muted-foreground hover:text-rose-600"><X size={13} /></button>
                </div>
              );
            })}
          </div>
        )}
        <div className="rounded-xl border border-dashed border-border bg-card p-3 space-y-2">
          <input value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="Resource name" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex gap-2">
            <input
              value={resourceUrl}
              onChange={e => setResourceUrl(e.target.value)}
              placeholder="Google Drive, Notion, GitHub, Figma… any URL"
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={addResource} disabled={!resourceUrl.trim() || !resourceTitle.trim()} className="shrink-0 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add</button>
          </div>
          {resourceUrl && (
            <p className="text-[11px] text-muted-foreground">Source: <span className="font-semibold text-foreground">{SOURCE_META[detectResourceSource(resourceUrl)].label}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
