import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp, Users, DollarSign, GraduationCap, Eye, ChevronRight, Maximize2, X } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ANALYTICS, MOCK_GROWTH_SERIES, MOCK_ONLINE, MOCK_DIRECT_MESSAGES } from "@/lib/mock-data";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/app/creator")({
  head: () => ({ meta: [{ title: "Creator Hub · SukaSpace" }] }),
  component: CreatorHub,
});

const METRICS = [
  { icon: DollarSign, label: "Monthly Recurring Revenue", value: MOCK_ANALYTICS.mrr, change: "+18.4%", tone: "text-primary" },
  { icon: Users, label: "Active members", value: MOCK_ANALYTICS.activeMembers, change: "+126 this week", tone: "text-primary" },
  { icon: GraduationCap, label: "Course completion", value: MOCK_ANALYTICS.courseCompletionRate, change: "+4.2%", tone: "text-primary" },
  { icon: TrendingUp, label: "Discovery impressions", value: "24.6k", change: "+31% MoM", tone: "text-primary" },
];

const GROWTH_CHART_DATA = MOCK_GROWTH_SERIES.map((members, i) => ({
  week: `W${i + 1}`,
  members,
}));

function CreatorHub() {
  const [showMockup, setShowMockup] = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({ "AI & Automation": true, "Software Engineering": true, "No-Code Tech": false, "Digital Business": true, Marketing: false });
  const nav = useNavigate();
  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Creator Hub</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">AI Automation Architects</h1>
            <p className="text-sm text-muted-foreground">Owned by you · Public · Free access</p>
          </div>
          <button onClick={() => nav({ to: "/app/feed" })} className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-white">Preview as visitor</button>
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
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-foreground">Member growth timeline</h2>
                <p className="text-xs text-muted-foreground">Last 12 weeks · net new members</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-primary">+82 this week</div>
                <button
                  onClick={() => setShowMockup(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  <Maximize2 size={11} /> View sample
                </button>
              </div>
            </div>
            <div className="mt-4 h-52 w-full rounded-lg border border-border bg-background p-2 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_CHART_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memberGrowthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} domain={[0, "dataMax + 10"]} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }}
                    labelStyle={{ fontWeight: 600, color: "var(--color-foreground)" }}
                    formatter={(value: number) => [`${value} members`, "Net new"]}
                  />
                  <Area type="monotone" dataKey="members" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#memberGrowthFill)" activeDot={{ r: 4 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground"><Eye size={12} /> Discovery visibility</div>
            <div className="mt-3 space-y-2">
              {Object.entries(visibility).map(([k, on]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                  <span className="text-sm font-medium text-foreground">{k}</span>
                  <button
                    aria-label={`Toggle visibility for ${k}`}
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
              <button onClick={() => nav({ to: "/app/members" })} className="text-xs font-semibold text-primary">See all <ChevronRight size={12} className="inline" /></button>
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
                      <td className="text-right px-3 font-semibold text-primary">{28 - i} 🔥</td>
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
                  {d.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMockup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMockup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-foreground">Sample creator analytics dashboard</div>
                <button onClick={() => setShowMockup(false)} className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-accent"><X size={14} /></button>
              </div>
              <div className="max-h-[76vh] overflow-auto bg-background p-2">
                <img src={UPLOADED_MOCKUPS.creatorGrowthAnalytics} alt="Sample SukaSpace creator analytics and payouts dashboard" className="mx-auto w-full rounded-lg border border-border" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
