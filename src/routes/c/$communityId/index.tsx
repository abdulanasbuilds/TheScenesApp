import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FilePlus2, Search, X } from "lucide-react";
import { EventCard, PostCard } from "@/components/domain/cards";
import { CommunityShell } from "@/components/layout/community-shell";
import { Avatar, Badge, Button, Card, Chip } from "@/components/ui";
import { events, getCreator } from "@/data/seed";
import { loadCatalogForRoute } from "@/features/learning/catalog-loader";
import { formatCompact } from "@/lib/utils";
import { useApp, usePosts } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/")({
  loader: async ({ params }) => {
    const catalog = await loadCatalogForRoute();
    const community = catalog.communities.find((item) => item.slug === params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.community.name} — The Scenes` : "Community — The Scenes",
      },
    ],
  }),
  component: CommunityFeedPage,
});

function CommunityFeedPage() {
  const { community } = Route.useLoaderData();
  const { dataMode, currentMember } = useApp();
  const allPosts = usePosts();
  const posts = (dataMode === "fixtures" ? allPosts : []).filter(
    (post) => post.communitySlug === community.slug,
  );
  const communityEvents =
    dataMode === "fixtures"
      ? events.filter((event) => event.communitySlug === community.slug && !event.replay)
      : [];
  const creator = getCreator(community.creatorHandle);
  const categories = useMemo(
    () => ["All", ...new Set(posts.map((post) => post.category))],
    [posts],
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [postSearch, setPostSearch] = useState("");

  const visiblePosts = posts.filter((post) => {
    const categoryMatch = activeCategory === "All" || post.category === activeCategory;
    const normalized = postSearch.trim().toLowerCase();
    const searchMatch =
      !normalized || `${post.title ?? ""} ${post.body}`.toLowerCase().includes(normalized);
    return categoryMatch && searchMatch;
  });

  return (
    <CommunityShell community={community} active="feed">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                  Community
                </h1>
                {dataMode === "fixtures" ? (
                  <Badge tone="green">
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current align-middle"
                      aria-hidden="true"
                    />
                    {community.online} online
                  </Badge>
                ) : (
                  <Badge tone="outline">Connected community</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {dataMode === "fixtures"
                  ? `${community.name} · ${formatCompact(community.members)} members`
                  : community.name}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="community-search" className="sr-only">
                Search posts
              </label>
              <input
                id="community-search"
                type="search"
                value={postSearch}
                onChange={(event) => setPostSearch(event.target.value)}
                placeholder="Search this community"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <Chip
                key={category}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {dataMode === "fixtures" ? <StartHereChecklist communitySlug={community.slug} /> : null}
          <Card className="p-4">
            <div className="flex gap-3">
              <Avatar name={currentMember?.name ?? "Member"} size={40} online />
              <a
                href={`/c/${community.slug}/posts/new`}
                className="flex h-10 flex-1 items-center rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-500 hover:border-slate-400 hover:bg-white"
              >
                {dataMode === "fixtures"
                  ? "Share a question, build log or useful note…"
                  : "Community posts are coming soon."}
              </a>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                {dataMode === "fixtures"
                  ? "Posts are saved for this preview."
                  : "Connected posting is coming soon."}
              </p>
              <a
                href={`/c/${community.slug}/posts/new`}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                <FilePlus2 className="h-3.5 w-3.5" /> New post
              </a>
            </div>
          </Card>

          {visiblePosts.length ? (
            visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="p-8 text-center">
              <p className="font-display text-lg font-bold text-slate-900">No posts in this view</p>
              <p className="mt-1 text-sm text-slate-500">
                Change the category or try a different search.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActiveCategory("All");
                  setPostSearch("");
                }}
              >
                Show all posts
              </Button>
            </Card>
          )}
        </div>

        <aside
          className="space-y-4 xl:sticky xl:top-20 xl:self-start"
          aria-label="Community information"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Avatar name={creator?.name ?? "Creator"} size={42} online />
              <div>
                <p className="text-sm font-bold text-slate-900">{creator?.name}</p>
                <p className="text-xs text-slate-500">Community host</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{community.tagline}</p>
            <a
              href={`/communities/${community.slug}`}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
            >
              About this scene <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card>

          {communityEvents[0] ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                  Next event
                </h2>
                <a
                  href={`/c/${community.slug}/calendar`}
                  className="text-xs font-semibold text-indigo-700"
                >
                  View calendar
                </a>
              </div>
              <EventCard event={communityEvents[0]} />
            </div>
          ) : null}

          <Card className="p-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              House rules
            </h2>
            <ol className="mt-3 space-y-3">
              {community.rules.slice(0, 3).map((rule, index) => (
                <li key={rule} className="flex gap-2.5 text-xs leading-5 text-slate-600">
                  <span className="font-mono font-bold text-indigo-700">0{index + 1}</span>
                  {rule}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </CommunityShell>
  );
}

function StartHereChecklist({ communitySlug }: { communitySlug: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState([false, false, false, false]);
  const completed = done.filter(Boolean).length;
  const steps = [
    {
      label: "Introduce yourself",
      hint: "Reply to the pinned Start here post",
      href: `/c/${communitySlug}/posts/post-start-here`,
    },
    {
      label: "Add your headline and location",
      hint: "Help people understand your context",
      href: "/settings",
    },
    {
      label: "Complete one preview lesson",
      hint: "Open the classroom",
      href: `/c/${communitySlug}/classroom`,
    },
    {
      label: "RSVP to the next live session",
      hint: "See how a teardown works",
      href: `/c/${communitySlug}/calendar`,
    },
  ];
  if (dismissed) return null;
  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
            New here?
          </p>
          <h2 className="mt-1 font-display text-lg font-extrabold text-slate-900">Start here</h2>
          <p className="mt-1 text-xs text-slate-600">
            {completed} of {steps.length} steps done · saved for this preview
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss start-here checklist"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step, index) => {
          const complete = done[index];
          return (
            <li key={step.label}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setDone((current) => current.map((value, i) => (i === index ? !value : value)))
                  }
                  aria-pressed={complete}
                  aria-label={`Mark “${step.label}” as ${complete ? "not done" : "done"}`}
                  className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <CheckCircle2
                    className={complete ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-slate-300"}
                  />
                </button>
                <a href={step.href} className="min-w-0 flex-1">
                  <span
                    className={
                      complete
                        ? "block text-sm font-semibold text-slate-400 line-through"
                        : "block text-sm font-semibold text-slate-800"
                    }
                  >
                    {step.label}
                  </span>
                  <span className="block text-[11px] text-slate-500">{step.hint}</span>
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
