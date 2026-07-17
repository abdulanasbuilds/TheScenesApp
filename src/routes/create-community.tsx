import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Rocket, LayoutDashboard,
  Globe, Lock, ImageIcon, Palette,
} from "lucide-react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { useAppStore } from "@/lib/app-store";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { AppLoadingSkeleton } from "@/components/PageSkeleton";

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
const TOTAL_STEPS = 5;

const BRAND_COLORS = [
  { hex: "#3B82F6", label: "Ocean"    },
  { hex: "#6366F1", label: "Indigo"   },
  { hex: "#8B5CF6", label: "Violet"   },
  { hex: "#EC4899", label: "Rose"     },
  { hex: "#EF4444", label: "Ruby"     },
  { hex: "#F97316", label: "Amber"    },
  { hex: "#10B981", label: "Emerald"  },
  { hex: "#14B8A6", label: "Teal"     },
  { hex: "#64748B", label: "Slate"    },
  { hex: "#1E293B", label: "Midnight" },
];

function CreateCommunityPage() {
  const store = useAppStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0 — Foundation
  const [title, setTitle]     = useState("");
  const [summary, setSummary] = useState("");

  // Step 1 — Branding
  const [color, setColor]               = useState(BRAND_COLORS[0].hex);
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Step 2 — Niche
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Step 3 — Access + Privacy
  const [tag, setTag]         = useState<"FREE" | "PAID">("FREE");
  const [price, setPrice]     = useState("$19/mo");
  const [isPrivate, setIsPrivate] = useState(false);

  // Step 4 — Review (no extra fields)

  const [launched, setLaunched] = useState<{ title: string } | null>(null);

  // Auth guard
  useEffect(() => {
    if (store.isHydrated && !store.session) window.location.replace("/auth");
  }, [store.isHydrated, store.session]);

  if (!store.isHydrated || !store.session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  const canContinue =
    step === 0 ? title.trim().length > 1 && summary.trim().length > 3 : true;

  const next = () => {
    if (step < TOTAL_STEPS - 1) { setStep(step + 1); return; }
    const community = store.createCommunity({
      title: title.trim(),
      summary: summary.trim(),
      category,
      tag,
      price: tag === "PAID" ? price : undefined,
      color,
      coverImageUrl: coverImageUrl.trim() || undefined,
      isPrivate,
    });
    setLaunched({ title: community.title });
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const STEP_META = [
    { title: "Create your foundation",    img: UPLOADED_MOCKUPS.createCommunityStep1 },
    { title: "Brand your community",      img: UPLOADED_MOCKUPS.createCommunityStep2 },
    { title: "Select your niche",         img: UPLOADED_MOCKUPS.createCommunityStep2 },
    { title: "Manage access & privacy",   img: UPLOADED_MOCKUPS.manageAccess        },
    { title: "Review & launch",           img: UPLOADED_MOCKUPS.inviteMembers        },
  ] as const;

  const inAppHeader = (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => nav({ to: "/app/feed" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} /> Back to App
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{store.session.name}</span>
          </span>
          <button
            onClick={() => nav({ to: "/app/creator" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LayoutDashboard size={13} /> Creator Hub
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background">
      {inAppHeader}

      {launched ? (
        <LaunchSuccess title={launched.title} onGoToHub={() => nav({ to: "/app/creator" })} />
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tighter text-[#151515] sm:text-4xl">
              Launch a premium learning space in minutes.
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Fill this out and your community goes live on Discover the moment you finish.
            </p>
          </div>

          {/* Progress */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex gap-1">
                {STEP_META.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-neutral-200"}`}
                  />
                ))}
              </div>
              <div className="text-xs font-semibold text-muted-foreground">
                Step {step + 1} / {TOTAL_STEPS}
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="mx-auto mt-6 grid max-w-5xl gap-0 overflow-hidden rounded-2xl border border-neutral-100 bg-card lg:grid-cols-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ background: color }}
                >
                  {step + 1}
                </span>
                <h2 className="text-lg font-extrabold tracking-tighter text-[#151515]">
                  {STEP_META[step].title}
                </h2>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                >
                  {/* ── Step 0: Foundation ──────────────────────────────── */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-foreground">Community name</span>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Agentic Systems Guild"
                          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-foreground">Value proposition</span>
                        <textarea
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          rows={3}
                          placeholder="What will members learn or achieve? (This appears on your Discover card)"
                          className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    </div>
                  )}

                  {/* ── Step 1: Branding ────────────────────────────────── */}
                  {step === 1 && (
                    <div className="space-y-5">
                      {/* Brand color */}
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Palette size={13} /> Brand colour
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {BRAND_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              title={c.label}
                              onClick={() => setColor(c.hex)}
                              className="relative h-8 w-8 rounded-full ring-offset-2 transition-all"
                              style={{ background: c.hex }}
                            >
                              {color === c.hex && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <span className="h-3 w-3 rounded-full border-2 border-white" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        {/* Custom hex input */}
                        <div className="mt-3 flex items-center gap-2">
                          <div
                            className="h-7 w-7 shrink-0 rounded-lg border border-border"
                            style={{ background: color }}
                          />
                          <input
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="#3B82F6"
                            maxLength={7}
                            className="w-28 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="text-xs text-muted-foreground">Custom hex</span>
                        </div>
                      </div>

                      {/* Cover image */}
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <ImageIcon size={13} /> Cover image <span className="font-normal text-muted-foreground">(optional)</span>
                        </div>
                        <input
                          value={coverImageUrl}
                          onChange={(e) => setCoverImageUrl(e.target.value)}
                          placeholder="https://... (1084 × 576 px recommended)"
                          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        {coverImageUrl && (
                          <img
                            src={coverImageUrl}
                            alt="Cover preview"
                            className="mt-2 h-20 w-full rounded-lg border border-border object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        {!coverImageUrl && (
                          <div
                            className="mt-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-border"
                            style={{ background: `${color}18` }}
                          >
                            <span className="text-xs text-muted-foreground">
                              Cover preview — paste a URL above
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Niche ───────────────────────────────────── */}
                  {step === 2 && (
                    <div>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Pick the category where your community gets discovered.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                              category === c
                                ? "border-transparent text-white"
                                : "border-border bg-card text-foreground hover:border-slate-300"
                            }`}
                            style={category === c ? { background: color } : {}}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Step 3: Access + Privacy ────────────────────────── */}
                  {step === 3 && (
                    <div className="space-y-5">
                      {/* Access model */}
                      <div>
                        <p className="mb-2 text-xs font-semibold text-foreground">Membership access</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() => setTag("FREE")}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                              tag === "FREE"
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-slate-300"
                            }`}
                          >
                            <div className="text-sm font-semibold text-foreground">Free access</div>
                            <div className="mt-1 text-xs text-muted-foreground">Anyone can join instantly.</div>
                          </button>
                          <button
                            onClick={() => setTag("PAID")}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                              tag === "PAID"
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-slate-300"
                            }`}
                          >
                            <div className="text-sm font-semibold text-foreground">Paid membership</div>
                            <div className="mt-1 text-xs text-muted-foreground">Set a recurring price.</div>
                          </button>
                        </div>
                        {tag === "PAID" && (
                          <label className="mt-4 block max-w-xs">
                            <span className="mb-1 block text-xs font-semibold text-foreground">Monthly price</span>
                            <input
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                        )}
                      </div>

                      {/* Visibility */}
                      <div>
                        <p className="mb-2 text-xs font-semibold text-foreground">Visibility on Discover</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() => setIsPrivate(false)}
                            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                              !isPrivate
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-slate-300"
                            }`}
                          >
                            <Globe size={16} className="mt-0.5 shrink-0 text-primary" />
                            <div>
                              <div className="text-sm font-semibold text-foreground">Public</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">Appears in search & Discover. Anyone can find and join.</div>
                            </div>
                          </button>
                          <button
                            onClick={() => setIsPrivate(true)}
                            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                              isPrivate
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-slate-300"
                            }`}
                          >
                            <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
                            <div>
                              <div className="text-sm font-semibold text-foreground">Private</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">Hidden from Discover. Invite-only via direct link.</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Step 4: Review & Launch ─────────────────────────── */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Everything looks good? Hit launch — your space goes live immediately.
                      </p>

                      {/* Cover preview */}
                      {coverImageUrl ? (
                        <img
                          src={coverImageUrl}
                          alt="Cover"
                          className="h-24 w-full rounded-xl border border-border object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div
                          className="h-24 w-full rounded-xl border border-border"
                          style={{ background: `linear-gradient(135deg, ${color}44 0%, ${color}22 100%)` }}
                        />
                      )}

                      {/* Summary */}
                      <div className="overflow-hidden rounded-xl border border-border bg-background">
                        <div
                          className="flex items-center gap-2 border-b border-border px-4 py-2"
                          style={{ background: `${color}12` }}
                        >
                          <div className="h-3.5 w-3.5 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-semibold" style={{ color }}>Brand colour</span>
                        </div>
                        <div className="divide-y divide-border">
                          {[
                            { label: "Name",       value: title || "—"                              },
                            { label: "Summary",    value: summary || "—"                            },
                            { label: "Category",   value: category                                  },
                            { label: "Access",     value: tag === "FREE" ? "Free" : `Paid · ${price}` },
                            { label: "Visibility", value: isPrivate ? "Private (invite-only)" : "Public on Discover" },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                              <span className="shrink-0 font-semibold text-muted-foreground">{label}</span>
                              <span className="text-right text-foreground">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <textarea
                        placeholder="Optional: Invite co-creators or founding members by email (alex@co.com, sarah@co.com). You can always do this later."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  disabled={!canContinue}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                  style={{ background: color }}
                >
                  {step === TOTAL_STEPS - 1 ? "Launch community" : "Continue"}{" "}
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>

            {/* Right panel — mockup image */}
            <div className="border-t border-border bg-[#F8FAFC] p-3 lg:border-l lg:border-t-0">
              <img
                src={STEP_META[step].img}
                alt={`${STEP_META[step].title} mockup`}
                className="h-full min-h-[280px] w-full rounded-xl border border-border bg-card object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-border bg-accent p-4 text-center text-sm font-semibold text-foreground">
            <CheckCircle2 size={16} className="mr-2 inline text-primary" />
            {isPrivate
              ? "Private space — share the link directly with your invited members."
              : "Once launched, your space appears instantly in Discover search results."}
          </div>
        </main>
      )}
    </div>
  );
}

function LaunchSuccess({ title, onGoToHub }: { title: string; onGoToHub: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="border-b border-border bg-background p-3">
          <img
            src={UPLOADED_MOCKUPS.launchSuccess}
            alt="Community launch success mockup"
            className="mx-auto w-full max-h-72 rounded-xl border border-border object-cover"
          />
        </div>
        <div className="p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Rocket size={22} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">"{title}" is live!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It's now visible on Discover — searchers can find it immediately,
            whether they filter by category or search by name.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              onClick={onGoToHub}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Go to Creator Hub <ArrowRight size={14} />
            </button>
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              <Sparkles size={14} /> View it on Discover
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
