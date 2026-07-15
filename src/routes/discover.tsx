import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, Users, X, CheckCircle2, Rocket, ArrowRight, Lock, Loader2, AlertCircle, TrendingUp, Star, Flame } from "lucide-react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_CATEGORIES, MOCK_COMMUNITIES } from "@/lib/mock-data";
import { useAppStore, type Community } from "@/lib/app-store";
import { initiatePaystackPayment, isPaystackConfigured, priceStringToAmount } from "@/lib/paystack";
import { verifyPaystackPayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Communities · SukaSpace" },
      { name: "description", content: "Browse AI, engineering, no-code, and digital business communities. Or launch your own." },
      { property: "og:title",       content: "Discover · SukaSpace" },
      { property: "og:description", content: "Find your niche or claim a new one on SukaSpace." },
    ],
  }),
  component: Discovery,
});

// ─── Featured community IDs (first 3 from mock) ──────────────────────────────
const FEATURED_IDS = [1, 5, 3];

// ─── Discovery page ───────────────────────────────────────────────────────────

function Discovery() {
  const [query, setQuery]           = useState("");
  const [cat, setCat]               = useState("All");
  const [authModal, setAuthModal]   = useState(false);
  const [joinTarget, setJoinTarget] = useState<Community | null>(null);
  const [payModal, setPayModal]     = useState(false);
  const [paying, setPaying]         = useState(false);
  const nav = useNavigate();
  const store = useAppStore();

  const allCommunities = useMemo(() => {
    // Merge mock data with user-created ones, deduplicated by title
    const userTitles = new Set(store.communities.map((c) => c.title));
    const extras = MOCK_COMMUNITIES.filter((m) => !userTitles.has(m.title));
    return [
      ...store.communities,
      ...extras.map((m) => ({
        id: m.id,
        title: m.title,
        category: m.category,
        members: m.members,
        creator: m.creator,
        creatorEmail: `${m.creator.toLowerCase().replace(" ", ".")}@example.com`,
        avatar: m.avatar,
        banner: m.banner,
        tag: m.tag as "FREE" | "PAID",
        price: undefined,
        summary: m.summary,
        createdAt: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 90,
      })),
    ];
  }, [store.communities]);

  const filtered = useMemo(() => {
    return allCommunities.filter((c) => {
      const catOk = cat === "All" || c.category === cat;
      const q = query.trim().toLowerCase();
      const qOk = !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [allCommunities, query, cat]);

  const featured = useMemo(() =>
    FEATURED_IDS.map((id) => allCommunities.find((c) => c.id === id)).filter(Boolean) as Community[],
    [allCommunities]
  );

  const hasFilters = query.trim() !== "" || cat !== "All";
  const resetFilters = () => { setQuery(""); setCat("All"); };

  const handleJoin = (community: Community) => {
    if (!store.session) {
      setJoinTarget(community);
      setAuthModal(true);
      return;
    }
    if (community.tag === "PAID") {
      setJoinTarget(community);
      setPayModal(true);
      return;
    }
    store.joinCommunity(community.id);
    store.pushNotification(`You joined "${community.title}"! Welcome to the community.`);
    toast.success(`Joined "${community.title}"!`);
    nav({ to: "/app/feed" });
  };

  const handlePayment = async () => {
    if (!joinTarget || !store.session) return;
    const paystackReady = isPaystackConfigured();

    if (!paystackReady) {
      // Demo mode — join anyway for testing
      store.joinCommunity(joinTarget.id);
      store.pushNotification(`You joined "${joinTarget.title}".`);
      toast.success(`Joined "${joinTarget.title}"! (Payment sandbox — configure Paystack keys for live payments.)`);
      setPayModal(false);
      nav({ to: "/app/feed" });
      return;
    }

    setPaying(true);
    try {
      const amount = priceStringToAmount(joinTarget.price ?? "$19/mo");
      await initiatePaystackPayment({
        email: store.session.email,
        amount,
        currency: "NGN",
        metadata: { communityId: joinTarget.id, userId: store.session.email },
        onSuccess: async (reference) => {
          try {
            await verifyPaystackPayment({ data: { reference, communityId: joinTarget.id, expectedEmail: store.session!.email } });
            store.joinCommunity(joinTarget.id);
            store.pushNotification(`Payment successful — you're now a member of "${joinTarget.title}"!`);
            toast.success("Payment confirmed! You're now a member.");
            setPayModal(false);
            nav({ to: "/app/feed" });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed. Please contact support.");
          }
          setPaying(false);
        },
        onClose: () => {
          setPaying(false);
          toast.info("Payment cancelled.");
        },
      });
    } catch (err) {
      setPaying(false);
      toast.error(err instanceof Error ? err.message : "Payment could not be initiated.");
    }
  };

  const totalMembers = allCommunities.reduce((s, c) => s + c.members, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader />

      {/* ── Hero search ── */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 pt-14 pb-10 text-center sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-5xl"
          >
            Discover expert-led communities
          </motion.h1>
          <p className="mt-3 text-base text-slate-600">
            Find focused spaces dedicated to AI, engineering, no-code, and digital business — or launch your own.
          </p>

          {/* Stats chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            {[
              { icon: Users,     val: `${allCommunities.length} communities` },
              { icon: TrendingUp, val: `${(totalMembers / 1000).toFixed(0)}k+ members` },
              { icon: Star,       val: "Free to join" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <span key={s.val} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
                  <Icon size={11} className="text-primary" />{s.val}
                </span>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <Search size={17} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities, skills, or creators…"
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0 text-slate-400 hover:text-slate-600"><X size={14} /></button>
            )}
            <button className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
              Search
            </button>
          </div>

          {/* Category pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {MOCK_CATEGORIES.map((c) => (
              <motion.button
                key={c}
                onClick={() => setCat(c)}
                whileTap={{ scale: 0.96 }}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                  cat === c
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:text-primary"
                }`}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
        {/* ── Featured (only when no active filter) ── */}
        {!hasFilters && featured.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Flame size={15} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Trending this week</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {featured.map((c, i) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  isNew={Date.now() - c.createdAt < 1000 * 60 * 60 * 24}
                  joined={store.isJoined(c.id)}
                  onJoin={() => handleJoin(c)}
                  featured={i === 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── All communities ── */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600">
            <span className="font-bold text-slate-900">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "community" : "communities"}
            {hasFilters ? " found" : " available"}
          </p>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button onClick={resetFilters} className="text-xs font-semibold text-primary hover:underline">Clear filters</button>
            )}
            <Link to="/create-community" className="text-sm font-semibold text-primary hover:underline">
              + Create yours
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyFilter query={query} cat={cat} onReset={resetFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                isNew={Date.now() - c.createdAt < 1000 * 60 * 60 * 24}
                joined={store.isJoined(c.id)}
                onJoin={() => handleJoin(c)}
                featured={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Auth modal ── */}
      <AnimatePresence>
        {authModal && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 backdrop-blur-sm sm:place-items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAuthModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Join SukaSpace</span>
                <button onClick={() => setAuthModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={15} /></button>
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                Create an account to continue
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Sign up in seconds to join {joinTarget ? `"${joinTarget.title}"` : "this community"}.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => nav({ to: "/auth", search: { mode: "signup" } })} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Sign up free</button>
                <button onClick={() => nav({ to: "/auth", search: { mode: "signin" } })} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">Log in</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Payment modal ── */}
      <AnimatePresence>
        {payModal && joinTarget && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 backdrop-blur-sm sm:place-items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !paying && setPayModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Lock size={10} /> Paid Community
                </span>
                <button onClick={() => !paying && setPayModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={15} /></button>
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">Join "{joinTarget.title}"</h3>
              <p className="mt-1 text-sm text-slate-600">{joinTarget.summary}</p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Membership</span>
                  <span className="text-xl font-extrabold text-slate-900">{joinTarget.price ?? "$19/mo"}</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {["Full community access", "All course content", "Direct messaging", "Leaderboard participation"].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={12} className="shrink-0 text-primary" />{b}
                    </li>
                  ))}
                </ul>
              </div>

              {!isPaystackConfigured() && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Paystack is not configured. Payment will be simulated — set <code className="rounded bg-amber-100 px-1 font-mono text-[10px]">VITE_PAYSTACK_PUBLIC_KEY</code> for live payments.
                  </p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={paying}
                className="mt-5 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-70 transition-colors"
              >
                {paying ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" /> Processing…
                  </span>
                ) : isPaystackConfigured() ? (
                  `Pay & Join — ${joinTarget.price ?? "$19/mo"}`
                ) : (
                  "Join (Demo Mode)"
                )}
              </button>
              <p className="mt-2 text-center text-[10px] text-slate-500">
                Secured by Paystack · Cancel anytime
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({
  community, isNew, joined, onJoin, featured,
}: {
  community: Community;
  isNew: boolean;
  joined: boolean;
  onJoin: () => void;
  featured: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${featured ? "border-primary/30 ring-1 ring-primary/10" : "border-slate-200 hover:border-primary/20"}`}
    >
      <div className={`relative h-28 bg-gradient-to-br ${community.banner}`}>
        <div className="absolute inset-0 flex items-end p-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-white bg-slate-800 text-sm font-bold text-white shadow-md">
            {community.avatar}
          </div>
        </div>
        <div className="absolute right-2 top-2 flex flex-wrap items-center gap-1">
          {isNew && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">New</span>
          )}
          {featured && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              🔥 Trending
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${community.tag === "FREE" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
            {community.tag === "FREE" ? "FREE" : community.price ?? "PAID"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">{community.title}</div>
          <div className="mt-0.5 text-xs text-slate-500">by {community.creator} · {community.category}</div>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600">{community.summary}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Users size={11} />
          <span>{community.members.toLocaleString()} members</span>
        </div>
        <button
          onClick={onJoin}
          className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
            joined
              ? "border border-slate-200 bg-slate-50 text-slate-500"
              : community.tag === "PAID"
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5"
          }`}
        >
          {joined ? (
            <span className="inline-flex items-center justify-center gap-1">
              <CheckCircle2 size={13} /> Joined
            </span>
          ) : community.tag === "PAID" ? (
            <span className="inline-flex items-center justify-center gap-1">
              <Lock size={12} /> Join — {community.price ?? "Paid"}
            </span>
          ) : (
            "Join community"
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty filter ─────────────────────────────────────────────────────────────

function EmptyFilter({ query, cat, onReset }: { query: string; cat: string; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
        <Search size={16} className="text-slate-500" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">No communities match</h3>
      <p className="mt-1 text-sm text-slate-500">
        {query ? `No results for "${query}"` : `No communities in "${cat}" yet`}.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <button onClick={onReset} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
          Clear filters
        </button>
        <Link to="/create-community" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          <Rocket size={14} /> Create this community <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
