import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, TrendingUp, TrendingDown, DollarSign, Activity,
  HeartHandshake, Eye, Target,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  getSeries, getSummary, money, TRAFFIC_SOURCES, PLAN_BREAKDOWN, RETENTION_COHORTS,
  type RangeKey,
} from "@/lib/analytics-data";
import { SPRING_FAST, hapticTap } from "@/lib/pwa";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Community Analytics · SukaSpace" },
      { name: "description", content: "Track member growth, MRR, engagement, retention, visitors, and conversion for your SukaSpace community." },
      { property: "og:title", content: "Community Analytics · SukaSpace" },
      { property: "og:description", content: "Member count, MRR monitoring, engagement, retention, visitor stats, and conversion tracking in one dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const ICONS: Record<string, React.ElementType> = {
  members: Users,
  mrr: DollarSign,
  engagement: Activity,
  retention: HeartHandshake,
  visitors: Eye,
  conversion: Target,
};

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const series = useMemo(() => getSeries(range), [range]);
  const summary = useMemo(() => getSummary(range), [range]);

  const chartData = useMemo(
    () => series.map((p) => ({ ...p, label: shortDate(p.date) })),
    [series],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Community analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Growth, revenue, and engagement health for your SukaSpace community.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => { hapticTap(); setRange(r.key); }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                range === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((m, i) => {
          const Icon = ICONS[m.key] ?? Activity;
          const up = m.deltaPct >= 0;
          const Trend = up ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_FAST, delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={16} />
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                  )}
                >
                  <Trend size={11} />
                  {Math.abs(m.deltaPct).toFixed(1)}%
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{m.value}</div>
              <div className="text-xs font-semibold text-muted-foreground">{m.label}</div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{m.hint}</p>
            </motion.div>
          );
        })}
      </div>

      {/* MRR + members chart */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">MRR trend</h2>
          <p className="text-xs text-muted-foreground">Recurring revenue recognised per day</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v) => money(Number(v))} labelClassName="text-xs" contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                <Area type="monotone" dataKey="mrr" stroke="var(--primary)" strokeWidth={2} fill="url(#mrrFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Member growth</h2>
          <p className="text-xs text-muted-foreground">Joins vs. cancellations</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                <Bar dataKey="newMembers" name="Joined" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="churned" name="Left" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visitors + conversion */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Visitors & conversion</h2>
        <p className="text-xs text-muted-foreground">About-page and discovery traffic converting into members</p>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#0ea5e9" strokeWidth={2} fill="url(#visitFill)" />
              <Area type="monotone" dataKey="signups" name="Signups" stroke="#10b981" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Traffic sources</h2>
          <div className="mt-3 space-y-2">
            {TRAFFIC_SOURCES.map((s) => {
              const cr = (s.signups / s.visitors) * 100;
              return (
                <div key={s.source} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{s.source}</span>
                    <span className="font-bold text-primary">{cr.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, cr * 8)}%` }} />
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    {s.visitors.toLocaleString()} visitors · {s.signups.toLocaleString()} members
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Revenue by plan</h2>
            <div className="mt-3 space-y-2">
              {PLAN_BREAKDOWN.map((p) => (
                <div key={p.plan} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{p.plan}</div>
                    <div className="text-[11px] text-muted-foreground">{p.members.toLocaleString()} members</div>
                  </div>
                  <div className="text-sm font-bold text-foreground">{money(p.mrr)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Retention cohorts</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-semibold">Cohort</th>
                    <th className="pb-2 font-semibold">Size</th>
                    <th className="pb-2 font-semibold">M1</th>
                    <th className="pb-2 font-semibold">M2</th>
                    <th className="pb-2 font-semibold">M3</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION_COHORTS.map((c) => (
                    <tr key={c.cohort} className="border-t border-border">
                      <td className="py-2 font-semibold text-foreground">{c.cohort}</td>
                      <td className="py-2 text-muted-foreground">{c.size}</td>
                      {[c.m1, c.m2, c.m3].map((v, i) => (
                        <td key={i} className="py-2">
                          {v ? (
                            <span className="rounded px-1.5 py-0.5 font-semibold text-emerald-700" style={{ backgroundColor: `rgba(16,185,129,${0.08 + (v / 100) * 0.22})` }}>
                              {v}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
