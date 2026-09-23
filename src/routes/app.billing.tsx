import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, HardDrive, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/billing")({
  head: () => ({ meta: [
    { title: "Billing · The Scenes" },
    { name: "description", content: "Review the billing interface for The Scenes." },
    { property: "og:title", content: "Billing · The Scenes" },
    { property: "og:description", content: "Review the billing interface for The Scenes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: BillingPage,
});

function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">Creator workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">The billing layout is retained as a frontend-only screen.</p>
      </div>
      <section className="mt-6 border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-accent text-primary"><CreditCard size={18} /></span>
            <div><h2 className="font-semibold text-foreground">Free plan</h2><p className="text-sm text-muted-foreground">No payment provider or recurring billing is connected.</p></div>
          </div>
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-muted-foreground">Frontend only</span>
        </div>
      </section>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Wallet, label: "Revenue", value: "—", hint: "No connected ledger" },
          { icon: HardDrive, label: "Storage", value: "Local", hint: "Browser presentation only" },
          { icon: ShieldCheck, label: "Payments", value: "Off", hint: "No processor connected" },
        ].map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="border border-border bg-card p-4">
            <Icon size={16} className="text-primary" /><p className="mt-3 text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Button disabled>Upgrade unavailable</Button>
        <Button variant="outline" asChild><Link to="/app/settings">Open settings</Link></Button>
      </div>
    </div>
  );
}
