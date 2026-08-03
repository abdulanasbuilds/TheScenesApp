import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Flame, GraduationCap, Trophy, Zap } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <PublicHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Learners Hub</div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Turn skill-building into a visible progress system.</h1>
              <p className="mt-4 text-lg font-medium text-muted-foreground">Follow structured modules, collect XP, keep streaks alive, and learn inside focused operator-led communities.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/discover" className="rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-white hover:bg-primary/90">Explore Communities</Link>
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
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1"><Trophy size={14} className="text-primary" /> Levels</span><span className="inline-flex items-center gap-1"><Flame size={14} className="text-primary" /> Streaks</span></div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">XP that reflects real work</h2>
              <p className="mt-2 text-sm text-muted-foreground">Earn XP for posting, commenting, and completing lessons. Your level, streak, and rank update the moment you do the work \u2014 nothing is pre-filled.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <h2 className="text-base font-semibold text-foreground">How a track works</h2>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Modules unlock in order", body: "Creators structure lessons into modules so you always know the next step." },
                  { name: "Drip scheduling", body: "Lessons can unlock days after you enroll, keeping the pace realistic." },
                  { name: "Progress you can see", body: "Every lesson you finish moves the module bar and your XP total." },
                ].map((module) => (
                  <div key={module.name} className="rounded-lg border border-border bg-background p-3">
                    <div className="text-sm font-semibold text-foreground">{module.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{module.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Join a community", body: "Browse Discover and join a space that matches what you want to build." },
                { title: "Enroll in a course", body: "Pick a track and start the first lesson the same day." },
                { title: "Climb the leaderboard", body: "Consistency compounds \u2014 streaks and XP put your progress on the board." },
              ].map((step, index) => (
                <div key={step.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between"><div className="text-sm font-semibold text-foreground">Step {index + 1}</div><Zap size={16} className="text-primary" /></div>
                  <div className="mt-2 text-base font-semibold text-foreground">{step.title}</div>
                  <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /> {step.body}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/discover" className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Explore Communities</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
