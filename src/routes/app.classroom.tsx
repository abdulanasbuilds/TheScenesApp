import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trophy, Flame, GraduationCap, Zap } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/classroom")({
  head: () => ({ meta: [{ title: "Classroom · SukaSpace" }] }),
  component: Classroom,
});

function Classroom() {
  const store = useAppStore();
  const [role, setRole] = useState<"learner" | "creator">("learner");

  const xp = 0;
  const streak = 0;
  const level = 1;

  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-56px)]">
      <aside className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-border bg-accent p-0.5 text-[10px]">
              {(["learner", "creator"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)} className={`rounded px-2 py-0.5 font-semibold uppercase ${role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{r}</button>
              ))}
            </div>
          </div>
          {role === "learner" ? (
            <div className="mt-3 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Trophy size={12} className="text-primary" /> Level {level}</span>
                <span className="inline-flex items-center gap-1"><Flame size={12} className="text-primary" /> {streak}-day streak</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground">{xp.toLocaleString()} XP</div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: "0%" }} />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">Complete lessons to earn XP</div>
            </div>
          ) : (
            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-card py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary">
              <Plus size={14} /> Add module
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <GraduationCap size={28} className="text-muted-foreground/60" />
          <p className="mt-2 text-xs font-semibold text-foreground">
            {role === "creator" ? "No modules yet" : "No lessons available"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {role === "creator"
              ? "Add your first module to start building your curriculum."
              : "Join a community with courses to start learning."}
          </p>
        </div>
      </aside>

      <section className="col-span-12 md:col-span-8 lg:col-span-9 bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent">
            <GraduationCap size={28} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {role === "creator" ? "Build your curriculum" : "No lessons yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {role === "creator"
              ? "Add modules and lessons to create your first course. Learners will see your content here once it's published."
              : "No course content has been published yet in this community. Check back soon or explore other communities."}
          </p>
          {role === "learner" && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
              <Zap size={12} /> +50 XP per completed lesson
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
