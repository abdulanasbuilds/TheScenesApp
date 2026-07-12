import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Flame, Users2, Flame as FireIcon, GraduationCap, MessageSquare, Bug, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { xpToTier } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({ meta: [
    { title: "Leaderboard · SukaSpace" },
    { name: "description", content: "Community rankings, XP tiers, and achievement badges." },
  ] }),
  component: LeaderboardPage,
});

type Period = "week" | "month" | "all";

const BADGES = [
  { id: 1, name: "30 Day Streak", desc: "Log in consecutively for 30 days.", Icon: FireIcon, tone: "bg-slate-100 text-slate-400", earned: false, locked: false, progress: 0, target: 30, unit: "days" },
  { id: 2, name: "Course Master", desc: "Complete 5 advanced modules.", Icon: GraduationCap, tone: "bg-slate-100 text-slate-400", earned: false, locked: false, progress: 0, target: 5, unit: "modules" },
  { id: 3, name: "Top Contributor", desc: "Receive 50 upvotes on forum posts.", Icon: MessageSquare, tone: "bg-slate-100 text-slate-400", earned: false, locked: false, progress: 0, target: 50, unit: "upvotes" },
  { id: 4, name: "Bug Hunter", desc: "Report a confirmed platform bug.", Icon: Bug, tone: "bg-slate-100 text-slate-400", earned: false, locked: true, progress: 0, target: 1, unit: "" },
];

function LeaderboardPage() {
  const store = useAppStore();
  const [period, setPeriod] = useState<Period>("week");
  const [periodMenu, setPeriodMenu] = useState(false);
  const PERIOD_LABEL: Record<Period, string> = { week: "This Week", month: "This Month", all: "All Time" };

  const userXp = 0;
  const you = { name: store.session?.name || "You", avatar: store.session?.avatar || "YU", score: 0, xp: userXp };
  const youTier = xpToTier(userXp);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Rankings & Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your progress, compete with peers, and unlock exclusive tier benefits.</p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
          Your Rank: <Trophy size={13} className="text-amber-500" />{youTier.name}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Trophy size={14} className="text-primary" />Platform-wide Leaderboard
            </h2>
            <div className="relative">
              <button onClick={() => setPeriodMenu((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent">
                {PERIOD_LABEL[period]}<ChevronDown size={12} />
              </button>
              {periodMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPeriodMenu(false)} />
                  <div className="absolute right-0 top-8 z-40 w-32 rounded-lg border border-border bg-card p-1 shadow-lg">
                    {(["week", "month", "all"] as Period[]).map((p) => (
                      <button key={p} onClick={() => { setPeriod(p); setPeriodMenu(false); }} className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-accent">{PERIOD_LABEL[p]}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-8 text-center">
            <Trophy size={24} className="text-muted-foreground/40" />
            <p className="mt-2 text-sm font-semibold text-foreground">Leaderboard is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">Earn XP by posting, completing lessons, and engaging with your community to climb the rankings.</p>
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <div className="flex items-center gap-3 rounded-lg bg-sky-50 px-2 py-2.5">
              <span className="w-5 shrink-0 text-sm font-semibold text-primary">#1</span>
              <Avatar initials={you.avatar} size={28} tone="primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {you.name} <span className="text-xs font-normal text-muted-foreground">({youTier.name})</span>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">{you.score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Users2 size={14} className="text-primary" />Community Ranks
            </h2>
            <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
              <Users2 size={20} className="text-muted-foreground/40" />
              <p className="mt-2 text-xs font-semibold text-foreground">No communities ranked yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Community rankings appear as members earn XP.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Trophy size={14} className="text-amber-500" />Tier Progression
            </h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-[10px] font-semibold uppercase text-amber-700">Current Tier</div>
              <div className="mt-0.5 text-base font-bold text-foreground">{youTier.name}</div>
              <div className="mt-3 text-xs text-muted-foreground">Unlock <span className="font-semibold text-foreground">Diamond Tier</span> at 2,200 points.</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-primary" style={{ width: "0%" }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0 / 2,200</span><span>0%</span>
              </div>
              <div className="mt-3 rounded-lg bg-white p-2.5 text-[11px] text-foreground">
                <div className="mb-1 font-semibold">Diamond benefits include:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>1-on-1 Mentorship Sessions</li>
                  <li>Early Access to New Courses</li>
                  <li>Exclusive Community Badge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b) => (
            <div key={b.id} className={`rounded-xl border border-border p-4 text-center ${b.locked ? "opacity-60" : ""}`}>
              <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${b.tone}`}>
                <b.Icon size={20} />
              </span>
              <div className="mt-2 text-sm font-semibold text-foreground">{b.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{b.desc}</p>
              {b.locked ? (
                <div className="mt-2 text-[10px] font-semibold uppercase text-muted-foreground">Locked</div>
              ) : (
                <>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: "0%" }} />
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-muted-foreground">
                    {b.progress} / {b.target} {b.unit}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="py-2.5 px-4 text-left">Rank</th>
              <th className="text-left">Member</th>
              <th className="text-left">Tier</th>
              <th className="text-left">Streak</th>
              <th className="px-4 text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-2.5 px-4 font-semibold text-foreground">#1</td>
              <td>
                <div className="flex items-center gap-2">
                  <Avatar initials={you.avatar} size={26} />
                  <div>
                    <div className="font-medium text-foreground">{you.name}</div>
                    <div className="text-xs text-muted-foreground">You</div>
                  </div>
                </div>
              </td>
              <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${youTier.color}`}>{youTier.name}</span></td>
              <td className="font-semibold text-primary">
                <span className="inline-flex items-center gap-1"><Flame size={11} />0</span>
              </td>
              <td className="px-4 text-right font-semibold text-foreground">0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
