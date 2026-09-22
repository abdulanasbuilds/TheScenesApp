import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Activity, HeartHandshake, Eye, Target, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { buildDailySeries, buildSummary, sumSeries, type RangeKey } from "@/lib/analytics-data";
import { useAppStore } from "@/lib/app-store";
import { EmptyState } from "@/components/EmptyState";
import { SPRING_FAST, hapticTap } from "@/lib/pwa";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Community Analytics · The Scenes" },
      {
        name: "description",
        content:
          "Track member growth, revenue, engagement, and course enrolments for your The Scenes community.",
      },
      { property: "og:title", content: "Community Analytics · The Scenes" },
      {
        property: "og:description",
        content: "Member count, revenue, engagement, and enrolment tracking in one dashboard.",
      },
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

function AnalyticsPage() {
  const store = useAppStore();
  const [range, setRange] = useState<RangeKey>("30d");

  const myCommunities = useMemo(
    () => store.communities.filter((c) => c.creatorEmail === store.session?.email),
    [store.communities, store.session?.email],
  );
  const myCommunityIds = useMemo(() => new Set(myCommunities.map((c) => c.id)), [myCommunities]);

  const myCourses = useMemo(
    () => store.courses.filter((c) => c.creatorEmail === store.session?.email),
    [store.courses, store.session?.email],
  );
  const myCourseIds = useMemo(() => new Set(myCourses.map((c) => c.id)), [myCourses]);

  const members = useMemo(
    () => myCommunities.reduce((acc, c) => acc + store.getJoinedEmails(c.id).length, 0),
    [myCommunities, store],
  );

  const postTimestamps = useMemo(
    () => store.posts.filter((p) => myCommunityIds.has(p.communityId)).map((p) => p.createdAt),
    [store.posts, myCommunityIds],
  );

  const myEnrollments = useMemo(
    () => store.enrollments.filter((e) => myCourseIds.has(e.courseId)),
    [store.enrollments, myCourseIds],
  );
  const enrollmentTimestamps = useMemo(
    () => myEnrollments.map((e) => e.enrolledAt),
    [myEnrollments],
  );
  const lessonCompletionTimestamps = useMemo(
    () => myEnrollments.flatMap((e) => e.completedLessonIds.map(() => e.enrolledAt)),
    [myEnrollments],
  );

  const publishedCourses = myCourses.filter((c) => c.published).length;

  const summary = useMemo(
    () =>
      buildSummary({
        range,
        members,
        postTimestamps,
        enrollmentTimestamps,
        lessonCompletionTimestamps,
        revenueUsd: 0,
        publishedCourses,
      }),
    [
      range,
      members,
      postTimestamps,
      enrollmentTimestamps,
      lessonCompletionTimestamps,
      publishedCourses,
    ],
  );

  const postSeries = useMemo(
    () => buildDailySeries(postTimestamps, range),
    [postTimestamps, range],
  );
  const enrolSeries = useMemo(
    () => buildDailySeries(enrollmentTimestamps, range),
    [enrollmentTimestamps, range],
  );
  const activityData = useMemo(
    () =>
      postSeries.map((p, i) => ({
        label: p.label,
        posts: p.value,
        enrolments: enrolSeries[i]?.value ?? 0,
      })),
    [postSeries, enrolSeries],
  );

  const hasAnyActivity = sumSeries(postSeries) + sumSeries(enrolSeries) > 0;

  // ── State: creator has no community yet ────────────────────────────────────
  if (myCommunities.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          variant="setup"
          icon={<BarChart3 size={22} />}
          title="Analytics start when your community does"
          description="There's nothing to measure yet because you haven't launched a community. Create one and this dashboard begins tracking members, engagement, enrolments, and revenue automatically."
          primary={{ label: "Create your community", to: "/create-community" }}
          secondary={{ label: "See how others set up", to: "/discover" }}
          helper="Takes about 2 minutes. You can rename or delete it later."
          checklist={[
            { label: "Create your community" },
            { label: "Publish your first course" },
            { label: "Invite your first 10 members" },
            { label: "Connect payouts to track revenue" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Community analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live numbers from your own communities — nothing simulated.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                hapticTap();
                setRange(r.key);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                range === r.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
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
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_FAST, delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon size={16} />
              </span>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {m.value}
              </div>
              <div className="text-xs font-semibold text-muted-foreground">{m.label}</div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{m.hint}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Activity */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Community activity</h2>
        <p className="text-xs text-muted-foreground">Posts and course enrolments per day</p>

        {hasAnyActivity ? (
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                <Bar dataKey="posts" name="Posts" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="enrolments" name="Enrolments" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            compact
            className="mt-3"
            title="No activity in this range yet"
            description="Nobody has posted or enrolled in the last period. Kick things off with a welcome post — communities with a first post from the creator activate far faster."
            primary={{ label: "Write the first post", to: "/app/feed" }}
            secondary={{ label: "Invite members", to: "/app/members" }}
            helper="Charts fill in automatically as activity happens."
          />
        )}
      </div>

      {/* Revenue */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Revenue</h2>
          <p className="text-xs text-muted-foreground">Only server-verified payments are counted</p>
          <EmptyState
            compact
            className="mt-3"
            variant="setup"
            icon={<DollarSign size={22} />}
            title="No verified revenue yet"
            description="Set a paid membership price and connect your payout account so cleared payments show up here."
            primary={{ label: "Set up payouts", to: "/app/payouts" }}
            secondary={{ label: "Pricing settings", to: "/app/billing" }}
            helper="You keep control of pricing and can switch back to free anytime."
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Your communities</h2>
          <p className="text-xs text-muted-foreground">Member counts, live</p>
          <div className="mt-3 space-y-2">
            {myCommunities.map((c) => {
              const count = store.getJoinedEmails(c.id).length;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.tag === "PAID" ? "Paid" : "Free"} · {c.category}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-foreground">{count.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
