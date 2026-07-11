import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, Users, Sparkles, X } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_COMMUNITIES, MOCK_CATEGORIES } from "@/lib/mock-data";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

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
  const [simulateZeroState, setSimulateZeroState] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(false);
  const nav = useNavigate();

  const filtered = useMemo(() => {
    return MOCK_COMMUNITIES.filter((c) => {
      const catOk = cat === "All" || c.category === cat;
      const q = query.trim().toLowerCase();
      const qOk = !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [query, cat]);

  const openJoin = () => setModal(true);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="mx-auto flex max-w-7xl items-center justify-end gap-2 px-4 pt-3 sm:px-6">
        <span className="text-[11px] font-medium text-500">Catalog state</span>
        <button
          onClick={() => setSimulateZeroState(false)}
          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${!simulateZeroState ? "border-[primary] bg-[primary] text-white" : "border-border bg-card text-600"}`}
        >Live</button>
        <button
          onClick={() => setSimulateZeroState(true)}
          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${simulateZeroState ? "border-[primary] bg-[primary] text-white" : "border-border bg-card text-600"}`}
        >Day 1 zero-state</button>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-900">Discover tech & expert-led communities <span className="text-400">or create your own</span></h1>
          <p className="mt-3 text-lg font-medium text-500">AI, engineering, no-code, and modern business — find hyper-focused spaces led by real operators.</p>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
            <Search size={16} className="ml-2 text-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 'LLM agents', 'no-code', 'growth'…"
              className="flex-1 bg-transparent px-1 py-1.5 text-sm text-900 outline-none placeholder:text-400"
            />
            <button onClick={openJoin} className="rounded-lg bg-[primary] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0369A1]">Search</button>
          </div>

          <div className="mt-4 -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:justify-center sm:px-0">
            {MOCK_CATEGORIES.map((c) => (
              <motion.button
                key={c}
                onClick={() => setCat(c)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${cat === c ? "border-slate-900 bg-slate-900 text-white" : "border-border bg-card text-700 hover:border-slate-300"}`}
              >{c}</motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {simulateZeroState ? (
          <ZeroState onClaim={openJoin} />
        ) : filtered.length === 0 ? (
          <EmptyFilter onReset={() => { setQuery(""); setCat("All"); }} />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((c) => (
                <motion.button
                  layout
                  key={c.id}
                  onClick={openJoin}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-slate-300"
                >
                  <div className={`h-24 bg-gradient-to-br ${c.banner}`} />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-600">{c.category}</span>
                      <span className="rounded-md border border-border bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">{c.tag}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-900">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-600">{c.summary}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar initials={c.avatar} tone="sky" size={24} />
                        <span className="text-xs font-medium text-700">{c.creator}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-500"><Users size={12} />{c.members.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
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
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-[primary]" /><span className="text-sm font-semibold text-900">Join SukaSpace</span></div>
                <button onClick={() => setModal(false)} className="rounded-md p-1 text-500 hover:bg-slate-100"><X size={16} /></button>
              </div>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-900">Create an account to continue</h3>
              <p className="mt-1 text-sm text-600">Sign up in seconds to join this community or launch your own space.</p>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => nav({ to: "/auth", search: { mode: "signup" } })} className="rounded-lg bg-[primary] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]">Sign up free</button>
                <button onClick={() => nav({ to: "/auth", search: { mode: "signin" } })} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-900 hover:bg-slate-50">Log in</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ZeroState({ onClaim }: { onClaim: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }} className="mx-auto grid max-w-6xl gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-5">
      <div className="p-6 sm:p-8 lg:col-span-2 lg:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-3 py-1 text-[11px] font-semibold text-600"><Sparkles size={12} className="text-[primary]" /> Day 1 · Early access</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-900">The next generation of tech communities is launching.</h2>
        <p className="mt-3 text-base text-600">Be the first expert to claim your niche. AI, LLM engineering, automation, no-code — early creators own the discovery graph as new members flood in.</p>
        <ul className="mt-5 space-y-2 text-sm text-700">
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[primary]" />Priority ranking in the Discovery feed</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[primary]" />Founding creator badge on your profile</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[primary]" />Direct feedback line with the SukaSpace team</li>
        </ul>
      </div>
      <div className="border-t border-border bg-[#F8FAFC] p-3 lg:col-span-3 lg:border-l lg:border-t-0">
        <img src={UPLOADED_MOCKUPS.discoverZeroState} alt="SukaSpace discovery search zero-state mockup" className="h-full min-h-[280px] w-full rounded-xl border border-border bg-card object-cover" />
      </div>
      <div className="flex flex-col justify-center border-t border-border bg-card p-6 lg:col-span-5 lg:p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-500">Launch</div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-900">Create the first tech space</div>
        <p className="mt-2 text-sm text-600">2-minute setup. No card required.</p>
        <motion.button
          onClick={onClaim}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-[primary] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0369A1]"
        >Create the First Tech Space</motion.button>
      </div>
    </motion.div>
  );
}

function EmptyFilter({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-500"><Search size={16} /></div>
      <h3 className="mt-3 text-base font-semibold text-900">No spaces match those filters</h3>
      <p className="mt-1 text-sm text-500">Try a different category or reset your search.</p>
      <button onClick={onReset} className="mt-4 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-900 hover:bg-slate-50">Reset</button>
    </div>
  );
}
