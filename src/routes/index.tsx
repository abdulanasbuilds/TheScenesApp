import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Sparkles, Users, GraduationCap, MessagesSquare, BarChart3, CheckCircle2, Hash, ChevronRight, PlayCircle, Download } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { BrowserFrame, Avatar } from "@/components/BrowserFrame";
import { MOCK_COMMUNITY_POSTS, MOCK_CHANNELS, MOCK_ONLINE, MOCK_CLASSROOM_MODULES, MOCK_DIRECT_MESSAGES, MOCK_ANALYTICS, MOCK_GROWTH_SERIES } from "@/lib/mock-data";
import { MOCKUP_GALLERY, UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SukaSpace — Community + Courses for the AI Era" },
      { name: "description", content: "Launch a premium learning community with linear course tracking and rich multi-channel discussions. Built for AI, engineering, and tech creators." },
      { property: "og:title", content: "SukaSpace — Community + Courses for the AI Era" },
      { property: "og:description", content: "Community meets courses. Ship your knowledge empire with SukaSpace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <PublicHeader />
      <Hero />
      <FeatureMatrix />
      <UploadedMockupGallery />
      <CTA />
      <Footer />
    </div>
  );
}

function UploadedMockupGallery() {
  const [zoomed, setZoomed] = useState<(typeof MOCKUP_GALLERY)[number] | null>(null);
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Live workspace previews</div>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-tighter text-[#151515] sm:text-4xl">Every SukaSpace screen, shipped as a production asset.</h2>
          <p className="mt-2 text-base font-medium text-muted-foreground">All {MOCKUP_GALLERY.length} uploaded human-designed mockups are permanently hosted and wired into the matching product route.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCKUP_GALLERY.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => setZoomed(card)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="overflow-hidden rounded-xl border border-neutral-100 bg-card text-left hover:border-neutral-200"
            >
              <img src={card.src} alt={`SukaSpace ${card.label} mockup`} loading="lazy" className="aspect-[5/4] w-full border-b border-border object-cover" />
              <div className="p-4">
                <h3 className="text-base font-semibold text-foreground">{card.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.caption}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {zoomed && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-accent p-4 backdrop-blur-sm md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomed(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0"><div className="truncate text-sm font-semibold text-foreground">{zoomed.label}</div><div className="truncate text-xs text-muted-foreground">{zoomed.caption}</div></div>
                <button onClick={() => setZoomed(null)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">Close</button>
              </div>
              <div className="max-h-[78vh] overflow-auto bg-background p-2">
                <img src={zoomed.src} alt={`SukaSpace ${zoomed.label} mockup zoomed`} className="mx-auto w-full max-w-[1600px] rounded-lg border border-border bg-card" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles size={12} className="text-primary" /> Now onboarding AI, engineering & tech creators
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tighter text-[#151515] sm:text-6xl">
            Community <span className="text-primary">and</span> courses,<br className="hidden sm:block" /> engineered for the AI era.
          </h1>
          <p className="mt-3 text-base font-medium text-muted-foreground">
            SukaSpace fuses linear course tracking with rich multi-channel spaces so experts can teach, monetize, and build a real community — without the tech friction.
          </p>
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="w-full sm:w-auto">
              <Link to="/discover" className="flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-2.5 text-base font-extrabold text-white border border-transparent hover:bg-primary/85 w-full h-12">
                Explore Communities <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="w-full sm:w-auto">
          <Link to="/create-community" className="flex items-center justify-center gap-2 rounded-3xl border border-gray-300 bg-card px-6 py-2.5 text-base font-extrabold text-foreground hover:bg-gray-50 w-full h-12">
                Create a Community
              </Link>
            </motion.div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary" /> No card required</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary" /> Launch in minutes</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary" /> Own your audience</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: MessagesSquare, title: "Multi-channel spaces", body: "Circle-style topic channels with threads, polls, and live activity." },
  { icon: GraduationCap, title: "Linear course tracking", body: "Skool-style module hierarchy with XP, streaks, and progress meters." },
  { icon: Users, title: "1-on-1 private DMs", body: "Real-time inbox with typing indicators and unread state." },
  { icon: BarChart3, title: "Creator analytics", body: "MRR, retention, and discovery visibility signals baked in." },
];

function FeatureMatrix() {
  return (
    <section id="features" className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tighter text-foreground sm:text-4xl">One platform. Community + courses.</h2>
          <p className="mt-1.5 text-base font-medium text-muted-foreground">The rigor of Skool. The channel depth of Circle. The polish of a Linear-grade utility.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-100 bg-card p-5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-primary-foreground">
                <f.icon size={16} />
              </div>
              <div className="mt-3 text-base font-extrabold tracking-tighter text-foreground">{f.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function CTA() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
        <h2 className="text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">Claim your niche before someone else does.</h2>
        <p className="mt-2.5 text-base text-neutral-300">Launch your community + course in a single afternoon. Free while we're in early access.</p>
        <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link to="/discover" className="rounded-3xl border border-white/30 bg-white px-6 py-2.5 text-base font-extrabold text-slate-900 hover:bg-white/85 w-full sm:w-auto h-12 flex items-center justify-center">Explore Communities</Link>
          <Link to="/create-community" className="rounded-3xl bg-primary px-6 py-2.5 text-base font-extrabold text-white hover:bg-primary/85 border border-transparent w-full sm:w-auto h-12 flex items-center justify-center gap-2">Create a Community <ChevronRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2.5 px-4 py-6 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-[10px] font-bold text-white">S</span>
          <span>© 2026 SukaSpace — Community + Courses for the AI era.</span>
        </div>
        <div className="flex gap-5 text-xs font-medium text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/discover" className="hover:text-foreground">Discover</Link>
        </div>
      </div>
    </footer>
  );
}
