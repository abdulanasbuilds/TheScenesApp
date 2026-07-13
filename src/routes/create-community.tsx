import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Rocket } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { useAppStore } from "@/lib/app-store";
import { MOCK_CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/create-community")({
  head: () => ({
    meta: [
      { title: "Create a Community · SukaSpace" },
      { name: "description", content: "Launch a learning community and course workspace on SukaSpace in minutes." },
      { property: "og:title", content: "Create a Community · SukaSpace" },
      { property: "og:description", content: "Foundation, niche, access, and launch — set up your space and go live on Discover instantly." },
    ],
  }),
  component: CreateCommunityPage,
});

const CATEGORIES = MOCK_CATEGORIES.filter((c) => c !== "All");
const TOTAL_STEPS = 4;

function CreateCommunityPage() {
  const store = useAppStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tag, setTag] = useState<"FREE" | "PAID">("FREE");
  const [price, setPrice] = useState("$19/mo");
  const [launched, setLaunched] = useState<{ title: string } | null>(null);

  const canContinue = step === 0 ? title.trim().length > 1 && summary.trim().length > 3 : true;

  const next = () => {
    if (step < TOTAL_STEPS - 1) { setStep(step + 1); return; }
    const community = store.createCommunity({ title: title.trim(), summary: summary.trim(), category, tag, price: tag === "PAID" ? price : undefined });
    setLaunched({ title: community.title });
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const STEP_META = [
    { title: "Create your foundation", img: UPLOADED_MOCKUPS.createCommunityStep1 },
    { title: "Select your niche", img: UPLOADED_MOCKUPS.createCommunityStep2 },
    { title: "Manage access", img: UPLOADED_MOCKUPS.manageAccess },
    { title: "Invite members", img: UPLOADED_MOCKUPS.inviteMembers },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {launched ? (
        <LaunchSuccess title={launched.title} onGoToHub={() => nav({ to: "/app/creator" })} />
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tighter text-[#151515] sm:text-4xl">Launch a premium learning space in minutes.</h1>
            <p className="mt-2 text-base text-muted-foreground">Fill this out and your community goes live on Discover the moment you finish.</p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 26 }} />
            </div>
            <div className="mt-1.5 text-right text-xs font-semibold text-muted-foreground">Step {step + 1} / {TOTAL_STEPS}</div>
          </div>

          <div className="mx-auto mt-6 grid max-w-5xl gap-0 overflow-hidden rounded-2xl border border-neutral-100 bg-card lg:grid-cols-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-foreground text-xs font-bold text-white">{step + 1}</span>
                <h2 className="text-lg font-extrabold tracking-tighter text-[#151515]">{STEP_META[step].title}</h2>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 220, damping: 26 }}>
                  {step === 0 && (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-foreground">Community name</span>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Agentic Systems Guild" className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-foreground">One-line summary</span>
                        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="What will members learn or achieve here?" className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      </label>
                    </div>
                  )}
                  {step === 1 && (
                    <div>
                      <p className="mb-3 text-sm text-muted-foreground">Pick the category where your community should get discovered.</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => (
                          <button key={c} onClick={() => setCategory(c)} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${category === c ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground hover:border-slate-300"}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div>
                      <p className="mb-3 text-sm text-muted-foreground">Choose how members get in.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button onClick={() => setTag("FREE")} className={`rounded-xl border p-4 text-left ${tag === "FREE" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-slate-300"}`}>
                          <div className="text-sm font-semibold text-foreground">Free access</div>
                          <div className="mt-1 text-xs text-muted-foreground">Anyone can join instantly.</div>
                        </button>
                        <button onClick={() => setTag("PAID")} className={`rounded-xl border p-4 text-left ${tag === "PAID" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-slate-300"}`}>
                          <div className="text-sm font-semibold text-foreground">Paid membership</div>
                          <div className="mt-1 text-xs text-muted-foreground">Set a recurring price.</div>
                        </button>
                      </div>
                      {tag === "PAID" && (
                        <label className="mt-4 block max-w-xs">
                          <span className="mb-1 block text-xs font-semibold text-foreground">Monthly price</span>
                          <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </label>
                      )}
                    </div>
                  )}
                  {step === 3 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Optional — invite co-creators or founding members by email. You can always do this later from Members.</p>
                      <textarea placeholder="alex@company.com, sarah@company.com" rows={3} className="mt-3 w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm">
                        <div className="font-semibold text-foreground">Review</div>
                        <div className="mt-1 text-muted-foreground">"{title || "Untitled community"}" · {category} · {tag === "FREE" ? "Free" : price}</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={prev} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-40">
                  <ArrowLeft size={14} /> Back
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={next} disabled={!canContinue} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50">
                  {step === TOTAL_STEPS - 1 ? "Launch community" : "Continue"} <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
            <div className="border-t border-border bg-[#F8FAFC] p-3 lg:border-l lg:border-t-0">
              <img src={STEP_META[step].img} alt={`${STEP_META[step].title} mockup`} className="h-full min-h-[280px] w-full rounded-xl border border-border bg-card object-cover" loading="lazy" />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-border bg-accent p-4 text-center text-sm font-semibold text-foreground">
            <CheckCircle2 size={16} className="mr-2 inline text-primary" />Once launched, your space appears instantly in Discover search results.
          </div>
        </main>
      )}
    </div>
  );
}

function LaunchSuccess({ title, onGoToHub }: { title: string; onGoToHub: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 24 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-background p-3">
          <img src={UPLOADED_MOCKUPS.launchSuccess} alt="Community launch success mockup" className="mx-auto w-full max-h-72 rounded-xl border border-border object-cover" />
        </div>
        <div className="p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Rocket size={22} /></div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">"{title}" is live!</h1>
          <p className="mt-2 text-sm text-muted-foreground">It's now visible on Discover — searchers can find it immediately, whether they filter by category or search by name.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={onGoToHub} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">
              Go to Creator Hub <ArrowRight size={14} />
            </button>
            <Link to="/discover" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent">
              <Sparkles size={14} /> View it on Discover
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
