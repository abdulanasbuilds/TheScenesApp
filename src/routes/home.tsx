import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarDays, Compass, MessageSquareText } from "lucide-react";
import { CommunityCard, EventCard, MiniLearningCard, PostCard } from "@/components/domain/cards";
import { MemberShell } from "@/components/layout/member-shell";
import { Badge, Card, SectionHeading, buttonClass } from "@/components/ui";
import { communities, courses, events } from "@/data/seed";
import { useApp, usePosts } from "@/store/app-store";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — The Scenes" }] }),
  component: MemberHomePage,
});

function MemberHomePage() {
  const { state, currentMember } = useApp();
  const posts = usePosts();
  const joinedCommunities = communities.filter((community) =>
    state.joined.includes(community.slug),
  );
  const joinedPosts = posts.filter((post) => state.joined.includes(post.communitySlug)).slice(0, 4);
  const enrolled = courses.filter((course) => state.enrolledCourses.includes(course.id));
  const upcoming = events
    .filter(
      (event) =>
        state.joined.includes(event.communitySlug) &&
        new Date(event.start) > new Date("2026-11-03"),
    )
    .slice(0, 3);
  const recommended = communities
    .filter((community) => !state.joined.includes(community.slug))
    .slice(0, 2);

  return (
    <MemberShell active="home">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Tuesday, 3 November
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Welcome back, {currentMember?.name.split(" ")[0]}.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Continue a lesson, answer a question or see what changed in your scenes.
              </p>
            </div>
            <a href="/explore" className={buttonClass("secondary", "md")}>
              <Compass className="h-4 w-4" /> Explore more
            </a>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_340px]">
          <div className="min-w-0 space-y-8">
            <section>
              <SectionHeading
                title="Continue learning"
                description="Your progress follows you across communities."
                action={
                  <a href="/my-learning" className="text-xs font-bold text-indigo-700">
                    All learning →
                  </a>
                }
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {enrolled.slice(0, 2).map((course) => {
                  const all = course.modules.flatMap((module) => module.lessons);
                  const done = all.filter((lesson) =>
                    state.completedLessons.includes(lesson.id),
                  ).length;
                  const progress = Math.round((done / all.length) * 100);
                  const next =
                    all.find((lesson) => !state.completedLessons.includes(lesson.id)) ?? all[0];
                  return (
                    <MiniLearningCard
                      key={course.id}
                      title={next?.title ?? course.title}
                      community={course.title}
                      progress={progress}
                      href={`/c/${course.communitySlug}/classroom/${course.slug}/${next?.id}`}
                    />
                  );
                })}
              </div>
            </section>
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                    From your communities
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Recent, useful activity — not an infinite feed.
                  </p>
                </div>
                <Badge tone="green">● Updated</Badge>
              </div>
              <div className="mt-4 space-y-4">
                {joinedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                  Upcoming
                </h2>
                <a
                  href={`/c/${joinedCommunities[0]?.slug}/calendar`}
                  className="text-xs font-bold text-indigo-700"
                >
                  Calendar
                </a>
              </div>
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
              </div>
            </section>
            <Card className="p-4">
              <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                Your scenes
              </h2>
              <div className="mt-3 space-y-2">
                {joinedCommunities.map((community) => (
                  <a
                    key={community.id}
                    href={`/c/${community.slug}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: `hsl(${community.accentHue} 48% 38%)` }}
                    >
                      {community.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {community.name}
                      </span>
                      <span className="text-xs text-slate-500">{community.online} online</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </Card>
            {recommended.length ? (
              <section>
                <div className="mb-3">
                  <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Worth a look
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Not algorithmic — fixture recommendations.
                  </p>
                </div>
                <div className="space-y-3">
                  {recommended.map((community) => (
                    <CommunityCard key={community.id} community={community} compact />
                  ))}
                </div>
              </section>
            ) : null}
            <Card className="bg-indigo-700 p-5 text-white">
              <MessageSquareText className="h-5 w-5 text-indigo-200" />
              <h2 className="mt-3 font-display text-lg font-extrabold">
                Share what you are building.
              </h2>
              <p className="mt-2 text-xs leading-5 text-indigo-100">
                Working notes are more useful than polished announcements.
              </p>
              <a
                href={`/c/${joinedCommunities[0]?.slug}/posts/new`}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-indigo-800"
              >
                <BookOpen className="h-3.5 w-3.5" /> Write a post
              </a>
            </Card>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
