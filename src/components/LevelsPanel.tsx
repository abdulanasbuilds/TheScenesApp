import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Plus, Trash2, Save, Lock, Unlock, Sparkles, Pencil, X } from "lucide-react";
import {
  loadLevels,
  saveLevels,
  sortLevels,
  levelForPoints,
  REWARD_LABEL,
  type CommunityLevel,
  type RewardKind,
} from "@/lib/gamification";
import { SPRING_FAST, hapticTap, hapticMilestone } from "@/lib/pwa";
import { cn } from "@/lib/utils";

type Member = { name: string; avatar: string; points: number };

const REWARD_KINDS: RewardKind[] = ["course", "content", "badge", "perk"];

export function LevelsPanel({
  viewerPoints,
  members,
}: {
  viewerPoints: number;
  members: Member[];
}) {
  const [levels, setLevels] = useState<CommunityLevel[]>(() => sortLevels(loadLevels()));
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLevels(sortLevels(loadLevels()));
  }, []);

  const viewer = useMemo(() => levelForPoints(viewerPoints, levels), [viewerPoints, levels]);

  const distribution = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of members) {
      const l = levelForPoints(m.points, levels).current;
      map.set(l.id, (map.get(l.id) ?? 0) + 1);
    }
    return map;
  }, [members, levels]);

  const patch = (id: number, next: Partial<CommunityLevel>) =>
    setLevels((prev) => prev.map((l) => (l.id === id ? { ...l, ...next } : l)));

  const addLevel = () => {
    hapticTap();
    const maxThreshold = Math.max(...levels.map((l) => l.threshold), 0);
    setLevels((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Level ${prev.length + 1}`,
        threshold: maxThreshold + 1000,
        color: "#0ea5e9",
        rewards: [],
      },
    ]);
  };

  const removeLevel = (id: number) => {
    hapticTap();
    setLevels((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const addReward = (id: number) =>
    setLevels((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, rewards: [...l.rewards, { kind: "content", label: "" }] } : l,
      ),
    );

  const patchReward = (
    id: number,
    index: number,
    next: Partial<{ kind: RewardKind; label: string }>,
  ) =>
    setLevels((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, rewards: l.rewards.map((r, i) => (i === index ? { ...r, ...next } : r)) }
          : l,
      ),
    );

  const removeReward = (id: number, index: number) =>
    setLevels((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, rewards: l.rewards.filter((_, i) => i !== index) } : l,
      ),
    );

  const commit = () => {
    const clean = sortLevels(
      levels.map((l) => ({
        ...l,
        name: l.name.trim() || "Untitled level",
        threshold: Math.max(0, Math.round(Number(l.threshold) || 0)),
        rewards: l.rewards.filter((r) => r.label.trim().length > 0),
      })),
    );
    setLevels(clean);
    saveLevels(clean);
    setEditing(false);
    setSaved(true);
    hapticMilestone();
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Award size={15} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Levels &amp; rewards</h2>
            <p className="text-[11px] text-muted-foreground">
              Custom level names, point thresholds, and what each unlocks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700"
              >
                Saved
              </motion.span>
            )}
          </AnimatePresence>
          {editing ? (
            <>
              <button
                onClick={() => {
                  hapticTap();
                  setLevels(sortLevels(loadLevels()));
                  setEditing(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={commit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <Save size={13} /> Save ladder
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                hapticTap();
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Pencil size={13} /> Edit levels
            </button>
          )}
        </div>
      </div>

      {/* Viewer progress */}
      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: viewer.current.color }}
            >
              {sortLevels(levels).findIndex((l) => l.id === viewer.current.id) + 1}
            </span>
            <div>
              <div className="text-sm font-bold text-foreground">{viewer.current.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {viewerPoints.toLocaleString()} points earned
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-muted-foreground">
              {viewer.next ? `Next: ${viewer.next.name}` : "Max level reached"}
            </div>
            {viewer.next && (
              <div className="text-xs font-bold text-primary">
                {viewer.pointsToNext.toLocaleString()} pts to go
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${viewer.progressPct}%` }}
            transition={SPRING_FAST}
          />
        </div>
      </div>

      {/* Ladder */}
      <div className="mt-4 space-y-2.5">
        {sortLevels(levels).map((lvl, idx) => {
          const unlocked = viewerPoints >= lvl.threshold;
          const count = distribution.get(lvl.id) ?? 0;
          return (
            <div
              key={lvl.id}
              className={cn(
                "rounded-xl border p-3.5 transition-colors",
                unlocked
                  ? "border-border bg-background"
                  : "border-dashed border-border bg-muted/30",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: lvl.color }}
                >
                  {idx + 1}
                </span>

                {editing ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      value={lvl.name}
                      onChange={(e) => patch(lvl.id, { name: e.target.value })}
                      placeholder="Level name"
                      className="min-w-[120px] flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    />
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      Points
                      <input
                        type="number"
                        min={0}
                        value={lvl.threshold}
                        onChange={(e) => patch(lvl.id, { threshold: Number(e.target.value) })}
                        className="w-24 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </label>
                    <input
                      type="color"
                      value={lvl.color}
                      onChange={(e) => patch(lvl.id, { color: e.target.value })}
                      className="h-8 w-9 cursor-pointer rounded-lg border border-border bg-card"
                      aria-label={`${lvl.name} colour`}
                    />
                    <button
                      onClick={() => removeLevel(lvl.id)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${lvl.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{lvl.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {lvl.threshold.toLocaleString()} points · {count} member
                        {count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                        unlocked
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {unlocked ? <Unlock size={10} /> : <Lock size={10} />}
                      {unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                )}
              </div>

              {/* Rewards */}
              <div className="mt-2.5 space-y-1.5 pl-0 sm:pl-12">
                {lvl.rewards.map((r, i) =>
                  editing ? (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={r.kind}
                        onChange={(e) =>
                          patchReward(lvl.id, i, { kind: e.target.value as RewardKind })
                        }
                        className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground outline-none focus:border-primary"
                      >
                        {REWARD_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {REWARD_LABEL[k]}
                          </option>
                        ))}
                      </select>
                      <input
                        value={r.label}
                        onChange={(e) => patchReward(lvl.id, i, { label: e.target.value })}
                        placeholder="Reward description"
                        className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => removeReward(lvl.id, i)}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove reward"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[11px] text-muted-foreground"
                    >
                      <Sparkles size={11} className="shrink-0 text-primary" />
                      <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                        {REWARD_LABEL[r.kind]}
                      </span>
                      <span>{r.label}</span>
                    </div>
                  ),
                )}
                {editing && (
                  <button
                    onClick={() => addReward(lvl.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={11} /> Add reward
                  </button>
                )}
                {!editing && lvl.rewards.length === 0 && (
                  <div className="text-[11px] text-muted-foreground">No rewards linked yet.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <button
          onClick={addLevel}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Plus size={13} /> Add level
        </button>
      )}
    </div>
  );
}
