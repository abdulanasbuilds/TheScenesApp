import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { CommunityCard, CommunityRow } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import { Button, Card, Chip, EmptyState, Select } from "@/components/ui";
import { categories, communities } from "@/data/seed";
import { cn } from "@/lib/utils";

type ExploreSearch = {
  q: string;
  category: string;
  price: string;
  sort: string;
};

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "all",
    price: typeof search.price === "string" ? search.price : "all",
    sort: typeof search.sort === "string" ? search.sort : "featured",
  }),
  head: () => ({
    meta: [
      { title: "Explore communities — The Scenes" },
      {
        name: "description",
        content: "Search and filter focused learning communities on The Scenes.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q);
  const [category, setCategory] = useState(search.category);
  const [price, setPrice] = useState(search.price);
  const [sort, setSort] = useState(search.sort);
  const [view, setView] = useState<"grid" | "rows">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = communities.filter((community) => {
      const creatorText = community.creatorHandle.replaceAll("-", " ");
      const matchesQuery =
        !normalized ||
        `${community.name} ${community.tagline} ${community.description} ${creatorText}`
          .toLowerCase()
          .includes(normalized);
      const matchesCategory = category === "all" || community.categorySlug === category;
      const matchesPrice =
        price === "all" ||
        (price === "free" && community.pricing.type === "free") ||
        (price === "paid" && community.pricing.type !== "free");
      return matchesQuery && matchesCategory && matchesPrice;
    });

    return [...result].sort((a, b) => {
      if (sort === "members") return b.members - a.members;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "newest") return new Date(b.founded).getTime() - new Date(a.founded).getTime();
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.members - a.members;
    });
  }, [query, category, price, sort]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setPrice("all");
    setSort("featured");
  };
  const activeFilterCount = Number(category !== "all") + Number(price !== "all");

  return (
    <PublicShell active="/explore">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            Discovery
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Find your people. Learn the thing.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Search focused communities by craft, outcome or the kind of work happening inside.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Fixture catalogue · updated for this preview
            </span>
          </div>
          <div className="mt-7 flex max-w-3xl items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/15">
            <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
            <label htmlFor="explore-search" className="sr-only">
              Search communities
            </label>
            <input
              id="explore-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “pricing”, “AI agents” or “video editing”"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={category === "all"} onClick={() => setCategory("all")}>
              All scenes
            </Chip>
            {categories.map((item) => (
              <Chip
                key={item.id}
                active={category === item.slug}
                onClick={() => setCategory(item.slug)}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" /> {item.name}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mr-auto">
            <p className="text-sm font-bold text-slate-900">
              {filtered.length} {filtered.length === 1 ? "community" : "communities"}
            </p>
            <p className="text-xs text-slate-500">
              {query ? `Matching “${query}”` : "Browse the full preview catalogue"}
            </p>
          </div>
          <Button
            variant={activeFilterCount ? "soft" : "secondary"}
            size="sm"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilterCount ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-700 text-[9px] text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="w-40 border-0 bg-slate-50"
          >
            <option value="featured">Featured</option>
            <option value="members">Most members</option>
            <option value="rating">Highest rated</option>
            <option value="newest">Newest</option>
          </Select>
          <div
            className="flex rounded-lg border border-slate-200 bg-slate-50 p-1"
            aria-label="Result view"
          >
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md",
                view === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
              )}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("rows")}
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md",
                view === "rows" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
              )}
              aria-label="Table view"
              aria-pressed={view === "rows"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <Card className="mt-3 grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="price-filter" className="text-xs font-bold text-slate-700">
                Access
              </label>
              <Select
                id="price-filter"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1.5"
              >
                <option value="all">Free and paid</option>
                <option value="free">Free only</option>
                <option value="paid">Paid memberships</option>
              </Select>
            </div>
            <div>
              <label htmlFor="category-filter" className="text-xs font-bold text-slate-700">
                Category
              </label>
              <Select
                id="category-filter"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1.5"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="ghost" size="md" onClick={clearFilters}>
              Clear all
            </Button>
          </Card>
        ) : null}

        {filtered.length ? (
          view === "grid" ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          ) : (
            <Card className="mt-6 overflow-x-auto">
              <div className="grid min-w-[780px] grid-cols-[2fr_1fr_0.7fr_0.7fr_0.8fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                <span>Community</span>
                <span>Creator</span>
                <span>Members</span>
                <span>Rating</span>
                <span>Access</span>
              </div>
              {filtered.map((community) => (
                <CommunityRow key={community.id} community={community} />
              ))}
            </Card>
          )
        ) : (
          <EmptyState
            className="mt-6"
            icon={<Search className="h-5 w-5" />}
            title="No scenes match those filters"
            description="Try a broader phrase, change the category or clear the price filter. Nothing has been hidden behind a loading state."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
      </section>
    </PublicShell>
  );
}
