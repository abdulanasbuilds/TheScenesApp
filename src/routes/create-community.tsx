import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Rocket,
  Globe,
  Lock,
  ImageIcon,
  Palette,
  Tag,
  DollarSign,
  Users,
  MessageSquare,
  Eye,
  EyeOff,
  Upload,
  Check,
  Info,
  Zap,
  BookOpen,
  Star,
} from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { SPRING_FAST } from "@/lib/pwa";

export const Route = createFileRoute("/create-community")({
  head: () => ({ meta: [{ title: "Create Community · The Scenes" }] }),
  component: CreateCommunity,
});

// ─── Static data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  "AI & Technology",
  "Business & Entrepreneurship",
  "Design & Creative",
  "Marketing & Growth",
  "Health & Wellness",
  "Finance & Investing",
  "Personal Development",
  "Music & Arts",
  "Gaming",
  "Education",
  "Coding & Dev",
  "Spirituality",
  "Sports & Fitness",
  "Other",
];

const BRAND_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#E11D48",
  "#0EA5E9",
  "#A855F7",
];

const PRICING_MODELS = [
  { id: "free", label: "Free", desc: "Open to everyone, no charge", icon: Globe },
  { id: "paid", label: "Paid", desc: "Monthly or one-time subscription", icon: DollarSign },
  {
    id: "freemium",
    label: "Freemium",
    desc: "Free entry with paid upgrades available",
    icon: Star,
  },
];

const slide = {
  initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
  transition: { type: "spring", stiffness: 360, damping: 34 },
};

