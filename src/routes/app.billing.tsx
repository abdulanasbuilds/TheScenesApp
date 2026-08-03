import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Shield,
  Zap,
  ChevronRight,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  HardDrive,
  Sparkles,
  BarChart3,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { PLANS, formatCurrency, formatFeeBps, formatStorageQuota } from "@/lib/plans";
import {
  getCreatorDashboard,
  requestWithdrawal,
  initializePayment,
  verifyAndRecordPayment,
} from "@/lib/monetization.functions";
import { initiatePaystackPayment, generateReference } from "@/lib/paystack";
import { getPayoutSetup } from "@/lib/payouts.functions";

export const Route = createFileRoute("/app/billing")({
  head: () => ({ meta: [{ title: "Billing & Payouts · SukaSpace" }] }),
  component: BillingPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "withdraw" | "storage" | "history";

type DashboardData = Awaited<ReturnType<typeof getCreatorDashboard>> | null;

type PayoutAccountView = Awaited<ReturnType<typeof getPayoutSetup>>["account"];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    reversed: "bg-slate-100 text-slate-700",
    completed: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function BillingPage() {
  const store = useAppStore();
  const email = store.session?.email;
  const role = store.session?.role;

  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  // Withdrawal form state
  const [wdAmount, setWdAmount] = useState("");
  const [wdType, setWdType] = useState<"standard" | "instant">("standard");
  const [wdSubmitting, setWdSubmitting] = useState(false);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccountView>(null);

  const isCreator = role === "creator";
  const plan = (data?.plan ?? "free") as "free" | "pro";
  const planMeta = PLANS[plan];

  const fetchDashboard = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const [result, payout] = await Promise.all([
        getCreatorDashboard({ data: { creatorEmail: email } }),
        getPayoutSetup({ data: { creatorEmail: email } }).catch(() => ({ account: null })),
      ]);
      setData(result);
      setPayoutAccount(payout.account);
      if (payout.account?.defaultWithdrawalType) setWdType(payout.account.defaultWithdrawalType);
    } catch {
      toast.error("Failed to load billing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [email]);

  const handleUpgrade = async () => {
    if (!email) return;
    setUpgrading(true);
    try {
      const init = await initializePayment({
        data: { payerEmail: email, paymentType: "pro_subscription", currency: "USD" },
      });
      if (!init.ok) {
        toast.error(init.error);
        return;
      }

      await initiatePaystackPayment({
        email,
        amount: init.amountCents,
        currency: "USD",
        reference: init.reference,
        metadata: { transactionId: init.transactionId, type: "pro_subscription" },
        onSuccess: async (ref) => {
          const verify = await verifyAndRecordPayment({
            data: { reference: ref, transactionId: init.transactionId, userEmail: email },
          });
          if (verify.ok) {
            toast.success("🎉 Welcome to Pro! Your plan is now active.");
            fetchDashboard();
          } else {
            toast.error(verify.error);
          }
        },
        onClose: () => setUpgrading(false),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upgrade failed.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!email) return;
    const amountCents = Math.round(parseFloat(wdAmount.replace(/,/g, "")) * 100);
    if (!amountCents || amountCents <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!payoutAccount?.isPayoutReady) {
      toast.error("Add a payout account in Settings → Payouts first.");
      return;
    }

    setWdSubmitting(true);
    try {
      const result = await requestWithdrawal({
        data: {
          creatorEmail: email,
          amountCents,
          currency: "NGN",
          withdrawalType: wdType,
        },
      });

      if (result.ok) {
        toast.success("Withdrawal request submitted! Processing within 24–48 hours.");
        setWdAmount("");
        fetchDashboard();
      } else {
        toast.error((result as { ok: false; error: string }).error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed.");
    } finally {
      setWdSubmitting(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "withdraw", label: "Withdraw", icon: ArrowDownToLine },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "history", label: "History", icon: Clock },
  ];

  if (!isCreator) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <Wallet size={32} className="mx-auto text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">Creator access only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Billing and payouts are available to creators who have published communities or courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your plan, earnings, and withdrawals.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Plan banner */}
      <div
        className={`mt-6 rounded-xl border p-4 ${plan === "pro" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-lg ${plan === "pro" ? "bg-primary text-white" : "bg-accent text-muted-foreground"}`}
            >
              {plan === "pro" ? <Sparkles size={18} /> : <Shield size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{planMeta.name} Plan</span>
                {plan === "pro" && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Platform fee: <strong>{formatFeeBps(planMeta.platformFeeBps)}</strong>
                {plan === "pro" && data?.subscriptionEndsAt && (
                  <> · Renews {new Date(data.subscriptionEndsAt).toLocaleDateString()}</>
                )}
              </div>
            </div>
          </div>
          {plan === "free" && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {upgrading ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Upgrading…
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Upgrade to Pro · $49/mo
                </>
              )}
            </button>
          )}
        </div>
        {plan === "free" && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: Shield, text: "0% platform fee on Pro" },
              { icon: HardDrive, text: "100 GB hosted storage" },
              { icon: Zap, text: "Instant withdrawals" },
              { icon: BarChart3, text: "Advanced analytics" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon size={11} className="shrink-0 text-primary" /> {text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border border-border bg-accent/40 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:block">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <div className="mt-5 space-y-5">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-accent" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard
                    label="Gross Earned"
                    value={formatCurrency(
                      data?.earnings.grossEarnedCents ?? 0,
                      data?.earnings.currency,
                    )}
                    sub="Total payments received"
                  />
                  <StatCard
                    label="Platform Fees"
                    value={formatCurrency(
                      data?.earnings.totalFeesCents ?? 0,
                      data?.earnings.currency,
                    )}
                    sub={`${formatFeeBps(planMeta.platformFeeBps)} rate`}
                    color="text-amber-600"
                  />
                  <StatCard
                    label="Net Earned"
                    value={formatCurrency(
                      (data?.earnings.grossEarnedCents ?? 0) - (data?.earnings.totalFeesCents ?? 0),
                      data?.earnings.currency,
                    )}
                    sub="After platform fees"
                    color="text-emerald-600"
                  />
                  <StatCard
                    label="Available"
                    value={formatCurrency(
                      data?.earnings.availableBalanceCents ?? 0,
                      data?.earnings.currency,
                    )}
                    sub={
                      data?.earnings.pendingCents
                        ? `₦${(data.earnings.pendingCents / 100).toLocaleString()} pending`
                        : "Ready to withdraw"
                    }
                    color="text-primary"
                  />
                </div>
              )}

              {/* Recent earnings */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Recent earnings</h3>
                  <button
                    onClick={() => setTab("history")}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
                ) : (data?.recentEarnings.length ?? 0) === 0 ? (
                  <div className="p-10 text-center">
                    <TrendingUp size={24} className="mx-auto text-muted-foreground/30" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      No earnings yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Revenue appears here once learners pay for your content.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/40 text-[10px] font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left hidden sm:table-cell">Description</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right hidden sm:table-cell">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data?.recentEarnings.slice(0, 8).map((e) => (
                        <tr key={e.id} className="hover:bg-accent/40">
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                e.entryType === "revenue"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : e.entryType === "withdrawal"
                                    ? "bg-blue-100 text-blue-700"
                                    : e.entryType === "platform_fee"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {e.entryType.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[180px]">
                            {e.description ?? "—"}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right text-xs font-semibold tabular-nums ${e.amountCents >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {e.amountCents >= 0 ? "+" : ""}
                            {formatCurrency(e.amountCents, e.currency)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground hidden sm:table-cell tabular-nums">
                            {formatCurrency(e.balanceAfterCents, e.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Withdraw tab ── */}
          {tab === "withdraw" && (
            <div className="mt-5 space-y-5">
              {/* Balance pill */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <Wallet size={20} className="text-primary shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Available to withdraw</div>
                  <div className="text-xl font-bold text-foreground">
                    {loading
                      ? "…"
                      : formatCurrency(data?.earnings.availableBalanceCents ?? 0, "NGN")}
                  </div>
                </div>
              </div>

              {/* Withdrawal form */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">New withdrawal request</h3>

                {/* Type selector */}
                <div className="grid grid-cols-2 gap-2">
                  {(["standard", "instant"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setWdType(t)}
                      disabled={t === "instant" && plan !== "pro"}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        wdType === t
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-1.5">
                        {t === "instant" ? (
                          <Zap size={13} className="text-primary" />
                        ) : (
                          <Clock size={13} className="text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold capitalize text-foreground">
                          {t}
                        </span>
                        {t === "instant" && plan !== "pro" && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {t === "standard"
                          ? "1–3 business days, no extra fee"
                          : "Within 2 hours, small fee applies"}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Amount (NGN)
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">₦</span>
                    <input
                      value={wdAmount}
                      onChange={(e) => setWdAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="5,000.00"
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Payout destination (managed in Settings → Payouts) */}
                <div className="rounded-lg border border-border bg-accent/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">
                        Payout destination
                      </div>
                      {payoutAccount?.isPayoutReady ? (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {payoutAccount.method === "bank"
                            ? (payoutAccount.bankName ?? "Bank account")
                            : payoutAccount.mobileMoneyNetwork}
                          {" · "}
                          {payoutAccount.accountNumberMasked ??
                            payoutAccount.mobileMoneyNumberMasked}
                          {" · "}
                          {payoutAccount.accountName}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-xs text-amber-700">
                          No payout account saved yet.
                        </div>
                      )}
                    </div>
                    <Link
                      to="/app/settings"
                      className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                    >
                      {payoutAccount?.isPayoutReady ? "Change" : "Add account"}
                    </Link>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={wdSubmitting || !wdAmount || !payoutAccount?.isPayoutReady}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40"
                >
                  {wdSubmitting ? "Submitting…" : "Request withdrawal →"}
                </button>
              </div>

              {/* Withdrawal history */}
              {(data?.recentWithdrawals.length ?? 0) > 0 && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-foreground">Recent withdrawals</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/40 text-[10px] font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data?.recentWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-accent/40">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {new Date(w.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 text-xs capitalize text-foreground">
                            {w.withdrawalType}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold">
                            {formatCurrency(w.amountCents, w.currency)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <StatusBadge status={w.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Storage tab ── */}
          {tab === "storage" && (
            <div className="mt-5 space-y-4">
              {plan !== "pro" ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <HardDrive size={28} className="mx-auto text-muted-foreground/30" />
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    Hosted storage requires Pro
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Free plan creators use external video embeds (YouTube, Vimeo, Loom) and external
                    links (Google Drive, Notion, Dropbox) — no storage fees.
                  </p>
                  <button
                    onClick={() => setTab("overview")}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Upgrade to Pro → 100 GB included
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Storage quota</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatStorageQuota(data?.storage.usedBytes ?? 0)} used of{" "}
                        {formatStorageQuota(data?.storage.quotaBytes ?? 0)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className={`h-full rounded-full transition-all ${(data?.storage.usedPercent ?? 0) > 85 ? "bg-rose-500" : "bg-primary"}`}
                        style={{ width: `${data?.storage.usedPercent ?? 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data?.storage.usedPercent ?? 0}% used ·{" "}
                      {formatStorageQuota(data?.storage.availableBytes ?? 0)} available
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Supported file types
                    </h4>
                    {[
                      "Video files (MP4, MOV, WebM) — streamed via Bunny.net",
                      "Documents (PDF, DOCX) — downloaded via presigned R2 URL",
                      "Images (PNG, JPG, WebP) — served with time-limited access",
                      "Archives (ZIP) — for lesson resource bundles",
                    ].map((line) => (
                      <div
                        key={line}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-emerald-500" />
                        {line}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── History tab ── */}
          {tab === "history" && (
            <div className="mt-5">
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
              ) : (data?.recentEarnings.length ?? 0) === 0 ? (
                <div className="py-10 text-center">
                  <Clock size={24} className="mx-auto text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No transactions yet.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/40 text-[10px] font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left hidden sm:table-cell">Description</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right hidden sm:table-cell">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data?.recentEarnings.map((e) => (
                        <tr key={e.id} className="hover:bg-accent/40">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(e.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                e.entryType === "revenue"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : e.entryType === "withdrawal"
                                    ? "bg-blue-100 text-blue-700"
                                    : e.entryType === "platform_fee"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {e.entryType.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[160px]">
                            {e.description ?? "—"}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right text-xs font-semibold tabular-nums ${e.amountCents >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {e.amountCents >= 0 ? "+" : ""}
                            {formatCurrency(e.amountCents, e.currency)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground tabular-nums hidden sm:table-cell">
                            {formatCurrency(e.balanceAfterCents, e.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
