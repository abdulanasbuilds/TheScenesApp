import { createFileRoute } from "@tanstack/react-router";
import { Download, Check, Wallet, TrendingUp, X, ArrowUpRight, ArrowDownRight, Plus, Landmark, CreditCard, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MOCK_MONTHLY_EARNINGS, MOCK_PAYMENT_METHODS, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/payouts")({
  head: () => ({ meta: [
    { title: "Payouts & Financials · SukaSpace" },
    { name: "description", content: "Manage earnings, view history, and configure withdrawals." },
  ] }),
  component: PayoutsPage,
});

type Txn = { id: number; desc: string; amount: number; date: string; type: "sale" | "payout" };
const STATUS_STYLES: Record<string, string> = { Completed: "bg-emerald-100 text-emerald-700", Processing: "bg-amber-100 text-amber-700" };

function PayoutsPage() {
  const store = useAppStore();
  const [exported, setExported] = useState(false);
  const [txns, setTxns] = useState<Txn[]>(MOCK_TRANSACTIONS as Txn[]);
  const [txnQuery, setTxnQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [methods, setMethods] = useState(MOCK_PAYMENT_METHODS);
  const [addMethodOpen, setAddMethodOpen] = useState(false);
  const [methodLabel, setMethodLabel] = useState("");
  const [methodDetail, setMethodDetail] = useState("");

  const balance = useMemo(() => txns.reduce((sum, t) => sum + t.amount, 0), [txns]);
  const prevBalance = balance - txns.filter((t) => t.type === "sale").slice(0, 2).reduce((s, t) => s + t.amount, 0);
  const growthPct = prevBalance > 0 ? (((balance - prevBalance) / prevBalance) * 100).toFixed(1) : "0.0";
  const maxMonth = Math.max(...MOCK_MONTHLY_EARNINGS.map((m) => m.amount));
  const nextPayoutDate = "2026-07-25";

  const filteredTxns = useMemo(() => {
    const q = txnQuery.trim().toLowerCase();
    return txns.filter((t) => !q || t.desc.toLowerCase().includes(q));
  }, [txns, txnQuery]);

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
    const txn: Txn = { id: Date.now(), desc: `Withdrawal to ${defaultMethod?.label ?? "bank"}`, amount: -value, date: "2026-07-12", type: "payout" };
    setTxns((t) => [txn, ...t]);
    store.pushNotification(`Withdrawal of $${value.toLocaleString()} initiated to ${defaultMethod?.label ?? "your account"}.`);
    setAmount(""); setOpen(false);
  };

  const addMethod = () => {
    if (!methodLabel.trim() || !methodDetail.trim()) return;
    setMethods((m) => [...m, { id: Date.now(), label: methodLabel.trim(), detail: methodDetail.trim(), type: "bank", isDefault: false }]);
    store.pushNotification(`Added payment method "${methodLabel.trim()}".`);
    setMethodLabel(""); setMethodDetail(""); setAddMethodOpen(false);
  };

  const makeDefault = (id: number) => setMethods((m) => m.map((x) => ({ ...x, isDefault: x.id === id })));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Payouts & Financials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your earnings, view history, and configure withdrawals.</p>
        </div>
        <button onClick={handleExport} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">
          {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}{exported ? "Exported" : "Export CSV"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground"><Wallet size={13} />Available balance</div>
          <div className="mt-3 text-3xl font-bold text-foreground">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${Number(growthPct) >= 0 ? "text-emerald-600" : "text-rose-600"}`}><TrendingUp size={12} />{growthPct}% from last month</div>
          <div className="mt-6 text-xs text-muted-foreground">Next scheduled payout: <span className="font-semibold text-foreground">{nextPayoutDate}</span></div>
          <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Withdraw Funds</button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Monthly Earnings</h2>
            <span className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">Last 6 Months</span>
          </div>
          <div className="mt-4 flex h-40 items-end gap-3">
            {MOCK_MONTHLY_EARNINGS.map((m, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground">${(m.amount / 1000).toFixed(1)}k</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary" style={{ height: `${Math.max(10, Math.round((m.amount / maxMonth) * 120))}px` }} title={`${m.month}: $${m.amount.toLocaleString()}`} />
                <span className="text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Payment Methods</h2>
            <button onClick={() => setAddMethodOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Plus size={12} />Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {methods.map((m) => (
              <button key={m.id} onClick={() => makeDefault(m.id)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${m.isDefault ? "border-primary bg-sky-50" : "border-border hover:bg-accent"}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-foreground">{m.type === "bank" ? <Landmark size={15} /> : <CreditCard size={15} />}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{m.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.detail}</div>
                </div>
                {m.isDefault && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">DEFAULT</span>}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Minimum withdrawal amount is $50.00. Processing times vary by method.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
            <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
              <Search size={13} className="text-muted-foreground" />
              <input value={txnQuery} onChange={(e) => setTxnQuery(e.target.value)} placeholder="Search transactions…" className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
                <tr><th className="py-2 px-4 text-left">Date</th><th className="text-left">Description</th><th className="text-left">Status</th><th className="px-4 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {filteredTxns.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="py-2.5 px-4 text-muted-foreground">{t.date}</td>
                    <td className="text-foreground">
                      <div className="flex items-center gap-2">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${t.type === "sale" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {t.type === "sale" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        </span>
                        {t.desc}
                      </div>
                    </td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[t.type === "sale" ? "Completed" : "Processing"]}`}>{t.type === "sale" ? "Completed" : "Processing"}</span></td>
                    <td className={`px-4 text-right font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-foreground"}`}>{t.amount >= 0 ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {filteredTxns.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">No transactions match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Withdraw funds</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Available balance: ${balance.toLocaleString()} · to {defaultMethod?.label ?? "—"}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Amount (USD)</label>
                <input type="number" min={1} max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <button onClick={withdraw} disabled={!amount || Number(amount) <= 0 || Number(amount) > balance} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Confirm withdrawal</button>
            </div>
          </div>
        </div>
      )}

      {addMethodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setAddMethodOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Add payment method</h2>
              <button onClick={() => setAddMethodOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Label</label>
                <input value={methodLabel} onChange={(e) => setMethodLabel(e.target.value)} placeholder="e.g. Wise Checking" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Account detail</label>
                <input value={methodDetail} onChange={(e) => setMethodDetail(e.target.value)} placeholder="•••• 1234" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <button onClick={addMethod} disabled={!methodLabel.trim() || !methodDetail.trim()} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add method</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
