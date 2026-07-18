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
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            The All-in-one Community Platform for Creators.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            SukaSpace brings everything creators need to build, monetize, and grow their communities in one powerful platform.
          </p>
          <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <Link to="/discover" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-bold text-white hover:bg-blue-600">
                Get Started <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <img src="/mockup-desktop.png" alt="Desktop mockup" className="w-full rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="rounded-xl border border-border bg-primary p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">SukaSpace Features</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>Multi-channel community spaces for meaningful discussions</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>Linear course tracking with XP and achievement systems</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>Live events and community gatherings</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>Creator analytics and monetization tools</span>
              </li>
            </ul>
          </div>
        </div>
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
    <section id="features" className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Empowers you to build meaningful relationships</h2>
          <p className="mt-4 text-lg text-muted-foreground">with like-minded individuals. Share experiences, offer advice, and find your community.</p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-white p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white">
                <f.icon size={18} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function CTA() {
  return (
    <section className="bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 text-center">
        <h2 className="text-4xl font-bold text-white sm:text-5xl">Join Thousands of Successful Communities</h2>
        <p className="mt-4 text-lg text-blue-100">Start building your community today and connect with your audience.</p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/auth" className="rounded-lg border border-white/20 bg-white px-8 py-3 text-base font-bold text-primary hover:bg-blue-50 flex items-center justify-center">Sign Up</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-white">S</span>
              <span className="font-bold">SukaSpace</span>
            </div>
            <p className="text-sm text-blue-100">Building communities for creators and their audiences.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/discover" className="hover:text-white">Discover</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><a href="#" className="hover:text-white">Features</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-900 mt-8 pt-8 text-center text-sm text-blue-200">
          <p>© 2026 SukaSpace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
