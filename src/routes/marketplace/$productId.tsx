import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { ProductCard } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import { Avatar, Badge, Button, Card, CoverArt, Modal, buttonClass } from "@/components/ui";
import { getCreator, getProduct, products } from "@/data/seed";
import { formatCompact, formatMoney } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/marketplace/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.title ?? "Resource"} — The Scenes Marketplace` },
      {
        name: "description",
        content: loaderData?.product.blurb ?? "A practical resource from a working creator.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const creator = getCreator(product.creatorHandle);
  const { state, purchase, toggleSave } = useApp();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const purchased = state.purchases.includes(product.id);
  const saved = state.saved.includes(product.slug);
  const related = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3);
  const fee = Math.round(product.price * 0.03 * 100) / 100;

  const confirmPurchase = () => {
    purchase(product.id);
    setCompleted(true);
    toast("Preview purchase recorded", "No payment was processed and no file was delivered.");
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    window.setTimeout(() => setCompleted(false), 250);
  };

  return (
    <PublicShell active="/marketplace">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <nav
            className="flex items-center gap-2 overflow-hidden text-xs font-medium text-slate-500"
            aria-label="Breadcrumb"
          >
            <a
              href="/marketplace"
              className="inline-flex shrink-0 items-center gap-1 hover:text-indigo-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
            </a>
            <span>/</span>
            <span className="truncate text-slate-700">{product.category}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="min-w-0">
          <CoverArt
            seed={product.slug}
            hue={product.accentHue}
            rounded="rounded-2xl"
            className="aspect-[16/9] w-full border border-slate-200"
            label={product.category}
          />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {product.bestseller ? <Badge tone="clay">Bestseller</Badge> : null}
            <Badge tone="outline">{product.category}</Badge>
            <Badge tone="green">Instant access planned</Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{product.blurb}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <strong className="text-slate-900">{product.rating}</strong> ({product.reviews}{" "}
              reviews)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {formatCompact(product.sales)} purchases
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-4 w-4" /> {product.format}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
            <Avatar name={creator?.name ?? "Creator"} size={42} online />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500">Made by</p>
              <a
                href={`/creators/${creator?.handle}`}
                className="text-sm font-bold text-slate-900 hover:text-indigo-700"
              >
                {creator?.name}
              </a>
            </div>
            <a href={`/creators/${creator?.handle}`} className={buttonClass("secondary", "sm")}>
              View creator
            </a>
          </div>

          <section className="mt-8" aria-labelledby="about-resource">
            <h2 id="about-resource" className="font-display text-xl font-extrabold text-slate-900">
              About this resource
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-700">{product.description}</p>
          </section>

          <section className="mt-8" aria-labelledby="included-heading">
            <h2
              id="included-heading"
              className="font-display text-xl font-extrabold text-slate-900"
            >
              What is included
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {product.includes.map((item) => (
                <div
                  key={item}
                  className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-6 text-slate-700"
                >
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="format-heading">
            <h2 id="format-heading" className="font-display text-xl font-extrabold text-slate-900">
              Format and access
            </h2>
            <dl className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <dt className="text-slate-500">Format</dt>
                <dd className="font-semibold text-slate-900">{product.format}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <dt className="text-slate-500">Delivery</dt>
                <dd className="font-semibold text-slate-900">
                  Digital download · not connected in preview
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <dt className="text-slate-500">Updates</dt>
                <dd className="font-semibold text-slate-900">Lifetime updates planned</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <dt className="text-slate-500">Licence</dt>
                <dd className="font-semibold text-slate-900">Personal and client work</dd>
              </div>
            </dl>
          </section>

          <section className="mt-8" aria-labelledby="reviews-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="reviews-heading"
                  className="font-display text-xl font-extrabold text-slate-900"
                >
                  Ratings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Aggregate fixture values, not verified customer reviews.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {product.rating} / 5
              </span>
            </div>
            <Card className="mt-3 flex flex-wrap items-center gap-4 p-4">
              <p className="font-display text-4xl font-extrabold text-slate-900">
                {product.rating}
              </p>
              <div className="min-w-0 flex-1">
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={
                        value <= Math.round(product.rating)
                          ? "h-4 w-4 fill-amber-400 text-amber-400"
                          : "h-4 w-4 text-slate-300"
                      }
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {product.reviews} ratings in the preview catalogue
                </p>
              </div>
              <Badge tone="outline">No written reviews yet</Badge>
            </Card>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                  One-time purchase
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="font-display text-3xl font-extrabold text-slate-950">
                    {formatMoney(product.price)}
                  </p>
                  {product.compareAt ? (
                    <p className="text-sm text-slate-400 line-through">
                      {formatMoney(product.compareAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleSave(product.slug)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-indigo-700"
                aria-label={saved ? "Remove from saved items" : "Save item"}
                aria-pressed={saved}
              >
                <ShoppingBag
                  className={saved ? "h-4 w-4 fill-indigo-700 text-indigo-700" : "h-4 w-4"}
                />
              </button>
            </div>

            {purchased ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                  <Check className="h-4 w-4" /> In your preview library
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-900">
                  This purchase exists only in local state. Files are not delivered.
                </p>
              </div>
            ) : (
              <Button className="mt-4 w-full" size="lg" onClick={() => setCheckoutOpen(true)}>
                <ShoppingBag className="h-4 w-4" /> Preview checkout
              </Button>
            )}

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure checkout planned
              </p>
              <p className="flex items-center gap-2">
                <Download className="h-4 w-4 text-indigo-700" /> Digital delivery planned
              </p>
              <p className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-indigo-700" /> Lifetime updates planned
              </p>
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-4 text-amber-950">
              This is a frontend preview. No card is collected, no money moves and no receipt is
              sent.
            </p>
          </Card>

          <Card className="mt-4 p-4">
            <h2 className="text-sm font-bold text-slate-900">Need the context?</h2>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              The creator&apos;s community includes the discussion, updates and questions behind
              this resource.
            </p>
            <a
              href={`/creators/${creator?.handle}`}
              className={buttonClass("secondary", "md", "mt-3 w-full")}
            >
              Explore the creator
            </a>
          </Card>
        </aside>
      </div>

      {related.length ? (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
              More in {product.category}
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Modal
        open={checkoutOpen}
        onOpenChange={(open) => (open ? setCheckoutOpen(true) : closeCheckout())}
        title={completed ? "Preview purchase complete" : "Preview checkout"}
        description={
          completed
            ? "The item is now marked as purchased in local state."
            : "Confirm the order to test the purchase state. No payment method is requested."
        }
        footer={
          completed ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeCheckout}>
                Close
              </Button>
              <a href="/my-learning" className={buttonClass("primary", "md")}>
                Open my learning
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeCheckout}>
                Cancel
              </Button>
              <Button onClick={confirmPurchase}>
                <Lock className="h-4 w-4" /> Confirm preview purchase
              </Button>
            </div>
          )
        }
      >
        {completed ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-950">
              <Check className="h-4 w-4" /> Recorded locally
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">
              No server order was created. No download is available because storage and delivery are
              not connected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <CoverArt
                seed={product.slug}
                hue={product.accentHue}
                className="h-16 w-24 shrink-0"
                rounded="rounded-lg"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{product.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{creator?.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{product.format}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Item</dt>
                <dd className="font-semibold text-slate-900">{formatMoney(product.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Platform fee (preview)</dt>
                <dd className="font-semibold text-slate-900">{formatMoney(fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-bold text-slate-900">Total</dt>
                <dd className="font-display text-lg font-extrabold text-slate-900">
                  {formatMoney(product.price)}
                </dd>
              </div>
            </dl>
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p className="font-semibold text-slate-800">What happens when you confirm?</p>
              <p className="mt-1">
                Only local purchase state changes. There is no card form, payment provider, receipt
                email or file delivery in this phase.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </PublicShell>
  );
}
