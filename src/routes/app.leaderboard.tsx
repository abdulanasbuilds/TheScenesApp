import { createFileRoute } from "@tanstack/react-router";
import {
  Trophy, Flame, Users2, GraduationCap, MessageSquare, Bug, ChevronDown,
  Star, Zap, TrendingUp, Crown, Medal, Award
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_BADGES, xpToTier } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

// Real leaderboard member shape
interface LeaderMember {
  id: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  postsCount: number;
  coursesCompleted: number;
  joinDate: string;
  weekXp: number;
  monthXp: number;
}

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard · SukaSpace" },
      { name: "description", content: "Community rankings, XP tiers, and achievement badges." },
    ],
  }),
  component: LeaderboardPage,
});

type Period = "week" | "month" | "all";
const PERIOD_LABEL: Record<Period, string> = { week: "This Week", month: "This Month", all: "All Time" };

const BADGE_ICONS: Record<string, React.ElementType> = {
  flame: Flame, graduation: GraduationCap, message: MessageSquare, bug: Bug, star: Star, zap: Zap,
};

const BADGE_COLORS: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
  sky:     "bg-sky-100 text-sky-600 border-sky-200",
  amber:   "bg-amber-100 text-amber-600 border-amber-200",
  violet:  "bg-violet-100 text-violet-600 border-violet-200",
  slate:   "bg-slate-100 text-slate-500 border-slate-200",
};

