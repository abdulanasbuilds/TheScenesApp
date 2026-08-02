// ─── Community analytics dataset ─────────────────────────────────────────────
// Static, deterministic local data powering the community analytics dashboard.
// Shapes mirror what the server ledger/analytics endpoints will return, so the
// dashboard can be swapped to live data without touching the UI layer.

export type RangeKey = "7d" | "30d" | "90d";

export type SeriesPoint = {
  /** ISO date (UTC) */
  date: string;
  members: number;
  newMembers: number;
  churned: number;
  mrr: number;
  visitors: number;
  signups: number;
  activeMembers: number;
  posts: number;
  comments: number;
  lessonsCompleted: number;
};

/** Deterministic pseudo-random generator so numbers never shift between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildSeries(days: number): SeriesPoint[] {
  const rand = seeded(20260801);
  const out: SeriesPoint[] = [];
  let members = 1180;
  let mrr = 8420;
  const start = Date.UTC(2026, 7, 2) - (days - 1) * 86400000;

  for (let i = 0; i < days; i++) {
    const weekday = new Date(start + i * 86400000).getUTCDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.62 : 1;

    const visitors = Math.round((420 + rand() * 260) * weekendDip);
    const signups = Math.round(visitors * (0.052 + rand() * 0.028));
    const newMembers = Math.max(1, Math.round(signups * (0.68 + rand() * 0.2)));
    const churned = Math.round(rand() * 6);
    members = members + newMembers - churned;
    mrr = Math.round(mrr + newMembers * 21 - churned * 19 + (rand() - 0.5) * 90);

    out.push({
      date: new Date(start + i * 86400000).toISOString().slice(0, 10),
      members,
      newMembers,
      churned,
      mrr,
      visitors,
      signups,
      activeMembers: Math.round(members * (0.36 + rand() * 0.1) * weekendDip),
      posts: Math.round((18 + rand() * 22) * weekendDip),
      comments: Math.round((54 + rand() * 70) * weekendDip),
      lessonsCompleted: Math.round((31 + rand() * 40) * weekendDip),
    });
  }
  return out;
}

const SERIES_90 = buildSeries(90);

export function getSeries(range: RangeKey): SeriesPoint[] {
  const n = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return SERIES_90.slice(-n);
}

export type MetricSummary = {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  deltaPct: number;
  hint: string;
};

function sum(points: SeriesPoint[], k: keyof SeriesPoint) {
  return points.reduce((acc, p) => acc + (p[k] as number), 0);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

/** Retention = members retained over the window vs. members at window start. */
export function computeRetention(points: SeriesPoint[]) {
  const startMembers = points[0]?.members ?? 0;
  const churned = sum(points, "churned");
  if (startMembers === 0) return 0;
  return Math.max(0, ((startMembers - churned) / startMembers) * 100);
}

/** Engagement = share of members who posted, commented or completed a lesson. */
export function computeEngagement(points: SeriesPoint[]) {
  const last = points[points.length - 1];
  if (!last) return 0;
  const avgActive = sum(points, "activeMembers") / points.length;
  return Math.min(100, (avgActive / last.members) * 100);
}

export function computeConversion(points: SeriesPoint[]) {
  const visitors = sum(points, "visitors");
  if (!visitors) return 0;
  return (sum(points, "signups") / visitors) * 100;
}

export function getSummary(range: RangeKey): MetricSummary[] {
  const points = getSeries(range);
  const n = points.length;
  const prev = SERIES_90.slice(-(n * 2), -n);
  const prevSafe = prev.length ? prev : points;

  const last = points[points.length - 1]!;
  const prevLast = prevSafe[prevSafe.length - 1]!;

  const retention = computeRetention(points);
  const prevRetention = computeRetention(prevSafe);
  const engagement = computeEngagement(points);
  const prevEngagement = computeEngagement(prevSafe);
  const conversion = computeConversion(points);
  const prevConversion = computeConversion(prevSafe);
  const visitors = sum(points, "visitors");
  const prevVisitors = sum(prevSafe, "visitors");

  return [
    {
      key: "members",
      label: "Total members",
      value: last.members.toLocaleString(),
      rawValue: last.members,
      deltaPct: pctChange(last.members, prevLast.members),
      hint: `${sum(points, "newMembers").toLocaleString()} joined, ${sum(points, "churned").toLocaleString()} left`,
    },
    {
      key: "mrr",
      label: "Monthly recurring revenue",
      value: money(last.mrr),
      rawValue: last.mrr,
      deltaPct: pctChange(last.mrr, prevLast.mrr),
      hint: `ARR pace ${money(last.mrr * 12)}`,
    },
    {
      key: "engagement",
      label: "Engagement level",
      value: pct(engagement),
      rawValue: engagement,
      deltaPct: pctChange(engagement, prevEngagement),
      hint: "Members active in the last 24h, averaged",
    },
    {
      key: "retention",
      label: "Member retention",
      value: pct(retention),
      rawValue: retention,
      deltaPct: pctChange(retention, prevRetention),
      hint: `${sum(points, "churned")} cancellations in range`,
    },
    {
      key: "visitors",
      label: "Page visitors",
      value: visitors.toLocaleString(),
      rawValue: visitors,
      deltaPct: pctChange(visitors, prevVisitors),
      hint: "About page + discovery listing views",
    },
    {
      key: "conversion",
      label: "Visitor → member conversion",
      value: pct(conversion, 2),
      rawValue: conversion,
      deltaPct: pctChange(conversion, prevConversion),
      hint: `${sum(points, "signups").toLocaleString()} signups from ${visitors.toLocaleString()} visits`,
    },
  ];
}

export type SourceRow = { source: string; visitors: number; signups: number };

export const TRAFFIC_SOURCES: SourceRow[] = [
  { source: "SukaSpace Discovery", visitors: 8420, signups: 512 },
  { source: "Direct / app link", visitors: 5130, signups: 402 },
  { source: "YouTube", visitors: 3980, signups: 198 },
  { source: "X / Twitter", visitors: 2210, signups: 86 },
  { source: "Newsletter", visitors: 1640, signups: 121 },
  { source: "Referral / affiliate", visitors: 990, signups: 74 },
];

export type PlanRow = { plan: string; members: number; mrr: number };

export const PLAN_BREAKDOWN: PlanRow[] = [
  { plan: "Free", members: 842, mrr: 0 },
  { plan: "Pro monthly", members: 361, mrr: 10830 },
  { plan: "Pro annual", members: 118, mrr: 2950 },
  { plan: "Founding member", members: 42, mrr: 1680 },
];

export type CohortRow = { cohort: string; size: number; m1: number; m2: number; m3: number };

export const RETENTION_COHORTS: CohortRow[] = [
  { cohort: "May 2026", size: 214, m1: 88, m2: 79, m3: 72 },
  { cohort: "Jun 2026", size: 268, m1: 91, m2: 82, m3: 0 },
  { cohort: "Jul 2026", size: 331, m1: 93, m2: 0, m3: 0 },
  { cohort: "Aug 2026", size: 126, m1: 0, m2: 0, m3: 0 },
];
