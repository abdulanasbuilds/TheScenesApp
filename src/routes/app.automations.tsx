import { createFileRoute } from "@tanstack/react-router";
import {
  Zap,
  Webhook,
  MessageSquare,
  UserCheck,
  RefreshCw,
  GitBranch,
  Tag,
  Bell,
} from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/automations")({
  head: () => ({
    meta: [
      { title: "Automations · The Scenes" },
      {
        name: "description",
        content: "Automate member onboarding, CRM sync, and community workflows — coming soon.",
      },
    ],
  }),
  component: AutomationsPage,
});

function AutomationsPage() {
  return (
    <ComingSoon
      icon={Zap}
      title="Workflow Automations"
      subtitle="Connect The Scenes to your entire business stack — no code required."
      description="Stop doing manually what a workflow can do for you. The Scenes Automations will let you build trigger-action pipelines that welcome new members, sync your CRM, gate content on behaviour, and fire webhooks to any external system — all configured from a simple visual editor inside your Creator Hub."
      badge="Coming Soon"
      backTo="/app/creator"
      backLabel="Back to Creator Hub"
      gradientClass="from-amber-500/10 via-yellow-500/5 to-background"
      features={[
        {
          icon: UserCheck,
          label: "Auto Welcome DMs",
          desc: "Send a personalised direct message to every new member the moment they join.",
        },
        {
          icon: Webhook,
          label: "Webhooks & API Triggers",
          desc: "Fire events to any external URL — Zapier, Make.com, n8n, or your own backend.",
        },
        {
          icon: MessageSquare,
          label: "Drip Notifications",
          desc: "Schedule in-app notifications over days or weeks to guide member journeys.",
        },
        {
          icon: RefreshCw,
          label: "CRM Sync",
          desc: "Mirror member data and payment events to HubSpot, Notion, Airtable, or Google Sheets.",
        },
        {
          icon: Tag,
          label: "Auto-Tagging",
          desc: "Tag members automatically based on courses completed, events attended, or XP reached.",
        },
        {
          icon: GitBranch,
          label: "Conditional Logic",
          desc: "Branch automations based on member role, tier, payment status, or any custom field.",
        },
        {
          icon: Bell,
          label: "Event-Based Triggers",
          desc: "Trigger flows on community join, lesson completion, payment, or leaderboard milestone.",
        },
        {
          icon: Zap,
          label: "Visual Flow Builder",
          desc: "Drag-and-drop trigger → action editor — no code, no YAML, no complexity.",
        },
      ]}
    />
  );
}
