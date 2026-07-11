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
      <HeroMockup />
      <LearnersMockup />
      <ChannelsMockup />
      <CreatorMockup />
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
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Every SukaSpace screen, shipped as a production asset.</h2>
          <p className="mt-3 text-base font-medium text-muted-foreground">All {MOCKUP_GALLERY.length} uploaded human-designed mockups are permanently hosted and wired into the matching product route.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCKUP_GALLERY.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => setZoomed(card)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-border/80"
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles size={12} className="text-primary" /> Now onboarding AI, engineering & tech creators
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Community <span className="text-primary">and</span> courses,<br className="hidden sm:block" /> engineered for the AI era.
          </h1>
          <p className="mt-5 text-lg font-medium text-muted-foreground">
            SukaSpace fuses linear course tracking with rich multi-channel spaces so experts can teach, monetize, and build a real community — without the tech friction.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <Link to="/discover" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                Explore Communities <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          <Link to="/create-community" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-accent">
                Create a Community
              </Link>
            </motion.div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> No card required</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> Launch in minutes</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> Own your audience</span>
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">One platform. Community + courses.</h2>
          <p className="mt-3 text-lg font-medium text-muted-foreground">The rigor of Skool. The channel depth of Circle. The polish of a Linear-grade utility.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-primary-foreground">
                <f.icon size={16} />
              </div>
              <div className="mt-4 text-base font-semibold text-foreground">{f.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- MOCKUP: Hero — Workspace triple-column ---------- */
function HeroMockup() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">The workspace</div>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">A high-density command center for your community.</h3>
        </div>
        <BrowserFrame url="app.sukaspace.com/community/ai-automation-architects/channels/ai-automation-engineering">
          <div className="grid grid-cols-12 min-h-[520px]">
            {/* Left rail */}
            <div className="col-span-3 border-r border-border bg-card p-3">
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-accent p-2">
                <Avatar initials="AI" tone="sky" size={28} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground">AI Automation Architects</div>
                  <div className="text-[10px] text-muted-foreground">4,820 members</div>
                </div>
              </div>
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</div>
              <ul className="space-y-0.5">
                {MOCK_CHANNELS.map((c) => (
                  <li key={c.id} className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${c.active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}>
                    <span className="flex items-center gap-1.5 truncate"><Hash size={12} />{c.name}</span>
                    {c.unread ? <span className="ml-2 rounded-full bg-slate-900 px-1.5 text-[9px] font-semibold text-white">{c.unread}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
            {/* Center feed */}
            <div className="col-span-6 border-r border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">#ai-automation-engineering</div>
                <div className="text-[11px] text-muted-foreground">312 posts · 48 online</div>
              </div>
              <div className="space-y-3">
                {MOCK_COMMUNITY_POSTS.map((p) => (
                  <article key={p.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar initials={p.avatar} tone="slate" size={28} />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-foreground">{p.author} <span className="font-normal text-muted-foreground">· {p.role}</span></div>
                        <div className="text-[10px] text-muted-foreground">{p.category} · 2h</div>
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.body}</p>
                    <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span>❤ {p.likes}</span><span>💬 {p.comments}</span><span>↗ Share</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            {/* Right rail */}
            <div className="col-span-3 bg-card p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Online now · {MOCK_ONLINE.length}</div>
              <ul className="space-y-1.5">
                {MOCK_ONLINE.slice(0, 7).map((u) => (
                  <li key={u.name} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent">
                    <div className="relative">
                      <Avatar initials={u.avatar} tone={u.status === "leader" ? "sky" : "slate"} size={26} />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-accent0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-foreground">{u.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{u.role}</div>
                    </div>
                    {u.status === "leader" && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">LEAD</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}

/* ---------- MOCKUP: Learners — Classroom ---------- */
function LearnersMockup() {
  return (
    <section id="learners" className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">For learners</div>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Structured tracks, gamified progress, real skills.</h3>
          <p className="mt-3 text-base text-muted-foreground">Track modules, streaks, and XP. Ship real projects and get feedback from peers who are actually operating in the field.</p>
          <ul className="mt-5 space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-success" />Linear module hierarchy with progress meters</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-success" />XP, level badges, and daily streak tracking</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-success" />Embedded video, resources, and code snippets</li>
          </ul>
        </div>
        <BrowserFrame url="app.sukaspace.com/classroom/llm-operations">
          <div className="grid grid-cols-12 min-h-[420px]">
            <div className="col-span-4 border-r border-border bg-card p-3">
              <div className="mb-3 rounded-lg border border-border bg-background p-2.5">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">Your progress</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">1,240</span>
                  <span className="text-xs font-medium text-muted-foreground">XP · Lvl 7</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: "62%" }} />
                </div>
              </div>
              {MOCK_CLASSROOM_MODULES.map((m) => (
                <div key={m.id} className="mb-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[11px] font-semibold text-foreground">{m.name}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground">{m.progress}%</div>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-slate-100">
                    <div className="h-1 rounded-full bg-accent0" style={{ width: `${m.progress}%` }} />
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {m.lessons.map((l) => (
                      <li key={l.title} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px]">
                        {l.status === "complete" && <CheckCircle2 size={12} className="text-success" />}
                        {l.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-primary" />}
                        {l.status === "locked" && <span className="h-2 w-2 rounded-full bg-border" />}
                        <span className={l.status === "locked" ? "text-muted-foreground" : "text-foreground"}>{l.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="col-span-8 bg-background p-4">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Lesson 2.1</div>
              <h4 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">State Management in Agentic Frameworks</h4>
              <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-border bg-slate-900">
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-card/90 shadow-lg">
                    <PlayCircle size={30} className="text-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">18:42</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-left text-xs hover:bg-accent">
                  <Download size={14} className="text-primary" />
                  <div><div className="font-semibold text-foreground">agent-graph.py</div><div className="text-[10px] text-muted-foreground">2.4 KB</div></div>
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-left text-xs hover:bg-accent">
                  <Download size={14} className="text-primary" />
                  <div><div className="font-semibold text-foreground">state-schema.pdf</div><div className="text-[10px] text-muted-foreground">318 KB</div></div>
                </button>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-semibold text-success">
                +50 XP · Lesson in progress
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}

/* ---------- MOCKUP: Channels + DMs ---------- */
function ChannelsMockup() {
  return (
    <section id="creators" className="border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1 grid grid-cols-5 gap-4">
          {/* Desktop channel mockup */}
          <BrowserFrame url="channels" className="col-span-5 md:col-span-3">
            <div className="p-3 min-h-[380px]">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Spaces</div>
              {["#announcements", "#wins", "#q-and-a", "#general-chat", "#job-board"].map((n, i) => (
                <div key={n} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent">
                  <span className="flex items-center gap-1.5"><Hash size={12} />{n.slice(1)}</span>
                  {i % 2 === 0 && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
              ))}
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <Avatar initials="ER" tone="sky" size={26} />
                  <div className="min-w-0"><div className="text-xs font-semibold text-foreground">Elena Rostova</div><div className="text-[10px] text-muted-foreground">#announcements · 5m</div></div>
                </div>
                <p className="mt-2 text-xs text-foreground">Next masterclass drops Thursday 3pm ET — RSVP inside.</p>
              </div>
            </div>
          </BrowserFrame>
          {/* Mobile DM mockup */}
          <BrowserFrame url="dm/david" className="col-span-5 md:col-span-2">
            <div className="min-h-[380px] flex flex-col">
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Avatar initials="DC" tone="slate" size={28} />
                <div className="min-w-0"><div className="text-xs font-semibold text-foreground">David Chen</div><div className="text-[10px] text-success">Online</div></div>
              </div>
              <div className="flex-1 space-y-2 p-3">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs text-foreground">Realtime listener works. Zero latency.</div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-white">Amazing. Ship it.</div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <span className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" /></span>
                </div>
              </div>
              <div className="border-t border-border p-2 flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-accent px-2 py-1.5 text-[11px] text-muted-foreground">Type a message…</div>
                <button className="rounded-lg bg-primary px-2 py-1.5 text-[11px] font-semibold text-white">Send</button>
              </div>
            </div>
          </BrowserFrame>
        </div>
        <div className="order-1 lg:order-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">For creators</div>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Channels, threads, and private DMs — one clean shell.</h3>
          <p className="mt-3 text-base text-muted-foreground">Run announcements, wins, and Q&A channels alongside 1-on-1 mentor DMs. Everything runs on realtime with a Linear-grade utility feel.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[{ k: "48ms", v: "avg realtime latency" }, { k: "12+", v: "topic channels per space" }, { k: "∞", v: "threads & polls" }, { k: "1:1", v: "private mentor DMs" }].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-card p-4">
                <div className="text-2xl font-bold text-foreground">{s.k}</div>
                <div className="text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- MOCKUP: Creator Console ---------- */
function CreatorMockup() {
  const max = Math.max(...MOCK_GROWTH_SERIES);
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Creator console</div>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Own the metrics that grow your empire.</h3>
        </div>
        <BrowserFrame url="app.sukaspace.com/creator">
          <div className="grid grid-cols-12 min-h-[380px]">
            <div className="col-span-12 border-b border-border p-4 md:col-span-8 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-foreground">Member growth · last 12 weeks</h4>
                <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-success">{MOCK_ANALYTICS.growthPercentage}</span>
              </div>
              <div className="flex h-40 items-end gap-1.5 rounded-lg border border-border bg-background p-3">
                {MOCK_GROWTH_SERIES.map((v, i) => (
                  <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${(v / max) * 100}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { k: "MRR", v: MOCK_ANALYTICS.mrr },
                  { k: "Active members", v: MOCK_ANALYTICS.activeMembers },
                  { k: "Completion", v: MOCK_ANALYTICS.courseCompletionRate },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">{s.k}</div>
                    <div className="mt-0.5 text-xl font-bold text-foreground">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 p-4 md:col-span-4">
              <h4 className="text-sm font-semibold text-foreground">Discovery visibility</h4>
              <div className="mt-2 space-y-2">
                {[{ k: "AI & Automation", on: true }, { k: "Software Engineering", on: true }, { k: "No-Code Tech", on: false }, { k: "Digital Business", on: true }].map((c) => (
                  <div key={c.k} className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                    <span className="text-xs font-medium text-foreground">{c.k}</span>
                    <span className={`h-4 w-8 rounded-full ${c.on ? "bg-primary" : "bg-slate-200"} relative transition`}>
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-card transition ${c.on ? "left-4" : "left-0.5"}`} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">Recent DMs</div>
                <ul className="mt-1 space-y-1.5">
                  {MOCK_DIRECT_MESSAGES.slice(0, 3).map((d) => (
                    <li key={d.id} className="flex items-start gap-2">
                      <Avatar initials={d.avatar} tone="slate" size={22} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1"><span className="truncate text-[11px] font-semibold text-foreground">{d.sender}</span>{d.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{d.text}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Claim your niche before someone else does.</h2>
        <p className="mt-3 text-base text-border">Launch your community + course in a single afternoon. Free while we're in early access.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/discover" className="rounded-xl border border-white/20 bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-card/20">Explore Communities</Link>
          <Link to="/create-community" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#0369A1]">Create a Community <ChevronRight className="inline" size={14} /></Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-[10px] font-bold text-white">S</span>
          <span>© 2026 SukaSpace — Community + Courses for the AI era.</span>
        </div>
        <div className="flex gap-5 text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/discover" className="hover:text-foreground">Discover</Link>
        </div>
      </div>
    </footer>
  );
}
