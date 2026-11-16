import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Award, EyeOff, Gift, Info, Trophy } from "lucide-react";
import { CommunityShell } from "@/components/layout/community-shell";
import { Avatar, Badge, Card, Chip } from "@/components/ui";
import { currentUserId, getCommunity, members } from "@/data/seed";
import { cn, formatCompact } from "@/lib/utils";

export const Route = createFileRoute("/c/$communityId/leaderboard")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Leaderboard · ${loaderData?.community.name ?? "The Scenes"}` }],
  }),
  component: LeaderboardPage,
});

const levels = [
  { level: 1, name: "Starter", points: 0, reward: "Post and comment access" },
  { level: 2, name: "Contributor", points: 50, reward: "Weekly digest" },
  { level: 3, name: "Builder", points: 150, reward: "Build-log channel" },
  { level: 4, name: "Reviewer", points: 300, reward: "Request a teardown" },
  { level: 5, name: "Practitioner", points: 600, reward: "Office-hours priority" },
  { level: 6, name: "Specialist", points: 1000, reward: "Unlock an advanced module" },
  { level: 7, name: "Mentor", points: 1600, reward: "Host a member session" },
  { level: 8, name: "Lead", points: 2400, reward: "Private feedback thread" },
  { level: 9, name: "Principal", points: 3600, reward: "Early course access" },
  { level: 10, name: "Guild elder", points: 5000, reward: "Shape the roadmap" },
];

function LeaderboardPage() {
  const { community } = Route.useLoaderData();
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [privateMode, setPrivateMode] = useState(false);
  const ranked = useMemo(
    () =>
      [...members]
        .map((member, index) => ({
          ...member,
          score:
            period === "week"
              ? Math.round(member.points * 0.08 + (index % 5) * 23)
              : period === "month"
                ? Math.round(member.points * 0.31 + (index % 4) * 51)
                : member.points,
        }))
        .sort((a, b) => b.score - a.score),
    [period],
  );
  const currentRank = ranked.findIndex((member) => member.id === currentUserId) + 1;
  const currentUserLevel = members.find((member) => member.id === currentUserId)?.level ?? 1;
  return (
    <CommunityShell community={community} active="leaderboard">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Participation preview
                </p>
                <Badge tone="amber">Policy not final</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Leaderboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                A fixture concept for recognising useful participation — not a production scoring
                policy.
              </p>
            </div>
            <div className="flex gap-2">
              {(
                [
                  ["week", "This week"],
                  ["month", "This month"],
                  ["all", "All time"],
                ] as const
              ).map(([value, label]) => (
                <Chip key={value} active={period === value} onClick={() => setPeriod(value)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Card className="mb-5 flex flex-wrap items-center gap-3 border-amber-200 bg-amber-50 p-4">
          <Info className="h-5 w-5 shrink-0 text-amber-700" />
          <p className="min-w-0 flex-1 text-xs leading-5 text-amber-950">
            Leaderboards are marked <strong>NEEDS DECISION</strong> in product requirements because
            public rank can harm privacy and motivation. This UI is a reversible fixture only.
          </p>
          <button
            type="button"
            onClick={() => setPrivateMode((value) => !value)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900"
          >
            <EyeOff className="h-3.5 w-3.5" /> {privateMode ? "Show names" : "Hide names"}
          </button>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          {ranked.slice(0, 3).map((member, index) => (
            <Card
              key={member.id}
              className={cn("p-5 text-center", index === 0 && "border-amber-300 bg-amber-50/50")}
            >
              <span
                className={cn(
                  "mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-extrabold",
                  index === 0
                    ? "bg-amber-400 text-amber-950"
                    : index === 1
                      ? "bg-slate-300 text-slate-800"
                      : "bg-clay-200 text-clay-700",
                )}
              >
                {index + 1}
              </span>
              <Avatar name={member.name} size={58} className="mx-auto" online={member.online} />
              <h2 className="mt-3 text-sm font-bold text-slate-900">
                {privateMode ? `Member ${index + 1}` : member.name}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Level {member.level}</p>
              <p className="mt-3 font-display text-2xl font-extrabold tabular-nums text-slate-900">
                {formatCompact(member.score)}
              </p>
              <p className="text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                fixture points
              </p>
            </Card>
          ))}
        </div>
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Levels &amp; rewards
              </p>
              <h2 className="mt-1 font-display text-lg font-extrabold text-slate-900">
                Ten levels, earned by useful participation
              </h2>
            </div>
            <Gift className="h-5 w-5 text-indigo-700" />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Level names, point thresholds and rewards are a fixture concept. The live policy is
            still a product decision; rewards here are platform access, never guaranteed provider
            capacity.
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {levels.map((item) => {
              const unlocked = item.level <= currentUserLevel;
              return (
                <li
                  key={item.level}
                  className={cn(
                    "rounded-lg border p-3",
                    unlocked ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      L{item.level}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatCompact(item.points)}+
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.reward}</p>
                  {unlocked ? (
                    <p className="mt-1 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                      Unlocked
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Card>
        <Card className="mt-5 overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_auto_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
            <span>Rank</span>
            <span>Member</span>
            <span>Level</span>
            <span>Points</span>
          </div>
          {ranked.slice(3).map((member, index) => (
            <div
              key={member.id}
              className={cn(
                "grid grid-cols-[48px_1fr_auto_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0",
                member.id === currentUserId && "bg-indigo-50",
              )}
            >
              <span className="font-mono text-xs font-bold text-slate-500">{index + 4}</span>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={member.name} size={34} online={member.online} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {privateMode && member.id !== currentUserId
                      ? `Member ${index + 4}`
                      : member.name}
                    {member.id === currentUserId ? " (you)" : ""}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.headline}</p>
                </div>
              </div>
              <Badge tone="outline">L{member.level}</Badge>
              <span className="text-right font-mono text-xs font-bold tabular-nums text-slate-800">
                {formatCompact(member.score)}
              </span>
            </div>
          ))}
        </Card>
        <Card className="mt-5 flex items-center gap-4 bg-indigo-700 p-5 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Your preview position: #{currentRank}</p>
            <p className="mt-0.5 text-xs text-indigo-100">
              Points are derived from static member fixtures, not tracked behaviour.
            </p>
          </div>
          <Award className="h-5 w-5 text-indigo-200" />
        </Card>
      </div>
    </CommunityShell>
  );
}
