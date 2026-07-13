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
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#151515] sm:text-5xl">Simple pricing for the launch era.</h1>
          <p className="mt-2.5 text-base font-medium text-muted-foreground">Start free, validate your niche, then upgrade when your community needs more control.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className="rounded-xl border border-neutral-100 bg-card p-6">
              <h2 className="text-xl font-extrabold tracking-tighter text-[#151515]">{plan.name}</h2>
              <div className="mt-2.5 text-3xl font-extrabold text-foreground">{plan.price}</div>
              <ul className="mt-5 space-y-3 text-sm text-foreground">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />{feature}</li>)}
              </ul>
              <Link to={plan.to} search={plan.to === "/auth" ? { mode: "signup" } : undefined} className="mt-6 block rounded-full bg-primary px-4 py-3 text-center text-sm font-extrabold text-white border border-transparent hover:bg-primary/90">{plan.cta}</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
