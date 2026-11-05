import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Search, ShoppingBag, UserRound, Users, X } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Avatar, Badge, Button, Card, Chip, EmptyState } from "@/components/ui";
import { communities, courses, creators, products } from "@/data/seed";
import { formatCompact, formatMoney } from "@/lib/utils";

type SearchParams = { q: string; type: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : "",
    type: typeof search.type === "string" ? search.type : "all",
  }),
  head: () => ({ meta: [{ title: "Search — The Scenes" }] }),
  component: SearchResultsPage,
});

type Result = {
  id: string;
  type: "communities" | "courses" | "creators" | "products";
  title: string;
  description: string;
  href: string;
  meta: string;
  hue?: number;
};

function SearchResultsPage() {
  const initial = Route.useSearch();
  const [query, setQuery] = useState(initial.q);
  const [type, setType] = useState(initial.type);

  const allResults = useMemo<Result[]>(
    () => [
      ...communities.map((item) => ({
        id: item.id,
        type: "communities" as const,
        title: item.name,
        description: item.tagline,
        href: `/communities/${item.slug}`,
        meta: `${formatCompact(item.members)} members · ${item.pricing.type === "free" ? "Free" : `$${item.pricing.amount}/month`}`,
        hue: item.accentHue,
      })),
      ...courses.map((item) => ({
        id: item.id,
        type: "courses" as const,
        title: item.title,
        description: item.subtitle,
        href: `/c/${item.communitySlug}/classroom/${item.slug}`,
        meta: `${item.level} · ${item.hours} hours · ${item.price === "included" ? "Included" : formatMoney(item.price)}`,
        hue: item.accentHue,
      })),
      ...creators.map((item) => ({
        id: item.id,
        type: "creators" as const,
        title: item.name,
        description: item.headline,
        href: `/creators/${item.handle}`,
        meta: `${item.location} · ${formatCompact(item.followers)} followers`,
      })),
      ...products.map((item) => ({
        id: item.id,
        type: "products" as const,
        title: item.title,
        description: item.blurb,
        href: `/marketplace/${item.slug}`,
        meta: `${item.category} · ${formatMoney(item.price)}`,
        hue: item.accentHue,
      })),
    ],
    [],
  );

  const results = allResults.filter((item) => {
    const normalized = query.trim().toLowerCase();
    return (
      (type === "all" || item.type === type) &&
      (!normalized ||
        `${item.title} ${item.description} ${item.meta}`.toLowerCase().includes(normalized))
    );
  });

  const tabs = [
    ["all", "All"],
    ["communities", "Communities"],
    ["courses", "Courses"],
    ["creators", "Creators"],
    ["products", "Products"],
  ];

  return (
    <PublicShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            Search everything
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Find a scene, lesson, person or resource.
          </h1>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-300 p-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/15">
            <Search className="ml-2 h-5 w-5 text-slate-400" />
            <label htmlFor="global-search" className="sr-only">
              Search The Scenes
            </label>
            <input
              id="global-search"
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by subject, creator or outcome"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map(([value, label]) => (
              <Chip key={value} active={type === value} onClick={() => setType(value)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">
            {results.length} results{query ? ` for “${query}”` : ""}
          </p>
          <p className="text-xs text-slate-500">Fixture search · updates as you type</p>
        </div>
        {results.length ? (
          <Card className="mt-4 divide-y divide-slate-100 overflow-hidden">
            {results.map((result) => (
              <SearchResult key={`${result.type}-${result.id}`} result={result} />
            ))}
          </Card>
        ) : (
          <EmptyState
            className="mt-4"
            icon={<Search className="h-5 w-5" />}
            title="No results found"
            description="Check the spelling, use fewer words or search all result types."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setType("all");
                }}
              >
                Reset search
              </Button>
            }
          />
        )}
      </div>
    </PublicShell>
  );
}

function SearchResult({ result }: { result: Result }) {
  const icons = {
    communities: Users,
    courses: BookOpen,
    creators: UserRound,
    products: ShoppingBag,
  };
  const Icon = icons[result.type];
  return (
    <a
      href={result.href}
      className="flex items-start gap-4 p-4 transition-colors hover:bg-slate-50 sm:p-5"
    >
      {result.type === "creators" ? (
        <Avatar name={result.title} size={44} />
      ) : (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: `hsl(${result.hue ?? 246} 48% 38%)` }}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-bold text-slate-900">{result.title}</span>
          <Badge tone="outline">{result.type.slice(0, -1)}</Badge>
        </span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{result.description}</span>
        <span className="mt-1 block text-xs font-medium text-slate-500">{result.meta}</span>
      </span>
    </a>
  );
}
