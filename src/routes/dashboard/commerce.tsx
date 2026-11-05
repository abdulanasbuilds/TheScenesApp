import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Badge,
  Button,
  Card,
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
import { getCreator, orders, products } from "@/data/seed";
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
  const fees = paidOrders.reduce((sum, order) => sum + order.fee, 0);
  const refunds = orders
    .filter((order) => order.status === "refunded")
    .reduce((sum, order) => sum + order.amount, 0);
  const pending = orders
    .filter((order) => order.status === "pending")
    .reduce((sum, order) => sum + order.amount, 0);

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const statusMatch = status === "all" || order.status === status;
      const queryMatch =
        !normalized ||
        `${order.id} ${order.customer} ${order.item} ${order.kind}`
          .toLowerCase()
          .includes(normalized);
      return statusMatch && queryMatch;
    });
  }, [query, status]);

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
                <Badge tone="amber">Fixture data · no money moves</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Orders, products and payouts.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Validate the commercial interface with deterministic orders. Payment providers,
                refunds and payouts are intentionally not connected.
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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Gross paid sales"
            value={formatMoney(gross)}
            hint="Paid fixture orders only"
          />
          <Stat
            label="Net after 3% fee"
            value={formatMoney(gross - fees)}
            hint="Illustrative Pro fee model"
          />
          <Stat label="Refunded" value={formatMoney(refunds)} hint="One refunded fixture order" />
          <Stat label="Pending" value={formatMoney(pending)} hint="Not settled · no provider" />
        </div>

        <div className="mt-6">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>
              <p className="text-xs font-semibold text-slate-500">Preview ledger · 8 orders</p>
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
                      toast("Export prepared", "CSV export is not connected in this preview.")
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
                    title="No orders match"
                    description="Clear the search or choose another status."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setQuery("");
                          setStatus("all");
                        }}
                      >
                        Reset filters
                      </Button>
                    }
                  />
                )}
              </Card>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                <p className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 shrink-0" /> Orders are fixture records.
                  Refunds, taxes and chargebacks are not implemented.
                </p>
                <a href="/pricing" className="font-bold underline underline-offset-2">
                  Read the commercial boundary
                </a>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {products.map((product) => {
                  const creator = getCreator(product.creatorHandle);
                  return (
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
                          <p className="mt-0.5 text-xs text-slate-500">
                            {product.category} · {creator?.name}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="font-semibold text-slate-900">
                              {formatMoney(product.price)}
                            </span>
                            <span>{product.sales.toLocaleString()} sales</span>
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Published
                              fixture
                            </span>
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
                              "Marketplace publishing belongs to a later product phase.",
                            )
                          }
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Edit listing
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="payouts">
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                <Card className="overflow-hidden">
                  <div className="border-b border-slate-200 bg-slate-950 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold tracking-[0.14em] text-slate-300 uppercase">
                        Available balance
                      </p>
                      <Badge className="bg-white/10 text-slate-200 ring-1 ring-white/15">
                        Preview
                      </Badge>
                    </div>
                    <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
                      {formatMoney(gross - fees)}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Net of illustrative 3% platform fee
                    </p>
                  </div>
                  <div className="p-5">
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Paid gross</dt>
                        <dd className="font-semibold text-slate-900">{formatMoney(gross)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Platform fee</dt>
                        <dd className="font-semibold text-slate-900">-{formatMoney(fees)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Refunded</dt>
                        <dd className="font-semibold text-slate-900">-{formatMoney(refunds)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-3">
                        <dt className="font-bold text-slate-900">Estimated payout</dt>
                        <dd className="font-display text-xl font-extrabold text-slate-900">
                          {formatMoney(gross - fees - refunds)}
                        </dd>
                      </div>
                    </dl>
                    <Button className="mt-5 w-full" onClick={() => setPayoutOpen(true)}>
                      <Banknote className="h-4 w-4" /> Request payout
                    </Button>
                    <p className="mt-3 text-center text-[11px] leading-4 text-slate-500">
                      No payout provider is connected. This button opens a preview explanation.
                    </p>
                  </div>
                </Card>

                <div className="space-y-4">
                  <Card className="p-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <RefreshCw className="h-4 w-4 text-indigo-700" /> Payout schedule
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Standard automated payouts are part of the plan direction. Settlement timing,
                      KYC and provider fees remain undecided.
                    </p>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Next planned window</p>
                      <p className="mt-0.5">Friday · 7 November 2026</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What is connected
                    </h2>
                    <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                      <li>• Local purchase state for marketplace testing</li>
                      <li>• Fixture orders and fee display</li>
                      <li>• Clear commercial boundary messaging</li>
                    </ul>
                    <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[11px] leading-4 text-amber-950">
                      Not connected: cards, mobile money, payouts, tax, receipts or refunds.
                    </p>
                  </Card>
                  <a href="/pricing" className={buttonClass("secondary", "md", "w-full")}>
                    <CircleDollarSign className="h-4 w-4" /> View plan structure
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-slate-600">
          <CreditCard className="h-3.5 w-3.5" /> Commerce fixture snapshot ·{" "}
          {formatDate("2026-11-03")} ·<span>No production provider connected</span>
        </p>
      </div>

      <Modal
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => (!open ? setSelectedOrder(null) : undefined)}
        title={`Order ${selectedOrder?.id ?? ""}`}
        description="Fixture order detail. No payment provider record exists behind this view."
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
                ["Platform fee", formatMoney(selectedOrder.fee)],
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
        title="Payouts are not connected"
        description="This preview cannot move money or create a payout request."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPayoutOpen(false)}>
              Close
            </Button>
            <a href="/pricing" className={buttonClass("primary", "md")}>
              Review plan terms
            </a>
          </div>
        }
      >
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>
            A production payout flow needs a payment provider, identity checks, settlement rules,
            tax handling and a verified ledger. None of those exist in this build.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            The figures on this page are derived from fixture orders. They are not a balance and
            cannot be withdrawn.
          </div>
        </div>
      </Modal>

      <Modal
        open={productOpen}
        onOpenChange={setProductOpen}
        title="Product publishing is a later phase"
        description="The listing form is not being faked into a working marketplace."
        footer={
          <Button variant="secondary" onClick={() => setProductOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-sm leading-6 text-slate-700">
          Marketplace discovery and product detail are implemented. Creating and publishing a real
          listing requires media storage, payment setup, moderation and delivery rules. The public
          catalogue uses fixture products until those decisions are made.
        </p>
      </Modal>
    </CreatorShell>
  );
}
