import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Layers } from "lucide-react";
import { CommunityCard } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Button, Card, EmptyState, buttonClass } from "@/components/ui";
import { categories } from "@/data/seed";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/categories/$slug")({
  loader: ({ params }) => {
    const category = categories.find((item) => item.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? "Category"} — The Scenes` },
      {
        name: "description",
        content:
          loaderData?.category.blurb ??
          "Browse focused communities and practical courses by category on The Scenes.",
      },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { communities, dataMode } = useApp();
  const scoped = communities.filter((community) => community.categorySlug === category.slug);
  const otherCategories = categories.filter((item) => item.slug !== category.slug);

  return (
    <PublicShell active="/explore">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/explore"
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Explore
            </a>
            <span className="text-xs text-slate-400" aria-hidden="true">
              /
            </span>
            <span className="text-xs font-semibold text-slate-500">{category.name}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: `hsl(${category.hue} 52% 44%)` }}
                  aria-hidden="true"
                />
                <Badge tone="outline">Category</Badge>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                {category.name}
              </h1>
              <p className="mt-2 text-base leading-7 text-slate-600">{category.blurb}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold tabular-nums text-slate-900">
                {scoped.length}
              </p>
              <p className="text-xs text-slate-500">
                {scoped.length === 1 ? "community in this preview" : "communities in this preview"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`/explore?category=${category.slug}`} className={buttonClass("primary", "md")}>
              Filter in Explore <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/explore" className={buttonClass("secondary", "md")}>
              All categories
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {dataMode === "fixtures"
              ? "Sample catalogue for this preview"
              : "Connected pre-production catalogue"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
          {scoped.length === 1 ? "Community" : "Communities"}
        </h2>
        {scoped.length ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {scoped.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="No communities in this category yet"
            description="This category is ready, but no community has been published into it in the current catalogue."
            action={
              <Button variant="secondary" onClick={() => window.location.assign("/explore")}>
                Back to Explore
              </Button>
            }
          />
        )}
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
            Other categories
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherCategories.map((item) => (
              <a
                key={item.id}
                href={`/categories/${item.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: `hsl(${item.hue} 52% 44%)` }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-semibold text-slate-800">{item.name}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Teaching in this space? You can open a community around it.
            </p>
            <a href="/become-a-teacher" className={buttonClass("primary", "sm")}>
              Become a teacher
            </a>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
