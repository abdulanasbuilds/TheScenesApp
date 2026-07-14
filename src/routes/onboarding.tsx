import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles, Rocket, GraduationCap, Check, Upload, ArrowRight, ArrowLeft, Zap, Trophy, MessagesSquare, Lock } from "lucide-react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to SukaSpace · Onboarding" }] }),
  component: Onboarding,
});

type Role = "creator" | "learner" | null;

const INTERESTS = ["Generative AI", "LLM Dev", "SaaS Automation", "No-Code Tech", "Software Engineering", "Digital Marketing", "Design Systems", "Growth"];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const nav = useNavigate();
  const store = useAppStore();

  const finishOnboarding = () => {
    if (!store.session) {
      nav({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    if (name.trim()) store.updateProfile({ name: name.trim() });
    if (bio.trim()) store.updateProfile({ bio: bio.trim() });
    const dest = (role ?? store.session.role) === "creator" ? "/app/creator" : "/app/dashboard";
    nav({ to: dest });
  };

  const total = 4;
  const pct = ((step + 1) / total) * 100;

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else setShowUpgrade(true);
  };
  const prev = () => setStep(Math.max(0, step - 1));

  const toggleInterest = (i: string) => {
    setInterests((cur) => cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
    setReward("+10 XP · Niche selected");
    setTimeout(() => setReward(null), 1400);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress */}
      <div className="sticky top-0 z-30 border-b border-neutral-100 bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-xs font-bold text-white">S</span>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-accent">
              <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 26 }} />
            </div>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Step {step + 1} / {total}</span>
        </div>
      </div>

      {/* XP reward pop */}
      <AnimatePresence>
        {reward && (
          <motion.div initial={{ y: -20, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }} className="fixed top-16 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm">
            {reward}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}>
            {step === 0 && <Welcome onNext={next} />}
            {step === 1 && <RoleStep role={role} setRole={setRole} />}
            {step === 2 && <InterestsStep interests={interests} toggle={toggleInterest} />}
            {step === 3 && <ProfileStep name={name} setName={setName} bio={bio} setBio={setBio} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={prev} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-40">
            <ArrowLeft size={14} /> Back
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={next} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
            {step === total - 1 ? "Finish" : "Continue"} <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-accent0 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="border-b border-border bg-background p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground"><Sparkles size={12} className="text-primary" /> Accelerator Program</span>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Unlock the Mastery Vault</h3>
                <p className="mt-1 text-sm text-muted-foreground">94% of members who unlock the Premium Vault clear their first tech cert in 30 days vs 14 days on Free.</p>
              </div>
              <div className="space-y-2 p-6">
                {[
                  { icon: MessagesSquare, t: "VIP direct messaging with top experts" },
                  { icon: Lock, t: "Exclusive locked masterclasses" },
                  { icon: Trophy, t: "Global leaderboard priority ranking" },
                  { icon: Zap, t: "Streak protection & priority support" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-white"><f.icon size={14} /></span>
                    <span className="text-sm font-medium text-foreground">{f.t}</span>
                    <Check size={14} className="ml-auto text-primary" />
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-6">
                <motion.button
                  animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  onClick={() => finishOnboarding()}
                  className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90"
                >Claim Full Platform Access & Unlock My Dashboard</motion.button>
                <button onClick={() => finishOnboarding()} className="mt-2 w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground">Continue with Free Base Access</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="p-8 text-center sm:p-10 lg:flex lg:flex-col lg:justify-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles size={22} />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">Welcome to the future of learning.</h1>
          <p className="mt-2 text-base text-muted-foreground">You're 3 quick steps away from your workspace.</p>
          <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6 inline-flex items-center gap-2 self-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Let's go <ArrowRight size={14} />
          </motion.button>
        </div>
        <div className="border-t border-border bg-background p-3 lg:border-l lg:border-t-0">
          <img src={UPLOADED_MOCKUPS.onboardingJourney} alt="SukaSpace onboarding role selection mockup" className="h-full min-h-[260px] w-full rounded-xl border border-border bg-card object-cover" />
        </div>
      </div>
    </div>
  );
}

function RoleStep({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">How will you use SukaSpace?</h2>
      <p className="mt-1 text-sm text-muted-foreground">This shapes your workspace defaults.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { k: "creator", icon: Rocket, title: "I'm an expert / creator", body: "Launch a community, build courses, monetize your knowledge." },
          { k: "learner", icon: GraduationCap, title: "I'm a learner / student", body: "Join communities, track lessons, earn XP and level up." },
        ].map((o) => (
          <motion.button
            key={o.k}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => setRole(o.k as Role)}
            className={`rounded-xl border p-5 text-left ${role === o.k ? "border-primary bg-primary/5" : "border-border bg-card hover:border-slate-300"}`}
          >
            <span className={`inline-grid h-9 w-9 place-items-center rounded-lg ${role === o.k ? "bg-primary text-white" : "bg-foreground text-white"}`}><o.icon size={16} /></span>
            <div className="mt-3 text-base font-semibold text-foreground">{o.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{o.body}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function InterestsStep({ interests, toggle }: { interests: string[]; toggle: (i: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Pick your target skills</h2>
      <p className="mt-1 text-sm text-muted-foreground">We'll tune your feed and Discovery around these.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {INTERESTS.map((i) => {
          const on = interests.includes(i);
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => toggle(i)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${on ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground hover:border-slate-300"}`}
            >{i}</motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileStep({ name, setName, bio, setBio }: { name: string; setName: (v: string) => void; bio: string; setBio: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Set up your profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">Preview updates live as you type.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">Short bio</span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="AI systems engineer. Building agentic workflows in production." rows={4} className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <div className="rounded-xl border border-dashed border-slate-300 bg-card p-6 text-center">
            <Upload size={20} className="mx-auto text-muted-foreground" />
            <div className="mt-2 text-sm font-semibold text-foreground">Drop your avatar</div>
            <div className="text-xs text-muted-foreground">PNG or JPG · square works best</div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">Live preview</div>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-16 bg-gradient-to-br from-sky-100 to-blue-50" />
            <div className="-mt-6 flex flex-col items-center p-4">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-foreground text-sm font-bold text-white shadow">
                {(name || "You").slice(0, 2).toUpperCase()}
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">{name || "Your name"}</div>
              <div className="mt-1 text-center text-xs text-muted-foreground">{bio || "Your bio will appear here."}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
