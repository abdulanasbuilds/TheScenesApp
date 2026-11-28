import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Megaphone,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Card, buttonClass } from "@/components/ui";
import { EARLY_ACCESS } from "@/lib/early-access";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Free during Early Access — The Scenes" }] }),
  component: EarlyAccessPage,
});

const freeSurfaces = [
  {
    icon: GraduationCap,
    title: "Learn for free",
    body: "Every course, lesson and resource is open. Enrol in one click, pick up where you left off and keep your progress.",
  },
  {
    icon: BookOpen,
    title: "Teach for free",
    body: "Publish a classroom, open a community, host a session. No plan to choose and no fee to unlock your own work.",
  },
  {
    icon: Compass,
    title: "Grow for free",
    body: "Use discovery, search and your public creator page to reach people who care about the same craft — not just followers.",
  },
];

const promises = [
  "No plans to compare.",
  "No platform fees during launch.",
  "No checkout between you and the first lesson.",
];

const faqs = [
  [
    "Is this a free trial?",
    "It is not a countdown and it is not a teaser. The Scenes is free for early members while we build the platform. When paid plans are introduced later, existing early members will hear about it first and nothing you have created will be locked away.",
  ],
  [
    "Do I need a card to join, learn or teach?",
    "No. There is no payment method, no checkout and no card form anywhere in The Scenes today. You create an account and start.",
  ],
  [
    "Can creators charge for their work?",
    "Not yet — and that is deliberate. During early access every creator publishes for free and keeps the full relationship with their audience. Payments, payouts and paid plans are a later, separately approved phase.",
  ],
  [
    "Are there platform fees?",
    "Zero during launch. Because no payment can be processed yet, there is nothing to take a percentage of. The future commercial model is documented separately and will be announced before it applies to anyone.",
  ],
  [
    "What stays free if plans arrive later?",
    "Your account, your published material and the communities you have joined. Paid tiers, when they come, are intended to add capacity for creators who are already earning — never to remove what early members already have.",
  ],
];

function EarlyAccessPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <PublicShell active="/pricing">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <Badge tone="green">
            <Sparkles className="h-3 w-3" /> Free for Early Access
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-balance text-slate-950 sm:text-5xl">
            {EARLY_ACCESS.manifestoHeadline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {EARLY_ACCESS.manifestoBody}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/register" className={buttonClass("primary", "lg")}>
              Create your free account <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/become-a-teacher" className={buttonClass("secondary", "lg")}>
              Publish as a creator
            </a>
          </div>
          <p className="mt-5 text-xs font-semibold text-slate-500">
            No card. No plan. No checkout.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            What free covers today
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900">
            The whole product, not a sample of it.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Early access means early influence. Use the same surfaces that will run the platform
            later, and tell us what to build next.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {freeSurfaces.map((surface) => {
            const Icon = surface.icon;
            return (
              <Card key={surface.title} className="p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
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

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <Badge className="bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/30">
              <HeartHandshake className="h-3 w-3" /> The early-access promise
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
              Build the audience before the invoice.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
              We would rather earn trust with a working product than with a pricing table. So for
              now, the only thing we ask you to bring is your work.
            </p>
          </div>
          <ul className="grid gap-3">
            {promises.map((promise) => (
              <li
                key={promise}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200">
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {promise}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            Plain answers
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">
            Questions about free access
          </h2>
        </div>
        <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {faqs.map(([question, answer], index) => (
            <div key={question}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
                aria-expanded={openFaq === index}
              >
                <HelpCircle className="h-4 w-4 shrink-0 text-indigo-700" />
                <span className="flex-1 text-sm font-bold text-slate-900">{question}</span>
                <Plus
                  className={cn(
                    "h-4 w-4 text-slate-400 transition-transform",
                    openFaq === index && "rotate-45",
                  )}
                />
              </button>
              {openFaq === index ? (
                <p className="px-5 pb-5 pl-12 text-sm leading-6 text-slate-600">{answer}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-indigo-50">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <Megaphone className="mx-auto h-6 w-6 text-indigo-700" aria-hidden="true" />
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900">
            Be early. Help shape what comes next.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {EARLY_ACCESS.creatorPromise}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href="/register?role=creator" className={buttonClass("primary", "lg")}>
              Start teaching free <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/explore" className={buttonClass("secondary", "lg")}>
              Join free communities
            </a>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
