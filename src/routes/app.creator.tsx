import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp, Users, DollarSign, GraduationCap, Eye, ChevronRight, BarChart3, MessageSquare, BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/creator")({
  head: () => ({ meta: [{ title: "Creator Hub · SukaSpace" }] }),
  component: CreatorHub,
});

function CreatorHub() {
  const store = useAppStore();
  const nav = useNavigate();
  const community = store.communities[0] ?? null;

  const myCourses = store.courses.filter(c => c.creatorEmail === store.session?.email);
  const publishedCourses = myCourses.filter(c => c.published);
  const totalEnrollments = myCourses.reduce((s, c) => s + c.enrollmentCount, 0);

  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    "AI & Automation": true,
    "Software Engineering": true,
    "No-Code Tech": false,
    "Digital Business": true,
    Marketing: false,
  });

  if (!community) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-background flex items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
            <BarChart3 size={24} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No community yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your first community to see analytics, manage members, and track growth.</p>
          <button onClick={() => nav({ to: "/create-community" })} className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Create a community</button>
        </div>
      </div>
    );
  }

  const METRICS = [
    { icon: DollarSign, label: "Monthly Revenue", value: "$0.00", sub: "No sales yet", tone: "text-muted-foreground" },
    { icon: Users, label: "Members", value: community.members.toLocaleString(), sub: "Active in community", tone: "text-emerald-600" },
    { icon: BookOpen, label: "Courses", value: publishedCourses.length.toString(), sub: `${myCourses.length} total (${myCourses.length - publishedCourses.length} draft)`, tone: "text-primary" },
    { icon: GraduationCap, label: "Enrollments", value: totalEnrollments.toString(), sub: "Across all courses", tone: totalEnrollments > 0 ? "text-primary" : "text-muted-foreground" },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Creator Hub</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{community.title}</h1>
            <p className="text-sm text-muted-foreground">
              {community.tag === "FREE" ? "Free access" : `Paid · ${community.price}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav({ to: "/app/courses" })} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">
              <BookOpen size={14} />Course Builder
            </button>
            <button onClick={() => nav({ to: "/app/feed" })} className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-white">View community</button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map(m => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{m.label}</span>
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent"><m.icon size={14} /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{m.value}</div>
              <div className={`mt-1 text-xs font-semibold ${m.tone}`}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Growth chart placeholder */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Member growth</h2>
                <p className="text-xs text-muted-foreground">Net new members over time</p>
              </div>
              <TrendingUp size={16} className="text-muted-foreground" />
            </div>
            <div className="mt-4 flex h-52 w-full items-center justify-center rounded-lg border border-dashed border-border bg-background">
              <p className="text-xs text-muted-foreground">Growth chart appears as members join.</p>
            </div>
          </div>

          {/* Discovery visibility */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground mb-3"><Eye size={12} />Discovery Visibility</div>
            <div className="space-y-2">
              {Object.entries(visibility).map(([k, on]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                  <span className="text-sm font-medium text-foreground">{k}</span>
                  <button
                    onClick={() => setVisibility(v => ({ ...v, [k]: !v[k] }))}
                    className={`relative h-5 w-9 rounded-full transition ${on ? "bg-primary" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${on ? "left-4" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Courses widget */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Courses</h2>
              <div className="flex gap-2">
                <button onClick={() => nav({ to: "/app/courses" })} className="text-xs font-semibold text-primary hover:underline">Manage all <ChevronRight size={12} className="inline" /></button>
              </div>
            </div>
            {myCourses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
                <BookOpen size={20} className="mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No courses yet. Build your first course to start teaching.</p>
                <button onClick={() => nav({ to: "/app/courses" })} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={12} />Create course</button>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
                    <tr><th className="py-2 px-3 text-left">Course</th><th className="text-left">Lessons</th><th className="text-left">Enrolled</th><th className="px-3 text-right">Status</th></tr>
                  </thead>
                  <tbody>
                    {myCourses.slice(0, 5).map(c => {
                      const lessons = c.modules.flatMap(m => m.lessons).length;
                      return (
                        <tr key={c.id} className="border-t border-slate-100">
                          <td className="py-2 px-3 font-medium text-foreground">{c.title}</td>
                          <td className="text-muted-foreground">{lessons}</td>
                          <td className="font-semibold text-foreground">{c.enrollmentCount}</td>
                          <td className="px-3 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.published ? "Published" : "Draft"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DMs */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Recent DMs</h2>
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare size={20} className="text-muted-foreground/50" />
              <p className="mt-2 text-xs text-muted-foreground">No messages yet.</p>
            </div>
          </div>
        </div>

        {/* Top members */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Top members</h2>
            <button onClick={() => nav({ to: "/app/members" })} className="text-xs font-semibold text-primary hover:underline">Manage <ChevronRight size={12} className="inline" /></button>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
                <tr><th className="py-2 px-3 text-left">Member</th><th className="text-left">Posts</th><th className="text-left">Lessons</th><th className="px-3 text-right">Streak</th></tr>
              </thead>
              <tbody>
                {store.session && (
                  <tr className="border-t border-slate-100">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar initials={store.session.avatar} size={26} />
                        <span className="font-medium">{store.session.name}</span>
                      </div>
                    </td>
                    <td className="text-foreground">{store.posts.length}</td>
                    <td className="text-foreground">—</td>
                    <td className="px-3 text-right font-semibold text-primary">0 🔥</td>
                  </tr>
                )}
                {!store.session && (
                  <tr><td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">No member activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
