import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { CommunityCard, CourseCard } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Card, CoverArt, Eyebrow, SectionHeading, buttonClass } from "@/components/ui";
import { categories, communities, courses, creators } from "@/data/seed";
import { formatCompact } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Scenes — Learn practical skills with people doing the work" },
      {
        name: "description",
        content:
          "Discover focused communities, practical courses and working creators. Learn, participate and build in public on The Scenes.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const featuredCommunities = communities.filter((community) => community.featured).slice(0, 3);
  const featuredCourses = courses.slice(0, 3);

  return (
    <PublicShell>
      <section className="bg-indigo-700 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <Badge className="bg-white/12 text-indigo-50 ring-1 ring-white/20">
              Built in Africa · open to the world
            </Badge>
            <h1 className="mt-5 max-w-3xl font-display text-[2.65rem] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4rem]">
              Learn practical skills with people doing the work.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-indigo-100 sm:text-xl sm:leading-8">
              Focused communities, useful courses and honest working notes — all in one place. Join
              the people building, teaching and applying what they know.
            </p>
            <form action="/search" method="get" className="mt-8 max-w-xl" role="search">
              <label htmlFor="hero-search" className="sr-only">
                Search communities and courses
              </label>
              <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-[0_10px_30px_rgba(30,27,75,0.25)] sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    id="hero-search"
                    name="q"
                    type="search"
                    placeholder="What do you want to learn?"
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button type="submit" className={buttonClass("clay", "md", "h-11 sm:px-5")}>
                  Explore The Scenes <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-indigo-100">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Free communities available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Creator-led, moderated spaces
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-4 w-4" /> Learn from anywhere
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-indigo-800/60 p-3 shadow-[0_18px_50px_rgba(30,27,75,0.28)] sm:p-5">
            <div className="flex items-center justify-between gap-4 px-1 pb-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-200 uppercase">
                  Live on The Scenes
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Communities learning together
                </p>
              </div>
              <Badge className="bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/30">
                ● Preview data
              </Badge>
            </div>
            <div className="overflow-hidden rounded-xl bg-white text-slate-900">
              <div className="grid grid-cols-[1.7fr_0.65fr_0.65fr] border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                <span>Community</span>
                <span className="text-right">Members</span>
                <span className="text-right">Access</span>
              </div>
              {communities.slice(0, 5).map((community) => (
                <a
                  key={community.id}
                  href={`/communities/${community.slug}`}
                  className="grid grid-cols-[1.7fr_0.65fr_0.65fr] items-center gap-2 border-b border-slate-100 px-4 py-3 text-xs last:border-0 hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `hsl(${community.accentHue} 54% 45%)` }}
                    />
                    <span className="truncate font-semibold">{community.name}</span>
                  </span>
                  <span className="text-right font-semibold tabular-nums text-slate-700">
                    {formatCompact(community.members)}
                  </span>
                  <span className="text-right font-semibold text-slate-900">
                    {community.pricing.type === "free" ? "Free" : `$${community.pricing.amount}/mo`}
                  </span>
                </a>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 divide-x divide-white/15 rounded-xl border border-white/10 bg-indigo-950/20 px-2 py-3 text-center">
              {[
                [String(communities.length), "sample communities"],
                [String(courses.length), "sample courses"],
                [String(creators.length), "working creators"],
              ].map(([value, label]) => (
                <div key={label} className="px-2">
                  <p className="font-display text-lg font-extrabold tabular-nums">{value}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-indigo-200">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Built for people who want to do more than watch
          </p>
          <div className="mt-5 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            {[
              [Users, "Focused communities", "Discuss real work"],
              [BookOpen, "Practical classrooms", "Learn in sequence"],
              [CalendarDays, "Live sessions", "Ask and apply"],
              [Sparkles, "Creator tools", "Teach and grow"],
            ].map(([Icon, title, description]) => {
              const ItemIcon = Icon as typeof Users;
              return (
                <div key={String(title)} className="flex items-center gap-3 px-2 sm:justify-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                    <ItemIcon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{String(title)}</span>
                    <span className="hidden text-xs text-slate-500 sm:block">
                      {String(description)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Find your room"
          title="Communities with a point of view."
          description="Not another endless feed. Each scene has a clear purpose, working practitioners and a structured path from question to action."
          action={
            <a href="/explore" className={buttonClass("secondary", "md")}>
              Explore all <ArrowRight className="h-4 w-4" />
            </a>
          }
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredCommunities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <Eyebrow>Broad outside, structured inside</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Start with an interest. Find the practitioners.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The Scenes is broader than one trend. Browse the subject you care about, then move
                into a focused community with lessons, events and people you can ask.
              </p>
              <a href="/explore" className={buttonClass("primary", "md", "mt-6")}>
                Browse every category
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase sm:px-5">
                <span>Category</span>
                <span>Scenes</span>
              </div>
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`/explore?category=${category.slug}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-200 px-4 py-4 last:border-0 hover:bg-white sm:px-5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: `hsl(${category.hue} 52% 44%)` }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {category.blurb}
                      </span>
                    </span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                    {category.communityCount}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Learn by making"
          title="Short courses. Clear outcomes."
          description="Every course belongs to a living community, so the lesson does not end when the video does."
          action={
            <a
              href="/my-learning"
              className="text-sm font-bold text-indigo-700 hover:text-indigo-900"
            >
              See the classroom →
            </a>
          }
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <Card className="overflow-hidden border-0 bg-slate-950 text-white">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <Badge className="bg-clay-600 text-white">For creators and organisations</Badge>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Turn what you know into a place people return to.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Run a community, publish a classroom, host events and understand your audience from
                one calm workspace. Pricing is being finalised — the product preview is open now.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/register?role=creator" className={buttonClass("clay", "lg")}>
                  Start your scene <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/dashboard/creator"
                  className={buttonClass(
                    "secondary",
                    "lg",
                    "border-slate-700 bg-transparent text-white hover:border-slate-500 hover:bg-slate-900",
                  )}
                >
                  Preview the workspace
                </a>
              </div>
            </div>
            <div className="relative min-h-64 overflow-hidden border-t border-slate-800 lg:border-t-0 lg:border-l">
              <CoverArt
                seed="creator-workspace"
                hue={26}
                rounded="rounded-none"
                className="absolute inset-0 h-full w-full opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 rounded-xl border border-white/15 bg-slate-950/75 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    This week in your scene
                  </span>
                  <Badge tone="green">● Healthy</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    ["46", "posts"],
                    ["3", "events"],
                    ["81%", "lesson finish"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <p className="font-display text-xl font-extrabold">{value}</p>
                      <p className="text-[10px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="border-t border-slate-200 bg-indigo-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Eyebrow>Choose your next room</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Useful knowledge gets better in company.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Browse communities by craft, meet the people teaching inside them and start with one
            concrete lesson.
          </p>
          <a href="/explore" className={buttonClass("primary", "lg", "mt-7")}>
            Explore The Scenes <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </PublicShell>
  );
}
