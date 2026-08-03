// ─── Static product configuration (no demo/dummy records) ────────────────────
// Everything here is platform configuration — category taxonomy, XP rules,
// tier thresholds, badge definitions. Real member/community data always comes
// from the app store / backend.

export const COMMUNITY_CATEGORIES = [
  "All", "AI & Automation", "Software Engineering", "No-Code Tech", "Digital Business", "Creative Design", "Marketing",
];

export function xpToTier(xp: number): { name: string; color: string; emoji: string; nextAt: number | null } {
  if (xp >= 4000) return { name: "Diamond Elite", color: "text-sky-600 bg-sky-100",       emoji: "💎", nextAt: null  };
  if (xp >= 2800) return { name: "Diamond I",     color: "text-sky-600 bg-sky-100",       emoji: "💎", nextAt: 4000 };
  if (xp >= 2000) return { name: "Platinum",      color: "text-slate-600 bg-slate-200",   emoji: "⚡", nextAt: 2800 };
  if (xp >= 1400) return { name: "Gold II",       color: "text-amber-600 bg-amber-100",   emoji: "🥇", nextAt: 2000 };
  if (xp >= 900)  return { name: "Gold I",        color: "text-amber-600 bg-amber-100",   emoji: "🥇", nextAt: 1400 };
  if (xp >= 500)  return { name: "Silver",        color: "text-slate-500 bg-slate-100",   emoji: "🥈", nextAt: 900  };
  return                  { name: "Bronze",       color: "text-orange-700 bg-orange-100", emoji: "🥉", nextAt: 500  };
}

export const XP_EVENTS = [
  { action: "post",            xp: 15, label: "Post in community" },
  { action: "comment",         xp: 8,  label: "Leave a comment" },
  { action: "lesson_complete", xp: 25, label: "Complete a lesson" },
  { action: "login_streak",    xp: 10, label: "Daily login streak" },
  { action: "community_join",  xp: 20, label: "Join a community" },
  { action: "course_enroll",   xp: 30, label: "Enroll in a course" },
  { action: "receive_upvote",  xp: 5,  label: "Post upvoted" },
] as const;

/** Badge definitions. Progress is always computed from real activity. */
export type BadgeDefinition = {
  id: number;
  name: string;
  desc: string;
  icon: "flame" | "graduation" | "message" | "bug";
  tone: "emerald" | "sky" | "slate";
  /** Which real metric unlocks it. */
  metric: "streakDays" | "lessonsCompleted" | "upvotes" | "bugReports";
  target: number;
};

export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: 1, name: "30 Day Streak",   desc: "Log in 30 days in a row.",              icon: "flame",      tone: "emerald", metric: "streakDays",       target: 30 },
  { id: 2, name: "Course Master",   desc: "Complete 5 lessons across your courses.", icon: "graduation", tone: "sky",   metric: "lessonsCompleted", target: 5  },
  { id: 3, name: "Top Contributor", desc: "Receive 50 likes on your posts.",       icon: "message",    tone: "slate",   metric: "upvotes",          target: 50 },
  { id: 4, name: "Bug Hunter",      desc: "Report a confirmed platform bug.",      icon: "bug",        tone: "slate",   metric: "bugReports",       target: 1  },
];
