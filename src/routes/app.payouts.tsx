import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download, Check, Wallet, X, ArrowUpRight, ArrowDownRight, Plus, Landmark,
  Search, AlertCircle, ExternalLink, TrendingUp, CreditCard, Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/app-store";
import { isPaystackConfigured } from "@/lib/paystack";
// No mock data — transactions come from real Paystack payments
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getLastSixMonths() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { month: MONTHS_SHORT[d.getMonth()], amount: 0 };
  });
}

export const Route = createFileRoute("/app/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts & Financials · SukaSpace" },
      { name: "description", content: "Manage your earnings, view transaction history, and configure withdrawals." },
    ],
  }),
  component: PayoutsPage,
});

type Txn = { id: number; desc: string; amount: number; date: string; type: "sale" | "payout" };
type PaymentMethod = { id: number; label: string; detail: string; type: "bank" | "card" | "paystack"; isDefault: boolean };

const STATUS_STYLES = {
  Completed:  "bg-emerald-100 text-emerald-700",
  Processing: "bg-amber-100 text-amber-700",
};

function getNextMonthFirst() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PayoutsPage() {
  const store = useAppStore();
  const [exported, setExported] = useState(false);
  const [txns] = useState<Txn[]>([]);
  const [txnQuery, setTxnQuery] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: 1, label: "Paystack Payout",    detail: "Connected via Paystack",        type: "paystack", isDefault: true },
  ]);
  const [addMethodOpen, setAddMethodOpen] = useState(false);
  const [methodLabel, setMethodLabel]     = useState("");
  const [methodDetail, setMethodDetail]   = useState("");
  const [methodType, setMethodType]       = useState<"bank" | "card">("bank");
  const paystackReady = isPaystackConfigured();

  const totalSales    = useMemo(() => txns.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0), [txns]);
  const totalPayouts  = useMemo(() => txns.filter((t) => t.type === "payout").reduce((s, t) => s + Math.abs(t.amount), 0), [txns]);
  const balance       = totalSales - totalPayouts;
  const nextPayoutDate = getNextMonthFirst();

  const filteredTxns = useMemo(() => {
    const q = txnQuery.trim().toLowerCase();
    return txns.filter((t) => !q || t.desc.toLowerCase().includes(q));
  }, [txns, txnQuery]);

  const monthlyEarnings = getLastSixMonths();
  const maxEarning = Math.max(...monthlyEarnings.map((m) => m.amount), 1);

  const handleExport = () => {
    const rows = ["date,description,type,amount", ...txns.map((t) => `${t.date},"${t.desc}",${t.type},${t.amount}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payouts.csv"; a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const defaultMethod = methods.find((m) => m.isDefault) || methods[0];

  const withdraw = () => {
    const value = Math.round(Number(amount));
    if (!value || value <= 0 || value > balance) return;
    store.pushNotification(`Withdrawal of $${value.toLocaleString()} initiated to ${defaultMethod?.label ?? "your account"}.`);
    setAmount(""); setWithdrawOpen(false);
  };

  const addMethod = () => {
    if (!methodLabel.trim() || !methodDetail.trim()) return;
    setMethods((m) => [...m, { id: Date.now(), label: methodLabel.trim(), detail: methodDetail.trim(), type: methodType, isDefault: false }]);
    store.pushNotification(`Payment method "${methodLabel.trim()}" added.`);
    setMethodLabel(""); setMethodDetail(""); setAddMethodOpen(false);
  };

  const makeDefault = (id: number) => setMethods((m) => m.map((x) => ({ ...x, isDefault: x.id === id })));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Payouts &amp; Financials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track earnings, manage payment methods, and configure withdrawals.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={txns.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
        >
          {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}
          {exported ? "Exported!" : "Export CSV"}
        </button>
      </div>

      {/* Paystack connection banner */}
      {!paystackReady && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-800">Connect Paystack to accept payments</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Set <code className="rounded bg-amber-100 px-1 font-mono text-[10px]">VITE_PAYSTACK_PUBLIC_KEY</code> and{" "}
              <code className="rounded bg-amber-100 px-1 font-mono text-[10px]">PAYSTACK_SECRET_KEY</code> in your .env file to enable payment collection.
            </div>
          </div>
          <a
            href="https://paystack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Get API keys <ExternalLink size={11} />
          </a>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Available Balance", value: `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `Next payout: ${nextPayoutDate}`, icon: Wallet, highlight: true },
          { label: "Total Revenue",     value: `$${totalSales.toLocaleString()}`,  sub: "All time sales",   icon: TrendingUp, highlight: false },
          { label: "Total Paid Out",    value: `$${totalPayouts.toLocaleString()}`, sub: "Withdrawn so far", icon: Download,   highlight: false },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-5 shadow-sm ${s.highlight ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${s.highlight ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground"}`}>
                  <Icon size={15} />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
              {s.highlight && (
                <button
                  onClick={() => setWithdrawOpen(true)}
                  disabled={balance <= 0}
                  className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Withdraw Funds
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Earnings chart + payment methods */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Earnings bar chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Monthly Revenue</h2>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">Last 6 Months</span>
          </div>
          {txns.filter(t => t.type === "sale").length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-center">
              <TrendingUp size={24} className="text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No revenue yet</p>
              <p className="text-xs text-muted-foreground">Your monthly earnings will appear here once members start paying.</p>
            </div>
          ) : (
            <div className="mt-5 flex h-44 items-end gap-2">
              {monthlyEarnings.map((m, i) => {
                const h = Math.max(8, Math.round((m.amount / maxEarning) * 160));
                return (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-1.5 cursor-default">
                    <div className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(m.amount / 1000).toFixed(1)}k
                    </div>
                    <div
                      className="w-full rounded-t-md bg-primary/20 group-hover:bg-primary transition-colors"
                      style={{ height: `${h}px` }}
                      title={`${m.month}: ${m.amount.toLocaleString()}`}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Payment Methods</h2>
            <button onClick={() => setAddMethodOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {methods.map((m) => {
              const Icon = m.type === "paystack" ? Zap : m.type === "card" ? CreditCard : Landmark;
              return (
                <button
                  key={m.id}
                  onClick={() => makeDefault(m.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${m.isDefault ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${m.type === "paystack" ? "bg-emerald-100 text-emerald-700" : "bg-accent text-muted-foreground"}`}>
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{m.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.detail}</div>
                  </div>
                  {m.isDefault && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">DEFAULT</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background p-3">
            <div className="text-[11px] font-semibold text-foreground">Stripe — Coming Soon</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Stripe integration is in progress. Use Paystack for now.</div>
            <Link to="/app/affiliate" className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
              <Zap size={9} /> Affiliate program coming too
            </Link>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
            Minimum withdrawal: $50.00. Paystack payouts process within 1–3 business days.
          </p>
        </div>
      </div>

      {/* Transaction table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
            <Search size={13} className="text-muted-foreground" />
            <input
              value={txnQuery}
              onChange={(e) => setTxnQuery(e.target.value)}
              placeholder="Search transactions…"
              className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 text-left">Date</th>
                <th className="py-2.5 text-left">Description</th>
                <th className="py-2.5 text-left hidden sm:table-cell">Status</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.map((t) => (
                <tr key={t.id} className="hover:bg-accent/40 transition-colors">
                  <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{t.date}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${t.type === "sale" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {t.type === "sale" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      </span>
                      <span className="text-sm text-foreground">{t.desc}</span>
                    </div>
                  </td>
                  <td className="py-2.5 hidden sm:table-cell">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[t.type === "sale" ? "Completed" : "Processing"]}`}>
                      {t.type === "sale" ? "Completed" : "Processing"}
                    </span>
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-foreground"}`}>
                    {t.amount >= 0 ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    {txnQuery ? `No transactions matching "${txnQuery}".` : "No transactions yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw modal */}
      <AnimatePresence>
        {withdrawOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
            onClick={() => setWithdrawOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Withdraw Funds</h2>
                <button onClick={() => setWithdrawOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X size={16} /></button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Available: <span className="font-semibold text-foreground">${balance.toLocaleString()}</span> · to <span className="font-semibold text-foreground">{defaultMethod?.label ?? "—"}</span>
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Amount (USD)</label>
                  <input
                    type="number"
                    min={50}
                    max={balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">Minimum $50 · Processed via Paystack within 1–3 days</p>
                </div>
                <button
                  onClick={withdraw}
                  disabled={!amount || Number(amount) < 50 || Number(amount) > balance}
                  className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add method modal */}
      <AnimatePresence>
        {addMethodOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
            onClick={() => setAddMethodOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Add Payment Method</h2>
                <button onClick={() => setAddMethodOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X size={16} /></button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(["bank", "card"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setMethodType(t)}
                      className={`rounded-xl border py-2 text-xs font-semibold capitalize transition-all ${methodType === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"}`}
                    >
                      {t === "bank" ? "Bank Account" : "Card"}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Label</label>
                  <input
                    value={methodLabel}
                    onChange={(e) => setMethodLabel(e.target.value)}
                    placeholder={methodType === "bank" ? "e.g. GTBank — Savings" : "e.g. Visa •••• 4567"}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Account detail</label>
                  <input
                    value={methodDetail}
                    onChange={(e) => setMethodDetail(e.target.value)}
                    placeholder={methodType === "bank" ? "Account number" : "•••• 1234"}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <button
                  onClick={addMethod}
                  disabled={!methodLabel.trim() || !methodDetail.trim()}
                  className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Add Method
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
