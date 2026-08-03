// ─── Analytics helpers ───────────────────────────────────────────────────────
// Pure functions over REAL app data. No demo/seed datasets: a brand-new
// workspace legitimately reports zeros, and the UI turns that into guidance.

export type RangeKey = "7d" | "30d" | "90d";

export function rangeDays(range: RangeKey) {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

export function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function startOfRange(range: RangeKey, now = Date.now()) {
  return now - (rangeDays(range) - 1) * 86400000;
}

export type DayPoint = { date: string; label: string; value: number };

/** Buckets timestamped records into one point per day across the range. */
export function buildDailySeries(
  timestamps: number[],
  range: RangeKey,
  now = Date.now(),
): DayPoint[] {
  const days = rangeDays(range);
  const startDay = new Date(now);
  startDay.setUTCHours(0, 0, 0, 0);
  const start = startDay.getTime() - (days - 1) * 86400000;

  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    if (ts < start) continue;
    const key = new Date(ts).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const out: DayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      value: counts.get(iso) ?? 0,
    });
  }
  return out;
}

export function sumSeries(series: DayPoint[]) {
  return series.reduce((acc, p) => acc + p.value, 0);
}

export type AnalyticsInput = {
  range: RangeKey;
  /** Total members across the creator's communities. */
  members: number;
  /** Timestamps of posts inside those communities. */
  postTimestamps: number[];
  /** Timestamps of course enrolments. */
  enrollmentTimestamps: number[];
  /** Timestamps of completed lessons. */
  lessonCompletionTimestamps: number[];
  /** Verified revenue recognised in the range, in USD. */
  revenueUsd: number;
  /** Number of published courses. */
  publishedCourses: number;
  now?: number;
};

export type MetricSummary = {
  key: string;
  label: string;
  value: string;
  hint: string;
};

export function buildSummary(input: AnalyticsInput): MetricSummary[] {
  const now = input.now ?? Date.now();
  const posts = buildDailySeries(input.postTimestamps, input.range, now);
  const enrols = buildDailySeries(input.enrollmentTimestamps, input.range, now);
  const lessons = buildDailySeries(input.lessonCompletionTimestamps, input.range, now);

  const postCount = sumSeries(posts);
  const enrolCount = sumSeries(enrols);
  const lessonCount = sumSeries(lessons);
  const activeSignals = postCount + lessonCount;
  const engagement = input.members > 0 ? Math.min(100, (activeSignals / input.members) * 100) : 0;
  const conversion = input.members > 0 ? (enrolCount / input.members) * 100 : 0;

  return [
    {
      key: "members",
      label: "Total members",
      value: input.members.toLocaleString(),
      hint:
        input.members === 0
          ? "Share your community link to get the first join"
          : "Across all your communities",
    },
    {
      key: "mrr",
      label: "Recognised revenue",
      value: money(input.revenueUsd),
      hint:
        input.revenueUsd === 0
          ? "Appears after your first verified payment"
          : "Verified payments in this range",
    },
    {
      key: "engagement",
      label: "Engagement level",
      value: pct(engagement),
      hint: `${postCount} posts · ${lessonCount} lessons completed`,
    },
    {
      key: "retention",
      label: "Active contributors",
      value: activeSignals.toLocaleString(),
      hint:
        activeSignals === 0
          ? "No member activity recorded yet"
          : "Posts + lesson completions in range",
    },
    {
      key: "visitors",
      label: "Published courses",
      value: input.publishedCourses.toLocaleString(),
      hint:
        input.publishedCourses === 0
          ? "Publish a course to give members a path"
          : "Live and visible to members",
    },
    {
      key: "conversion",
      label: "Member → enrolment rate",
      value: pct(conversion, 1),
      hint: `${enrolCount} enrolments in this range`,
    },
  ];
}
