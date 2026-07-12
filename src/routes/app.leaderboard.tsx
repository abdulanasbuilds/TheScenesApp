import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Flame, Medal, Users2, Flame as FireIcon, GraduationCap, MessageSquare, Bug, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ONLINE, MOCK_BADGES, MOCK_COMMUNITY_RANKS, xpToTier } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({ meta: [
    { title: "Leaderboard · SukaSpace" },
    { name: "description", content: "Community rankings, XP tiers, and achievement badges." },
  ] }),
  component: LeaderboardPage,
});

type Period = "week" | "month" | "all";
const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-orange-400"];
const BADGE_ICONS: Record<string, typeof Flame> = { flame: FireIcon, graduation: GraduationCap, message: MessageSquare, bug: Bug };
const BADGE_TONES: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", sky: "bg-sky-100 text-sky-600", slate: "bg-slate-100 text-slate-400" };

function LeaderboardPage() {
  const store = useAppStore();
  const [period, setPeriod] = useState<Period>("week");
  const [periodMenu, setPeriodMenu] = useState(false);
  const PERIOD_LABEL: Record<Period, string> = { week: "This Week", month: "This Month", all: "All Time" };

  const rows = useMemo(() => {
    const multiplier = period === "week" ? 0.18 : period === "month" ? 1 : 2.4;
    return MOCK_ONLINE
      .map((m) => ({ ...m, score: Math.round(m.xp * multiplier) }))
      .sort((a, b) => b.score - a.score);
  }, [period]);

  const you = { name: store.session?.name || "You", avatar: store.session?.avatar || "YU", score: Math.round(640 * (period === "week" ? 0.18 : period === "month" ? 1 : 2.4)), xp: 640 };
  const youTier = xpToTier(you.xp);
  const yourRank = rows.filter((r) => r.score > you.score).length + 1;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 6);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Rankings & Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your progress, compete with peers, and unlock exclusive tier benefits across the SukaSpace ecosystem.</p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">Your Rank: <Trophy size={13} className="text-amber-500" />{youTier.name}</div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Trophy size={14} className="text-primary" />Platform-wide Leaderboard</h2>
            <div className="relative">
              <button onClick={() => setPeriodMenu((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent">{PERIOD_LABEL[period]}<ChevronDown size={12} /></button>
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

          <div className="mt-5 grid grid-cols-3 items-end gap-2 text-center">
            {podium[1] && (
              <div className="flex flex-col items-center">
                <Medal size={16} className={MEDAL_COLORS[1]} />
                <Avatar initials={podium[1].avatar} size={44} tone="primary" />
                <div className="mt-1.5 truncate text-xs font-semibold text-foreground">{podium[1].name}</div>
                <div className="text-[11px] text-muted-foreground">{podium[1].score.toLocaleString()} pts</div>
                <div className="mt-2 h-16 w-full rounded-t-md bg-slate-100" />
              </div>
            )}
            {podium[0] && (
              <div className="flex flex-col items-center">
                <Medal size={20} className={MEDAL_COLORS[0]} />
                <Avatar initials={podium[0].avatar} size={56} tone="primary" />
                <div className="mt-1.5 truncate text-sm font-semibold text-foreground">{podium[0].name}</div>
                <div className="text-xs text-muted-foreground">{podium[0].score.toLocaleString()} pts</div>
                <div className="mt-2 h-24 w-full rounded-t-md bg-amber-100" />
              </div>
            )}
            {podium[2] && (
              <div className="flex flex-col items-center">
                <Medal size={16} className={MEDAL_COLORS[2]} />
                <Avatar initials={podium[2].avatar} size={44} tone="primary" />
                <div className="mt-1.5 truncate text-xs font-semibold text-foreground">{podium[2].name}</div>
                <div className="text-[11px] text-muted-foreground">{podium[2].score.toLocaleString()} pts</div>
                <div className="mt-2 h-10 w-full rounded-t-md bg-orange-50" />
              </div>
            )}
          </div>

          <div className="mt-5 divide-y divide-slate-100 border-t border-border">
            {rest.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 py-2.5">
                <span className="w-5 shrink-0 text-sm font-semibold text-foreground">{i + 4}</span>
                <Avatar initials={r.avatar} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{r.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.role}</div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">{r.score.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-lg bg-sky-50 px-2 py-2.5">
              <span className="w-5 shrink-0 text-sm font-semibold text-primary">#{yourRank}</span>
              <Avatar initials={you.avatar} size={28} tone="primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">You <span className="text-xs font-normal text-muted-foreground">({youTier.name})</span></div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">{you.score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Users2 size={14} className="text-primary" />Community Ranks</h2>
            <div className="mt-3 space-y-3">
              {MOCK_COMMUNITY_RANKS.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs font-semibold text-foreground">{c.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.tone === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>Rank #{c.rank}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{c.members.toLocaleString()} Members</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${c.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${c.progressToTop10}%` }} />
                  </div>
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">{c.pointsToTop10.toLocaleString()} pts to Top 10</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Trophy size={14} className="text-amber-500" />Tier Progression</h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-[10px] font-semibold uppercase text-amber-700">Current Tier</div>
              <div className="mt-0.5 text-base font-bold text-foreground">{youTier.name}</div>
              <div className="mt-3 text-xs text-muted-foreground">Unlock <span className="font-semibold text-foreground">Diamond Tier</span> at 2,200 points.</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((you.xp / 2200) * 100))}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{you.xp.toLocaleString()} / 2,200</span><span>{Math.min(100, Math.round((you.xp / 2200) * 100))}%</span></div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent Badges</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_BADGES.map((b) => {
            const Icon = BADGE_ICONS[b.icon];
            return (
              <div key={b.id} className={`rounded-xl border border-border p-4 text-center ${b.locked ? "opacity-60" : ""}`}>
                <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${BADGE_TONES[b.tone]}`}><Icon size={20} /></span>
                <div className="mt-2 text-sm font-semibold text-foreground">{b.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">{b.desc}</p>
                {b.earned ? (
                  <div className="mt-2 text-[10px] font-semibold uppercase text-emerald-600">{b.meta}</div>
                ) : b.locked ? (
                  <div className="mt-2 text-[10px] font-semibold uppercase text-muted-foreground">Locked</div>
                ) : (
                  <>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${((b.progress ?? 0) / (b.target ?? 1)) * 100}%` }} /></div>
                    <div className="mt-1 text-[10px] font-semibold text-muted-foreground">{b.progress}/{b.target} upvotes</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
            <tr><th className="py-2.5 px-4 text-left">Rank</th><th className="text-left">Member</th><th className="text-left">Tier</th><th className="text-left">Streak</th><th className="px-4 text-right">XP</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const tier = xpToTier(r.score);
              return (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="py-2.5 px-4 font-semibold text-foreground">#{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar initials={r.avatar} size={26} />
                      <div>
                        <div className="font-medium text-foreground">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>{tier.name}</span></td>
                  <td className="font-semibold text-primary"><span className="inline-flex items-center gap-1"><Flame size={11} />{r.streak}</span></td>
                  <td className="px-4 text-right font-semibold text-foreground">{r.score.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
