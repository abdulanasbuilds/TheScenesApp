import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Sparkles, Rocket, GraduationCap, Check, ArrowRight, ArrowLeft,
  Zap, Trophy, MessagesSquare, BookOpen, Users, BarChart3,
  Lightbulb, Target, Code2, Palette, TrendingUp, Layers,
  Brain, Globe, ShieldCheck, Star,
} from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { onOnboardingComplete } from "@/lib/autodm.functions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to SukaSpace · Get Started" }] }),
  component: Onboarding,
});

type Role = "creator" | "learner" | null;
type Skill = "beginner" | "intermediate" | "advanced" | null;

// ─── Static data ──────────────────────────────────────────────────────────────

const INTERESTS = [
  { id: "ai",        label: "Generative AI",       icon: Brain },
  { id: "llm",       label: "LLM Development",     icon: Code2 },
  { id: "saas",      label: "SaaS & Automation",   icon: Zap },
  { id: "nocode",    label: "No-Code Tools",        icon: Layers },
  { id: "software",  label: "Software Engineering", icon: Code2 },
  { id: "marketing", label: "Digital Marketing",   icon: TrendingUp },
  { id: "design",    label: "Design Systems",       icon: Palette },
  { id: "growth",    label: "Growth & Scale",       icon: BarChart3 },
  { id: "content",   label: "Content Creation",     icon: Globe },
  { id: "business",  label: "Online Business",      icon: Target },
  { id: "web3",      label: "Web3 / Crypto",        icon: ShieldCheck },
  { id: "data",      label: "Data & Analytics",     icon: BarChart3 },
];

const GOALS_CREATOR = [
  "Build a paid community",
  "Sell online courses",
  "Grow my audience",
  "Create recurring revenue",
  "Launch a coaching program",
  "Share my expertise",
];

const GOALS_LEARNER = [
  "Learn new skills",
  "Join a like-minded community",
  "Launch a side project",
  "Advance my career",
  "Find accountability partners",
  "Build something from scratch",
];

const SKILLS: { id: Skill; label: string; desc: string }[] = [
  { id: "beginner",     label: "Just starting out",  desc: "New to this space, ready to learn" },
  { id: "intermediate", label: "Some experience",    desc: "Know the basics, want to go deeper" },
  { id: "advanced",     label: "Experienced",        desc: "Looking to refine and grow further" },
];

// ─── Framer Motion variants ───────────────────────────────────────────────────

