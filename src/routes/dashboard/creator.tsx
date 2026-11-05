import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FilePlus2,
  MessageSquareText,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import { Avatar, Badge, Button, Card, Progress, Select, Stat, buttonClass } from "@/components/ui";
import { courses, events, getCommunity, members, orders, posts } from "@/data/seed";
import { formatCompact, formatDate, formatMoney, relativeTime } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/creator")({
  head: () => ({ meta: [{ title: "Creator workspace — The Scenes" }] }),
  component: CreatorDashboardPage,
});

function CreatorDashboardPage() {
  const [range, setRange] = useState("30");
  const { toast } = useToast();
  const community = getCommunity("ai-builders-guild")!;
  const communityCourses = courses.filter((course) => course.communitySlug === community.slug);
  const upcomingEvents = events.filter(
    (event) =>
      event.communitySlug === community.slug && new Date(event.start) > new Date("2026-11-03"),
  );
  const communityPosts = posts.filter((post) => post.communitySlug === community.slug);
  const previewRevenue = orders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + order.amount, 0);

  return (
    <CreatorShell active="overview">
      <section className="border-b border-indigo-800 bg-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/12 text-indigo-50 ring-1 ring-white/20">
                  Fixture workspace
                </Badge>
                <span className="text-xs text-indigo-200">No production analytics connected</span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Good morning, Nana.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                Here is what needs attention in {community.name} — based on deterministic preview
                data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/c/ai-builders-guild/posts/new"
                className={buttonClass(
                  "secondary",
                  "md",
                  "border-white/25 bg-white/10 text-white hover:bg-white/15",
                )}
              >
                <FilePlus2 className="h-4 w-4" /> New post
              </a>
              <a href="/dashboard/courses" className={buttonClass("clay", "md")}>
                <BookOpen className="h-4 w-4" /> Create course
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Workspace pulse</p>
            <p className="text-xs text-slate-500">
              Preview values for layout and interaction testing
            </p>
          </div>
          <Select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="w-40 border-0 bg-white shadow-sm"
            aria-label="Activity period"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Members"
            value={formatCompact(community.members)}
            hint="Community fixture total"
          />
          <Stat
            label="Posts this week"
            value={community.postsPerWeek}
            hint={`${communityPosts.length} preview posts loaded`}
          />
          <Stat
            label="Course learners"
            value={formatCompact(
              communityCourses.reduce((sum, course) => sum + course.students, 0),
            )}
            hint="Across published courses"
          />
          <Stat
            label="Preview gross sales"
            value={formatMoney(previewRevenue)}
            hint="Fixture orders · not financial data"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Member activity
                  </h2>
                  <p className="text-xs text-slate-500">Daily active members · fixture trend</p>
                </div>
                <Badge tone="green">
                  <TrendingUp className="h-3 w-3" /> 8.4% preview
                </Badge>
              </div>
              <div className="p-5">
                <div className="flex h-52 items-end gap-2 border-b border-l border-slate-200 px-2 pt-4 sm:gap-3">
                  {[42, 58, 51, 69, 62, 74, 81, 77, 88, 83, 94, 90, 102, 111].map(
                    (value, index) => (
                      <div key={index} className="group relative flex h-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-sm bg-indigo-600/80 transition-colors group-hover:bg-indigo-700"
                          style={{ height: `${Math.max(12, (value / 120) * 100)}%` }}
                        />
                        <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] text-white group-hover:block">
                          {value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>20 Oct</span>
                  <span>27 Oct</span>
                  <span>3 Nov</span>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Courses</h2>
                    <p className="text-xs text-slate-500">Published classroom content</p>
                  </div>
                  <a href="/dashboard/courses" className="text-xs font-bold text-indigo-700">
                    Manage
                  </a>
                </div>
                <div className="divide-y divide-slate-100">
                  {communityCourses.map((course) => (
                    <a
                      key={course.id}
                      href={`/c/${community.slug}/classroom/${course.slug}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {course.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          {course.students.toLocaleString()} learners · {course.modules.length}{" "}
                          modules
                        </span>
                      </span>
                      <Badge tone={course.status === "published" ? "green" : "amber"}>
                        {course.status}
                      </Badge>
                    </a>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Upcoming events</h2>
                    <p className="text-xs text-slate-500">Sessions scheduled for members</p>
                  </div>
                  <a href="/dashboard/events" className="text-xs font-bold text-indigo-700">
                    Manage
                  </a>
                </div>
                <div className="divide-y divide-slate-100">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <a
                      key={event.id}
                      href={`/c/${community.slug}/events/${event.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 flex-col items-center justify-center rounded-lg bg-clay-50 text-clay-700">
                        <span className="text-[8px] font-bold uppercase">
                          {new Intl.DateTimeFormat("en", { month: "short" }).format(
                            new Date(event.start),
                          )}
                        </span>
                        <span className="text-sm font-extrabold leading-none">
                          {new Date(event.start).getDate()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          {event.attendees} going · {event.kind}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Recent community activity
                  </h2>
                  <p className="text-xs text-slate-500">Posts and conversations needing a glance</p>
                </div>
                <a href={`/c/${community.slug}`} className="text-xs font-bold text-indigo-700">
                  Open feed
                </a>
              </div>
              <div className="divide-y divide-slate-100">
                {communityPosts.slice(0, 4).map((post) => {
                  const author = members.find((member) => member.id === post.authorId);
                  return (
                    <a
                      key={post.id}
                      href={`/c/${community.slug}/posts/${post.id}`}
                      className="grid gap-3 px-5 py-3.5 hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="flex min-w-0 gap-3">
                        <Avatar name={author?.name ?? "Nana Adjei"} size={34} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {post.title ?? post.body}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {post.category} · {relativeTime(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> {post.likes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquareText className="h-3.5 w-3.5" /> {post.comments.length}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Needs attention
                  </p>
                  <h2 className="mt-1 font-display text-lg font-extrabold text-slate-900">
                    Three useful next moves
                  </h2>
                </div>
                <MoreHorizontal className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-4 space-y-2">
                {[
                  [
                    UserPlus,
                    "Review 8 join requests",
                    "New members are waiting",
                    "/dashboard/members",
                  ],
                  [Clock3, "Publish draft lesson", "Evals before prompts", "/dashboard/courses"],
                  [
                    CalendarDays,
                    "Confirm Friday host",
                    "Architecture teardown",
                    "/dashboard/events",
                  ],
                ].map(([Icon, title, hint, href]) => {
                  const ItemIcon = Icon as typeof UserPlus;
                  return (
                    <a
                      key={String(title)}
                      href={String(href)}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {String(title)}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {String(hint)}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </a>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Commercial preview
                  </p>
                  <h2 className="mt-1 font-display text-lg font-extrabold text-slate-900">
                    Orders and earnings
                  </h2>
                </div>
                <CircleDollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <dl className="mt-5 space-y-4">
                <div className="flex items-end justify-between">
                  <dt className="text-sm text-slate-500">Gross fixture sales</dt>
                  <dd className="font-display text-2xl font-extrabold tabular-nums text-slate-900">
                    {formatMoney(previewRevenue)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                  <dt className="text-slate-500">Paid orders</dt>
                  <dd className="font-semibold text-slate-900">
                    {orders.filter((order) => order.status === "paid").length}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Platform fee model</dt>
                  <dd className="font-semibold text-slate-900">3% · Pro</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Payments and payouts are not connected. These figures exist only to validate the
                management interface.
              </div>
              <a
                href="/dashboard/commerce"
                className={buttonClass("secondary", "md", "mt-4 w-full")}
              >
                Open commerce preview <ArrowRight className="h-4 w-4" />
              </a>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900">Quick publish</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Start in the right workspace and finish the details there.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href="/c/ai-builders-guild/posts/new"
                  className="rounded-lg border border-slate-200 p-3 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  <MessageSquareText className="mx-auto mb-1.5 h-4 w-4 text-indigo-700" />
                  Post
                </a>
                <a
                  href="/dashboard/courses"
                  className="rounded-lg border border-slate-200 p-3 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  <BookOpen className="mx-auto mb-1.5 h-4 w-4 text-indigo-700" />
                  Lesson
                </a>
                <a
                  href="/dashboard/events"
                  className="rounded-lg border border-slate-200 p-3 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  <CalendarDays className="mx-auto mb-1.5 h-4 w-4 text-indigo-700" />
                  Event
                </a>
                <button
                  type="button"
                  onClick={() =>
                    toast(
                      "Product publishing unavailable",
                      "Marketplace publishing is a later product phase.",
                    )
                  }
                  className="rounded-lg border border-slate-200 p-3 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  <CircleDollarSign className="mx-auto mb-1.5 h-4 w-4 text-indigo-700" />
                  Product
                </button>
              </div>
            </Card>
          </aside>
        </div>

        <p className="mt-8 text-center text-[11px] text-slate-600">
          Dashboard fixture snapshot · {formatDate("2026-11-03")} · Range selector: {range} days
        </p>
      </div>
    </CreatorShell>
  );
}
