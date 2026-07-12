import { createFileRoute } from "@tanstack/react-router";
import { Download, Check } from "lucide-react";
import { useState } from "react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { MOCK_GROWTH_SERIES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/payouts")({
  head: () => ({ meta: [
    { title: "Payouts & Financials · SukaSpace" },
    { name: "description", content: "Manage earnings, view history, and configure withdrawals." },
  ] }),
  component: PayoutsPage,
});

function PayoutsPage() {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const rows = ["week,value", ...MOCK_GROWTH_SERIES.map((g, i) => `W${i + 1},${g}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payouts.csv"; a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
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
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <img src={UPLOADED_MOCKUPS.payoutsFinancials} alt="SukaSpace payouts, balance, and monthly earnings dashboard" className="w-full object-cover" />
      </div>
    </div>
  );
}
