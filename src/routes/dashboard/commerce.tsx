import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Package,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Badge,
  Button,
  Card,
  ComingSoonBadge,
  EmptyState,
  Input,
  Modal,
  Select,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  buttonClass,
} from "@/components/ui";
import { orders, products } from "@/data/seed";
import type { Order } from "@/data/types";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/commerce")({
  head: () => ({ meta: [{ title: "Commerce — The Scenes creator workspace" }] }),
  component: CommercePage,
});

function CommercePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("orders");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const paidOrders = orders.filter((order) => order.status === "paid");
  const gross = paidOrders.reduce((sum, order) => sum + order.amount, 0);
  const refunds = orders
    .filter((order) => order.status === "refunded")
    .reduce((sum, order) => sum + order.amount, 0);
  const pending = orders
    .filter((order) => order.status === "pending")
    .reduce((sum, order) => sum + order.amount, 0);

  // A plain filter is cheaper than a manual memo here, and the React Compiler cannot preserve the
  // manual memoization in this component, so keeping it produced no benefit.
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrders = orders.filter((order) => {
    const statusMatch = status === "all" || order.status === status;
    const queryMatch =
      !normalizedQuery ||
      `${order.id} ${order.customer} ${order.item} ${order.kind}`
        .toLowerCase()
        .includes(normalizedQuery);
    return statusMatch && queryMatch;
  });

  return (
    <CreatorShell active="commerce">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Commerce
                </p>
                <Badge tone="amber">Sample data · no money moves</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Orders, products and payouts.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Explore the commercial interface with sample orders. Payments, refunds and payouts
                are coming soon.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="md" onClick={() => setProductOpen(true)}>
                <Plus className="h-4 w-4" /> New product
              </Button>
              <Button size="md" onClick={() => setPayoutOpen(true)}>
                <Wallet className="h-4 w-4" /> Request payout
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Card className="border-indigo-100 bg-indigo-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700 ring-1 ring-indigo-100">
                <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-extrabold text-slate-900">
                    Monetization &amp; Payouts are in development
                  </p>
                  <ComingSoonBadge>Coming soon</ComingSoonBadge>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
                  Enjoy zero platform fees today — no payment can be processed while the payment
                  layer is being built. Nothing below is a real balance and nothing can be
                  withdrawn.
                </p>
              </div>
            </div>
            <a href="/pricing" className={buttonClass("secondary", "md")}>
              How early access works
            </a>
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Gross paid sales" value={formatMoney(gross)} hint="No orders yet" />
          <Stat label="Platform fees" value={formatMoney(0)} hint="Zero during early access" />
          <Stat label="Refunded" value={formatMoney(refunds)} hint="No refunds yet" />
          <Stat label="Pending" value={formatMoney(pending)} hint="Not settled" />
        </div>

        <div className="mt-6">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>
              <p className="text-xs font-semibold text-slate-500">
                Preview ledger · {orders.length} orders
              </p>
            </div>

            <TabsContent value="orders">
              <Card className="mt-4 overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
                  <div className="relative min-w-52 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <label htmlFor="order-search" className="sr-only">
                      Search orders
                    </label>
                    <Input
                      id="order-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search order, customer or item"
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-40"
                    aria-label="Filter orders by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toast(
                        "CSV export is coming soon",
                        "No file was generated or downloaded in this preview.",
                      )
                    }
                  >
                    <Download className="h-4 w-4" /> Export
                  </Button>
                </div>

                {visibleOrders.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                        <tr>
                          <th scope="col" className="px-4 py-2.5">
                            Order
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Customer
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Item
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Date
                          </th>
                          <th scope="col" className="px-4 py-2.5 text-right">
                            Amount
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-2.5 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                              {order.id}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{order.customer}</p>
                              <p className="text-xs text-slate-500">{order.kind}</p>
                            </td>
                            <td className="max-w-56 truncate px-4 py-3 text-slate-700">
                              {order.item}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {formatDate(order.date)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                              {formatMoney(order.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                tone={
                                  order.status === "paid"
                                    ? "green"
                                    : order.status === "pending"
                                      ? "amber"
                                      : "slate"
                                }
                              >
                                {order.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<ReceiptText className="h-5 w-5" />}
                    title={orders.length ? "No orders match" : "No orders yet"}
                    description={
                      orders.length
                        ? "Clear the search or choose another status."
                        : "Orders appear here once payments are connected. Nothing is fabricated in the meantime."
                    }
                    action={
                      orders.length ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setQuery("");
                            setStatus("all");
                          }}
                        >
                          Reset filters
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </Card>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                <p className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 shrink-0" />{" "}
                  {orders.length
                    ? "Orders are samples. Refunds, taxes and chargebacks are coming soon."
                    : "There are no orders yet. Refunds, taxes and chargebacks arrive with payments."}
                </p>
                <a href="/pricing" className="font-bold underline underline-offset-2">
                  How free early access works
                </a>
              </div>
            </TabsContent>

            <TabsContent value="products">
              {products.length ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {products.map((product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                          <Package className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-sm font-bold text-slate-900">
                              {product.title}
                            </h2>
                            {product.bestseller ? <Badge tone="clay">Bestseller</Badge> : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{product.category}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="font-semibold text-slate-900">
                              {formatMoney(product.price)}
                            </span>
                            <span>{product.sales.toLocaleString()} sales</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <a
                          href={`/marketplace/${product.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                        >
                          Public page <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            toast(
                              "Product editing unavailable",
                              "Marketplace publishing is coming soon.",
                            )
                          }
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Edit listing
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-4"
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title="No products yet"
                  description="Marketplace listings appear here after the marketplace and payments are connected. Nothing is fabricated in the meantime."
                  action={
                    <Button variant="secondary" onClick={() => setProductOpen(true)}>
                      <Plus className="h-4 w-4" /> New product
                    </Button>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="payouts">
              <EmptyState
                className="mt-4 border-indigo-200 bg-indigo-50"
                icon={<Wallet className="h-5 w-5" />}
                title="Monetization & Payouts are in development"
                description="Enjoy zero platform fees today. Payout requests open once payments, identity checks and settlement rules are connected — and this build never moves money."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => setPayoutOpen(true)}>
                      <Wallet className="h-4 w-4" /> Request payout
                    </Button>
                    <a href="/pricing" className={buttonClass("secondary", "md")}>
                      <CircleDollarSign className="h-4 w-4" /> How early access works
                    </a>
                  </div>
                }
              />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-slate-600">
          <CreditCard className="h-3.5 w-3.5" /> Commerce snapshot ·{" "}
          {formatDate("2026-11-03")} ·<span>Live payments coming soon</span>
        </p>
      </div>

      <Modal
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => (!open ? setSelectedOrder(null) : undefined)}
        title={`Order ${selectedOrder?.id ?? ""}`}
        description="Sample order detail. No payment provider record exists behind this view."
        footer={
          <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
            Close
          </Button>
        }
      >
        {selectedOrder ? (
          <div className="space-y-4">
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {[
                ["Customer", selectedOrder.customer],
                ["Item", selectedOrder.item],
                ["Type", selectedOrder.kind],
                ["Date", formatDate(selectedOrder.date)],
                ["Amount", formatMoney(selectedOrder.amount)],
                ["Platform fee", formatMoney(0)],
                ["Status", selectedOrder.status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-wrap justify-between gap-2 px-3.5 py-2.5 text-sm"
                >
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              Refunds and receipt resends are not available in the frontend phase. This modal never
              claims a provider action succeeded.
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        title="Payouts are coming soon"
        description="Payout requests open once payments are connected."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPayoutOpen(false)}>
              Close
            </Button>
            <a href="/pricing" className={buttonClass("primary", "md")}>
              How early access works
            </a>
          </div>
        }
      >
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>
            Payouts need a payment provider, identity checks, settlement rules, tax handling and a
            verified ledger. Those are being built.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            There are no orders yet, so these figures are zero. Nothing here is a balance that can
            be withdrawn.
          </div>
        </div>
      </Modal>

      <Modal
        open={productOpen}
        onOpenChange={setProductOpen}
        title="Product publishing is coming soon"
        description="The listing form opens once the marketplace goes live."
        footer={
          <Button variant="secondary" onClick={() => setProductOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-sm leading-6 text-slate-700">
          Marketplace discovery and product detail are ready to explore. Creating and publishing a
          real listing needs media storage, payment setup, moderation and delivery rules, so
          publishing is coming soon. The public catalogue uses sample products until then.
        </p>
      </Modal>
    </CreatorShell>
  );
}
