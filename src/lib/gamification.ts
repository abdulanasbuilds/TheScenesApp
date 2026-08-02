// ─── Gamification: custom levels, point thresholds, rewards ──────────────────
// Creator-configurable level ladder. Persisted locally so creator edits survive
// reloads; shape matches the future `community_levels` table 1:1.

export type RewardKind = "course" | "content" | "badge" | "perk";

export type LevelReward = {
  kind: RewardKind;
  label: string;
};

export type CommunityLevel = {
  id: number;
  name: string;
  /** Points (XP) required to reach this level. */
  threshold: number;
  color: string;
  rewards: LevelReward[];
};

export const DEFAULT_LEVELS: CommunityLevel[] = [
  { id: 1, name: "Starter",   threshold: 0,     color: "#94a3b8", rewards: [{ kind: "content", label: "Community feed access" }] },
  { id: 2, name: "Explorer",  threshold: 250,   color: "#38bdf8", rewards: [{ kind: "course", label: "Unlocks: AI Foundations" }] },
  { id: 3, name: "Builder",   threshold: 750,   color: "#0ea5e9", rewards: [{ kind: "content", label: "Weekly build teardown replays" }] },
  { id: 4, name: "Operator",  threshold: 1800,  color: "#6366f1", rewards: [{ kind: "course", label: "Unlocks: Shipping with Agents" }, { kind: "badge", label: "Operator badge" }] },
  { id: 5, name: "Guru",      threshold: 4000,  color: "#f59e0b", rewards: [{ kind: "perk", label: "Monthly group coaching call" }] },
  { id: 6, name: "Elite",     threshold: 9000,  color: "#ef4444", rewards: [{ kind: "perk", label: "1:1 strategy session" }, { kind: "badge", label: "Elite badge" }] },
];

const STORAGE_KEY = "sukaspace_levels_v1";

export function loadLevels(): CommunityLevel[] {
  if (typeof window === "undefined") return DEFAULT_LEVELS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEVELS;
    const parsed = JSON.parse(raw) as CommunityLevel[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LEVELS;
    return sortLevels(parsed);
  } catch {
    return DEFAULT_LEVELS;
  }
}

export function saveLevels(levels: CommunityLevel[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortLevels(levels)));
  } catch {
    /* storage unavailable — in-memory state still applies */
  }
}

export function sortLevels(levels: CommunityLevel[]): CommunityLevel[] {
  return [...levels].sort((a, b) => a.threshold - b.threshold);
}

export type LevelProgress = {
  current: CommunityLevel;
  next: CommunityLevel | null;
  /** 0–100 progress toward the next level. */
  progressPct: number;
  pointsToNext: number;
};

export function levelForPoints(points: number, levels: CommunityLevel[]): LevelProgress {
  const ordered = sortLevels(levels);
  let current = ordered[0]!;
  for (const lvl of ordered) if (points >= lvl.threshold) current = lvl;
  const next = ordered.find((l) => l.threshold > current.threshold) ?? null;
  const span = next ? next.threshold - current.threshold : 1;
  const progressPct = next ? Math.min(100, Math.max(0, ((points - current.threshold) / span) * 100)) : 100;
  return {
    current,
    next,
    progressPct,
    pointsToNext: next ? Math.max(0, next.threshold - points) : 0,
  };
}

export const REWARD_LABEL: Record<RewardKind, string> = {
  course: "Course unlock",
  content: "Bonus content",
  badge: "Badge",
  perk: "Perk",
};
