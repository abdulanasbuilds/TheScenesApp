import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  GraduationCap,
  BookOpen,
  Plus,
  Settings,
  Bell,
  BarChart3,
  ChevronRight,
  Eye,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Radio,
  Zap,
  Share2,
  Copy,
  Link2,
  Globe,
  ExternalLink,
  Flame,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAppStore, type Community, type Course } from "@/lib/app-store";
import { Avatar } from "@/components/BrowserFrame";
// No mock data — real member growth will appear as community grows
import { toast } from "sonner";

export const Route = createFileRoute("/app/creator")({
  head: () => ({ meta: [{ title: "Creator Hub · The Scenes" }] }),
  component: CreatorDashboard,
});

// ─── Affiliate helpers ────────────────────────────────────────────────────────

interface AffiliateSettings {
  enabled: boolean;
  commissionRate: number; // 5–50 %
  commissionType: "recurring" | "one-time";
  cookieDays: 30 | 60 | 90;
  referralCode: string;
}

const AFF_DEFAULTS: AffiliateSettings = {
  enabled: false,
  commissionRate: 20,
  commissionType: "recurring",
  cookieDays: 30,
  referralCode: "",
};

function loadAff(communityId: number): AffiliateSettings {
  if (typeof window === "undefined") return AFF_DEFAULTS;
  try {
    const raw = localStorage.getItem(`the-scenes_aff_${communityId}`);
    return raw ? { ...AFF_DEFAULTS, ...JSON.parse(raw) } : AFF_DEFAULTS;
  } catch {
    return AFF_DEFAULTS;
  }
}

function saveAff(communityId: number, s: AffiliateSettings) {
  localStorage.setItem(`the-scenes_aff_${communityId}`, JSON.stringify(s));
}

function makeCode(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return `${slug}${Math.random().toString(36).slice(2, 6)}`;
}

// Affiliates are loaded from real data when the affiliate system is backed by Supabase

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab =
  | "overview"
  | "communities"
  | "courses"
  | "members"
  | "payments"
  | "analytics"
  | "affiliate"
  | "live"
  | "automations"
  | "settings";

const TABS: { id: Tab; label: string; badge?: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "communities", label: "Communities" },
  { id: "courses", label: "Courses" },
  { id: "members", label: "Members" },
  { id: "payments", label: "Payments" },
  { id: "analytics", label: "Analytics" },
  { id: "affiliate", label: "Affiliate" },
  { id: "live", label: "Live", badge: "Soon" },
  { id: "automations", label: "Automations", badge: "Soon" },
  { id: "settings", label: "Settings" },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