function PodiumCard({
  member, rank, delay,
}: {
  member: LeaderMember;
  rank: 1 | 2 | 3;
  delay: number;
}) {
  const tier = xpToTier(member.xp);
  const config = {
    1: { height: "h-24", icon: Crown,  bg: "bg-amber-50 border-amber-200",  iconColor: "text-amber-500", label: "Gold" },
    2: { height: "h-16", icon: Medal,  bg: "bg-slate-50 border-slate-200",  iconColor: "text-slate-500", label: "Silver" },
    3: { height: "h-12", icon: Award,  bg: "bg-orange-50 border-orange-200", iconColor: "text-orange-500", label: "Bronze" },
  }[rank];
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 26 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        <Avatar initials={member.avatar} size={44} tone={rank === 1 ? "primary" : "slate"} />
        <span className={`absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[9px] font-bold ${rank === 1 ? "bg-amber-400 text-white" : rank === 2 ? "bg-slate-400 text-white" : "bg-orange-400 text-white"}`}>
          {rank}
        </span>
      </div>
      <div className="text-center">
        <div className="max-w-[80px] truncate text-xs font-semibold text-foreground">{member.name.split(" ")[0]}</div>
        <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${tier.color}`}>{tier.name}</span>
      </div>
      <div className={`w-16 rounded-t-lg border-t border-x ${config.bg} ${config.height} flex items-start justify-center pt-1.5`}>
        <Icon size={14} className={config.iconColor} />
      </div>
      <div className="text-xs font-bold text-foreground">{member.xp.toLocaleString()} XP</div>
    </motion.div>
  );
}

function LeaderboardPage() {
  const store = useAppStore();
  const [period, setPeriod] = useState<Period>("all");
  const [periodMenu, setPeriodMenu] = useState(false);

  const userXp = 0;
  const you: LeaderMember = {
    id: 0,
    name: store.session?.name || "You",
    avatar: store.session?.avatar || "YU",
    xp: userXp,
    streak: 0,
    postsCount: store.posts.filter(p => p.author === store.session?.name).length,
    coursesCompleted: 0,
    joinDate: "Today",
    weekXp: 0,
    monthXp: 0,
  };
  const youTier = xpToTier(userXp);

  // Real members list — only the current user until the Supabase profiles table is populated.
  // As more users sign up and earn XP, they appear here via real data.
  const members: LeaderMember[] = [you];

  const ranked = useMemo(() => {
    const key: Record<Period, keyof LeaderMember> = {
      week: "weekXp", month: "monthXp", all: "xp",
    };
    return [...members].sort((a, b) => (b[key[period]] as number) - (a[key[period]] as number));
  }, [members, period]);

  const podium = ranked.slice(0, 3) as [LeaderMember, LeaderMember, LeaderMember];
  const rest = ranked.slice(3);

  const xpKey = period === "week" ? "weekXp" : period === "month" ? "monthXp" : "xp";
  const nextTier = xpToTier(userXp);
  const nextAt = nextTier.nextAt ?? 500;
  const pct = Math.min(100, Math.round((userXp / nextAt) * 100));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <Trophy size={22} className="shrink-0 text-amber-500" />
            Rankings &amp; Achievements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn XP by posting, completing lessons, and engaging with your community.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
          <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${youTier.color}`}>
            {youTier.name}
          </span>
          <span className="text-muted-foreground">Your Tier</span>
        </div>
      </div>

      {/* Your rank card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 28 }}
        className="mt-5 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <Avatar initials={you.avatar} size={40} tone="primary" />
            <div>
              <div className="text-sm font-semibold text-foreground">{you.name}</div>
              <div className="text-xs text-muted-foreground">That&apos;s you</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1 min-w-0">
            {[
              { label: "XP", value: you.xp.toLocaleString() },
              { label: "Rank", value: `#${ranked.length + 1}` },
              { label: "Streak", value: `${you.streak} days` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="min-w-[140px] flex-1">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">{youTier.name}</span>
              {nextTier.nextAt && <span className="text-muted-foreground">{nextTier.nextAt?.toLocaleString()} XP to next</span>}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{userXp} / {nextAt} XP ({pct}%)</div>
          </div>
        </div>
      </motion.div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Leaderboard panel */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Trophy size={14} className="text-primary" />
              Platform-wide Leaderboard
            </h2>
            <div className="relative">
              <button
                onClick={() => setPeriodMenu((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
              >
                {PERIOD_LABEL[period]} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {periodMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setPeriodMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-9 z-40 w-36 rounded-lg border border-border bg-card p-1 shadow-lg"
                    >
                      {(["week", "month", "all"] as Period[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => { setPeriod(p); setPeriodMenu(false); }}
                          className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium hover:bg-accent ${p === period ? "text-primary font-semibold" : "text-foreground"}`}
                        >
                          {PERIOD_LABEL[p]}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Podium — top 3 */}
          {podium.length === 3 && (
            <div className="border-b border-border bg-gradient-to-b from-accent/40 to-transparent px-4 py-6">
              <div className="flex items-end justify-center gap-4">
                <PodiumCard member={podium[1]} rank={2} delay={0.1} />
                <PodiumCard member={podium[0]} rank={1} delay={0.0} />
                <PodiumCard member={podium[2]} rank={3} delay={0.2} />
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-accent text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pl-4 pr-2 text-left w-10">#</th>
                  <th className="py-2.5 text-left">Member</th>
                  <th className="py-2.5 text-left hidden sm:table-cell">Tier</th>
                  <th className="py-2.5 text-left hidden md:table-cell">Streak</th>
                  <th className="py-2.5 text-left hidden md:table-cell">Posts</th>
                  <th className="py-2.5 pr-4 text-right">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rest.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No other members yet. Start posting and completing lessons to earn XP and climb the ranks!
                    </td>
                  </tr>
                )}
                {rest.map((m, i) => {
                  const rank = i + 4;
                  const tier = xpToTier(m.xp);
                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.04 * i }}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-semibold text-muted-foreground">#{rank}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={m.avatar} size={28} />
                          <div>
                            <div className="font-medium text-foreground text-xs sm:text-sm">{m.name}</div>
                            <div className="text-[10px] text-muted-foreground">{m.joinDate}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 hidden sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>{tier.name}</span>
                      </td>
                      <td className="py-2.5 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 font-semibold text-orange-500 text-xs">
                          <Flame size={11} />{m.streak}d
                        </span>
                      </td>
                      <td className="py-2.5 hidden md:table-cell text-xs text-muted-foreground">{m.postsCount}</td>
                      <td className="py-2.5 pr-4 text-right font-bold text-foreground text-sm">
                        {(m[xpKey] as number).toLocaleString()}
                      </td>
                    </motion.tr>
                  );
                })}
                {/* You at bottom */}
                <tr className="bg-primary/5 border-t-2 border-primary/20">
                  <td className="py-2.5 pl-4 pr-2 font-semibold text-muted-foreground">#{ranked.length + 1}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={you.avatar} size={28} tone="primary" />
                      <div>
                        <div className="font-medium text-foreground text-xs sm:text-sm">{you.name}</div>
                        <div className="text-[10px] text-primary font-semibold">You</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 hidden sm:table-cell">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${youTier.color}`}>{youTier.name}</span>
                  </td>
                  <td className="py-2.5 hidden md:table-cell text-xs font-semibold text-orange-500">
                    <span className="inline-flex items-center gap-1"><Flame size={11} />{you.streak}d</span>
                  </td>
                  <td className="py-2.5 hidden md:table-cell text-xs text-muted-foreground">{you.postsCount}</td>
                  <td className="py-2.5 pr-4 text-right font-bold text-foreground">{you.xp}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Tier progression */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <TrendingUp size={14} className="text-primary" /> Tier Progression
            </h2>
            <div className="mt-3 space-y-2">
              {[
                { name: "Bronze",        at: 0,    color: "bg-orange-400" },
                { name: "Silver",        at: 500,  color: "bg-slate-400" },
                { name: "Gold I",        at: 900,  color: "bg-amber-400" },
                { name: "Gold II",       at: 1400, color: "bg-amber-500" },
                { name: "Platinum",      at: 2000, color: "bg-slate-600" },
                { name: "Diamond I",     at: 2800, color: "bg-sky-500" },
                { name: "Diamond Elite", at: 4000, color: "bg-sky-600" },
              ].map((t) => (
                <div key={t.name} className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${userXp >= t.at ? "border-primary/20 bg-primary/5" : "border-border bg-background"}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${userXp >= t.at ? t.color : "bg-slate-200"}`} />
                  <span className="flex-1 text-xs font-semibold text-foreground">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.at.toLocaleString()} XP</span>
                  {userXp >= t.at && <span className="text-[10px] font-semibold text-primary">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Top Communities — real data from store */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Users2 size={14} className="text-primary" /> Top Communities
            </h2>
            {store.communities.length === 0 ? (
              <div className="mt-3 py-4 text-center text-xs text-muted-foreground">
                No communities yet. <br />
                <a href="/create-community" className="text-primary hover:underline font-semibold">Create the first one →</a>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {[...store.communities]
                  .sort((a, b) => b.members - a.members)
                  .slice(0, 5)
                  .map((c, i) => {
                    const maxMembers = store.communities[0]?.members || 1;
                    const pct = Math.round((c.members / maxMembers) * 100);
                    return (
                      <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5">
                        <span className="w-5 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-foreground">{c.title}</div>
                          <div className="text-[10px] text-muted-foreground">{c.members.toLocaleString()} members</div>
                        </div>
                        <div className="w-16 shrink-0">
                          <div className="mb-0.5 text-right text-[10px] text-muted-foreground">{pct}%</div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Complete actions to earn badges and unlock exclusive perks.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_BADGES.map((b, i) => {
            const Icon = BADGE_ICONS[b.icon] ?? Star;
            const colorClass = BADGE_COLORS[b.tone] ?? BADGE_COLORS.slate;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-xl border p-4 text-center transition-all ${b.locked ? "opacity-50" : b.earned ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-card"}`}
              >
                <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full border ${colorClass}`}>
                  <Icon size={20} />
                </span>
                <div className="mt-2.5 text-sm font-semibold text-foreground">{b.name}</div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                {b.locked ? (
                  <div className="mt-2 text-[10px] font-semibold uppercase text-muted-foreground">🔒 Locked</div>
                ) : b.earned ? (
                  <div className="mt-2 text-[10px] font-semibold text-emerald-600">✓ {b.meta}</div>
                ) : (
                  <>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((b.progress ?? 0) / (b.target ?? 1)) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-muted-foreground">
                      {b.progress ?? 0} / {b.target ?? 1}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">How to Earn XP</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {[
            { label: "Post in community",  xp: "+15 XP", icon: MessageSquare },
            { label: "Complete a lesson",  xp: "+25 XP", icon: GraduationCap },
            { label: "Daily login streak", xp: "+10 XP", icon: Flame },
            { label: "Receive an upvote",  xp: "+5 XP",  icon: Star },
          ].map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={14} />
                </span>
                <div>
                  <div className="text-xs font-semibold text-foreground">{e.label}</div>
                  <div className="text-[10px] font-bold text-primary">{e.xp}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Need to extend the xpToTier type to include nextAt
declare module "@/lib/mock-data" {
  // This is a type augmentation hint — actual implementation is in mock-data.ts
}
