import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({ meta: [
    { title: "Leaderboard · SukaSpace" },
    { name: "description", content: "Community rankings, XP tiers, and achievement badges." },
  ] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Rankings & Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your progress, compete with peers, and unlock exclusive tier benefits.</p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"><Trophy size={14} className="text-primary" />Gold III</div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <img src={UPLOADED_MOCKUPS.leaderboard} alt="SukaSpace rankings, tiers, and community leaderboard" className="w-full object-cover" />
      </div>
    </div>
  );
}
