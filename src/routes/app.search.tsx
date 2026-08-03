import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Users, GraduationCap, Hash, Building2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/app/search")({
  head: () => ({
    meta: [
      { title: "Search · SukaSpace" },
      {
        name: "description",
        content: "Search across communities, courses, members, messages, and resources.",
      },
    ],
  }),
  component: SearchPage,
});

type Tab = "all" | "communities" | "courses" | "members" | "resources";
type ContentType = "discussions" | "courses" | "profiles";
type AccessLevel = "all" | "free" | "pro";
const SORTS = ["Most Relevant", "Newest", "Most Members"] as const;

function SearchPage() {
  const store = useAppStore();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Most Relevant");
  const [types, setTypes] = useState<Record<ContentType, boolean>>({
    discussions: true,
    courses: true,
    profiles: false,
  });
  const [access, setAccess] = useState<AccessLevel>("all");

  const q = query.trim().toLowerCase();

  const communities = useMemo(
    () =>
      store.communities.filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      ),
    [store.communities, q],
  );

  const totalResults = communities.length;
  const show = (key: Tab) => tab === "all" || tab === key;

  const highlight = (text: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded bg-sky-200 px-0.5 text-foreground">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const clearFilters = () => {
    setAccess("all");
    setTypes({ discussions: true, courses: true, profiles: true });
    setSort("Most Relevant");
  };

  const toggleType = (t: ContentType) => setTypes((v) => ({ ...v, [t]: !v[t] }));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1 shadow-sm">
            <Search size={18} className="ml-2.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities, lessons, members, channels…"
              className="flex-1 bg-transparent px-1 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mr-2 rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {query && (
            <p className="mt-3 text-sm text-muted-foreground">
              {totalResults} result{totalResults === 1 ? "" : "s"} for "
              <span className="font-semibold text-foreground">{query}</span>"
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-4 border-b border-border text-sm">
            {(
              [
                ["all", "All"],
                ["communities", "Communities"],
                ["courses", "Courses"],
                ["members", "Members"],
                ["resources", "Resources"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`border-b-2 pb-2 font-semibold ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-7">
            {show("communities") && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  <Building2 size={12} />
                  Top Communities
                </h2>
                {communities.length === 0 ? (
                  store.communities.length === 0 ? (
                    <EmptyState
                      compact
                      variant="empty"
                      title="No communities have launched yet"
                      description="You are early. Create the first community and it becomes searchable for everyone the moment you publish it."
                      primary={{ label: "Create a community", to: "/create-community" }}
                      helper="Setup takes about 2 minutes and you can change everything later."
                    />
                  ) : (
                    <EmptyState
                      compact
                      variant="no-results"
                      title="No communities match your search"
                      description="Try a shorter phrase, or browse everything in Discover to see what is available right now."
                      primary={{ label: "Browse all communities", to: "/discover" }}
                      helper="Search covers community names, topics, and descriptions."
                    />
                  )
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {communities.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                      >
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${c.banner} text-sm font-bold text-slate-700`}
                        >
                          {c.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {highlight(c.title)}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{c.summary}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {c.members.toLocaleString()} Members
                          </div>
                        </div>
                        <button
                          onClick={() => nav({ to: "/discover" })}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${store.isJoined(c.id) ? "border border-border text-foreground" : "bg-primary text-white hover:bg-primary/90"}`}
                        >
                          {store.isJoined(c.id) ? "View" : "Join"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {show("courses") && types.courses && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  <GraduationCap size={12} />
                  Relevant Courses
                </h2>
                <EmptyState
                  compact
                  variant="empty"
                  title="No courses published yet"
                  description="Courses appear here as soon as a creator publishes a curriculum. Join a community to be notified when its first course goes live."
                  primary={{ label: "Explore communities", to: "/discover" }}
                  secondary={{ label: "Create a course", to: "/app/courses" }}
                />
              </div>
            )}

            {show("members") && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  <Users size={12} />
                  Experts
                </h2>
                <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                  No members to display yet. As the community grows, expert profiles will appear
                  here.
                </p>
              </div>
            )}

            {show("resources") && (
              <>
                <div>
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    <Hash size={12} />
                    Channels
                  </h2>
                  <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                    No channels yet. Channels are created automatically when you create a community.
                  </p>
                </div>
                {types.discussions && (
                  <div>
                    <h2 className="mb-2 mt-6 text-xs font-semibold uppercase text-muted-foreground">
                      Recent Discussions
                    </h2>
                    <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                      No discussions yet. Start posting in your community to see discussions here.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="h-fit rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
              className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
              Content Type
            </label>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["discussions", "Discussions", 0],
                  ["courses", "Course Materials", 0],
                  ["profiles", "Profiles", 0],
                ] as [ContentType, string, number][]
              ).map(([key, label, count]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between text-xs font-medium text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={types[key]}
                      onChange={() => toggleType(key)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    {label}
                  </span>
                  <span className="text-muted-foreground">({count})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
              Access Level
            </label>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["all", "All Access"],
                  ["free", "Free Only"],
                  ["pro", "Pro Required"],
                ] as [AccessLevel, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                >
                  <input
                    type="radio"
                    name="access"
                    checked={access === key}
                    onChange={() => setAccess(key)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