function CreatorDashboard() {
  const store = useAppStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const myCommunities = store.communities.filter((c) => c.creatorEmail === store.session?.email);
  const myCourses = store.courses.filter((c) => c.creatorEmail === store.session?.email);
  const publishedCourses = myCourses.filter((c) => c.published);
  const totalEnrollments = myCourses.reduce((s, c) => s + c.enrollmentCount, 0);
  const totalMembers = myCommunities.reduce((s, c) => s + c.members, 0);

  if (myCommunities.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-background p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
            <BarChart3 size={24} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No community yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first community to access your Creator Hub.
          </p>
          <button
            onClick={() => {
              if (!store.session) {
                window.location.replace("/auth");
                return;
              }
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
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 md:pb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Creator Hub
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
              {community.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {community.tag === "FREE" ? "Free access" : `Paid · ${community.price}`}
              {myCommunities.length > 1 && ` · ${myCommunities.length} communities`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/settings"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-accent"
            >
              <Settings size={14} className="text-muted-foreground" />
            </Link>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-accent">
              <Bell size={14} className="text-muted-foreground" />
              {store.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {store.unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {t.label}
              {t.badge && (
                <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1 py-0.5 text-[7px] font-bold text-white leading-none">
                  {t.badge}
                </span>
              )}
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
          {tab === "affiliate" && <AffiliateTab community={community} />}
          {tab === "live" && <LiveTab />}
          {tab === "automations" && <AutomationsTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  community,
  myCourses,
  publishedCourses,
  totalEnrollments,
  totalMembers,
}: {
  community: Community;
  myCourses: Course[];
  publishedCourses: Course[];
  totalEnrollments: number;
  totalMembers: number;
}) {
  const store = useAppStore();
  const nav = useNavigate();
  const paystackOk = false;

  const METRICS = [
    {
      icon: DollarSign,
      label: "Revenue",
      value: "$0.00",
      sub: paystackOk ? "No transactions yet" : "Payments not connected",
      color: "text-primary bg-sky-50",
    },
    {
      icon: Users,
      label: "Total members",
      value: totalMembers.toLocaleString(),
      sub: "Across all communities",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: BookOpen,
      label: "Courses",
      value: `${publishedCourses.length}/${myCourses.length}`,
      sub: `${myCourses.length - publishedCourses.length} in draft`,
      color: "text-primary bg-sky-50",
    },
    {
      icon: GraduationCap,
      label: "Enrollments",
      value: totalEnrollments.toString(),
      sub: "Across all courses",
      color: "text-violet-600 bg-violet-50",
    },
  ];

  // Real growth data — flat until community grows (no fake numbers)
  const growthData = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    members: i === 11 ? totalMembers : 0,
  }));

  const recentPosts = store.posts.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Paystack banner */}
      {!paystackOk && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <div className="flex-1 text-xs text-amber-700">
            <span className="font-semibold">Payments not connected.</span> This is a design
            preview — no payments are collected.
          </div>
          <Link
            to="/app/payouts"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Set up payments
          </Link>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${m.color}`}>
              <m.icon size={14} />
            </div>
            <div className="text-xl font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Growth chart + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Member growth</h2>
              <p className="text-xs text-muted-foreground">
                Platform-wide trend (your community mirrors this as you grow)
              </p>
            </div>
            <TrendingUp size={14} className="text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={growthData} margin={{ left: -10, right: 4 }}>
              <defs>
                <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006194" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#006194" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="members"
                stroke="#006194"
                strokeWidth={2}
                fill="url(#memberGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Quick actions</h2>
          <div className="space-y-1.5">
            {[
              {
                icon: BookOpen,
                color: "text-primary",
                label: "New course",
                action: () => nav({ to: "/app/courses" }),
              },
              {
                icon: Users,
                color: "text-emerald-600",
                label: "New community",
                action: () => nav({ to: "/create-community" }),
              },
              {
                icon: Eye,
                color: "text-slate-500",
                label: "View community",
                action: () => nav({ to: "/app/feed" }),
              },
              {
                icon: Wallet,
                color: "text-violet-600",
                label: "Payouts & earnings",
                action: () => nav({ to: "/app/payouts" }),
              },
              {
                icon: Share2,
                color: "text-amber-600",
                label: "Affiliate program",
                action: () => nav({ to: "/app/affiliate" }),
              },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <a.icon size={14} className={a.color} />
                  {a.label}
                </span>
                <ChevronRight size={13} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coming soon platform features */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Coming soon for your community
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Radio,
              label: "Live Streaming",
              desc: "Host webinars and Q&A sessions up to 500 attendees.",
              tab: "live",
            },
            {
              icon: Zap,
              label: "Automations",
              desc: "Auto-DMs, CRM sync, Zapier/Make.com webhooks.",
              tab: "automations",
            },
            {
              icon: Globe,
              label: "Native Video",
              desc: "Host course videos directly on The Scenes.",
              tab: null,
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-xs font-semibold text-foreground">{f.label}</div>
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">
                      SOON
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courses table */}
      {myCourses.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Your courses</h2>
            <button
              onClick={() => nav({ to: "/app/courses" })}
              className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
            >
              Manage all <ChevronRight size={12} />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50 text-[10px] font-semibold uppercase text-muted-foreground">
                <th className="py-2 px-3 text-left">Course</th>
                <th className="py-2 px-2 text-left">Enrolled</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myCourses.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-accent/20 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground">{c.title}</td>
                  <td className="py-2 px-2 text-muted-foreground">{c.enrollmentCount}</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {c.published ? "Published" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent community posts</h2>
          <div className="divide-y divide-slate-100">
            {recentPosts.map((p) => (
              <div key={p.id} className="flex items-start gap-3 py-2.5">
                <Avatar initials={p.author.slice(0, 2).toUpperCase()} size={26} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{p.title}</span>
                  <div className="text-xs text-muted-foreground">
                    #{p.channel} · {p.author}
                  </div>
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
        <h2 className="text-sm font-semibold text-foreground">
          Your communities ({communities.length})
        </h2>
        <button
          onClick={() => nav({ to: "/create-community" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          <Plus size={12} /> New community
        </button>
      </div>
      {communities.map((c) => (
        <div
          key={c.id}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
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
                  <span
                    className={`font-semibold ${c.tag === "FREE" ? "text-emerald-600" : "text-primary"}`}
                  >
                    {c.tag === "FREE" ? "Free" : c.price}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.summary}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  onClick={() => nav({ to: "/app/feed" })}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  View
                </button>
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
        <button
          onClick={() => nav({ to: "/app/courses" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
        >
          <Plus size={12} /> New course
        </button>
      </div>
      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-accent text-muted-foreground">
            <BookOpen size={20} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">No courses yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first course to start teaching your community.
          </p>
          <button
            onClick={() => nav({ to: "/app/courses" })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
          >
            <Plus size={12} /> Create course
          </button>
        </div>
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
              {courses.map((c) => {
                const lessons = c.modules.flatMap((m) => m.lessons).length;
                return (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{c.title}</td>
                    <td className="py-3 px-3 text-muted-foreground">{lessons}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{c.enrollmentCount}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {c.published ? "Published" : "Draft"}
                        </span>
                        <button
                          onClick={() => nav({ to: "/app/courses" })}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Edit
                        </button>
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
    const base = session
      ? [
          {
            name: session.name,
            email: session.email,
            avatar: session.avatar,
            community: communities[0]?.title || "—",
            role: "Creator",
            joined: "Today",
          },
        ]
      : [];
    return base;
  }, [session, communities]);
  const filtered = mockMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-48 rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
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
                  {search
                    ? "No members match your search."
                    : "No members yet. Share your community to grow!"}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.email} className="hover:bg-accent/20 transition-colors">
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.role === "Creator" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{m.joined}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Members appear here as people join your communities.
      </p>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab({ communities }: { communities: Community[] }) {
  const hasPaid = communities.some((c) => c.tag === "PAID");
  const paystackOk = false;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-gradient-to-br from-foreground to-slate-800 p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Available balance
            </div>
            <div className="mt-1 text-3xl font-bold">$0.00</div>
            <div className="mt-1 text-xs text-white/60">USD · No pending payouts</div>
          </div>
          <DollarSign size={28} className="text-white/20" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!hasPaid && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">
              <AlertCircle size={12} /> No paid communities yet
            </div>
          )}
          {!paystackOk && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/30 px-3 py-2 text-xs font-semibold text-white">
              <AlertCircle size={12} /> Payments not connected
            </div>
          )}
        </div>
      </div>

      {!hasPaid && (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-primary">
            <DollarSign size={18} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">Ready to earn?</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a paid community or convert your free one to unlock payments.
          </p>
          <Link
            to="/create-community"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
          >
            Create paid community
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Full payout dashboard</h2>
          <Link
            to="/app/payouts"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Open Payouts <ArrowUpRight size={11} />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          View transaction history, configure payment methods, and withdraw earnings from the
          dedicated Payouts page.
        </p>
        <Link
          to="/app/payouts"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Wallet size={13} /> Go to Payouts
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent transactions</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 size={18} className="text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No transactions yet.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Revenue will appear here once members subscribe to your paid communities.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({
  courses,
  community,
}: {
  courses: Course[];
  community: Community | undefined;
}) {
  const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const enrollmentData = WEEKS.map((w, i) => ({
    week: w,
    enrollments: courses.reduce((s, c) => s + Math.min(c.enrollmentCount, i + 1), 0),
  }));
  const courseData = courses
    .slice(0, 6)
    .map((c) => ({
      name: c.title.length > 16 ? c.title.slice(0, 16) + "…" : c.title,
      enrolled: c.enrollmentCount,
    }));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Enrollment trend</h2>
            <p className="text-xs text-muted-foreground">Cumulative enrollments over time</p>
          </div>
          <BarChart3 size={14} className="text-muted-foreground" />
        </div>
        {courses.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-background">
            <p className="text-xs text-muted-foreground">
              Publish a course to see enrollment data.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "none",
                }}
              />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#006194"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

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
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "none",
                }}
              />
              <Bar dataKey="enrolled" fill="#006194" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Community visibility</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            "AI & Automation",
            "Software Engineering",
            "No-Code Tech",
            "Digital Business",
            "Marketing",
          ].map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-muted-foreground"
            >
              {cat}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Your community is listed in:{" "}
          <span className="font-semibold text-foreground">{community?.category ?? "—"}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Affiliate Tab ────────────────────────────────────────────────────────────

function AffiliateTab({ community }: { community: Community }) {
  const [aff, setAff] = useState<AffiliateSettings>(() => loadAff(community.id));
  const [rate, setRate] = useState(aff.commissionRate.toString());
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const referralLink = aff.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : "https://the-scenes.com"}/ref/${aff.referralCode}`
    : "";

  const toggle = () => {
    const next: AffiliateSettings = {
      ...aff,
      enabled: !aff.enabled,
      referralCode:
        !aff.enabled && !aff.referralCode ? makeCode(community.title) : aff.referralCode,
    };
    setAff(next);
    saveAff(community.id, next);
    toast.success(next.enabled ? "Affiliate program enabled!" : "Affiliate program disabled.");
  };

  const save = () => {
    const parsed = Math.min(50, Math.max(5, parseInt(rate) || 20));
    const next = { ...aff, commissionRate: parsed };
    setRate(parsed.toString());
    setAff(next);
    saveAff(community.id, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Affiliate settings saved!");
  };

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard?.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  // Real affiliate data — starts at 0 until real affiliates sign up
  const totalAff = 0;
  const totalConv = 0;
  const totalPending = 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Affiliate Program</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Let your members and fans earn a commission for every new subscriber they refer to your
          community. You set the rate — they do the promoting.
        </p>
      </div>

      {/* Enable / disable card */}
      <div
        className={`overflow-hidden rounded-xl border shadow-sm transition-colors ${aff.enabled ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${aff.enabled ? "bg-primary text-white" : "bg-accent text-muted-foreground"}`}
            >
              <Share2 size={18} />
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground">
                Affiliate program for "{community.title}"
              </div>
              <div className="text-xs text-muted-foreground">
                {aff.enabled
                  ? `Active · ${aff.commissionRate}% ${aff.commissionType} commission`
                  : "Disabled — toggle to activate"}
              </div>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aff.enabled ? "bg-primary" : "bg-slate-200"}`}
            aria-label="Toggle affiliate program"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aff.enabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Settings (shown when enabled) */}
        {aff.enabled && (
          <div className="border-t border-border p-4 space-y-4">
            {/* Commission rate */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Commission rate (%)
              </label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Percentage of each subscription payment your affiliates earn.
              </p>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={parseInt(rate) || 20}
                  onChange={(e) => setRate(e.target.value)}
                  className="flex-1 accent-primary"
                />
                <div className="flex items-center rounded-lg border border-border bg-card px-2.5 py-1.5">
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-10 bg-transparent text-center text-sm font-bold text-foreground outline-none"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>5% min</span>
                <span className="text-primary font-semibold">{rate}% commission</span>
                <span>50% max</span>
              </div>
            </div>

            {/* Commission type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Commission type</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["recurring", "one-time"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setAff((prev) => {
                        const n = { ...prev, commissionType: t };
                        saveAff(community.id, n);
                        return n;
                      })
                    }
                    className={`rounded-xl border p-3 text-left transition-all ${aff.commissionType === t ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                  >
                    <div className="text-xs font-semibold text-foreground capitalize">{t}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {t === "recurring"
                        ? "Affiliates earn every month the referral stays subscribed."
                        : "One payment per conversion, regardless of duration."}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cookie duration */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Attribution window
              </label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                How long after clicking the link a conversion is attributed to the affiliate.
              </p>
              <div className="mt-2 flex gap-2">
                {([30, 60, 90] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setAff((prev) => {
                        const n = { ...prev, cookieDays: d };
                        saveAff(community.id, n);
                        return n;
                      })
                    }
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${aff.cookieDays === d ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"}`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={save}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              {saved ? (
                <>
                  <CheckCircle2 size={13} /> Saved!
                </>
              ) : (
                "Save settings"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Referral link */}
      {aff.enabled && referralLink && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Link2 size={14} className="text-primary" /> Your referral link
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Share this link. Anyone who signs up and subscribes through it earns you nothing — but
            the affiliate who shared it earns their commission.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background p-3">
            <Globe size={14} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate font-mono text-xs text-foreground">
              {referralLink}
            </span>
            <button
              onClick={copyLink}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${copied ? "bg-emerald-100 text-emerald-700" : "bg-primary text-white hover:bg-primary/90"}`}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={11} /> Copied
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Code:{" "}
            <span className="font-mono font-semibold text-foreground">{aff.referralCode}</span> ·
            Regenerate code by disabling and re-enabling the program.
          </p>
        </div>
      )}

      {/* Stats row */}
      {aff.enabled && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Affiliates", value: totalAff.toString(), icon: Users },
            { label: "Total referrals", value: "0", icon: Share2 },
            { label: "Conversions", value: totalConv.toString(), icon: CheckCircle2 },
            { label: "Pending payout", value: `${totalPending}`, icon: Wallet },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <s.icon size={14} className="text-primary" />
              <div className="mt-2 text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Affiliates table */}
      {aff.enabled && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Active affiliates</h3>
            <p className="text-xs text-muted-foreground">
              People promoting your community and their performance.
            </p>
          </div>
          <div className="py-10 text-center">
            <Share2 size={20} className="mx-auto text-muted-foreground/30" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">No affiliates yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Share your referral link to attract your first affiliate. They'll appear here once
              they sign up.
            </p>
          </div>
        </div>
      )}

      {!aff.enabled && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
          <Share2 size={24} className="mx-auto text-muted-foreground/40" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">Enable affiliate marketing</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Let your community members earn a commission for every new subscriber they bring in.
            Toggle the switch above to get started.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Live Tab (coming soon in dashboard) ──────────────────────────────────────

function LiveTab() {
  const store = useAppStore();
  const [notified, setNotified] = useState(false);
  const notify = () => {
    if (notified) return;
    store.pushNotification("You'll be notified when Live Streaming launches for creators.");
    toast.success("Added to early-access list!");
    setNotified(true);
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Radio size={22} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-amber-900">Live Streaming & Events</h2>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-white">
                COMING SOON
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
              Host webinars, workshops, and interactive Q&A rooms — all directly inside your
              The Scenes community. No Zoom, no third-party links.
            </p>
            <button
              onClick={notify}
              disabled={notified}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60 transition-colors"
            >
              {notified ? (
                <>
                  <CheckCircle2 size={13} /> You're on the list!
                </>
              ) : (
                "Notify me when it's live"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            label: "Webinar Mode",
            desc: "Up to 500 participants with screen sharing, slides, and polls. Perfect for community-wide sessions.",
          },
          {
            label: "Interactive Rooms",
            desc: "Intimate Q&A and co-working sessions for up to 50 members with raise-hand and chat features.",
          },
          {
            label: "Auto-Replay Posting",
            desc: "Recordings automatically post to your community after the session ends — no manual upload.",
          },
          {
            label: "Attendance Analytics",
            desc: "See who showed up, how long they stayed, and which moments had peak engagement.",
          },
          {
            label: "RSVP & In-App Reminders",
            desc: "Members RSVP and receive in-app reminders 24 hours and 1 hour before the session.",
          },
          {
            label: "Scheduled & Recurring",
            desc: "Set up one-time or recurring events synced to your community calendar.",
          },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-foreground">{f.label}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Automations Tab (coming soon in dashboard) ────────────────────────────────

function AutomationsTab() {
  const store = useAppStore();
  const [notified, setNotified] = useState(false);
  const notify = () => {
    if (notified) return;
    store.pushNotification("You'll be notified when Automations launches for creators.");
    toast.success("Added to early-access list!");
    setNotified(true);
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Zap size={22} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-amber-900">Workflow Automations</h2>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-white">
                COMING SOON
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
              Build trigger-action pipelines to welcome new members, sync your CRM, drip
              notifications, and fire webhooks to Zapier, Make.com, or your own backend.
            </p>
            <button
              onClick={notify}
              disabled={notified}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60 transition-colors"
            >
              {notified ? (
                <>
                  <CheckCircle2 size={13} /> You're on the list!
                </>
              ) : (
                "Notify me when it's live"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            label: "Auto Welcome DMs",
            desc: "Send a personalised message to every new member the moment they join your community.",
          },
          {
            label: "Webhook & API Triggers",
            desc: "Fire events to any external URL — Zapier, Make.com, n8n, or your own server.",
          },
          {
            label: "Drip Notifications",
            desc: "Schedule in-app notifications over days or weeks to guide member journeys.",
          },
          {
            label: "CRM Sync",
            desc: "Mirror member data and payment events to HubSpot, Notion, Airtable, or Google Sheets.",
          },
          {
            label: "Auto-Tagging",
            desc: "Tag members automatically based on courses completed, XP tier, or payment status.",
          },
          {
            label: "Visual Flow Builder",
            desc: "Drag-and-drop trigger → action editor. No code, no YAML, no complexity.",
          },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-foreground">{f.label}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const nav = useNavigate();
  const ITEMS = [
    {
      icon: Settings,
      label: "Profile & account",
      desc: "Update your name, bio, and profile photo",
      action: () => nav({ to: "/app/settings" }),
    },
    {
      icon: Globe,
      label: "Community settings",
      desc: "Edit title, description, category, and pricing",
      action: () => nav({ to: "/create-community" }),
    },
    {
      icon: DollarSign,
      label: "Payments & payouts",
      desc: "Set up withdrawals and view earnings",
      action: () => nav({ to: "/app/payouts" }),
    },
    {
      icon: Share2,
      label: "Affiliate program",
      desc: "Set commission rates and manage your affiliate referral system",
      action: () => {},
    },
    {
      icon: Bell,
      label: "Notifications",
      desc: "Control what alerts you receive and when",
      action: () => {},
    },
  ];
  return (
    <div className="space-y-3">
      {ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className="flex w-full items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 text-left shadow-sm hover:bg-accent transition-colors"
        >
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
