import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, Users, X, CheckCircle2, Rocket, ArrowRight, Loader2, ArrowLeft, Compass } from "lucide-react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
import { Avatar } from "@/components/BrowserFrame";
import { Logo } from "@/components/Logo";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { useAppStore, type Community } from "@/lib/app-store";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover tech & expert-led communities · SukaSpace" },
      { name: "description", content: "Browse AI, engineering, no-code, and digital business communities. Or launch your own." },
      { property: "og:title", content: "Discover · SukaSpace" },
      { property: "og:description", content: "Find your niche or claim a new one on SukaSpace." },
    ],
  }),
  component: Discovery,
});

function Discovery() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(false);
  const [joinTarget, setJoinTarget] = useState<Community | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const nav = useNavigate();
  const store = useAppStore();

  const filtered = useMemo(() => {
    return store.communities.filter((c) => {
      const catOk = cat === "All" || c.category === cat;
      const q = query.trim().toLowerCase();
      const qOk = !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [store.communities, query, cat]);

  const hasFilters = query.trim() !== "" || cat !== "All";
  const hasCommunities = store.communities.length > 0;
  const resetFilters = () => { setQuery(""); setCat("All"); };

  const handleJoin = async (community: Community) => {
    if (!store.session) { setJoinTarget(community); setModal(true); return; }
    if (joiningId === community.id) return; // prevent double-click
    setJoiningId(community.id);
    try {
      await store.joinPaidCommunity(community.id, (msg) => toast.error(msg));
      nav({ to: "/app/feed" });
    } finally {
      setJoiningId(null);
    }
  };

  // When logged in, show an in-app header so users stay inside the app context
  const header = (store.isHydrated && store.session) ? (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav({ to: "/app/feed" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} /> Back to App
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Compass size={15} className="text-primary" /> Discover Communities
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{store.session.name}</span></span>
          <button
            onClick={() => nav({ to: "/create-community" })}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            + Create community
          </button>
        </div>
      </div>
    </header>
  ) : <PublicHeader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {header}

      {/* Hero search section */}
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tighter text-[#151515] sm:text-5xl">
          Discover tech &amp; expert-led communities
        </h1>
        <p className="mt-2.5 text-base text-slate-600">
          Join focused spaces dedicated to advancing your skills in engineering, automation, and digital business.
        </p>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for communities, skills, or experts..."
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            suppressHydrationWarning
          />
          {query && (
            <button onClick={() => setQuery("")} className="shrink-0 text-slate-400 hover:text-slate-600"><X size={15} /></button>
          )}
          <button className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-extrabold text-white border border-transparent hover:bg-primary/90">Find</button>
        </div>

        {/* Category filters */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {MOCK_CATEGORIES.map((c) => (
            <motion.button
              key={c}
              onClick={() => setCat(c)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                cat === c
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Community grid or zero state */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {!hasCommunities ? (
          <ZeroState />
        ) : filtered.length === 0 ? (
          <EmptyFilter query={query} cat={cat} onReset={resetFilters} />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                <span className="font-semibold text-slate-900">{filtered.length}</span> {filtered.length === 1 ? "community" : "communities"}{hasFilters ? " found" : ""}
              </p>
              <button onClick={() => { if (store.isHydrated && store.session) nav({ to: "/create-community" }); else nav({ to: "/auth", search: { mode: "signup" } }); }} className="text-sm font-semibold text-primary hover:underline">+ Create yours</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  isNew={store.isHydrated && Date.now() - c.createdAt < 1000 * 60 * 60 * 24}
                  joined={store.isJoined(c.id)}
                  onJoin={() => handleJoin(c)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Auth modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 backdrop-blur-sm sm:place-items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-6 shadow-lg sm:rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Join SukaSpace</span>
                <button onClick={() => setModal(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
              </div>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                Create an account to continue
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Sign up in seconds to join {joinTarget ? `"${joinTarget.title}"` : "this community"} or launch your own space.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => nav({ to: "/auth", search: { mode: "signup" } })} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Sign up free</button>
                <button onClick={() => nav({ to: "/auth", search: { mode: "signin" } })} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">Log in</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Zero State ───────────────────────────────────────────────────────────────

function ZeroState() {
  const store = useAppStore();
  const nav = useNavigate();
  const goCreate = () => {
    if (store.isHydrated && store.session) nav({ to: "/create-community" });
    else nav({ to: "/auth", search: { mode: "signup" } });
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
      className="mx-auto max-w-lg"
    >
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky-50">
          <Rocket size={28} className="text-primary" />
        </div>

        {/* Headline */}
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          Be the first to lead this niche
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          We couldn't find any communities here yet. This is your chance to claim this space, build your authority, and gather the first 1,000 members in your field.
        </p>

        {/* CTA */}
        <button
          onClick={goCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          Create the First Tech Space <ArrowRight size={15} />
        </button>

        {/* Benefit note */}
        <p className="mt-4 text-xs font-medium text-slate-500">
          Early creator benefits: 0% platform fees for 12 months
        </p>

        {/* Decorative dots */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-200" />
          ))}
        </div>
      </div>

      {/* Below card hint */}
      <p className="mt-6 text-center text-xs text-slate-500">
        Communities appear below once creators launch them. Yours will show up here immediately.
      </p>
    </motion.div>
  );
}

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({ community, isNew, joined, onJoin }: {
  community: Community;
  isNew: boolean;
  joined: boolean;
  onJoin: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:border-primary/30 transition"
    >
      <div className={`relative h-24 bg-gradient-to-br ${community.banner}`}>
        {isNew && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">New</span>
        )}
        <div className="absolute -bottom-4 left-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-white bg-slate-800 text-sm font-bold text-white shadow-sm">
            {community.avatar}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-6">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{community.title}</div>
          <div className="text-xs text-slate-500">by {community.creator} · {community.category}</div>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{community.summary}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Users size={12} />{community.members.toLocaleString()} members</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${community.tag === "FREE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {community.tag === "FREE" ? "FREE" : community.price || "PAID"}
          </span>
        </div>
        <button
          onClick={onJoin}
          className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
            joined
              ? "border border-slate-200 bg-slate-50 text-slate-500"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {joined
            ? <span className="inline-flex items-center justify-center gap-1"><CheckCircle2 size={14} />Joined</span>
            : "Join community"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty Filter ─────────────────────────────────────────────────────────────

function EmptyFilter({ query, cat, onReset }: { query: string; cat: string; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-slate-100">
        <Search size={16} className="text-slate-500" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">No communities match</h3>
      <p className="mt-1 text-sm text-slate-500">
        {query ? `No results for "${query}"` : `No communities in "${cat}" yet`}. Try a different search or category.
      </p>
      <button onClick={onReset} className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition">
        Clear filters
      </button>
    </div>
  );
}
