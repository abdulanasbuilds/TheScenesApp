import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, Users, Sparkles, X, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
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
  const handleJoin = (community: Community) => {
    if (!store.session) { setJoinTarget(community); setModal(true); return; }
    store.joinCommunity(community.id);
    nav({ to: "/app/feed" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Discover tech & expert-led communities</h1>
          <p className="mt-3 text-base text-muted-foreground">Join focused spaces dedicated to advancing your skills in engineering, automation, and digital business.</p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/create-community" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
              Create Your Community <Sparkles size={14} />
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
              See Pricing
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-primary bg-white p-1 shadow-sm">
            <Search size={20} className="ml-3 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, communities, and documentation..."
              className="flex-1 bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="mr-3 rounded border border-border bg-slate-100 px-2 py-1 text-xs font-semibold text-muted-foreground">⌘ K</kbd>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {MOCK_CATEGORIES.map((c) => (
              <motion.button
                key={c}
                onClick={() => setCat(c)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${cat === c ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/50"}`}
              >{c}</motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {!hasCommunities ? (
          <ZeroState onClaim={() => setModal(true)} />
        ) : filtered.length === 0 ? (
          <EmptyFilter onReset={resetFilters} />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{filtered.length} {filtered.length === 1 ? "community" : "communities"}{hasFilters ? " matching your search" : ""}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CommunityCard key={c.id} community={c} isNew={Date.now() - c.createdAt < 1000 * 60 * 60 * 24} joined={store.isJoined(c.id)} onJoin={() => handleJoin(c)} />
              ))}
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 backdrop-blur-sm sm:place-items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
          >
            <motion.div
              initial={{ y: 40, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl border border-border bg-card p-6 shadow-lg sm:rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-primary" /><span className="text-sm font-semibold text-slate-900">Join SukaSpace</span></div>
                <button onClick={() => setModal(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
              </div>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Create an account to continue</h3>
              <p className="mt-1 text-sm text-slate-600">Sign up in seconds to join {joinTarget ? `"${joinTarget.title}"` : "this community"} or launch your own space.</p>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => nav({ to: "/auth", search: { mode: "signup" } })} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Sign up free</button>
                <button onClick={() => nav({ to: "/auth", search: { mode: "signin" } })} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">Log in</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommunityCard({ community, isNew, joined, onJoin }: { community: Community; isNew: boolean; joined: boolean; onJoin: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className={`relative h-20 bg-gradient-to-br ${community.banner}`}>
        {isNew && <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">New</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Avatar initials={community.avatar} size={28} tone="primary" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{community.title}</div>
            <div className="truncate text-xs text-slate-500">by {community.creator}</div>
          </div>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{community.summary}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Users size={12} /> {community.members.toLocaleString()} members</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${community.tag === "FREE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{community.tag === "FREE" ? "FREE" : community.price || "PAID"}</span>
        </div>
        <button
          onClick={onJoin}
          className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold ${joined ? "border border-border bg-slate-50 text-slate-500" : "bg-primary text-white hover:bg-primary/90"}`}
        >
          {joined ? <span className="inline-flex items-center justify-center gap-1"><CheckCircle2 size={14} /> Joined</span> : "Join community"}
        </button>
      </div>
    </motion.div>
  );
}

function ZeroState({ onClaim }: { onClaim: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }} className="mx-auto grid max-w-6xl gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-5">
      <div className="p-6 sm:p-8 lg:col-span-2 lg:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600"><Sparkles size={12} className="text-primary" /> Day 1 · Early access</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">The next generation of tech communities is launching.</h2>
        <p className="mt-3 text-base text-slate-600">Be the first expert to claim your niche. AI, LLM engineering, automation, no-code — early creators own the discovery graph as new members flood in.</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Priority ranking in the Discovery feed</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Founding creator badge on your profile</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Direct feedback line with the SukaSpace team</li>
        </ul>
      </div>
      <div className="border-t border-border bg-[#F8FAFC] p-3 lg:col-span-3 lg:border-l lg:border-t-0">
        <img src={UPLOADED_MOCKUPS.discoverZeroState} alt="SukaSpace discovery search zero-state mockup" className="h-full min-h-[280px] w-full rounded-xl border border-border bg-card object-cover" />
      </div>
      <div className="flex flex-col justify-center border-t border-border bg-card p-6 lg:col-span-5 lg:p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Launch</div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create the first tech space</div>
        <p className="mt-2 text-sm text-slate-600">2-minute setup. No card required. It shows up below and in search the moment you launch it.</p>
        <motion.button
          onClick={onClaim}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >Create the First Tech Space</motion.button>
      </div>
    </motion.div>
  );
}

function EmptyFilter({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500"><Search size={16} /></div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">No spaces match those filters</h3>
      <p className="mt-1 text-sm text-slate-500">Try a different category or reset your search.</p>
      <button onClick={onReset} className="mt-4 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">Reset</button>
    </div>
  );
}
