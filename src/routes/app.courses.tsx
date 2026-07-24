import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Plus, ChevronRight, ChevronDown, GraduationCap, Video,
  FileText, Link2, Trash2, Edit3, Eye, EyeOff, Check, X,
  MoreVertical, Lock, Globe, Users, Clock, Star, ArrowLeft,
  AlertCircle, Sparkles, Play, ExternalLink, Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type Course, type Module, type Lesson, type LessonResource } from "@/lib/app-store";
import { RichTextEditor } from "@/components/RichTextEditor";
import { cn } from "@/lib/utils";
import { notifyCoursePublished } from "@/lib/autodm.functions";

export const Route = createFileRoute("/app/courses")({
  head: () => ({ meta: [{ title: "Courses · SukaSpace" }] }),
  component: CoursesPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomId() { return Date.now() + Math.floor(Math.random() * 9999); }

const SOURCE_ICONS: Record<string, string> = {
  gdrive: "📄", dropbox: "📦", onedrive: "☁️", notion: "📝",
  github: "🐙", canva: "🎨", figma: "🖌️", other: "🔗",
};

function detectSource(url: string): LessonResource["source"] {
  if (url.includes("drive.google"))  return "gdrive";
  if (url.includes("dropbox"))       return "dropbox";
  if (url.includes("onedrive"))      return "onedrive";
  if (url.includes("notion"))        return "notion";
  if (url.includes("github"))        return "github";
  if (url.includes("canva"))         return "canva";
  if (url.includes("figma"))         return "figma";
  return "other";
}

function extractVideoId(url: string): { type: "youtube" | "vimeo" | "loom" | null; id: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return { type: "youtube", id: yt[1] };
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return { type: "vimeo", id: vi[1] };
  const lo = url.match(/loom\.com\/share\/([a-z0-9]+)/);
  if (lo) return { type: "loom", id: lo[1] };
  return { type: null, id: "" };
}

function videoEmbedUrl(url: string): string | null {
  const { type, id } = extractVideoId(url);
  if (type === "youtube") return `https://www.youtube.com/embed/${id}`;
  if (type === "vimeo")   return `https://player.vimeo.com/video/${id}`;
  if (type === "loom")    return `https://www.loom.com/embed/${id}`;
  return null;
}

// ─── Published badge ──────────────────────────────────────────────────────────

function StatusBadge({ published }: { published?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
      published
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700",
    )}>
      {published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      {published ? "Published" : "Draft"}
    </span>
  );
}

// ─── Course card (creator view) ───────────────────────────────────────────────

function CourseCard({
  course, onEdit, onTogglePublish, onDelete,
}: {
  course: Course;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const lessonCount = course.modules?.reduce((s, m) => s + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      {/* Cover */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-violet-100 overflow-hidden">
        {course.cover ? (
          <img src={course.cover} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-300" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge published={course.published} />
        </div>
        {!course.published && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Lock className="w-8 h-8 text-white/80" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 flex-1">
            {course.title}
          </h3>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44"
                onMouseLeave={() => setMenuOpen(false)}>
                <button onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-slate-50 text-slate-700">
                  <Edit3 className="w-4 h-4" /> Edit course
                </button>
                <button onClick={() => { onTogglePublish(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-slate-50 text-slate-700">
                  {course.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {course.published ? "Unpublish" : "Publish"}
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{course.description || "No description yet."}</p>

        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {course.modules?.length ?? 0} modules
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {lessonCount} lessons
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-xl transition-colors border border-slate-200"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={onTogglePublish}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl transition-colors",
              course.published
                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
            )}
          >
            {course.published ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {course.published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Learner course card ──────────────────────────────────────────────────────

function LearnerCourseCard({ course, enrolled, onEnroll }: { course: Course; enrolled: boolean; onEnroll: () => void }) {
  const lessonCount = course.modules?.reduce((s, m) => s + (m.lessons?.length ?? 0), 0) ?? 0;
  const nav = useNavigate();
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-violet-100 overflow-hidden relative">
        {course.cover
          ? <img src={course.cover} alt={course.title} className="w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-10 h-10 text-blue-300" /></div>
        }
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{course.title}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description || "No description."}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{course.modules?.length ?? 0} modules</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lessonCount} lessons</span>
        </div>
        <button
          onClick={enrolled ? () => nav({ to: "/app/classroom" }) : onEnroll}
          className={cn(
            "mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-colors",
            enrolled
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
              : "bg-blue-600 hover:bg-blue-700 text-white",
          )}
        >
          {enrolled ? "Continue Learning →" : "Enroll Now"}
        </button>
      </div>
    </div>
  );
}

// ─── Lesson editor ────────────────────────────────────────────────────────────

function LessonEditor({
  lesson, onSave, onClose,
}: {
  lesson: Lesson;
  onSave: (updated: Lesson) => void;
  onClose: () => void;
}) {
  const [title,    setTitle]    = useState(lesson.title);
  const [body,     setBody]     = useState(lesson.body ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? "");
  const [locked,   setLocked]   = useState(lesson.locked ?? false);
  const [resUrl,   setResUrl]   = useState("");
  const [resLabel, setResLabel] = useState("");
  const [resources, setResources] = useState<LessonResource[]>(lesson.resources ?? []);

  const embedUrl = videoUrl ? videoEmbedUrl(videoUrl) : null;

  const addResource = () => {
    if (!resUrl.trim()) return;
    const newRes: LessonResource = {
      id:     randomId(),
      label:  resLabel.trim() || resUrl,
      url:    resUrl.trim(),
      source: detectSource(resUrl.trim()),
    };
    setResources(r => [...r, newRes]);
    setResUrl(""); setResLabel("");
  };

  const save = () => {
    if (!title.trim()) return;
    onSave({ ...lesson, title: title.trim(), body, videoUrl: videoUrl.trim(), locked, resources });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-900">Edit Lesson</h3>
          <div className="flex items-center gap-2">
            <button onClick={save}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Lesson title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Lesson title…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Lock toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-800">Drip / lock this lesson</p>
              <p className="text-xs text-slate-500">Learners must reach a level to unlock</p>
            </div>
            <button
              onClick={() => setLocked(v => !v)}
              className={cn("w-10 h-6 rounded-full transition-colors", locked ? "bg-blue-500" : "bg-slate-300")}
            >
              <span className={cn("block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1", locked ? "translate-x-4" : "translate-x-0")} />
            </button>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Video URL <span className="font-normal text-slate-400 normal-case">(YouTube, Vimeo, Loom)</span>
            </label>
            <input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {embedUrl && (
              <div className="mt-2 rounded-xl overflow-hidden aspect-video border border-slate-200">
                <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="video preview" />
              </div>
            )}
          </div>

          {/* Rich text body */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Lesson content
            </label>
            <RichTextEditor value={body} onChange={setBody} placeholder="Write the lesson content here…" />
          </div>

          {/* Resources */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Attachments & resources
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={resLabel}
                onChange={e => setResLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                value={resUrl}
                onChange={e => setResUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addResource()}
                placeholder="https://… (Drive, Notion, GitHub…)"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button onClick={addResource}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {resources.map(r => (
                <div key={r.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <span>{SOURCE_ICONS[r.source] ?? "🔗"}</span>
                  <span className="flex-1 text-sm text-slate-700 truncate">{r.label || r.url}</span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => setResources(rs => rs.filter(x => x.id !== r.id))}
                    className="text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Course editor (modules + lessons) ───────────────────────────────────────

function CourseEditor({
  course: initial, onSave, onBack,
}: {
  course: Course;
  onSave: (c: Course) => void;
  onBack: () => void;
}) {
  const [course, setCourse]         = useState<Course>({ ...initial, modules: initial.modules ?? [] });
  const [editingLesson, setEditing] = useState<{ moduleId: number; lesson: Lesson } | null>(null);
  const [expanded, setExpanded]     = useState<Set<number>>(new Set(course.modules.map(m => m.id)));
  const [newModTitle, setNewModTitle] = useState("");
  const [addingMod, setAddingMod]   = useState(false);
  const [titleEdit, setTitleEdit]   = useState(false);
  const [editTitle, setEditTitle]   = useState(course.title);
  const [editDesc,  setEditDesc]    = useState(course.description);

  const update = (fn: (c: Course) => Course) => setCourse(fn);

  const addModule = () => {
    if (!newModTitle.trim()) return;
    update(c => ({ ...c, modules: [...c.modules, { id: randomId(), title: newModTitle.trim(), lessons: [] }] }));
    setNewModTitle(""); setAddingMod(false);
  };

  const deleteModule = (mid: number) => update(c => ({ ...c, modules: c.modules.filter(m => m.id !== mid) }));

  const addLesson = (mid: number) => {
    const lesson: Lesson = { id: randomId(), moduleId: mid, title: "New Lesson", body: "", videoUrl: "", resources: [], locked: false };
    update(c => ({ ...c, modules: c.modules.map(m => m.id === mid ? { ...m, lessons: [...(m.lessons ?? []), lesson] } : m) }));
    setEditing({ moduleId: mid, lesson });
  };

  const deleteLesson = (mid: number, lid: number) =>
    update(c => ({ ...c, modules: c.modules.map(m => m.id === mid ? { ...m, lessons: m.lessons.filter(l => l.id !== lid) } : m) }));

  const saveLesson = (updated: Lesson) => {
    update(c => ({ ...c, modules: c.modules.map(m =>
      m.id === editingLesson?.moduleId
        ? { ...m, lessons: m.lessons.map(l => l.id === updated.id ? updated : l) }
        : m
    )}));
    setEditing(null);
  };

  const toggleExpanded = (mid: number) => setExpanded(s => {
    const next = new Set(s);
    next.has(mid) ? next.delete(mid) : next.add(mid);
    return next;
  });

  const lessonCount = course.modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          {titleEdit ? (
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => { update(c => ({ ...c, title: editTitle.trim() || c.title, description: editDesc })); setTitleEdit(false); }}
              onKeyDown={e => e.key === "Enter" && (update(c => ({ ...c, title: editTitle.trim() || c.title })), setTitleEdit(false))}
              className="font-bold text-slate-900 text-lg w-full border-b-2 border-blue-400 focus:outline-none bg-transparent"
            />
          ) : (
            <button onClick={() => setTitleEdit(true)} className="group flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-lg truncate">{course.title}</h2>
              <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span>{course.modules.length} modules</span>
            <span>{lessonCount} lessons</span>
            <StatusBadge published={course.published} />
          </div>
        </div>
        <button
          onClick={() => onSave(course)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Cover + description */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Cover image URL</label>
            <input
              value={course.cover ?? ""}
              onChange={e => update(c => ({ ...c, cover: e.target.value }))}
              placeholder="https://… (1460×752 recommended)"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              value={course.description}
              onChange={e => update(c => ({ ...c, description: e.target.value }))}
              placeholder="What will learners get from this course?"
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Modules list */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        <AnimatePresence>
          {course.modules.map((mod, mi) => (
            <motion.div key={mod.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

              {/* Module header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <button onClick={() => toggleExpanded(mod.id)} className="text-slate-400 hover:text-slate-600">
                  {expanded.has(mod.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide w-6">M{mi + 1}</span>
                <input
                  value={mod.title}
                  onChange={e => update(c => ({ ...c, modules: c.modules.map(m => m.id === mod.id ? { ...m, title: e.target.value } : m) }))}
                  className="flex-1 font-semibold text-slate-800 text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-blue-400"
                />
                <button onClick={() => addLesson(mod.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Lesson
                </button>
                <button onClick={() => deleteModule(mod.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lessons */}
              {expanded.has(mod.id) && (
                <div className="divide-y divide-slate-50">
                  {(mod.lessons ?? []).length === 0 && (
                    <div className="px-4 py-4 text-center">
                      <p className="text-xs text-slate-400">No lessons yet</p>
                      <button onClick={() => addLesson(mod.id)}
                        className="mt-1 text-xs text-blue-500 hover:underline">
                        Add first lesson
                      </button>
                    </div>
                  )}
                  {(mod.lessons ?? []).map((lesson, li) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group">
                      <span className="text-xs text-slate-400 w-5 text-center font-mono">{li + 1}</span>
                      {lesson.videoUrl ? <Video className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      <span className="flex-1 text-sm text-slate-700 truncate">{lesson.title}</span>
                      {lesson.locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      {(lesson.resources?.length ?? 0) > 0 && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                          {lesson.resources!.length} files
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing({ moduleId: mod.id, lesson })}
                          className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteLesson(mod.id, lesson.id)}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add module */}
        {addingMod ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newModTitle}
              onChange={e => setNewModTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addModule(); if (e.key === "Escape") setAddingMod(false); }}
              placeholder="Module title…"
              className="flex-1 border border-blue-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none ring-2 ring-blue-200"
            />
            <button onClick={addModule}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Add
            </button>
            <button onClick={() => { setAddingMod(false); setNewModTitle(""); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingMod(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-500 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Module
          </button>
        )}
      </div>

      {/* Lesson editor drawer */}
      <AnimatePresence>
        {editingLesson && (
          <LessonEditor
            lesson={editingLesson.lesson}
            onSave={saveLesson}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CoursesPage() {
  const store = useAppStore();
  const nav   = useNavigate();

  const session    = store.session;
  const isCreator  = session?.role === "creator";
  const allCourses = store.courses ?? [];

  // Creator sees their own courses; learner sees only published ones
  const visibleCourses = isCreator
    ? allCourses.filter(c => c.creatorEmail === session?.email)
    : allCourses.filter(c => c.published);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCreateModal, setShowCreate]  = useState(false);

  // New course form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc,  setNewDesc]  = useState("");

  const creatorCommunities = (store.userCommunities ?? []).filter(c => c.creatorEmail === session?.email);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    creatorCommunities[0]?.id ?? null
  );

  const handleCreate = () => {
    if (!newTitle.trim() || !session) return;
    const course: Course = {
      id:            Date.now(),
      communityId:   selectedCommunityId ?? 0,
      title:         newTitle.trim(),
      description:   newDesc.trim(),
      cover:         "",
      creatorEmail:  session.email,
      modules:       [],
      createdAt:     Date.now(),
      published:     false,
    };
    store.addCourse?.(course);
    setShowCreate(false);
    setNewTitle(""); setNewDesc("");
    setEditingCourse(course);
  };

  const handleSaveCourse = (updated: Course) => {
    store.updateCourse?.(updated);
    setEditingCourse(null);
  };

  const handleTogglePublish = async (course: Course) => {
    const willPublish = !course.published;
    store.updateCourse?.({ ...course, published: willPublish });

    if (willPublish) {
      // Notify members
      const community = (store.userCommunities ?? []).find(c => c.id === course.communityId);
      const memberEmails = store.getJoinedEmails?.(course.communityId ?? 0) ?? [];
      if (memberEmails.length > 0 && community) {
        await notifyCoursePublished({
          memberEmails,
          courseTitle:  course.title,
          courseId:     course.id,
          communityId:  course.communityId ?? 0,
          creatorName:  session?.name ?? "Creator",
        }).catch(() => null);
      }
      store.pushNotification(`✅ "${course.title}" is now published and visible to learners.`, "course_published", "/app/courses");
    } else {
      store.pushNotification(`"${course.title}" has been unpublished.`, "system");
    }
  };

  const handleDelete = (courseId: number) => {
    if (confirm("Delete this course? This cannot be undone.")) {
      store.deleteCourse?.(courseId);
    }
  };

  // ── Editor view ──────────────────────────────────────────────────────────────
  if (editingCourse) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col overflow-hidden">
        <CourseEditor
          course={editingCourse}
          onSave={handleSaveCourse}
          onBack={() => setEditingCourse(null)}
        />
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isCreator ? "My Courses" : "Available Courses"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isCreator
              ? `${visibleCourses.length} course${visibleCourses.length !== 1 ? "s" : ""} · ${visibleCourses.filter(c => c.published).length} published`
              : `${visibleCourses.length} course${visibleCourses.length !== 1 ? "s" : ""} available`
            }
          </p>
        </div>
        {isCreator && (
          <button
            onClick={() => {
              if (creatorCommunities.length === 0) {
                store.pushNotification("Create a community first before adding courses.", "system", "/create-community");
                nav({ to: "/create-community" });
                return;
              }
              setShowCreate(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Course
          </button>
        )}
      </div>

      {/* Requires community notice */}
      {isCreator && creatorCommunities.length === 0 && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">You need a community first</p>
            <p className="text-xs text-amber-600 mt-0.5">Courses live inside communities. Create your first community to get started.</p>
            <button
              onClick={() => nav({ to: "/create-community" })}
              className="mt-2 text-sm text-amber-700 hover:text-amber-800 font-semibold hover:underline"
            >
              Create a community →
            </button>
          </div>
        </div>
      )}

      {/* Course grid */}
      {visibleCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-700">
            {isCreator ? "No courses yet" : "No courses available"}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {isCreator
              ? "Create your first course to start teaching your community"
              : "Join a community to access its courses"
            }
          </p>
          {isCreator && creatorCommunities.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Create First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCreator
            ? visibleCourses.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onEdit={() => setEditingCourse(c)}
                  onTogglePublish={() => handleTogglePublish(c)}
                  onDelete={() => handleDelete(c.id)}
                />
              ))
            : visibleCourses.map(c => (
                <LearnerCourseCard
                  key={c.id}
                  course={c}
                  enrolled={(store.enrollments ?? []).some(e => e.courseId === c.id && e.userEmail === session?.email)}
                  onEnroll={() => store.enrollInCourse?.(c.id)}
                />
              ))
          }
        </div>
      )}

      {/* Create course modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 48, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 48, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">New Course</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Community selector */}
              {creatorCommunities.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Community</label>
                  <select
                    value={selectedCommunityId ?? ""}
                    onChange={e => setSelectedCommunityId(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {creatorCommunities.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Course title *</label>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Zero to AI Developer"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What will students learn?"
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <GraduationCap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Your course starts as a <strong>Draft</strong> — invisible to learners until you publish it.
                  You'll add modules and lessons in the editor.
                </p>
              </div>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Create & Open Editor
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
