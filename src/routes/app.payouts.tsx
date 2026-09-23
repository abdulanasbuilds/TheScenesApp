import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownToLine, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/payouts")({
  head: () => ({ meta: [
    { title: "Payouts · The Scenes" },
    { name: "description", content: "Review the creator payouts interface for The Scenes." },
    { property: "og:title", content: "Payouts · The Scenes" },
    { property: "og:description", content: "Review the creator payouts interface for The Scenes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PayoutsPage,
});

function PayoutsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase text-primary">Creator workspace</p>
      <h1 className="mt-1 text-2xl font-bold text-foreground">Payouts &amp; financials</h1>
      <p className="mt-1 text-sm text-muted-foreground">Financial connections and transaction records have been removed.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Available balance", value: "—", icon: Wallet },
          { label: "Total withdrawn", value: "—", icon: ArrowDownToLine },
          { label: "Payout account", value: "Not connected", icon: Landmark },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border bg-card p-5">
            <Icon size={17} className="text-primary" /><p className="mt-4 text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-5 border border-dashed border-border bg-card px-5 py-12 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-muted-foreground"><Wallet size={21} /></span>
        <h2 className="mt-4 font-semibold text-foreground">No financial data</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">This frontend does not store earnings, bank details, withdrawals, or transaction history.</p>
        <Button className="mt-5" disabled>Withdrawals unavailable</Button>
      </section>
    </div>
  );
}
