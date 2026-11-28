import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Layers,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Card, buttonClass } from "@/components/ui";

export const Route = createFileRoute("/become-a-teacher")({
  head: () => ({
    meta: [
      { title: "Become a teacher — The Scenes" },
      {
        name: "description",
        content:
          "Turn practical experience into a focused community, a structured classroom and live sessions on The Scenes.",
      },
    ],
  }),
  component: BecomeATeacherPage,
});

const surfaces = [
  {
    icon: BookOpen,
    title: "A structured classroom",
    body: "Organise courses into modules and lessons, attach resources and mark completion. Learning stays in sequence instead of disappearing into a feed.",
  },
  {
    icon: MessageSquareText,
    title: "A focused community",
    body: "Give learners a place to ask questions, share build logs and get feedback from people working on the same problems.",
  },
  {
    icon: CalendarDays,
    title: "Live sessions",
    body: "Schedule office hours, critiques and Q&A sessions so the room has a rhythm and learners know when to show up.",
  },
  {
    icon: Layers,
    title: "Discovery by category",
    body: "Communities sit inside clear categories, so the right learners can find you without relying only on social media.",
  },
];

const steps = [
  {
    title: "Create your creator profile",
    body: "Tell people what you actually do, where you work and what you can help them learn.",
  },
  {
    title: "Outline one useful course",
    body: "Start with a single outcome. Break it into short lessons and attach the resources people need to apply it.",
  },
  {
    title: "Open your community",
    body: "Invite your first members, pin a clear welcome post and ask one question that starts real conversation.",
  },
  {
    title: "Publish, observe, improve",
    body: "Watch what people complete and ask about, then refine the next lesson or session around that evidence.",
  },
];

const faqs = [
  {
    q: "What does early access cost me?",
    a: "Nothing. There is no plan to choose, no platform fee and no checkout. You create a creator profile, publish your work and keep the relationship with your audience — free for early access.",
  },
  {
    q: "Can I charge for my community or course?",
    a: "Not yet — and during early access you do not need to. Publish for free, build your audience and pay zero platform fees during launch. Paid plans, payouts and refunds are a later, separately approved phase, and nothing you have already published will be locked away.",
  },
  {
    q: "Do I need to host video on The Scenes?",
    a: "No. Launch resources use external links, so you can point lessons at video you already host elsewhere. Native video hosting is a separate later decision.",
  },
  {
    q: "What is available right now?",
    a: "You can explore the full product with sample data: accounts, posts, progress and the creator workspace all work in this preview. Payments, live streaming and transactional email are coming soon.",
  },
  {
    q: "Who decides what can be published?",
    a: "Every creator is responsible for their own material and for following the platform rules. Moderation and reporting tools are part of a later phase.",
  },
];

function BecomeATeacherPage() {
  return (
    <PublicShell active="/become-a-teacher">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <Badge tone="indigo">For practitioners</Badge>
            <h1 className="mt-5 max-w-2xl font-display text-4xl leading-[1.02] font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Teach what you actually do.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              The Scenes is for people with working experience, not only polished performers. Build
              a focused community, publish a clear course and host sessions around the work you
              already know how to do.
            </p>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-800">
              Publish for free, build your audience, and pay zero platform fees during launch.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/register?role=creator" className={buttonClass("primary", "lg")}>
                Start teaching free <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/dashboard/creator" className={buttonClass("secondary", "lg")}>
                Preview the workspace
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Free to publish during early
                access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Zero platform fees during launch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> You keep ownership of your
                material
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-4 w-4 text-emerald-600" /> Built for mobile-first learners
              </span>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[11px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                What a scene can hold
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                ["Classroom", "Modules, lessons and resources"],
                ["Community", "Posts, comments and member profiles"],
                ["Events", "Office hours, critiques and Q&A"],
                ["Discovery", "Category pages and public profiles"],
              ].map(([title, detail]) => (
                <div key={title} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 bg-indigo-50 px-5 py-4">
              <p className="flex items-start gap-2 text-xs leading-5 text-indigo-900">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                Publish for free during early access, with zero platform fees. Payments, payouts and
                live streaming arrive later — we will tell early creators first.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            What you can build
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Four surfaces, one clear place to teach.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {surfaces.map((surface) => {
            const Icon = surface.icon;
            return (
              <Card key={surface.title} className="p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-extrabold text-slate-900">
                  {surface.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{surface.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Start small and specific.
            </h2>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 font-mono text-xs font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
              Honest status
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900">
              What is connected, and what is not.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The Scenes is still in a frontend-first phase. We would rather tell you exactly what
              works than imply a service that does not.
            </p>
            <a href="/help#status" className={buttonClass("secondary", "md", "mt-6")}>
              Read the product status
            </a>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-slate-200 bg-white p-4 open:bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-900">
                  {faq.q}
                  <span className="text-slate-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-indigo-50">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Your experience is already the curriculum.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Start with one outcome you can help someone reach, then build the room around it.
            Publish for free during early access and pay zero platform fees during launch.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href="/register?role=creator" className={buttonClass("primary", "lg")}>
              Publish for free <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/pricing" className={buttonClass("secondary", "lg")}>
              How early access works
            </a>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
