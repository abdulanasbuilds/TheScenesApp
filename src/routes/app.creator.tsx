import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, DollarSign, GraduationCap, Eye, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ANALYTICS, MOCK_GROWTH_SERIES, MOCK_ONLINE, MOCK_DIRECT_MESSAGES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/creator")({
  head: () => ({ meta: [{ title: "Creator Hub · SukaSpace" }] }),
  component: CreatorHub,
});

const METRICS = [
  { icon: DollarSign, label: "Monthly Recurring Revenue", value: MOCK_ANALYTICS.mrr, change: "+18.4%", tone: "text-success" },
  { icon: Users, label: "Active members", value: MOCK_ANALYTICS.activeMembers, change: "+126 this week", tone: "text-success" },
  { icon: GraduationCap, label: "Course completion", value: MOCK_ANALYTICS.courseCompletionRate, change: "+4.2%", tone: "text-success" },
  { icon: TrendingUp, label: "Discovery impressions", value: "24.6k", change: "+31% MoM", tone: "text-success" },
];

function CreatorHub() {
  const max = Math.max(...MOCK_GROWTH_SERIES);
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[background]">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[primary]">Creator Hub</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">AI Automation Architects</h1>
            <p className="text-sm text-muted-foreground">Owned by you · Public · Free access</p>
          </div>
          <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-white">Preview as visitor</button>
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
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Member growth</h2>
                <p className="text-xs text-muted-foreground">Last 12 weeks · net new members</p>
              </div>
              <div className="text-xs font-semibold text-success">+82 this week</div>
            </div>
            <div className="mt-4 flex h-52 items-end gap-2 rounded-lg border border-border bg-[background] p-4">
              {MOCK_GROWTH_SERIES.map((v, i) => (
                <div key={i} className="group relative flex-1 rounded-t bg-[primary]/80 hover:bg-[primary]" style={{ height: `${(v / max) * 100}%` }}>
                  <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground"><Eye size={12} /> Discovery visibility</div>
            <div className="mt-3 space-y-2">
              {[{ k: "AI & Automation", on: true }, { k: "Software Engineering", on: true }, { k: "No-Code Tech", on: false }, { k: "Digital Business", on: true }, { k: "Marketing", on: false }].map((c) => (
                <div key={c.k} className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                  <span className="text-sm font-medium text-foreground">{c.k}</span>
                  <span className={`relative h-5 w-9 rounded-full transition ${c.on ? "bg-[primary]" : "bg-slate-200"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition ${c.on ? "left-4" : "left-0.5"}`} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Top members this month</h2>
              <button className="text-xs font-semibold text-[primary]">See all <ChevronRight size={12} className="inline" /></button>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
                  <tr><th className="py-2 px-3 text-left">Member</th><th className="text-left">Posts</th><th className="text-left">XP</th><th className="text-right px-3">Streak</th></tr>
                </thead>
                <tbody>
                  {MOCK_ONLINE.slice(0, 6).map((u, i) => (
                    <tr key={u.name} className="border-t border-slate-100">
                      <td className="py-2 px-3"><div className="flex items-center gap-2"><Avatar initials={u.avatar} size={26} /><span className="font-medium text-foreground">{u.name}</span></div></td>
                      <td className="text-foreground">{42 - i * 3}</td>
                      <td className="font-semibold text-foreground">{(2400 - i * 180).toLocaleString()}</td>
                      <td className="text-right px-3 font-semibold text-orange-500">{28 - i} 🔥</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Recent DMs</h2>
            <ul className="mt-3 space-y-2">
              {MOCK_DIRECT_MESSAGES.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
                  <Avatar initials={d.avatar} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="truncate text-xs font-semibold text-foreground">{d.sender}</span>
                      <span className="text-[10px] text-muted-foreground">{d.time}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{d.text}</div>
                  </div>
                  {d.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[primary]" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
