import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp, Users, DollarSign, GraduationCap, Eye, ChevronRight, BarChart3, MessageSquare } from "lucide-react";
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
    { icon: DollarSign, label: "Monthly Recurring Revenue", value: "$0.00", change: "No sales yet", tone: "text-muted-foreground" },
    { icon: Users, label: "Active members", value: community.members.toLocaleString(), change: "Just you so far", tone: "text-muted-foreground" },
    { icon: GraduationCap, label: "Course completion", value: "—", change: "No courses published", tone: "text-muted-foreground" },
    { icon: TrendingUp, label: "Discovery impressions", value: "0", change: "Community just launched", tone: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Creator Hub</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{community.title}</h1>
            <p className="text-sm text-muted-foreground">
              Owned by you · {community.tag === "FREE" ? "Free access" : `Paid · ${community.price}`}
            </p>
          </div>
          <button onClick={() => nav({ to: "/app/feed" })} className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-white">Preview community</button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{m.label}</span>
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-foreground"><m.icon size={14} /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{m.value}</div>
              <div className={`mt-1 text-xs font-semibold ${m.tone}`}>{m.change}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:col-span-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Member growth timeline</h2>
              <p className="text-xs text-muted-foreground">Net new members over time</p>
            </div>
            <div className="mt-4 flex h-52 w-full items-center justify-center rounded-lg border border-dashed border-border bg-background">
              <p className="text-xs text-muted-foreground">Growth data will appear here as members join.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground"><Eye size={12} /> Discovery visibility</div>
            <div className="mt-3 space-y-2">
              {Object.entries(visibility).map(([k, on]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                  <span className="text-sm font-medium text-foreground">{k}</span>
                  <button
                    aria-label={`Toggle ${k} visibility`}
                    onClick={() => setVisibility((v) => ({ ...v, [k]: !v[k] }))}
                    className={`relative h-5 w-9 rounded-full transition ${on ? "bg-primary" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition ${on ? "left-4" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Top members this month</h2>
              <button onClick={() => nav({ to: "/app/members" })} className="text-xs font-semibold text-primary">
                See all <ChevronRight size={12} className="inline" />
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3 text-left">Member</th>
                    <th className="text-left">Posts</th>
                    <th className="text-left">XP</th>
                    <th className="px-3 text-right">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {store.session && (
                    <tr className="border-t border-slate-100">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={store.session.avatar} size={26} />
                          <span className="font-medium text-foreground">{store.session.name}</span>
                        </div>
                      </td>
                      <td className="text-foreground">{store.posts.length}</td>
                      <td className="font-semibold text-foreground">0</td>
                      <td className="px-3 text-right font-semibold text-primary">0 🔥</td>
                    </tr>
                  )}
                  {store.posts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">No member activity yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Recent DMs</h2>
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare size={20} className="text-muted-foreground/50" />
              <p className="mt-2 text-xs text-muted-foreground">No messages yet.</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Member conversations will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
