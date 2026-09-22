import { EmptyState } from "@/components/EmptyState";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  PlayCircle,
  ChevronRight,
  Bell,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { useAppStore, type CommunityEvent } from "@/lib/app-store";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · The Scenes" }] }),
  component: LearnerDashboard,
});

type Tab = "overview" | "learning" | "communities" | "calendar" | "messages";

function LearnerDashboard() {
  const store = useAppStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const session = store.session;
  const joinedCommunities = useMemo(
    () => store.communities.filter((c) => store.isJoined(c.id)),
    [store.communities, store.joinedCommunityIds],
  );
  const enrolledCourses = useMemo(
    () => store.courses.filter((c) => store.isEnrolled(c.id)),
    [store.courses, store.enrollments],
  );
  const allEvents = useMemo(
    () => joinedCommunities.flatMap((c) => store.getCommunityEvents(c.id)),
    [joinedCommunities],
  );
  const upcomingEvents = allEvents
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const totalLessonsCompleted = enrolledCourses.reduce((acc, c) => {
    const p = store.getCourseProgress(c.id);
    return acc + p.completed;
  }, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = session?.name?.split(" ")[0] || "there";

  const STATS = [
    {
      icon: BookOpen,
      label: "Courses enrolled",
      value: enrolledCourses.length,
      color: "text-primary bg-sky-50",
    },
    {
      icon: Users,
      label: "Communities",
      value: joinedCommunities.length,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: CheckCircle2,
      label: "Lessons done",
      value: totalLessonsCompleted,
      color: "text-violet-600 bg-violet-50",
    },
    {
      icon: Calendar,
      label: "Upcoming events",
      value: upcomingEvents.length,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "communities", label: "Communities", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{greeting},</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{firstName} 👋</h1>
            <span className="mt-1 inline-block rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Learner
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/settings"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-accent"
            >
              <Settings size={15} className="text-muted-foreground" />
            </Link>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-accent">
              <Bell size={15} className="text-muted-foreground" />
              {store.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {store.unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${s.color}`}>
                <s.icon size={15} />
              </div>
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? "bg-foreground text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {tab === "overview" && (
            <OverviewTab
              enrolledCourses={enrolledCourses}
              joinedCommunities={joinedCommunities}
              upcomingEvents={upcomingEvents}
              recentPosts={store.posts.slice(0, 5)}
            />
          )}
          {tab === "learning" && <LearningTab courses={enrolledCourses} />}
          {tab === "communities" && <CommunitiesTab communities={joinedCommunities} />}
          {tab === "calendar" && <CalendarTab events={allEvents} />}
          {tab === "messages" && (
            <MessagesTab posts={store.posts} notifications={store.notifications} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  enrolledCourses,
  joinedCommunities,
  upcomingEvents,
  recentPosts,
}: {
  enrolledCourses: ReturnType<typeof useAppStore>["courses"];
  joinedCommunities: ReturnType<typeof useAppStore>["communities"];
  upcomingEvents: CommunityEvent[];
  recentPosts: ReturnType<typeof useAppStore>["posts"];
}) {
  const store = useAppStore();
  const nav = useNavigate();

  const inProgress = enrolledCourses.filter((c) => {
    const p = store.getCourseProgress(c.id);
    return p.completed > 0 && p.completed < p.total;
  });
  const notStarted = enrolledCourses.filter((c) => {
    const p = store.getCourseProgress(c.id);
    return p.completed === 0;
  });
  const continueCourse = inProgress[0] ?? notStarted[0] ?? null;

  return (
    <div className="space-y-5">
      {/* Continue learning */}
      {continueCourse ? (
        <div>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground">Continue learning</h2>
          <CourseProgressCard course={continueCourse} />
        </div>
      ) : enrolledCourses.length === 0 ? (
        <EmptyState
          variant="empty"
          icon={<BookOpen size={22} />}
          title="No courses yet"
          description="You have not enrolled in a course. Communities publish their curriculum in the classroom \u2014 join one and enroll to start tracking progress."
          primary={{ label: "Explore communities", to: "/discover" }}
          secondary={{ label: "Open your feed", to: "/app/feed" }}
          helper="Your lesson progress and XP start counting from your first lesson."
        />
      ) : (
        <div>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground">All courses completed 🎉</h2>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            You've completed all your enrolled courses. Time to enroll in something new!
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground">Upcoming events</h2>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.date}
                    {e.time ? ` · ${e.time}` : ""}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    e.type === "session"
                      ? "bg-sky-100 text-sky-700"
                      : e.type === "deadline"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {e.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentPosts.length > 0 && (
        <div>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground">Recent activity</h2>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-border bg-card">
            {recentPosts.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-foreground">
                  {p.author.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{p.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    by {p.author} · {p.channel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions if no data */}
      {enrolledCourses.length === 0 && joinedCommunities.length === 0 && (
        <EmptyState
          variant="empty"
          icon={<Rocket size={20} />}
          title="Welcome to The Scenes"
          description="Your workspace is ready and completely clean. Two steps get you to a working day-one setup."
          checklist={[
            { label: "Join or create a community" },
            { label: "Enroll in your first course" },
          ]}
          primary={{ label: "Browse communities", to: "/discover" }}
          secondary={{ label: "Create a community", to: "/create-community" }}
          helper="Nothing here is pre-filled \u2014 every number you see later is your own activity."
        />
      )}
    </div>
  );
}

// ─── Learning Tab ─────────────────────────────────────────────────────────────

function LearningTab({ courses }: { courses: ReturnType<typeof useAppStore>["courses"] }) {
  const store = useAppStore();
  const nav = useNavigate();

  if (courses.length === 0) {
    return (
      <EmptySection
        icon={<BookOpen size={22} />}
        title="No courses enrolled"
        desc="Join a community and enroll in a course to start learning."
        action={
          <Link
            to="/discover"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Discover communities <ArrowRight size={13} />
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((c) => (
        <CourseProgressCard key={c.id} course={c} />
      ))}
    </div>
  );
}

function CourseProgressCard({ course }: { course: ReturnType<typeof useAppStore>["courses"][0] }) {
  const store = useAppStore();
  const nav = useNavigate();
  const progress = store.getCourseProgress(course.id);
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isComplete = pct === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-50">
          {isComplete ? (
            <CheckCircle2 size={20} className="text-emerald-600" />
          ) : (
            <BookOpen size={20} className="text-sky-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-foreground">{course.title}</div>
            <span className="shrink-0 text-xs font-bold text-primary">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
              className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-primary"}`}
            />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {progress.completed} of {progress.total} lessons complete
          </div>
        </div>
        <button
          onClick={() => nav({ to: "/app/classroom" })}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isComplete ? "border border-border text-muted-foreground" : "bg-primary text-white"
          }`}
        >
          {isComplete ? "Review" : progress.completed === 0 ? "Start" : "Continue"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Communities Tab ──────────────────────────────────────────────────────────

function CommunitiesTab({
  communities,
}: {
  communities: ReturnType<typeof useAppStore>["communities"];
}) {
  const nav = useNavigate();

  if (communities.length === 0) {
    return (
      <EmptySection
        icon={<Users size={22} />}
        title="No communities joined"
        desc="Discover communities and join the ones that match your interests."
        action={
          <Link
            to="/discover"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Browse Discover <ArrowRight size={13} />
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {communities.map((c) => (
        <motion.button
          key={c.id}
          onClick={() => nav({ to: "/app/feed" })}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-primary/30 transition"
        >
          <div className={`relative h-16 bg-gradient-to-br ${c.banner}`}>
            <div className="absolute -bottom-3.5 left-4 grid h-9 w-9 place-items-center rounded-lg border-2 border-white bg-slate-800 text-xs font-bold text-white shadow-sm">
              {c.avatar}
            </div>
          </div>
          <div className="p-4 pt-5">
            <div className="text-sm font-semibold text-foreground">{c.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{c.members.toLocaleString()} members</span>
              <span>·</span>
              <span>{c.category}</span>
            </div>
            <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">{c.summary}</p>
          </div>
        </motion.button>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center"
      >
        <div>
          <div className="text-sm font-medium text-muted-foreground">Find more communities</div>
          <Link
            to="/discover"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Discover <ChevronRight size={12} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ events }: { events: CommunityEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const now = new Date(new Date().toDateString());
  const upcoming = sorted.filter((e) => new Date(e.date) >= now);
  const past = sorted.filter((e) => new Date(e.date) < now);

  const TYPE_META: Record<string, { label: string; color: string }> = {
    session: { label: "Live session", color: "bg-sky-100 text-sky-700" },
    deadline: { label: "Deadline", color: "bg-rose-100 text-rose-700" },
    meetup: { label: "Meetup", color: "bg-violet-100 text-violet-700" },
    personal: { label: "Personal", color: "bg-slate-100 text-slate-600" },
  };

  if (events.length === 0) {
    return (
      <EmptySection
        icon={<Calendar size={22} />}
        title="No events yet"
        desc="Events from your communities will appear here."
      />
    );
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming
          </h3>
          <div className="space-y-2">
            {upcoming.map((e) => {
              const meta = TYPE_META[e.type] ?? TYPE_META.personal;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <Calendar size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.date}
                      {e.time ? ` · ${e.time}` : ""}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Past
          </h3>
          <div className="space-y-2">
            {past.slice(0, 3).map((e) => {
              const meta = TYPE_META[e.type] ?? TYPE_META.personal;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 opacity-60"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
                    <Clock size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.date}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab({
  posts,
  notifications,
}: {
  posts: ReturnType<typeof useAppStore>["posts"];
  notifications: ReturnType<typeof useAppStore>["notifications"];
}) {
  const [activeView, setActiveView] = useState<"notifications" | "activity">("notifications");
  const store = useAppStore();

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["notifications", "activity"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${activeView === v ? "bg-foreground text-white" : "text-muted-foreground hover:bg-accent"}`}
          >
            {v}
            {v === "notifications" && store.unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">
                {store.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeView === "notifications" && (
        <div>
          {notifications.length === 0 ? (
            <EmptySection
              icon={<Bell size={20} />}
              title="No notifications"
              desc="You're all caught up!"
            />
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-border bg-card">
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-sky-50/50" : ""}`}
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-slate-200"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => store.markAllNotificationsRead()}
              className="mt-3 w-full rounded-lg border border-border bg-card py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      {activeView === "activity" && (
        <div>
          {posts.length === 0 ? (
            <EmptySection
              icon={<MessageSquare size={20} />}
              title="No activity yet"
              desc="Community posts will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-border bg-card">
              {posts.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-foreground">
                    {p.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{p.author}</span>
                      <span className="text-xs text-muted-foreground">posted in #{p.channel}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty Section ────────────────────────────────────────────────────────────

function EmptySection({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-accent text-muted-foreground">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      {action}
    </div>
  );
}
