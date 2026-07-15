import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Users, BookOpen, BarChart3, MessagesSquare,
  CalendarDays, Trophy, Video, Radio, Zap, Star, Shield,
  Globe, ChevronRight, Sparkles, TrendingUp, Rocket,
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { MOCK_TESTIMONIALS } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SukaSpace — Community & Courses, Engineered for the AI Era" },
      { name: "description", content: "Launch premium learning communities, sell courses, and engage members on a platform that outperforms Skool and Circle — without the complexity." },
      { property: "og:title",       content: "SukaSpace — Community & Courses" },
      { property: "og:description", content: "The community + course platform built for serious creators and learners." },
    ],
  }),
  component: LandingPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_STATS = [
  { value: "2,400+",  label: "Active communities" },
  { value: "18,000+", label: "Members worldwide"  },
  { value: "95%",     label: "Retention rate"     },
  { value: "$4.2M+",  label: "Creator earnings"   },
];

const CORE_FEATURES = [
  { icon: Users,        title: "Multi-Channel Community Spaces", desc: "Channels, threads, reactions, DMs, and a global feed — everything your community needs to stay active and engaged." },
  { icon: BookOpen,     title: "Structured Course Builder",      desc: "Modules, lessons, video embeds, drip content, and progress tracking. Build courses that actually get completed." },
  { icon: BarChart3,    title: "Creator Analytics Dashboard",    desc: "MRR, retention, engagement, and member growth — tracked in real time with beautiful, actionable charts." },
  { icon: Trophy,       title: "Gamification & Leaderboards",    desc: "XP points, streak tracking, tier levels, and achievement badges that turn passive scrollers into active contributors." },
  { icon: MessagesSquare, title: "Real-Time 1-on-1 Messaging",  desc: "Direct messages between any members, plus private community chat channels with threaded replies." },
  { icon: CalendarDays, title: "Shared Events Calendar",        desc: "Schedule Q&As, cohort sessions, co-working hours, and workshops with in-app RSVP and notifications." },
  { icon: Globe,        title: "Community Discovery Engine",     desc: "Members find your space via keyword search, category filters, and trending discovery — organic reach built in." },
  { icon: Shield,       title: "Access Control & Pricing Tiers", desc: "Free, paid, and tiered membership models. Gate content by level, subscription, or course enrollment." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Launch your space in minutes", desc: "Name your community, set your niche and access model, and go live on Discover instantly. No technical setup." },
  { step: "02", title: "Build your content library",   desc: "Use the drag-and-drop course builder to create structured modules, embed videos, and drip-release content." },
  { step: "03", title: "Grow and monetize your tribe", desc: "Collect payments via Paystack, track MRR in your creator dashboard, and scale with automation tools coming soon." },
];

type CellVal = boolean | "soon";

const COMPARISON_FEATURES: { label: string; suka: CellVal; skool: CellVal; circle: CellVal }[] = [
  { label: "Community feed & channels",        suka: true,  skool: true,  circle: true  },
  { label: "Course builder with modules",       suka: true,  skool: true,  circle: true  },
  { label: "Leaderboards & gamification",       suka: true,  skool: true,  circle: true  },
  { label: "Direct messaging (DMs)",            suka: true,  skool: false, circle: true  },
  { label: "1-click Paystack/Flutterwave",      suka: true,  skool: false, circle: false },
  { label: "Built-in XP & tier progression",   suka: true,  skool: true,  circle: false },
  { label: "Affiliate program",                 suka: "soon", skool: true, circle: false },
  { label: "Native live streaming",             suka: "soon", skool: false, circle: true  },
  { label: "Workflow automations",              suka: "soon", skool: false, circle: true  },
  { label: "0% platform fees (first year)",     suka: true,  skool: false, circle: false },
];

const COMING_SOON_FEATURES = [
  { icon: Video,  title: "Native Video Hosting",   desc: "Upload and host your course videos directly — no YouTube or Vimeo dependency." },
  { icon: Radio,  title: "Live Streaming & Rooms", desc: "Webinars, Q&A sessions, and interactive co-working rooms up to 500 participants." },
  { icon: Zap,    title: "Workflow Automations",   desc: "Auto-DMs, CRM sync, Zapier/Make webhooks, and drip notification sequences." },
];

function CheckCell({ val }: { val: boolean | "soon" }) {
  if (val === true)   return <td className="py-3 px-4 text-center"><span className="inline-grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={11} /></span></td>;
  if (val === "soon") return <td className="py-3 px-4 text-center"><span className="inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">SOON</span></td>;
  return <td className="py-3 px-4 text-center"><span className="text-slate-300 text-sm">—</span></td>;
}

// ─── Landing page ─────────────────────────────────────────────────────────────

function LandingPage() {
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <PublicHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F8FAFC] pt-20 pb-16 sm:pt-28 sm:pb-20">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 24 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={11} /> The future of community-led learning
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07, type: "spring", stiffness: 180, damping: 22 }}
            className="mt-5 text-4xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-5xl md:text-6xl lg:text-[4rem]"
          >
            Community and courses,
            <br />
            <span className="text-primary">engineered for the AI era.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, type: "spring", stiffness: 180, damping: 24 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            SukaSpace fuses the depth of Circle with the simplicity of Skool — and outperforms both.
            Launch in minutes, monetize with Paystack, and keep 100% of your audience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21, type: "spring", stiffness: 180, damping: 24 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5"
            >
              Explore Communities <ArrowRight size={15} />
            </Link>
            <Link
              to="/create-community"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              <Rocket size={15} /> Create a Community
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="mt-4 text-xs text-slate-500"
          >
            No card required · Live in under 3 minutes · 0% platform fees for 12 months
          </motion.p>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {["Community Spaces", "Course Builder", "Gamification", "Paystack Payments", "Creator Analytics", "DMs & Chat"].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />{f}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PLATFORM_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="text-center"
              >
                <div className="text-2xl font-extrabold tracking-tight text-[#0F0F0F] sm:text-3xl">{s.value}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Features ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-4xl">
            Everything your community needs. Nothing it doesn't.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            One platform. Every tool for creators to build, teach, and monetize — and for learners to grow, connect, and advance.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 26 }}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-sm font-semibold leading-tight text-[#0F0F0F]">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-4xl">Up and running in minutes</h2>
            <p className="mt-3 text-base text-slate-600">No engineers. No migration headache. No configuration nightmares.</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 26 }}
                className="relative"
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute top-5 left-full hidden w-8 border-t-2 border-dashed border-slate-200 sm:block" />
                )}
                <div className="text-4xl font-black text-slate-100">{s.step}</div>
                <h3 className="mt-2 text-base font-semibold text-[#0F0F0F]">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-4xl">
            Better than Skool. More accessible than Circle.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            We took the best of both — and fixed what frustrated everyone.
          </p>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Feature</th>
                <th className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white">
                    <Sparkles size={10} /> SukaSpace
                  </span>
                </th>
                <th className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500">Skool</th>
                <th className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500">Circle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON_FEATURES.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-slate-700">{row.label}</td>
                  <CheckCell val={row.suka} />
                  <CheckCell val={row.skool} />
                  <CheckCell val={row.circle} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          "Soon" features are in active development. You'll receive an in-app notification when they launch.
        </p>
      </section>

      {/* ── Coming Soon strip ── */}
      <section className="border-y border-slate-200 bg-gradient-to-r from-primary/5 via-background to-primary/5 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary">
              <TrendingUp size={10} /> On the roadmap
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-3xl">
              We're building things Skool and Circle can't match.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {COMING_SOON_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={16} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0F0F0F]">{f.title}</span>
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">SOON</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-4xl">Creators love the switch</h2>
          <p className="mt-2 text-base text-slate-600">Real feedback from people who've tried both sides.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {MOCK_TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, si) => <Star key={si} size={12} fill="currentColor" />)}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.body}&rdquo;</p>
              <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#0F0F0F] sm:text-4xl">Honest, simple pricing</h2>
          <p className="mt-3 text-base text-slate-600">
            Start free. Scale as you grow. No hidden transaction fees, no per-member gotchas.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { name: "Creator Free",  price: "$0/mo",   desc: "1 community, unlimited members, full course builder.",   cta: "Start for free",    primary: false },
              { name: "Creator Pro",   price: "$29/mo",  desc: "Unlimited communities, advanced analytics, priority support.", cta: "Start free trial",  primary: true  },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-6 text-left ${p.primary ? "border-primary bg-primary text-white shadow-lg" : "border-slate-200 bg-slate-50"}`}
              >
                <div className={`text-xs font-bold uppercase tracking-wider ${p.primary ? "text-white/70" : "text-slate-500"}`}>{p.name}</div>
                <div className={`mt-2 text-3xl font-extrabold ${p.primary ? "text-white" : "text-slate-900"}`}>{p.price}</div>
                <p className={`mt-2 text-sm ${p.primary ? "text-white/80" : "text-slate-600"}`}>{p.desc}</p>
                <Link
                  to="/pricing"
                  className={`mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${p.primary ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:bg-primary/90"}`}
                >
                  {p.cta} <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
            View full pricing →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:36px_36px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold tracking-tighter text-white sm:text-4xl"
          >
            Your community is waiting. Launch it today.
          </motion.h2>
          <p className="mt-4 text-base text-white/80">
            Join 2,400+ communities already growing on SukaSpace. Setup takes 3 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/create-community"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-sm hover:bg-white/90 transition-all hover:-translate-y-0.5"
            >
              <Rocket size={15} /> Create a Community — It's Free
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-all"
            >
              Browse Communities <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-base font-extrabold text-[#0F0F0F]">SukaSpace</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Community and courses, engineered for the AI era.</p>
            </div>
            {[
              { heading: "Product",  links: [{ label: "Discover",      href: "/discover"          }, { label: "Pricing",         href: "/pricing"  }, { label: "For Learners", href: "/learners" }, { label: "For Creators", href: "/creators" }] },
              { heading: "Platform", links: [{ label: "Create Community", href: "/create-community" }, { label: "Sign up",         href: "/auth?mode=signup" }, { label: "Log in",       href: "/auth?mode=signin" }] },
              { heading: "Company",  links: [{ label: "About",          href: "/about"             }, { label: "Feedback",        href: "#feedback" }] },
            ].map((col) => (
              <div key={col.heading}>
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{col.heading}</div>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-slate-600 hover:text-primary transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500">© 2026 SukaSpace. All rights reserved.</p>
            <p className="text-xs text-slate-500">
              Payments powered by <span className="font-semibold">Paystack</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
