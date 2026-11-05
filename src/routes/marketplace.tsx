import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Button, Card, Chip, EmptyState, Select } from "@/components/ui";
import { products } from "@/data/seed";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — The Scenes" },
      {
        name: "description",
        content:
          "Practical templates, systems and learning resources from working creators on The Scenes.",
      },
    ],
  }),
  component: MarketplaceRoute,
});

function MarketplaceRoute() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, ""),
  });
  return pathname === "/marketplace" ? <MarketplacePage /> : <Outlet />;
}

function MarketplacePage() {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [savedOnly, setSavedOnly] = useState(false);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [],
  );
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const categoryMatch = category === "All" || product.category === category;
        const queryMatch =
          !normalized ||
          `${product.title} ${product.blurb} ${product.description} ${product.category}`
            .toLowerCase()
            .includes(normalized);
        const savedMatch = !savedOnly || state.saved.includes(product.slug);
        return categoryMatch && queryMatch && savedMatch;
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price;
        if (sort === "price-high") return b.price - a.price;
        if (sort === "rating") return b.rating - a.rating;
        if (sort === "popular") return b.sales - a.sales;
        return Number(Boolean(b.bestseller)) - Number(Boolean(a.bestseller)) || b.sales - a.sales;
      });
  }, [category, query, savedOnly, sort, state.saved]);

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
    setSort("featured");
    setSavedOnly(false);
  };

  return (
    <PublicShell active="/marketplace">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <Badge tone="clay">
                <ShoppingBag className="h-3 w-3" /> Creator marketplace
              </Badge>
              <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Buy the system, not another course about the system.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Templates, playbooks and working files from practitioners in The Scenes. Every
                listing names what is included and who made it.
              </p>
            </div>
            <Card className="border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                Commerce preview
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Checkout is simulated in this frontend build. No card details are requested and no
                payment is processed.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> Safe to explore
              </div>
            </Card>
          </div>

          <div className="mt-8 flex max-w-3xl items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/15">
            <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
            <label htmlFor="marketplace-search" className="sr-only">
              Search marketplace
            </label>
            <input
              id="marketplace-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates, playbooks and working files"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear marketplace search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => (
              <Chip key={item} active={category === item} onClick={() => setCategory(item)}>
                {item}
              </Chip>
            ))}
          </div>
          <Button
            variant={savedOnly ? "soft" : "secondary"}
            size="sm"
            onClick={() => setSavedOnly((value) => !value)}
            aria-pressed={savedOnly}
          >
            <Bookmark className={savedOnly ? "h-4 w-4 fill-indigo-700" : "h-4 w-4"} />
            Saved
            {state.saved.length ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-700 px-1 text-[9px] text-white">
                {state.saved.length}
              </span>
            ) : null}
          </Button>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="w-40 border-0 bg-white shadow-sm"
            aria-label="Sort marketplace"
          >
            <option value="featured">Featured</option>
            <option value="popular">Most purchased</option>
            <option value="rating">Highest rated</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </Select>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">
            {visible.length} {visible.length === 1 ? "resource" : "resources"}
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {savedOnly ? "Showing saved items" : "Fixture catalogue"}
          </p>
        </div>

        {visible.length ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            icon={<ShoppingBag className="h-5 w-5" />}
            title="No resources match this view"
            description="Try a different category, clear the search, or turn off the saved-items filter."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}

        <Card className="mt-8 grid gap-5 border-indigo-100 bg-indigo-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
              Sell your own work
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">
              Turn a repeatable process into a resource.
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-700">
              Marketplace publishing is part of the creator workspace direction. Listings and
              checkout remain in preview until the payments phase is approved.
            </p>
          </div>
          <a
            href="/dashboard/commerce"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            Preview commerce tools
          </a>
        </Card>
      </section>
    </PublicShell>
  );
}
