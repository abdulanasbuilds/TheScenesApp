import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Check, Globe2, Lock, Star, Users } from "lucide-react";
import { CourseCard, EventCard } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CoverArt,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  buttonClass,
} from "@/components/ui";
import { courses, events, getCommunity, getCreator, members, posts } from "@/data/seed";
import { formatCompact, formatMoney } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/communities/$communityId")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.community.name ?? "Community"} — The Scenes` }],
  }),
  component: PublicCommunityPage,
});

function PublicCommunityPage() {
  const { community } = Route.useLoaderData();
  const creator = getCreator(community.creatorHandle);
  const communityCourses = courses.filter((course) => course.communitySlug === community.slug);
  const communityEvents = events.filter(
    (event) => event.communitySlug === community.slug && !event.replay,
  );
  const communityPosts = posts.filter((post) => post.communitySlug === community.slug);
  const { state, joinCommunity, leaveCommunity } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState("about");
  const joined = state.joined.includes(community.slug);

  const toggleJoin = () => {
    if (joined) {
      leaveCommunity(community.slug);
      toast("Community left", `${community.name} was removed from your home.`);
    } else {
      joinCommunity(community.slug);
      toast("Welcome to the scene", "Membership is simulated in local frontend state.");
    }
  };

  return (
    <PublicShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <CoverArt
            seed={community.slug}
            hue={community.accentHue}
            rounded="rounded-2xl"
            className="h-48 sm:h-64"
            label={community.name}
          />
          <div className="grid gap-6 py-7 lg:grid-cols-[1fr_310px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={community.privacy === "private" ? "slate" : "green"}>
                  {community.privacy === "private" ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Globe2 className="h-3 w-3" />
                  )}
                  {community.privacy}
                </Badge>
                <Badge tone="outline">{community.categorySlug.replaceAll("-", " ")}</Badge>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                {community.name}
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                {community.tagline}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {formatCompact(community.members)} members
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {community.rating} ·{" "}
                  {community.reviews} reviews
                </span>
                <span>{community.postsPerWeek} posts this week</span>
              </div>
            </div>
            <Card className="p-4 lg:-mt-16 lg:relative lg:z-10 lg:shadow-lg">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Membership
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                {community.pricing.type === "free"
                  ? "Free"
                  : `${formatMoney(community.pricing.amount)} / month`}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Membership actions are local preview state. No payment is collected.
              </p>
              <Button
                className="mt-4 w-full"
                size="lg"
                variant={joined ? "secondary" : "primary"}
                onClick={toggleJoin}
              >
                {joined ? <Check className="h-4 w-4" /> : null}
                {joined
                  ? "Joined"
                  : community.pricing.type === "free"
                    ? "Join community"
                    : "Preview membership"}
              </Button>
              {joined ? (
                <a
                  href={`/c/${community.slug}`}
                  className={buttonClass("dark", "md", "mt-2 w-full")}
                >
                  Open community <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="classroom">Classroom · {communityCourses.length}</TabsTrigger>
            <TabsTrigger value="events">Events · {communityEvents.length}</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <TabsContent value="about">
                <Card className="p-5 sm:p-7">
                  <h2 className="font-display text-xl font-extrabold text-slate-900">
                    What happens inside
                  </h2>
                  <p className="mt-3 text-[15px] leading-7 text-slate-700">
                    {community.description}
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {community.highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex gap-2.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                  <h3 className="mt-8 text-sm font-bold text-slate-900">
                    A preview of the conversation
                  </h3>
                  <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {communityPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="p-4">
                        <p className="text-sm font-bold text-slate-900">
                          {post.title ?? post.body}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {post.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="classroom">
                <div className="grid gap-5 sm:grid-cols-2">
                  {communityCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="events">
                <div className="space-y-3">
                  {communityEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="members">
                <Card className="p-6">
                  <h2 className="font-display text-xl font-extrabold text-slate-900">
                    A room full of practitioners
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Member details are visible after joining. Here is a small preview of the people
                    active today.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {members.slice(0, 10).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pr-3 pl-1.5"
                      >
                        <Avatar name={member.name} size={28} online={member.online} />
                        <span className="text-xs font-semibold text-slate-700">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </div>
            <aside className="space-y-4">
              <Card className="p-4">
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                  Hosted by
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar name={creator?.name ?? "Creator"} size={44} online />
                  <div>
                    <a
                      href={`/creators/${creator?.handle}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-700"
                    >
                      {creator?.name}
                    </a>
                    <p className="text-xs text-slate-500">{creator?.location}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">{creator?.headline}</p>
              </Card>
              <Card className="p-4">
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                  Community snapshot
                </p>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Founded</dt>
                    <dd className="font-semibold text-slate-900">
                      {new Date(community.founded).getFullYear()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Languages</dt>
                    <dd className="font-semibold text-slate-900">
                      {community.languages.join(", ")}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Active now</dt>
                    <dd className="font-semibold text-emerald-700">● {community.online}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <AvatarStack names={members.slice(0, 7).map((member) => member.name)} max={5} />
                </div>
              </Card>
            </aside>
          </div>
        </Tabs>
      </div>
    </PublicShell>
  );
}
