import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  Check,
  Wallet,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Zap,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { getCreatorDashboard, requestWithdrawal } from "@/lib/monetization.functions";
import { getPayoutSetup } from "@/lib/payouts.functions";
import type { EarningsSummary } from "@/lib/monetization/earnings";
import type { WithdrawalRequest } from "@/lib/monetization/withdrawals";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getLastSixMonths() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { month: MONTHS_SHORT[d.getMonth()], amount: 0 };
  });
}

function fmt(cents: number, currency = "NGN") {
  const sym = currency === "NGN" ? "₦" : "$";
  return `${sym}${(cents / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const Route = createFileRoute("/app/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts & Financials · SukaSpace" },
      {
        name: "description",
        content: "Manage your earnings, view transaction history, and configure withdrawals.",
      },
    ],
  }),
  component: PayoutsPage,
});

type DashboardData = Awaited<ReturnType<typeof getCreatorDashboard>>;
type PayoutAccountView = Awaited<ReturnType<typeof getPayoutSetup>>["account"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  reversed: "bg-slate-100 text-slate-700",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  processing: <Zap size={12} />,
  paid: <CheckCircle2 size={12} />,
  failed: <XCircle size={12} />,
  reversed: <XCircle size={12} />,
};

function PayoutsPage() {
  const store = useAppStore();
  const email = store.session?.email;
  const role = store.session?.role;

  const [data, setData] = useState<DashboardData | null>(null);
  const [payoutAcct, setPayoutAcct] = useState<PayoutAccountView>(null);
  const [loading, setLoading] = useState(true);
  const [exported, setExported] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [wdType, setWdType] = useState<"standard" | "instant">("standard");
  const [submitting, setSubmitting] = useState(false);
  const [txnQuery, setTxnQuery] = useState("");

  const isCreator = role === "creator";

  const load = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const [dash, payout] = await Promise.all([
        getCreatorDashboard({ data: { creatorEmail: email } }),
        getPayoutSetup({ data: { creatorEmail: email } }).catch(() => ({ account: null })),
      ]);
      setData(dash);
      setPayoutAcct(payout.account);
    } catch {
      toast.error("Could not load financial data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [email]);

  const earnings: EarningsSummary | null = data?.earnings ?? null;
  const withdrawals: WithdrawalRequest[] = data?.recentWithdrawals ?? [];
  const ledger = data?.recentEarnings ?? [];

  // Build monthly earnings from ledger (revenue entries)
  const monthlyEarnings = useMemo(() => {
    const months = getLastSixMonths();
    ledger
      .filter((e) => e.entryType === "revenue")
      .forEach((e) => {
        const d = new Date(e.createdAt);
        const mon = MONTHS_SHORT[d.getMonth()];
        const idx = months.findIndex((m) => m.month === mon);
        if (idx >= 0) months[idx].amount += e.amountCents;
      });
    return months;
  }, [ledger]);
  const maxEarning = Math.max(...monthlyEarnings.map((m) => m.amount), 1);

  // All transactions for the table (ledger + withdrawals merged)
  const allTxns = useMemo(() => {
    const rows: {
      id: string;
      desc: string;
      amountCents: number;
      date: string;
      type: "credit" | "debit";
      status: string;
    }[] = [];
    ledger.forEach((e) =>
      rows.push({
        id: e.id,
        desc: e.description || (e.entryType === "revenue" ? "Payment received" : e.entryType),
        amountCents: e.amountCents,
        date: fmtDate(e.createdAt),
        type: e.amountCents >= 0 ? "credit" : "debit",
        status: "completed",
      }),
    );
    withdrawals.forEach((w) =>
      rows.push({
        id: w.id,
        desc: `Withdrawal (${w.withdrawalType})`,
        amountCents: -w.netAmountCents,
        date: fmtDate(w.requestedAt),
        type: "debit",
        status: w.status,
      }),
    );
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledger, withdrawals]);

  const filteredTxns = useMemo(() => {
    const q = txnQuery.trim().toLowerCase();
    return q ? allTxns.filter((t) => t.desc.toLowerCase().includes(q)) : allTxns;
  }, [allTxns, txnQuery]);

  const handleExport = () => {
    const rows = [
      "date,description,type,amount,status",
      ...allTxns.map(
        (t) => `${t.date},"${t.desc}",${t.type},${(t.amountCents / 100).toFixed(2)},${t.status}`,
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payouts.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleWithdraw = async () => {
    if (!email) return;
    const amountCents = Math.round(parseFloat(amount.replace(/,/g, "")) * 100);
    if (!amountCents || amountCents <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!payoutAcct?.isPayoutReady) {
      toast.error("Set up your payout account in Settings → Payouts first.");
      setWithdrawOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestWithdrawal({
        data: { creatorEmail: email, amountCents, currency: "NGN", withdrawalType: wdType },
      });
      if (result.ok) {
        toast.success("Withdrawal request submitted. Processing within 1–3 business days.");
        setAmount("");
        setWithdrawOpen(false);
        await load(); // refresh
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableCents = earnings?.availableBalanceCents ?? 0;
  const grossCents = earnings?.grossEarnedCents ?? 0;
  const withdrawnCents = earnings?.totalWithdrawnCents ?? 0;
  const pendingCents = earnings?.pendingCents ?? 0;
  const currency = earnings?.currency ?? "NGN";
  const plan = data?.plan ?? "free";

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payouts &amp; Financials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time earnings, withdrawal requests, and payout history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={allTxns.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          >
            {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}
            {exported ? "Exported!" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Payout account missing banner */}
      {!loading && isCreator && !payoutAcct?.isPayoutReady && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-800">Connect your payout account</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Add a bank account or MoMo destination in Settings so we know where to send your
              earnings.
            </div>
          </div>
          <Link
            to="/app/settings"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Set up payout <ExternalLink size={11} />
          </Link>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Available Balance",
            value: fmt(availableCents, currency),
            sub: "Ready to withdraw",
            icon: Wallet,
            highlight: true,
          },
          {
            label: "Total Earned",
            value: fmt(grossCents, currency),
            sub: "Gross lifetime revenue",
            icon: TrendingUp,
            highlight: false,
          },
          {
            label: "Total Withdrawn",
            value: fmt(withdrawnCents, currency),
            sub: "Paid out so far",
            icon: Download,
            highlight: false,
          },
          {
            label: "Pending",
            value: fmt(pendingCents, currency),
            sub: "Awaiting processing",
            icon: Clock,
            highlight: false,
          },
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
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${s.highlight ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground"}`}
                >
                  <Icon size={15} />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
              </div>
              {loading ? (
                <div className="mt-3 h-7 w-28 animate-pulse rounded-md bg-accent" />
              ) : (
                <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  {s.value}
                </div>
              )}
              <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
              {s.highlight && (
                <button
                  onClick={() => setWithdrawOpen(true)}
                  disabled={availableCents <= 0 || !isCreator}
                  className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Request Withdrawal
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Chart + plan info */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* Earnings bar chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Monthly Revenue</h2>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Last 6 Months
            </span>
          </div>
          {loading ? (
            <div className="mt-5 flex h-44 items-end gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 animate-pulse rounded-t-md bg-accent"
                  style={{ height: `${20 + i * 15}px` }}
                />
              ))}
            </div>
          ) : monthlyEarnings.every((m) => m.amount === 0) ? (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-center">
              <TrendingUp size={24} className="text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No revenue yet</p>
              <p className="text-xs text-muted-foreground">
                Earnings will appear here once members start paying.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex h-44 items-end gap-2">
              {monthlyEarnings.map((m, i) => {
                const h = Math.max(8, Math.round((m.amount / maxEarning) * 160));
                return (
                  <div
                    key={i}
                    className="group flex flex-1 flex-col items-center gap-1.5 cursor-default"
                  >
                    <div className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {fmt(m.amount, currency)}
                    </div>
                    <div
                      className="w-full rounded-t-md bg-primary/20 group-hover:bg-primary transition-colors"
                      style={{ height: `${h}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Plan + payout info */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2.5">
              <span className="text-xs font-semibold text-foreground">Plan</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${plan === "pro" ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}
              >
                {plan}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2.5">
              <span className="text-xs font-semibold text-foreground">Platform Fee</span>
              <span className="text-xs font-semibold text-foreground">
                {plan === "pro" ? "3%" : "7%"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2.5">
              <span className="text-xs font-semibold text-foreground">Payout Account</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${payoutAcct?.isPayoutReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {payoutAcct?.isPayoutReady ? "Connected" : "Not set"}
              </span>
            </div>
            {payoutAcct?.accountName && (
              <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
                <Building2 size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground">
                    {payoutAcct.accountName}
                  </div>
                  {payoutAcct.bankCode && (
                    <div className="text-[10px] text-muted-foreground">
                      Bank code: {payoutAcct.bankCode}
                    </div>
                  )}
                </div>
              </div>
            )}
            {plan !== "pro" && (
              <Link
                to="/app/billing"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <Zap size={12} /> Upgrade to Pro — lower fees
              </Link>
            )}
            <Link
              to="/app/settings"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Manage payout settings
            </Link>
          </div>
        </div>
      </div>

      {/* Recent withdrawals */}
      {withdrawals.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Withdrawal Requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${STATUS_COLORS[w.status] ?? "bg-slate-100 text-slate-500"}`}
                >
                  {STATUS_ICON[w.status] ?? <Clock size={12} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">
                    {fmt(w.netAmountCents, w.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmtDate(w.requestedAt)} · {w.withdrawalType}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[w.status] ?? "bg-slate-100 text-slate-500"}`}
                >
                  {w.status}
                </span>
                {w.feeCents > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Fee: {fmt(w.feeCents, w.currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-xs text-muted-foreground">🔍</span>
            <input
              value={txnQuery}
              onChange={(e) => setTxnQuery(e.target.value)}
              placeholder="Search…"
              className="w-36 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
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
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4">
                      <div className="h-3 w-16 animate-pulse rounded bg-accent" />
                    </td>
                    <td className="py-3">
                      <div className="h-3 w-40 animate-pulse rounded bg-accent" />
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="h-3 w-16 animate-pulse rounded bg-accent" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="ml-auto h-3 w-20 animate-pulse rounded bg-accent" />
                    </td>
                  </tr>
                ))
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    {txnQuery ? `No transactions matching "${txnQuery}".` : "No transactions yet."}
                  </td>
                </tr>
              ) : (
                filteredTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${t.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {t.type === "credit" ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}
                        </span>
                        <span className="text-sm text-foreground">{t.desc}</span>
                      </div>
                    </td>
                    <td className="py-2.5 hidden sm:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[t.status] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-semibold ${t.amountCents >= 0 ? "text-emerald-600" : "text-foreground"}`}
                    >
                      {t.amountCents >= 0 ? "+" : ""}
                      {fmt(t.amountCents, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw modal */}
      <AnimatePresence>
        {withdrawOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
            onClick={() => setWithdrawOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Request Withdrawal</h2>
                <button
                  onClick={() => setWithdrawOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Available:{" "}
                <span className="font-semibold text-foreground">
                  {fmt(availableCents, currency)}
                </span>
              </p>
              {payoutAcct?.accountName && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/60 px-3 py-2.5">
                  <Building2 size={14} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">
                      {payoutAcct.accountName}
                    </div>
                    {payoutAcct.bankCode && (
                      <div className="text-[10px] text-muted-foreground">
                        Code: {payoutAcct.bankCode}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-3">
                {/* Withdrawal type */}
                <div className="grid grid-cols-2 gap-2">
                  {(["standard", "instant"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setWdType(t)}
                      className={`rounded-xl border py-2.5 text-xs font-semibold capitalize transition-all ${wdType === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"}`}
                    >
                      {t === "instant" ? "⚡ Instant" : "Standard"}
                    </button>
                  ))}
                </div>
                {wdType === "instant" && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    Instant withdrawals carry an additional fee. Available to Pro plan only.
                  </p>
                )}
                {/* Amount */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Minimum ₦10,000 · Processed within 1–3 business days
                  </p>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={!amount || Number(amount) <= 0 || submitting}
                  className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {submitting ? "Submitting…" : "Confirm Withdrawal"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
