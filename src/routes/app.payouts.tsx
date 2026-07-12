import { createFileRoute } from "@tanstack/react-router";
import { Download, Check, DollarSign, Wallet, TrendingUp, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMemo, useState } from "react";
import { MOCK_GROWTH_SERIES, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/payouts")({
  head: () => ({ meta: [
    { title: "Payouts & Financials · SukaSpace" },
    { name: "description", content: "Manage earnings, view history, and configure withdrawals." },
  ] }),
  component: PayoutsPage,
});

type Txn = { id: number; desc: string; amount: number; date: string; type: "sale" | "payout" };

function PayoutsPage() {
  const store = useAppStore();
  const [exported, setExported] = useState(false);
  const [txns, setTxns] = useState<Txn[]>(MOCK_TRANSACTIONS as Txn[]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const balance = useMemo(() => txns.reduce((sum, t) => sum + t.amount, 0), [txns]);
  const mrr = useMemo(() => txns.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0), [txns]);
  const maxWeek = Math.max(...MOCK_GROWTH_SERIES);

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

  const withdraw = () => {
    const value = Math.round(Number(amount));
    if (!value || value <= 0 || value > balance) return;
    const txn: Txn = { id: Date.now(), desc: "Payout to bank ••4821", amount: -value, date: "2026-07-12", type: "payout" };
    setTxns((t) => [txn, ...t]);
    store.pushNotification(`Withdrawal of $${value.toLocaleString()} initiated to your bank account.`);
    setAmount(""); setOpen(false);
  };

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

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Available balance</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-foreground"><Wallet size={14} /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">${balance.toLocaleString()}</div>
          <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90">Withdraw funds</button>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Sales this period</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-foreground"><DollarSign size={14} /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">${mrr.toLocaleString()}</div>
          <div className="mt-1 text-xs font-semibold text-primary">from {txns.filter((t) => t.type === "sale").length} transactions</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Member growth</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-foreground"><TrendingUp size={14} /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">+{MOCK_GROWTH_SERIES[MOCK_GROWTH_SERIES.length - 1]}</div>
          <div className="mt-1 text-xs font-semibold text-primary">net new members this week</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Earnings trend · last 12 weeks</h2>
        <div className="mt-4 flex h-36 items-end gap-2">
          {MOCK_GROWTH_SERIES.map((v, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(8, Math.round((v / maxWeek) * 120))}px` }} title={`W${i + 1}: ${v}`} />
              <span className="text-[9px] text-muted-foreground">W{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Transaction history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
              <tr><th className="py-2 px-4 text-left">Description</th><th className="text-left">Date</th><th className="px-4 text-right">Amount</th></tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className={`grid h-6 w-6 place-items-center rounded-md ${t.type === "sale" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {t.type === "sale" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      </span>
                      {t.desc}
                    </div>
                  </td>
                  <td className="text-muted-foreground">{t.date}</td>
                  <td className={`px-4 text-right font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-foreground"}`}>{t.amount >= 0 ? "+" : ""}${t.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Withdraw funds</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Available balance: ${balance.toLocaleString()}</p>
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
    </div>
  );
}
