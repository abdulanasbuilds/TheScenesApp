import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Globe2,
  GraduationCap,
  Layers,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Card, buttonClass } from "@/components/ui";
import { categories, communities, courses, creators } from "@/data/seed";
import { formatCompact } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Scenes" },
      {
        name: "description",
        content:
          "The Scenes is an African-first platform for practical learning, focused communities and creator-led education.",
      },
    ],
  }),
  component: AboutPage,
});

const principles = [
  {
    icon: BookOpen,
    title: "Practical before polished",
    body: "A lesson should change what someone can do next week. We favour working examples, templates and honest constraints over inspiration without application.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first, bandwidth-aware",
    body: "The core experience is designed for a phone on an imperfect connection. Dense desktop layouts come second, not first.",
  },
  {
    icon: Globe2,
    title: "African-first, globally expandable",
    body: "Local trust, direct-response channels and local payment needs shape the product. The architecture is not limited to one country.",
  },
  {
    icon: ShieldCheck,
    title: "Clear boundaries",
    body: "No fake provider success. If payments, email, storage or live video are not connected, the interface says so plainly.",
  },
];

const surfaces = [
  {
    icon: Compass,
    title: "Discover",
    body: "Find communities, courses and creators by category, price and activity — with enough context to judge fit before joining.",
    href: "/explore",
    link: "Explore the catalogue",
  },
  {
    icon: MessageSquareText,
    title: "Participate",
    body: "A focused feed, member directory, events and classroom inside each community. Not an infinite global timeline.",
    href: "/home",
    link: "Open member home",
  },
  {
    icon: GraduationCap,
    title: "Learn in sequence",
    body: "Courses with modules, lessons, progress and a leaderboard. The next lesson is always obvious.",
    href: "/my-learning",
    link: "Open my learning",
  },
  {
    icon: Layers,
    title: "Teach and operate",
    body: "A creator workspace for community settings, members, courses, events and commerce — with local-only preview actions.",
    href: "/dashboard/creator",
    link: "Open creator workspace",
  },
];

function AboutPage() {
  const totalMembers = communities.reduce((sum, community) => sum + community.members, 0);

  return (
    <PublicShell active="/about">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <Badge tone="clay">
              <Sparkles className="h-3 w-3" /> About The Scenes
            </Badge>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Useful knowledge should be easier to act on.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              The Scenes is an African-first platform for learning, teaching and focused
              communities. It brings discovery, practical courses, working resources and creator-led
              education into one place — without pretending every subject needs a feed.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <a href="/explore" className={buttonClass("primary", "md")}>
                Explore communities <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/pricing" className={buttonClass("secondary", "md")}>
                See membership options
              </a>
            </div>
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Communities", communities.length],
                ["Courses", courses.length],
                ["Creators", creators.length],
                ["Categories", categories.length],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[10px] font-bold tracking-[0.12em] text-slate-600 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold text-slate-900">
                    {formatCompact(Number(value))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <Card className="overflow-hidden border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                One account, four surfaces
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatCompact(totalMembers)} members across the preview catalogue
              </p>
            </div>
            <div className="divide-y divide-slate-200">
              {surfaces.map((surface) => {
                const Icon = surface.icon;
                return (
                  <a
                    key={surface.title}
                    href={surface.href}
                    className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-white"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900">
                        {surface.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        {surface.body}
                      </span>
                    </span>
                    <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" />
                  </a>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
              Why this exists
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950">
              The gap is not information. It is structure.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              People can find advice anywhere. What is harder is finding a room with the right
              level, a sequence that builds, and a way to ask a question without performing
              expertise.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                number: "01",
                title: "Discovery is scattered",
                body: "Useful creators are spread across social feeds, newsletters and private groups. It is hard to compare fit.",
              },
              {
                number: "02",
                title: "Courses stop at theory",
                body: "Many courses explain a topic but leave the learner without a working file, a next action or feedback.",
              },
              {
                number: "03",
                title: "Communities lack structure",
                body: "A group chat is not a classroom. Members need a feed, a directory, events and a clear learning path.",
              },
            ].map((item) => (
              <Card key={item.number} className="p-5">
                <p className="font-mono text-xs font-bold text-indigo-700">{item.number}</p>
                <h3 className="mt-3 font-display text-base font-extrabold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-slate-600">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                What you can do
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Learn, participate, teach — in the same place.
              </h2>
            </div>
            <a href="/explore" className="text-xs font-bold text-indigo-700">
              Browse the catalogue
            </a>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {surfaces.map((surface) => {
              const Icon = surface.icon;
              return (
                <Card key={surface.title} className="flex flex-col p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-slate-900">
                    {surface.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{surface.body}</p>
                  <a
                    href={surface.href}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-700"
                  >
                    {surface.link} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
              Broad outside, structured inside
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950">
              Start anywhere. Go deep somewhere.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              AI is a flagship category, not the definition of the company. The taxonomy is designed
              to hold creative, professional, business and specialist knowledge too.
            </p>
          </div>
          <a href="/explore" className="text-xs font-bold text-indigo-700">
            All categories
          </a>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/explore?category=${category.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
                  style={{ backgroundColor: `hsl(${category.hue} 46% 38%)` }}
                  aria-hidden="true"
                >
                  {category.name.slice(0, 2).toUpperCase()}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-700" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{category.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{category.blurb}</p>
              <p className="mt-2 text-[10px] font-semibold text-slate-600">
                {category.communityCount} communities
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-300 uppercase">
              Product principles
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              Decisions we are willing to be judged on.
            </h2>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <div key={principle.title} className="border-t border-white/15 pt-4">
                  <Icon className="h-5 w-5 text-indigo-300" />
                  <h3 className="mt-3 font-display text-base font-extrabold">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{principle.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                What is actually live in this build
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The current phase is a complete frontend with deterministic sample data. It is meant
              to be used, tested and critiqued before any production service is connected.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Public discovery, community and creator pages",
                "Member feed, posts, comments and notifications",
                "Course library, lesson viewer and progress",
                "Creator workspace, commerce and event management",
                "Responsive layouts for desktop, tablet and mobile",
                "Accessible forms with validation and clear states",
              ].map((item) => (
                <p key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </p>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
              <p className="font-bold">Not connected yet</p>
              <p className="mt-1">
                Production authentication, payments, payouts, email delivery, file storage, video
                hosting and browser push. Every affected screen says so instead of faking success.
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="bg-indigo-700 p-6 text-white">
              <Users className="h-5 w-5 text-indigo-200" />
              <h2 className="mt-3 font-display text-xl font-extrabold">
                Learn with people who show the work.
              </h2>
              <p className="mt-2 text-sm leading-6 text-indigo-100">
                Join a community, open the next lesson, or publish a working note.
              </p>
              <a href="/register" className={buttonClass("secondary", "md", "mt-4 w-full")}>
                Create a demo account
              </a>
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900">Have expertise to teach?</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                The creator workspace shows how a community, classroom, events and commerce fit
                together.
              </p>
              <a
                href="/dashboard/creator"
                className={buttonClass("secondary", "md", "mt-3 w-full")}
              >
                Preview the workspace
              </a>
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900">Need the details?</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                Read the membership structure or check which services are connected.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="/pricing" className={buttonClass("ghost", "sm")}>
                  Pricing
                </a>
                <a href="/help" className={buttonClass("ghost", "sm")}>
                  Help centre
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
