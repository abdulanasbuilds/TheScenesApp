import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/app/payouts")({
  head: () => ({ meta: [
    { title: "Payouts & Financials · SukaSpace" },
    { name: "description", content: "Manage earnings, view history, and configure withdrawals." },
  ] }),
  component: PayoutsPage,
});

function PayoutsPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Payouts & Financials</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your earnings, view history, and configure withdrawals.</p>
        </div>
        <button className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download size={14} />Export CSV</button>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <img src={UPLOADED_MOCKUPS.payoutsFinancials} alt="SukaSpace payouts, balance, and monthly earnings dashboard" className="w-full object-cover" />
      </div>
    </div>
  );
}
