import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Flame, GraduationCap, Trophy, Zap } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { MOCK_CLASSROOM_MODULES, MOCK_ONLINE } from "@/lib/mock-data";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/learners")({
  head: () => ({
    meta: [
      { title: "Learners Hub · SukaSpace" },
      { name: "description", content: "Track tech skills, XP, streaks, lessons, and community progress inside SukaSpace." },
      { property: "og:title", content: "Learners Hub · SukaSpace" },
      { property: "og:description", content: "A premium learning dashboard for course progress, community feedback, and skill momentum." },
    ],
  }),
  component: LearnersPage,
});

function LearnersPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[background]">
      <PublicHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-[primary]">Learners Hub</div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Turn skill-building into a visible progress system.</h1>
              <p className="mt-4 text-lg font-medium text-muted-foreground">Follow structured modules, collect XP, keep streaks alive, and learn inside focused operator-led communities.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/discover" className="rounded-xl bg-[primary] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[primary/90]">Explore Communities</Link>
                <Link to="/auth" search={{ mode: "signup" }} className="rounded-xl border border-border bg-card px-5 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent">Start Learning Free</Link>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 24 }} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <img src={UPLOADED_MOCKUPS.onboardingJourney} alt="SukaSpace learner onboarding role selection mockup" className="aspect-[5/4] w-full object-cover" />
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:px-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1"><Trophy size={14} className="text-amber-500" /> Level 7</span><span className="inline-flex items-center gap-1"><Flame size={14} className="text-primary" /> 12-day streak</span></div>
              <div className="mt-3 text-3xl font-bold text-foreground">1,240 XP</div>
              <div className="mt-3 h-2 rounded-full bg-accent"><div className="h-2 rounded-full bg-[primary]" style={{ width: "62%" }} /></div>
              <div className="mt-2 text-xs text-muted-foreground">760 XP to Level 8</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <h2 className="text-base font-semibold text-foreground">Current track</h2>
              <div className="mt-4 space-y-3">
                {MOCK_CLASSROOM_MODULES.map((module) => (
                  <div key={module.id} className="rounded-lg border border-border bg-[background] p-3">
                    <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm font-semibold text-foreground">{module.name}</span><span className="shrink-0 text-xs font-semibold text-muted-foreground">{module.progress}%</span></div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-accent0" style={{ width: `${module.progress}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {MOCK_ONLINE.slice(0, 3).map((member, index) => (
                <div key={member.name} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between"><div className="text-sm font-semibold text-foreground">#{index + 1} {member.name}</div><Zap size={16} className="text-[primary]" /></div>
                  <div className="mt-1 text-xs text-muted-foreground">{member.role} · {(2400 - index * 260).toLocaleString()} XP</div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-foreground"><CheckCircle2 size={16} className="text-primary" /> Completed this week's AI systems sprint</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
