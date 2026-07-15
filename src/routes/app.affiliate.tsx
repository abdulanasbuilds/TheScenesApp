import { createFileRoute } from "@tanstack/react-router";
import { Share2, DollarSign, BarChart3, Link2, Users, CreditCard, Trophy, Zap } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate Program · SukaSpace" },
      { name: "description", content: "Earn recurring commissions by referring creators and learners to SukaSpace." },
    ],
  }),
  component: AffiliatePage,
});

function AffiliatePage() {
  return (
    <ComingSoon
      icon={Share2}
      title="Affiliate Program"
      subtitle="Earn up to 30% recurring commission for every creator you refer."
      description="Turn your network into a revenue stream. SukaSpace's affiliate program rewards you every month for every paying creator or community you refer — for as long as they stay. With real-time dashboards, automated payouts, and leaderboard recognition, it's the most transparent referral program in the creator economy."
      badge="Coming Soon"
      backTo="/app/payouts"
      backLabel="Back to Payouts"
      gradientClass="from-emerald-500/10 via-teal-500/5 to-background"
      features={[
        { icon: DollarSign,  label: "30% Recurring Commission",  desc: "Earn every single month for the lifetime of each paying referral — not just the first payment." },
        { icon: Link2,       label: "Custom Referral Links",      desc: "Generate branded referral URLs and QR codes for any campaign or platform." },
        { icon: BarChart3,   label: "Real-Time Dashboard",        desc: "Track clicks, signups, conversions, and MRR attribution in one clean view." },
        { icon: CreditCard,  label: "Automated Payouts",          desc: "Earnings hit your Paystack or bank account automatically every month — no chasing invoices." },
        { icon: Users,       label: "Sub-Affiliate Tiers",        desc: "Earn a secondary commission on referrals made by people you originally referred." },
        { icon: Trophy,      label: "Affiliate Leaderboard",      desc: "Top affiliates get featured, unlocked perks, and invites to our creator advisory circle." },
        { icon: Zap,         label: "Deep-Link Tracking",         desc: "Link directly to any community or course with your affiliate tag automatically appended." },
        { icon: Share2,      label: "Shareable Content Packs",    desc: "Ready-made graphics, copy, and email templates to make sharing effortless." },
      ]}
    />
  );
}
