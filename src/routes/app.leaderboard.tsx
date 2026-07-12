import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Flame, Medal } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ONLINE, xpToTier } from "@/lib/mock-data";
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

function LeaderboardPage() {
  const store = useAppStore();
  const [period, setPeriod] = useState<Period>("month");

  const rows = useMemo(() => {
    const multiplier = period === "week" ? 0.18 : period === "month" ? 1 : 2.4;
    return MOCK_ONLINE
      .map((m) => ({ ...m, score: Math.round(m.xp * multiplier) }))
      .sort((a, b) => b.score - a.score);
  }, [period]);

  const you = { name: store.session?.name || "You", avatar: store.session?.avatar || "YU", score: Math.round(640 * (period === "week" ? 0.18 : period === "month" ? 1 : 2.4)), xp: 640 };
  const youTier = xpToTier(you.xp);
  const yourRank = rows.filter((r) => r.score > you.score).length + 1;

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Rankings & Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your progress, compete with peers, and unlock exclusive tier benefits.</p>
        </div>
        <div className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground`}><Trophy size={14} className="text-primary" />{youTier.name}</div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {(["week", "month", "all"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize ${period === p ? "border-primary bg-sky-50 text-primary" : "border-border text-muted-foreground"}`}>{p === "all" ? "All time" : `This ${p}`}</button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {rows.slice(0, 3).map((r, i) => (
          <div key={r.name} className={`rounded-xl border p-4 text-center shadow-sm ${i === 0 ? "border-amber-300 bg-amber-50" : "border-border bg-card"}`}>
            <Medal size={18} className={`mx-auto ${MEDAL_COLORS[i]}`} />
            <Avatar initials={r.avatar} size={40} tone="primary" />
            <div className="mt-2 truncate text-sm font-semibold text-foreground">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.role}</div>
            <div className="mt-1 text-lg font-bold text-foreground">{r.score.toLocaleString()} XP</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-primary bg-sky-50 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">#{yourRank}</span>
          <Avatar initials={you.avatar} size={32} tone="primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{you.name} <span className="text-xs font-normal text-muted-foreground">(you)</span></div>
            <div className="text-xs text-muted-foreground">{youTier.name} · {you.score.toLocaleString()} XP</div>
          </div>
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