const slide = {
  initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  animate: { opacity: 1, x: 0 },
  exit:    (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  transition: { type: "spring", stiffness: 340, damping: 32 },
};

// ─── Step indicators ──────────────────────────────────────────────────────────

function Steps({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 24 : 8 }}
          className={cn(
            "h-2 rounded-full transition-colors duration-300",
            i < current  ? "bg-blue-400"
            : i === current ? "bg-blue-600"
            : "bg-slate-200",
          )}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function Onboarding() {
  const nav   = useNavigate();
  const store = useAppStore();

  const [step,       setStep]       = useState(0);
  const [direction,  setDirection]  = useState(1);
  const [role,       setRole]       = useState<Role>(null);
  const [interests,  setInterests]  = useState<string[]>([]);
  const [goals,      setGoals]      = useState<string[]>([]);
  const [skill,      setSkill]      = useState<Skill>(null);
  const [name,       setName]       = useState(store.session?.name ?? "");
  const [bio,        setBio]        = useState(store.session?.bio ?? "");
  const [saving,     setSaving]     = useState(false);

  const TOTAL_STEPS = 5;

  const go = (delta: number) => {
    setDirection(delta);
    setStep(s => s + delta);
  };

  const toggleInterest = (id: string) =>
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const finish = async () => {
    if (!store.session) {
      nav({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    setSaving(true);
    try {
      if (name.trim())   store.updateProfile({ name: name.trim() });
      if (bio.trim())    store.updateProfile({ bio: bio.trim() });
      if (role)          store.updateProfile({ role });

      // Persist onboarding state in store
      store.completeOnboarding?.({
        role: role ?? store.session.role,
        interests,
        goals,
        skillLevel: skill ?? undefined,
      });

      // Push welcome notification (server fn — degrades if Supabase not configured)
      await onOnboardingComplete({
        data: {
          userEmail: store.session.email,
          userName:  name.trim() || store.session.name,
          role:      role ?? store.session.role,
        },
      }).catch(() => null);

      // In-app welcome notification via store
      store.pushNotification(
        `Welcome to SukaSpace! 🎉 ${role === "creator" ? "Create your first community to get started." : "Discover communities that match your interests."}`,
        "onboarding",
        role === "creator" ? "/app/creator" : "/discover",
      );

      nav({ to: role === "creator" ? "/app/creator" : "/app/feed" });
    } finally {
      setSaving(false);
    }
  };

  // ── Step 0: Welcome ──────────────────────────────────────────────────────────
  const Step0 = (
    <div className="flex flex-col items-center text-center space-y-6">
      <motion.div
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl"
      >
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to SukaSpace
        </h1>
        <p className="mt-2 text-slate-500 text-base max-w-xs mx-auto leading-relaxed">
          The platform where creators build communities and learners grow together.
          Let's set up your account in 2 minutes.
        </p>
      </div>

      {/* Quick feature pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { icon: Users,           text: "Communities" },
          { icon: BookOpen,        text: "Courses" },
          { icon: MessagesSquare,  text: "Private DMs" },
          { icon: Trophy,          text: "Leaderboards" },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
            <Icon className="w-3.5 h-3.5 text-blue-500" />
            {text}
          </span>
        ))}
      </div>

      {/* Name input */}
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium text-slate-700 mb-1.5 text-left">
          What should we call you?
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && go(1)}
          placeholder="Your name"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
        />
      </div>
    </div>
  );

  // ── Step 1: Role ─────────────────────────────────────────────────────────────
  const Step1 = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">You are here to…</h2>
        <p className="text-slate-500 text-sm mt-1">This helps us personalise your experience</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Creator */}
        <button
          onClick={() => setRole("creator")}
          className={cn(
            "group relative flex flex-col items-center text-center rounded-2xl border-2 p-6 transition-all cursor-pointer",
            role === "creator"
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/40",
          )}
        >
          {role === "creator" && (
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </span>
          )}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-4 shadow-md">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Creator</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Build communities, sell courses, and grow your audience
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-600 text-left w-full">
            {["Create unlimited communities", "Build & sell courses", "Earn from memberships", "Creator analytics"].map(f => (
              <li key={f} className="flex items-center gap-2">
                <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </button>

        {/* Learner */}
        <button
          onClick={() => setRole("learner")}
          className={cn(
            "group relative flex flex-col items-center text-center rounded-2xl border-2 p-6 transition-all cursor-pointer",
            role === "learner"
              ? "border-emerald-500 bg-emerald-50 shadow-md"
              : "border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40",
          )}
        >
          {role === "learner" && (
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </span>
          )}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-md">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Learner</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Join communities, take courses, and connect with creators
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-600 text-left w-full">
            {["Join paid & free communities", "Access premium courses", "Private messaging", "Track your progress"].map(f => (
              <li key={f} className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </button>
      </div>
    </div>
  );

  // ── Step 2: Interests ────────────────────────────────────────────────────────
  const Step2 = (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">What are you into?</h2>
        <p className="text-slate-500 text-sm mt-1">Pick at least one. We'll surface the best content for you.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {INTERESTS.map(({ id, label, icon: Icon }) => {
          const selected = interests.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleInterest(id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all text-left",
                selected
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:border-blue-200 text-slate-700 hover:bg-slate-50",
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", selected ? "text-blue-500" : "text-slate-400")} />
              <span className="leading-tight">{label}</span>
              {selected && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {interests.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          {interests.length} selected — great choices!
        </p>
      )}
    </div>
  );

  // ── Step 3: Goals + Skill level ───────────────────────────────────────────────
  const goalList = role === "creator" ? GOALS_CREATOR : GOALS_LEARNER;
  const Step3 = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Your goals & level</h2>
        <p className="text-slate-500 text-sm mt-1">Help us show you what matters most</p>
      </div>

      {/* Goals */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">What do you want to achieve?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {goalList.map(g => {
            const sel = goals.includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-sm transition-all text-left",
                  sel
                    ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                    : "border-slate-200 hover:border-violet-200 text-slate-700",
                )}
              >
                <Target className={cn("w-4 h-4 flex-shrink-0", sel ? "text-violet-500" : "text-slate-400")} />
                {g}
                {sel && <Check className="w-3.5 h-3.5 text-violet-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skill */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Your current level</p>
        <div className="space-y-2">
          {SKILLS.map(s => (
            <button
              key={s.id}
              onClick={() => setSkill(s.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                skill === s.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-200 hover:border-amber-200",
              )}
            >
              <Star className={cn("w-4 h-4 flex-shrink-0", skill === s.id ? "text-amber-500" : "text-slate-300")} />
              <div>
                <p className={cn("text-sm font-semibold", skill === s.id ? "text-amber-800" : "text-slate-800")}>
                  {s.label}
                </p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
              {skill === s.id && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Step 4: Profile bio ───────────────────────────────────────────────────────
  const Step4 = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Almost done!</h2>
        <p className="text-slate-500 text-sm mt-1">Tell the community a little about yourself</p>
      </div>

      {/* Avatar placeholder */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {(name || "U").charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Name review */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Display name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Bio <span className="text-slate-400 normal-case font-normal">(optional)</span>
        </label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell the community what you're working on or excited about…"
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-slate-400 mt-1">{bio.length}/160 characters</p>
      </div>

      {/* Summary card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your profile</p>
        <div className="flex flex-wrap gap-2">
          {role && (
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              role === "creator" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700",
            )}>
              {role === "creator" ? "🚀 Creator" : "🎓 Learner"}
            </span>
          )}
          {skill && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              {SKILLS.find(s => s.id === skill)?.label}
            </span>
          )}
          {interests.slice(0, 3).map(id => {
            const item = INTERESTS.find(i => i.id === id);
            return item ? (
              <span key={id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                {item.label}
              </span>
            ) : null;
          })}
          {interests.length > 3 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
              +{interests.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const STEPS = [Step0, Step1, Step2, Step3, Step4];

  const canNext = [
    true,                        // step 0: always can continue (name optional)
    role !== null,               // step 1: must pick a role
    interests.length > 0,        // step 2: at least one interest
    goals.length > 0 || skill !== null, // step 3: at least one goal or skill
    true,                        // step 4: always can finish
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 flex flex-col">

      {/* Logo bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Logo />
        {step > 0 && (
          <button
            onClick={() => go(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="px-6 py-2">
        <Steps total={TOTAL_STEPS} current={step} />
        <p className="text-center text-xs text-slate-400 mt-2">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {STEPS[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => go(1)}
              disabled={!canNext[step]}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving || !name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {role === "creator" ? "Create my creator account" : "Start exploring"}
                </>
              )}
            </button>
          )}

          {step === 2 && interests.length === 0 && (
            <button
              onClick={() => go(1)}
              className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-2"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
