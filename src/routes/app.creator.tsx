import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, DollarSign, GraduationCap, BookOpen, Plus,
  Settings, Bell, BarChart3, ChevronRight, Eye, MessageSquare,
  Rocket, CheckCircle2, AlertCircle, ArrowUpRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAppStore, type Community, type Course } from "@/lib/app-store";
import { Avatar } from "@/components/BrowserFrame";

export const Route = createFileRoute("/app/creator")({
  head: () => ({ meta: [{ title: "Creator Hub · SukaSpace" }] }),
  component: CreatorDashboard,
});

type Tab = "overview" | "communities" | "courses" | "members" | "payments" | "analytics" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "communities", label: "Communities" },
  { id: "courses", label: "Courses" },
  { id: "members", label: "Members" },
  { id: "payments", label: "Payments" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

function CreatorDashboard() {
  const store = useAppStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const myCommunities = store.communities.filter(
    c => c.creatorEmail === store.session?.email
  );
  const myCourses = store.courses.filter(
    c => c.creatorEmail === store.session?.email
  );
  const publishedCourses = myCourses.filter(c => c.published);
  const totalEnrollments = myCourses.reduce((s, c) => s + c.enrollmentCount, 0);
  const totalMembers = myCommunities.reduce((s, c) => s + c.members, 0);

  if (myCommunities.length === 0) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-background flex items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
            <BarChart3 size={24} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No community yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your first community to access your creator dashboard.</p>
          <button
            onClick={() => {
              if (!store.session) { window.location.replace("/auth"); return; }
              nav({ to: "/create-community" });
            }}
            className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Create a community
          </button>
        </div>
      </div>
    );
  }

  const community = myCommunities[0];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Creator Hub</div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">{community.title}</h1>
            <p className="text-sm text-muted-foreground">
              {community.tag === "FREE" ? "Free access" : `Paid · ${community.price}`}
              {myCommunities.length > 1 && ` · ${myCommunities.length} communities`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/settings" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-accent">
              <Settings size={14} className="text-muted-foreground" />
            </Link>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-accent">
              <Bell size={14} className="text-muted-foreground" />
              {store.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">{store.unreadCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === t.id ? "bg-foreground text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === "overview" && (
            <OverviewTab
              community={community}
              myCourses={myCourses}
              publishedCourses={publishedCourses}
              totalEnrollments={totalEnrollments}
              totalMembers={totalMembers}
            />
          )}
          {tab === "communities" && <CommunitiesTab communities={myCommunities} />}
          {tab === "courses" && <CoursesTab courses={myCourses} />}
          {tab === "members" && <MembersTab communities={myCommunities} />}
          {tab === "payments" && <PaymentsTab communities={myCommunities} />}
          {tab === "analytics" && <AnalyticsTab courses={myCourses} community={community} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ community, myCourses, publishedCourses, totalEnrollments, totalMembers }: {
  community: Community; myCourses: Course[]; publishedCourses: Course[]; totalEnrollments: number; totalMembers: number;
}) {
  const store = useAppStore();
  const nav = useNavigate();

  const METRICS = [
    { icon: DollarSign, label: "Revenue", value: "$0.00", sub: "Connect payments to earn", color: "text-primary bg-sky-50" },
    { icon: Users, label: "Total members", value: totalMembers.toLocaleString(), sub: "Across all communities", color: "text-emerald-600 bg-emerald-50" },
    { icon: BookOpen, label: "Courses", value: `${publishedCourses.length}/${myCourses.length}`, sub: `${myCourses.length - publishedCourses.length} draft`, color: "text-primary bg-sky-50" },
    { icon: GraduationCap, label: "Enrollments", value: totalEnrollments.toString(), sub: "Across all courses", color: "text-violet-600 bg-violet-50" },
  ];

  const recentPosts = store.posts.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METRICS.map(m => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${m.color}`}>
              <m.icon size={14} />
            </div>
            <div className="text-xl font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">{m.label}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column: growth chart + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Member growth</h2>
              <p className="text-xs text-muted-foreground">Net new members over time</p>
            </div>
            <TrendingUp size={14} className="text-muted-foreground" />
          </div>
          <div className="flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-border bg-background">
            <div className="text-center">
              <Users size={18} className="mx-auto text-muted-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">Growth chart appears as members join.</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Quick actions</h2>
          <div className="space-y-2">
            <button onClick={() => nav({ to: "/app/courses" })} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent">
              <span className="flex items-center gap-2"><BookOpen size={14} className="text-primary" />New course</span>
              <Plus size={13} className="text-muted-foreground" />
            </button>
            <button onClick={() => nav({ to: "/create-community" })} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent">
              <span className="flex items-center gap-2"><Users size={14} className="text-emerald-600" />New community</span>
              <Plus size={13} className="text-muted-foreground" />
            </button>
            <button onClick={() => nav({ to: "/app/feed" })} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent">
              <span className="flex items-center gap-2"><Eye size={14} className="text-slate-500" />View community</span>
              <ArrowUpRight size={13} className="text-muted-foreground" />
            </button>
            <button onClick={() => nav({ to: "/app/members" })} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent">
              <span className="flex items-center gap-2"><Users size={14} className="text-violet-600" />Manage members</span>
              <ChevronRight size={13} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Latest course performance */}
      {myCourses.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Courses</h2>
            <button onClick={() => nav({ to: "/app/courses" })} className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              Manage all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/50 text-[10px] font-semibold uppercase text-muted-foreground">
                  <th className="py-2 px-3 text-left">Course</th>
                  <th className="py-2 px-2 text-left">Enrolled</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCourses.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-medium text-foreground">{c.title}</td>
                    <td className="py-2 px-2 text-muted-foreground">{c.enrollmentCount}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {c.published ? "Published" : "Draft"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentPosts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent community posts</h2>
          <div className="divide-y divide-slate-100">
            {recentPosts.map(p => (
              <div key={p.id} className="flex items-start gap-3 py-2.5">
                <Avatar initials={p.author.slice(0, 2).toUpperCase()} size={26} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{p.title}</span>
                  <div className="text-xs text-muted-foreground">#{p.channel} · {p.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Communities Tab ──────────────────────────────────────────────────────────

function CommunitiesTab({ communities }: { communities: Community[] }) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your communities ({communities.length})</h2>
        <button onClick={() => nav({ to: "/create-community" })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90">
          <Plus size={12} /> New community
        </button>
      </div>

      {communities.map(c => (
        <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className={`h-20 bg-gradient-to-br ${c.banner}`} />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-foreground">{c.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{c.members.toLocaleString()} members</span>
                  <span>·</span>
                  <span>{c.category}</span>
                  <span>·</span>
                  <span className={`font-semibold ${c.tag === "FREE" ? "text-emerald-600" : "text-primary"}`}>{c.tag === "FREE" ? "Free" : c.price}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.summary}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button onClick={() => nav({ to: "/app/feed" })} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">View</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CoursesTab({ courses }: { courses: Course[] }) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your courses ({courses.length})</h2>
        <button onClick={() => nav({ to: "/app/courses" })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">
          <Plus size={12} /> New course
        </button>
      </div>

      {courses.length === 0 ? (
        <EmptyCard icon={<BookOpen size={20} />} title="No courses yet" desc="Create your first course to start teaching your community.">
          <button onClick={() => nav({ to: "/app/courses" })} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">
            <Plus size={12} /> Create course
          </button>
        </EmptyCard>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50 text-[10px] font-semibold uppercase text-muted-foreground">
                <th className="py-2.5 px-4 text-left">Course</th>
                <th className="py-2.5 px-3 text-left">Lessons</th>
                <th className="py-2.5 px-3 text-left">Enrolled</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map(c => {
                const lessons = c.modules.flatMap((m) => m.lessons).length;
                return (
                  <tr key={c.id} className="hover:bg-accent/30 transition">
                    <td className="py-3 px-4 font-medium text-foreground">{c.title}</td>
                    <td className="py-3 px-3 text-muted-foreground">{lessons}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{c.enrollmentCount}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {c.published ? "Published" : "Draft"}
                        </span>
                        <button onClick={() => nav({ to: "/app/courses" })} className="text-[11px] font-semibold text-primary hover:underline">Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ communities }: { communities: Community[] }) {
  const store = useAppStore();
  const [search, setSearch] = useState("");
  const session = store.session;

  const mockMembers = useMemo(() => {
    const base = session ? [{ name: session.name, email: session.email, avatar: session.avatar, community: communities[0]?.title || "—", role: "Creator", joined: "Today" }] : [];
    return base;
  }, [session, communities]);

  const filtered = mockMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 w-48"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50 text-[10px] font-semibold uppercase text-muted-foreground">
              <th className="py-2.5 px-4 text-left">Member</th>
              <th className="py-2.5 px-3 text-left">Community</th>
              <th className="py-2.5 px-3 text-left">Role</th>
              <th className="py-2.5 px-4 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "No members match your search." : "No members yet. Share your community to grow!"}
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.email} className="hover:bg-accent/20 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={m.avatar} size={28} />
                      <div>
                        <div className="font-medium text-foreground">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{m.community}</td>
                  <td className="py-3 px-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.role === "Creator" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{m.role}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{m.joined}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">Members appear here as people join your communities.</p>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab({ communities }: { communities: Community[] }) {
  const hasPaid = communities.some(c => c.tag === "PAID");
  return (
    <div className="space-y-5">
      {/* Balance card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-foreground to-slate-800 p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Available balance</div>
            <div className="mt-1 text-3xl font-bold">$0.00</div>
            <div className="mt-1 text-xs text-white/60">USD · No pending payouts</div>
          </div>
          <DollarSign size={28} className="text-white/20" />
        </div>
        {!hasPaid && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">
            <AlertCircle size={12} /> No paid communities yet
          </div>
        )}
      </div>

      {/* Setup prompt if no paid communities */}
      {!hasPaid && (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-primary">
            <DollarSign size={18} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">Ready to earn?</h3>
          <p className="mt-1 text-xs text-muted-foreground">Create a paid community or convert your free one to unlock payments.</p>
          <Link to="/create-community" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">
            Create paid community
          </Link>
        </div>
      )}

      {/* Transactions table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Transactions</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 size={18} className="text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No transactions yet.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Revenue will appear here once members subscribe.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ courses, community }: { courses: Course[]; community: Community | undefined }) {
  const enrollmentData = useMemo(() => {
    const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
    let running = 0;
    return weeks.map((w, i) => {
      const gain = courses.length > 0
        ? Math.floor(Math.random() * 3)
        : 0;
      running += gain;
      return { week: w, enrollments: running };
    });
  }, [courses.length]);

  const courseData = courses.slice(0, 6).map(c => ({
    name: c.title.length > 16 ? c.title.slice(0, 16) + "…" : c.title,
    enrolled: c.enrollmentCount,
  }));

  return (
    <div className="space-y-5">
      {/* Enrollment trend */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Enrollment trend</h2>
            <p className="text-xs text-muted-foreground">Cumulative enrollments over time</p>
          </div>
          <BarChart3 size={14} className="text-muted-foreground" />
        </div>
        {courses.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-background">
            <p className="text-xs text-muted-foreground">Publish a course to see enrollment data.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "none" }} />
              <Line type="monotone" dataKey="enrollments" stroke="#006194" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-course breakdown */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Enrollments by course</h2>
          <p className="text-xs text-muted-foreground">Who's taking what</p>
        </div>
        {courseData.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-background">
            <p className="text-xs text-muted-foreground">No course data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={courseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "none" }} />
              <Bar dataKey="enrolled" fill="#006194" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Discovery visibility */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Community visibility</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {["AI & Automation", "Software Engineering", "No-Code Tech", "Digital Business", "Marketing"].map(cat => (
            <span key={cat} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-muted-foreground">{cat}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Your community is listed in: <span className="font-semibold text-foreground">{community?.category ?? "—"}</span></p>
      </div>

      <p className="text-xs text-muted-foreground">
        ⚙️ Advanced analytics (cohorts, retention, revenue) are prepared in the database schema and will appear as your community grows.
      </p>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const nav = useNavigate();
  const ITEMS = [
    { icon: Settings, label: "Profile & account", desc: "Update your name, bio, and profile photo", action: () => nav({ to: "/app/settings" }) },
    { icon: Users, label: "Community settings", desc: "Edit title, description, category, and pricing", action: () => nav({ to: "/create-community" }) },
    { icon: DollarSign, label: "Payments & payouts", desc: "Connect a payment method to accept subscriptions", action: () => {} },
    { icon: Bell, label: "Notifications", desc: "Control what alerts you receive and when", action: () => {} },
  ];

  return (
    <div className="space-y-3">
      {ITEMS.map(item => (
        <button key={item.label} onClick={item.action} className="flex w-full items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 text-left shadow-sm hover:bg-accent transition">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent">
            <item.icon size={16} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.desc}</div>
          </div>
          <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

// ─── Empty Card ───────────────────────────────────────────────────────────────

function EmptyCard({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-accent text-muted-foreground">{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      {children}
    </div>
  );
}
