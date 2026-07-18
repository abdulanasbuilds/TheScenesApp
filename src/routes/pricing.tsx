import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · SukaSpace" },
      { name: "description", content: "Simple early-access pricing for SukaSpace communities and course workspaces." },
      { property: "og:title", content: "Pricing · SukaSpace" },
      { property: "og:description", content: "Start free and grow into premium creator tools as your learning community scales." },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  { name: "Learner", price: "Free", cta: "Explore Communities", to: "/discover", features: ["Join public tech spaces", "Track lessons and XP", "Follow discussions and leaderboards"] },
  { name: "Creator", price: "Early access", cta: "Create a Community", to: "/create-community", features: ["Launch a community workspace", "Publish structured courses", "Invite members and manage access", "View growth analytics"] },
  { name: "Team", price: "Coming soon", cta: "Join Waitlist", to: "/auth", features: ["Multiple creator seats", "Advanced permissions", "Private cohort spaces"] },
] as const;

function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Simple pricing for the launch era.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Start free, validate your niche, then upgrade when your community needs more control.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className="rounded-lg border border-border bg-white p-8">
              <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
              <div className="mt-4 text-4xl font-bold text-foreground">{plan.price}</div>
              <ul className="mt-6 space-y-3 text-sm text-foreground">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" /><span>{feature}</span></li>)}
              </ul>
              <Link to={plan.to} search={plan.to === "/auth" ? { mode: "signup" } : undefined} className="mt-8 block rounded-lg bg-primary px-6 py-3 text-center text-base font-bold text-white border border-transparent hover:bg-blue-600 transition-colors">{plan.cta}</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