// ─── Steps indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Identity", "Description", "Branding", "Pricing", "Welcome", "Review"];

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all",
              i < current
                ? "border-blue-500 bg-blue-500 text-white"
                : i === current
                  ? "border-blue-500 bg-white text-blue-600"
                  : "border-slate-200 bg-white text-slate-400",
            )}
          >
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 mx-0.5 transition-colors",
                i < current ? "bg-blue-500" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function CreateCommunity() {
  const store = useAppStore();
  const nav = useNavigate();

  // Auth guard
  useEffect(() => {
    if (!store.session) {
      window.location.replace("/auth");
      return;
    }
    if (store.session.role !== "creator") {
      nav({ to: "/app/feed" });
    }
  }, [store.session]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Step 0: Identity
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [showCatMenu, setShowCatMenu] = useState(false);

  // Step 1: Description
  const [summary, setSummary] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Step 2: Branding
  const [color, setColor] = useState("#3B82F6");
  const [customColor, setCustomColor] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  // Step 3: Pricing
  const [pricingModel, setPricingModel] = useState<"free" | "paid" | "freemium">("free");
  const [price, setPrice] = useState("");

  // Step 4: Welcome settings
  const [isPrivate, setIsPrivate] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [screenQ1, setScreenQ1] = useState("");
  const [screenQ2, setScreenQ2] = useState("");
  const [screenQ3, setScreenQ3] = useState("");
  const [keywordsRaw, setKeywordsRaw] = useState("");

  const TOTAL_STEPS = 6;
  const activeColor = customColor || color;

  const go = (delta: number) => {
    setDirection(delta);
    setStep((s) => s + delta);
  };

  const canNext = [
    name.trim().length >= 3 && category.length > 0, // 0: name + category
    summary.trim().length >= 20, // 1: description
    true, // 2: branding (always ok)
    price.length > 0, // 3: pricing
    true, // 4: welcome optional
    true, // 5: review
  ];

  const handleCreate = async () => {
    if (!store.session) return;
    setSaving(true);
    try {
      const tag: "FREE" | "PAID" = pricingModel === "free" ? "FREE" : "PAID";
      const keywords = keywordsRaw
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 11);
      const screeningQuestions = [screenQ1, screenQ2, screenQ3]
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 3);
      store.createCommunity({
        title: name.trim(),
        category,
        summary: summary.trim(),
        tag,
        price: pricingModel !== "free" ? price : undefined,
        color: activeColor,
        coverImageUrl: coverUrl || undefined,
        iconUrl: iconUrl || undefined,
        isPrivate,
        discoveryKeywords: keywords,
        screeningQuestions,
        welcomeMessage: welcomeMsg.trim() || undefined,
      });

      // Welcome notification
      store.pushNotification(
        `🎉 "${name.trim()}" is live! Share it with your audience.`,
        "system",
        "/app/creator",
      );

      setDone(true);
      setTimeout(() => nav({ to: "/app/creator" }), 2200);
    } finally {
      setSaving(false);
    }
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-violet-50 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-center space-y-4"
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl"
            style={{ backgroundColor: activeColor }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Community created!</h2>
          <p className="text-slate-500">Redirecting you to the Creator Hub…</p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:120ms]" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:240ms]" />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step 0: Identity ─────────────────────────────────────────────────────────
  const Step0 = (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Name your community</h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose a clear, memorable name. You can refine it later.
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Community name *
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AI Builders Club"
          maxLength={60}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-slate-400 mt-1">{name.length}/60 · minimum 3 characters</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Category *
        </label>
        <div className="relative">
          <button
            onClick={() => setShowCatMenu((v) => !v)}
            className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <span className={category ? "text-slate-800" : "text-slate-400"}>
              {category || "Select a category…"}
            </span>
            <Tag className="w-4 h-4 text-slate-400" />
          </button>
          {showCatMenu && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setShowCatMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors",
                    category === c && "bg-blue-50 text-blue-700 font-medium",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Step 1: Description ───────────────────────────────────────────────────────
  const Step1 = (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Describe your community</h2>
        <p className="text-sm text-slate-500 mt-1">
          This appears on your public page. Be clear about who it's for and what they'll get.
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Description *
        </label>
        <textarea
          autoFocus
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="This community is for… Members will learn… You'll get access to…"
          rows={5}
          maxLength={500}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-slate-400 mt-1">{summary.length}/500 · minimum 20 characters</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Cover image URL <span className="font-normal text-slate-400 normal-case">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://example.com/cover.jpg (1084×576 recommended)"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        {coverUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 aspect-video">
            <img
              src={coverUrl}
              alt="cover preview"
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          </div>
        )}
        {!coverUrl && (
          <div className="mt-2 rounded-xl border-2 border-dashed border-slate-200 aspect-video flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="w-8 h-8 mb-1" />
            <span className="text-sm">Cover image preview</span>
            <span className="text-xs">1084×576px recommended</span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Step 2: Branding ──────────────────────────────────────────────────────────
  const Step2 = (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Brand your community</h2>
        <p className="text-sm text-slate-500 mt-1">
          Pick a colour that represents your community's personality.
        </p>
      </div>

      {/* Community card preview */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="h-16" style={{ backgroundColor: activeColor }} />
        <div className="px-4 py-3 bg-white">
          <div
            className="w-10 h-10 rounded-full -mt-7 border-2 border-white shadow flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: activeColor }}
          >
            {name.charAt(0).toUpperCase() || "C"}
          </div>
          <p className="font-bold text-slate-900 mt-2 text-sm">{name || "Community Name"}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {category || "Category"} · {pricingModel === "free" ? "Free" : `Paid`}
          </p>
        </div>
      </div>

      {/* Color palette */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Brand color
        </label>
        <div className="flex flex-wrap gap-2">
          {BRAND_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setCustomColor("");
              }}
              className={cn(
                "w-9 h-9 rounded-full border-4 transition-transform hover:scale-110",
                activeColor === c ? "border-white ring-2 ring-offset-1" : "border-transparent",
              )}
              style={{
                backgroundColor: c,
                boxShadow: activeColor === c ? `0 0 0 2px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Custom hex */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Custom hex <span className="font-normal text-slate-400 normal-case">(optional)</span>
        </label>
        <div className="flex gap-2 items-center">
          <div
            className="w-9 h-9 rounded-lg border border-slate-200 flex-shrink-0"
            style={{ backgroundColor: activeColor }}
          />
          <input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#1A2B3C"
            maxLength={7}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Community icon (Skool parity — 128×128) */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Community icon URL{" "}
          <span className="font-normal text-slate-400 normal-case">(optional · 128×128)</span>
        </label>
        <div className="flex gap-3 items-center">
          <div
            className="w-12 h-12 rounded-2xl border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: activeColor }}
          >
            {iconUrl ? (
              <img
                src={iconUrl}
                alt="icon"
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            ) : (
              name.charAt(0).toUpperCase() || "C"
            )}
          </div>
          <input
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://example.com/icon.png"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
    </div>
  );

  // ── Step 3: Pricing ───────────────────────────────────────────────────────────
  const Step3 = (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Set your pricing</h2>
        <p className="text-sm text-slate-500 mt-1">How will members access your community?</p>
      </div>

      <div className="space-y-3">
        {PRICING_MODELS.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPricingModel(id as any)}
            className={cn(
              "w-full flex items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all",
              pricingModel === id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-blue-200",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                pricingModel === id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500",
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  pricingModel === id ? "text-blue-800" : "text-slate-800",
                )}
              >
                {label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            {pricingModel === id && <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {pricingModel !== "free" && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Price (e.g. "₦5,000/month" or "$9/month")
          </label>
          <input
            autoFocus
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. ₦5,000/month"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Payment is processed via Paystack. You keep 93–100% depending on your plan.
          </p>
        </div>
      )}
    </div>
  );

  // ── Step 4: Welcome & Privacy ─────────────────────────────────────────────────
  const Step4 = (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Welcome & access</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure how new members are welcomed and who can find your community.
        </p>
      </div>

      {/* Privacy toggle */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setIsPrivate(false)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
            !isPrivate ? "bg-emerald-50" : "hover:bg-slate-50",
          )}
        >
          <Globe className={cn("w-5 h-5", !isPrivate ? "text-emerald-600" : "text-slate-400")} />
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-semibold",
                !isPrivate ? "text-emerald-800" : "text-slate-700",
              )}
            >
              Public
            </p>
            <p className="text-xs text-slate-500">
              Discoverable on The Scenes and searchable on the web
            </p>
          </div>
          {!isPrivate && <Check className="w-4 h-4 text-emerald-500" />}
        </button>
        <div className="border-t border-slate-100" />
        <button
          onClick={() => setIsPrivate(true)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
            isPrivate ? "bg-slate-50" : "hover:bg-slate-50",
          )}
        >
          <Lock className={cn("w-5 h-5", isPrivate ? "text-slate-600" : "text-slate-400")} />
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-semibold",
                isPrivate ? "text-slate-800" : "text-slate-700",
              )}
            >
              Private
            </p>
            <p className="text-xs text-slate-500">Only visible to members. Invite-only access.</p>
          </div>
          {isPrivate && <Check className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Welcome message */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Auto welcome DM <span className="font-normal text-slate-400 normal-case">(optional)</span>
        </label>
        <textarea
          value={welcomeMsg}
          onChange={(e) => setWelcomeMsg(e.target.value)}
          placeholder="Hey {name}! Welcome to the community. Here's what to do first…"
          rows={4}
          maxLength={600}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-slate-400 mt-1">
          This message is automatically sent as a DM when someone joins.
        </p>
      </div>

      {/* Screening questions */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Screening questions{" "}
          <span className="font-normal text-slate-400 normal-case">(optional · up to 3)</span>
        </label>
        <input
          value={screenQ1}
          onChange={(e) => setScreenQ1(e.target.value)}
          placeholder="Question 1 — e.g. What brings you here?"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          value={screenQ2}
          onChange={(e) => setScreenQ2(e.target.value)}
          placeholder="Question 2 — e.g. What's your biggest goal?"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          value={screenQ3}
          onChange={(e) => setScreenQ3(e.target.value)}
          placeholder="Question 3 — e.g. How did you hear about us?"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Discovery keywords (Skool parity — up to 11) */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Discovery keywords{" "}
          <span className="font-normal text-slate-400 normal-case">
            (optional · up to 11, comma-separated)
          </span>
        </label>
        <input
          value={keywordsRaw}
          onChange={(e) => setKeywordsRaw(e.target.value)}
          placeholder="ai, startup, no-code, marketing, growth"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-slate-400 mt-1">
          Helps people find your community in Discover and search engines.
        </p>
      </div>
    </div>
  );

  // ── Step 5: Review ────────────────────────────────────────────────────────────
  const Step5 = (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Review & create</h2>
        <p className="text-sm text-slate-500 mt-1">
          Everything look right? You can edit all of this after launch.
        </p>
      </div>

      {/* Preview card */}
      <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md">
        <div className="h-24 relative" style={{ backgroundColor: activeColor }}>
          {coverUrl && (
            <img
              src={coverUrl}
              alt="cover"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
            />
          )}
        </div>
        <div className="px-5 pb-5 bg-white">
          <div
            className="w-12 h-12 rounded-2xl -mt-6 border-2 border-white shadow-md flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: activeColor }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{name}</h3>
              {isPrivate ? (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              ) : (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{category}</p>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{summary}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${activeColor}20`, color: activeColor }}
            >
              {pricingModel === "free" ? "Free" : pricingModel === "paid" ? `${price}` : "Freemium"}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
              <Users className="w-3 h-3" /> 1 member
            </span>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {[
          { ok: name.length >= 3, label: "Community name" },
          { ok: category.length > 0, label: "Category" },
          { ok: summary.length >= 20, label: "Description" },
          { ok: true, label: "Brand colour" },
          { ok: pricingModel === "free" || price.length > 0, label: "Pricing" },
        ].map(({ ok, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center",
                ok ? "bg-emerald-100" : "bg-slate-100",
              )}
            >
              <Check className={cn("w-3 h-3", ok ? "text-emerald-600" : "text-slate-300")} />
            </div>
            <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const STEPS = [Step0, Step1, Step2, Step3, Step4, Step5];

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-slate-400 text-sm hidden sm:inline">· Create Community</span>
        </div>
        <Link to="/app/creator" className="text-sm text-slate-500 hover:text-slate-700">
          Cancel
        </Link>
      </div>

      {/* Step progress */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3">
        <div className="max-w-lg mx-auto">
          <StepBar current={step} total={TOTAL_STEPS} />
          <div className="flex justify-between mt-1">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  i === step ? "text-blue-600" : i < step ? "text-slate-400" : "text-slate-300",
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
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

      {/* Footer */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={() => go(-1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={step < TOTAL_STEPS - 1 ? () => go(1) : handleCreate}
            disabled={!canNext[step] || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating…
              </>
            ) : step < TOTAL_STEPS - 1 ? (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Launch Community
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
