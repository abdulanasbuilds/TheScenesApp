import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Compass,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Button, Card, Chip, EmptyState, buttonClass } from "@/components/ui";
import { FeedbackForm } from "@/features/feedback/feedback-form";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help centre — The Scenes" },
      {
        name: "description",
        content:
          "Answers about accounts, communities, courses, creator tools and what is connected in the current preview.",
      },
    ],
  }),
  component: HelpPage,
});

const faqCategories = [
  "All topics",
  "Getting started",
  "Communities & posts",
  "Courses & learning",
  "Creators & commerce",
  "Account & privacy",
] as const;

type FaqCategory = (typeof faqCategories)[number];

const faqs: { category: Exclude<FaqCategory, "All topics">; question: string; answer: string }[] = [
  {
    category: "Getting started",
    question: "Do I need an account to explore The Scenes?",
    answer:
      "No. The landing page, discovery, public community pages, creator profiles, marketplace and pricing are all browsable without signing in. Member actions such as joining, posting, saving or confirming an event use a local demo session.",
  },
  {
    category: "Getting started",
    question: "How does sign-in work in this preview?",
    answer:
      "Sign-in is simulated in the browser. Any valid-looking email and password opens a demo session for Ama Boateng. No server account is created, no password is stored and no verification email is sent.",
  },
  {
    category: "Getting started",
    question: "Why do some changes disappear after a reload?",
    answer:
      "Most state lives in browser memory for the current session: joins, likes, comments, progress, RSVPs, saved items and creator-workspace edits. Post drafts use session storage and can survive a reload in the same tab. Nothing is synced to a backend.",
  },
  {
    category: "Communities & posts",
    question: "Can I join a community?",
    answer:
      "Yes. Joining and leaving update the local member state and unlock the community feed view. Billing, access control and server membership records are not connected, so no payment or permanent membership is created.",
  },
  {
    category: "Communities & posts",
    question: "What happens when I publish a post?",
    answer:
      "The post is added to local state and appears in the community feed for this session. It is not moderated, indexed, emailed or stored on a server. Comments and likes behave the same way.",
  },
  {
    category: "Communities & posts",
    question: "Are the community members real?",
    answer:
      "No. The directory, posts, points, badges and presence indicators are deterministic sample data used to test the interface. Do not treat profiles or activity as real people or real endorsements.",
  },
  {
    category: "Courses & learning",
    question: "How is course progress calculated?",
    answer:
      "Each course is made of modules and lessons. Completing a lesson adds it to local state, and progress is the share of lessons completed. The next incomplete lesson becomes the continue target. Reloading the page resets progress to the seeded starting point.",
  },
  {
    category: "Courses & learning",
    question: "Are the courses real curriculum?",
    answer:
      "The lessons are realistic sample content written for the preview. They demonstrate structure, sequencing, lesson types and resources. They are not a substitute for a production course, and no certificate is issued.",
  },
  {
    category: "Courses & learning",
    question: "What is the leaderboard based on?",
    answer:
      "The leaderboard uses fixture points and levels. Ranking policy, privacy controls and anti-gaming rules are unresolved, so the community setting that would enable a public leaderboard is off by default.",
  },
  {
    category: "Creators & commerce",
    question: "How do I become a teacher or creator?",
    answer:
      "The creator workspace is available as a full frontend preview from the member header. A production creator application, identity verification, revenue share and payout setup do not exist yet.",
  },
  {
    category: "Creators & commerce",
    question: "Can I buy a resource in the marketplace?",
    answer:
      "You can complete a simulated checkout. It records a local purchase state and nothing else: no card is collected, no money moves, no receipt is emailed and no file is delivered.",
  },
  {
    category: "Creators & commerce",
    question: "Are the prices final?",
    answer:
      "Community prices shown in the fixture catalogue are sample values. The approved platform monthly direction is Pro at $19 / GH₵300 and Pro Plus at $39 / GH₵620. Pro and Pro Plus have a 3% platform fee; Free has a 7% platform fee. No charge can occur in this preview because payments remain on hold.",
  },
  {
    category: "Account & privacy",
    question: "Who can see my profile?",
    answer:
      "The settings screen exposes the intended privacy controls, but they are local preferences only. There is no server-side authorization, database policy or real audience yet, so do not enter sensitive personal information.",
  },
  {
    category: "Account & privacy",
    question: "Is my data stored anywhere?",
    answer:
      "This preview does not send account data to a backend. Form values and local state stay in the browser tab. A production build will need a documented data model, retention policy and access controls before real personal data is collected.",
  },
];

const statusRows = [
  {
    service: "Public pages and discovery",
    status: "Available",
    tone: "green" as const,
    detail: "Fixture catalogue with search, filters and sorting.",
  },
  {
    service: "Member feed, posts and comments",
    status: "Local preview",
    tone: "amber" as const,
    detail: "Changes live in browser memory for the session.",
  },
  {
    service: "Course progress and RSVPs",
    status: "Local preview",
    tone: "amber" as const,
    detail: "No learner record is persisted to a server.",
  },
  {
    service: "Creator workspace",
    status: "Local preview",
    tone: "amber" as const,
    detail: "Settings, curriculum and event edits reset on reload.",
  },
  {
    service: "Accounts and sign-in",
    status: "Simulated",
    tone: "amber" as const,
    detail: "Demo session only. No credential is stored.",
  },
  {
    service: "Marketplace checkout",
    status: "Simulated",
    tone: "amber" as const,
    detail: "No card, payment, receipt or file delivery.",
  },
  {
    service: "Payments, payouts and refunds",
    status: "Not connected",
    tone: "slate" as const,
    detail: "Requires a payment provider, KYC and settlement rules.",
  },
  {
    service: "Email and browser push",
    status: "Not connected",
    tone: "slate" as const,
    detail: "No transactional email or push permission request.",
  },
  {
    service: "File storage and downloads",
    status: "Not connected",
    tone: "slate" as const,
    detail: "No uploads, private files or delivery links.",
  },
  {
    service: "Video hosting and live rooms",
    status: "Not connected",
    tone: "slate" as const,
    detail: "Lesson video and live sessions are placeholders.",
  },
];

function HelpPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory>("All topics");
  const currentRoute = useRouterState({
    // `href` is the origin-less path (pathname + search + hash), which is exactly the safe internal
    // route the feedback schema accepts. `search` is an object and would stringify as "[object Object]".
    select: (state) => state.location.href,
  });

  const visibleFaqs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const categoryMatch = category === "All topics" || faq.category === category;
      const queryMatch =
        !normalized ||
        `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  return (
    <PublicShell active="/help">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Badge tone="clay">
            <CircleHelp className="h-3 w-3" /> Help centre
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            What do you need to know?
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Answers about the product, the current frontend preview and what is deliberately not
            connected yet. If an action is simulated, it says so here.
          </p>

          <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/15">
            <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
            <label htmlFor="help-search" className="sr-only">
              Search the help centre
            </label>
            <input
              id="help-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search accounts, courses, payments or privacy"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full px-3 text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {faqCategories.map((item) => (
              <Chip key={item} active={category === item} onClick={() => setCategory(item)}>
                {item}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Compass, label: "Start exploring", href: "/explore", note: "Find a community" },
            {
              icon: BookOpen,
              label: "Open my learning",
              href: "/my-learning",
              note: "Continue a course",
            },
            {
              icon: Sparkles,
              label: "Creator workspace",
              href: "/dashboard/creator",
              note: "See the tools",
            },
            {
              icon: ShieldCheck,
              label: "Service status",
              href: "#status",
              note: "What is connected",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300"
              >
                <Icon className="h-5 w-5 text-indigo-700" />
                <p className="mt-2 text-sm font-bold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.note}</p>
                <ArrowRight className="mt-3 h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-700" />
              </a>
            );
          })}
        </div>

        <section id="faq" className="mt-8 scroll-mt-24" aria-labelledby="faq-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="faq-heading"
                className="font-display text-2xl font-extrabold tracking-tight text-slate-900"
              >
                Common questions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {visibleFaqs.length} {visibleFaqs.length === 1 ? "answer" : "answers"} in this view
              </p>
            </div>
            <a href="#status" className="text-xs font-bold text-indigo-700">
              Jump to service status
            </a>
          </div>

          {visibleFaqs.length ? (
            <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {visibleFaqs.map((faq, index) => (
                <details
                  key={`${faq.category}-${faq.question}`}
                  className="group"
                  open={index === 0 && !query && category === "All topics"}
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                    <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-500 uppercase">
                      {faq.category}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 pl-[8.4rem]">
                    <p className="text-sm leading-7 text-slate-600">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<CircleHelp className="h-5 w-5" />}
              title="No answers match that search"
              description="Try a broader term, or clear the topic filter."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setCategory("All topics");
                  }}
                >
                  Reset search
                </Button>
              }
            />
          )}
        </section>

        <section id="status" className="mt-10 scroll-mt-24" aria-labelledby="status-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Honest status
              </p>
              <h2
                id="status-heading"
                className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900"
              >
                What is connected right now
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                This build is a frontend preview. The table below is the boundary between working
                interface behaviour and services that still need a backend.
              </p>
            </div>
            <Badge tone="amber">
              <TriangleAlert className="h-3 w-3" /> No production services
            </Badge>
          </div>

          <Card className="mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Service
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statusRows.map((row) => (
                    <tr key={row.service} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.service}</td>
                      <td className="px-4 py-3">
                        <Badge tone={row.tone}>{row.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs leading-5 text-slate-600">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="mt-10" aria-labelledby="contact-heading">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-700" />
                <h2
                  id="contact-heading"
                  className="font-display text-xl font-extrabold text-slate-900"
                >
                  Send feedback
                </h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Tell us what is confusing, broken or missing. Your note goes to the internal team
                channel, together with the page you were on, the time and a reference. Nothing else
                is included.
              </p>
              <FeedbackForm route={currentRoute} />
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <LockKeyhole className="h-4 w-4 text-indigo-700" /> Before you type
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Do not enter passwords, card numbers, API keys or private personal information.
                  This preview does not need them and cannot protect them.
                </p>
              </Card>
              <Card className="p-5">
                <h2 className="text-sm font-bold text-slate-900">Looking for the product terms?</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Membership entitlements, the 3% Pro fee direction and the launch-pricing
                  placeholder are documented on the pricing page.
                </p>
                <a href="/pricing" className={buttonClass("secondary", "md", "mt-3 w-full")}>
                  Read pricing
                </a>
              </Card>
              <Card className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <UserRound className="h-4 w-4 text-indigo-700" /> Account help
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Sign-in is a local demo. If you need to start over, sign out and use the demo
                  credentials on the login page.
                </p>
                <a href="/login" className={buttonClass("ghost", "sm", "mt-2 px-0")}>
                  Open sign in <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Card>
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <a href="/about" className="font-semibold hover:text-indigo-700">
            About The Scenes
          </a>
          <a href="/pricing" className="font-semibold hover:text-indigo-700">
            Pricing
          </a>
          <a href="/explore" className="font-semibold hover:text-indigo-700">
            Explore
          </a>
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" /> Notifications are not connected
          </span>
        </div>
      </div>
    </PublicShell>
  );
}
