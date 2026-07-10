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
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">Learners Hub</div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Turn skill-building into a visible progress system.</h1>
              <p className="mt-4 text-lg font-medium text-slate-500">Follow structured modules, collect XP, keep streaks alive, and learn inside focused operator-led communities.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/discover" className="rounded-xl bg-[#0284C7] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#0369A1]">Explore Communities</Link>
                <Link to="/auth" search={{ mode: "signup" }} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50">Start Learning Free</Link>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 24 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img src={UPLOADED_MOCKUPS.onboardingJourney} alt="SukaSpace learner onboarding role selection mockup" className="aspect-[5/4] w-full object-cover" />
            </motion.div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:px-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1"><Trophy size={14} className="text-amber-500" /> Level 7</span><span className="inline-flex items-center gap-1"><Flame size={14} className="text-orange-500" /> 12-day streak</span></div>
              <div className="mt-3 text-3xl font-bold text-slate-900">1,240 XP</div>
              <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#0284C7]" style={{ width: "62%" }} /></div>
              <div className="mt-2 text-xs text-slate-500">760 XP to Level 8</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-900">Current track</h2>
              <div className="mt-4 space-y-3">
                {MOCK_CLASSROOM_MODULES.map((module) => (
                  <div key={module.id} className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-3">
                    <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm font-semibold text-slate-900">{module.name}</span><span className="shrink-0 text-xs font-semibold text-slate-500">{module.progress}%</span></div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${module.progress}%` }} /></div>
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
                <div key={member.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-900">#{index + 1} {member.name}</div><Zap size={16} className="text-[#0284C7]" /></div>
                  <div className="mt-1 text-xs text-slate-500">{member.role} · {(2400 - index * 260).toLocaleString()} XP</div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={16} className="text-emerald-600" /> Completed this week's AI systems sprint</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
