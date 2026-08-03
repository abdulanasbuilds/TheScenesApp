import { createFileRoute } from "@tanstack/react-router";
import { Radio, Users, Video, Calendar, Mic, PlayCircle, Download, BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/live")({
  head: () => ({
    meta: [
      { title: "Live Streaming · SukaSpace" },
      {
        name: "description",
        content: "Host webinars, Q&A sessions, and interactive rooms — coming soon to SukaSpace.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  return (
    <ComingSoon
      icon={Radio}
      title="Live Streaming & Events"
      subtitle="Host webinars, workshops, and interactive rooms — all inside SukaSpace."
      description="We're building a native live streaming experience that integrates directly with your communities and courses. Host webinars of up to 500 participants, run intimate Q&A rooms, and have recordings automatically posted back to your community — no third-party tools required."
      badge="Coming Soon"
      backTo="/app/feed"
      backLabel="Back to Community"
      gradientClass="from-rose-500/10 via-pink-500/5 to-background"
      features={[
        {
          icon: Video,
          label: "Webinar Mode",
          desc: "Up to 500 participants with screen sharing, slides, and polls.",
        },
        {
          icon: Users,
          label: "Interactive Rooms",
          desc: "Intimate Q&A and co-working sessions for up to 50 people.",
        },
        {
          icon: Calendar,
          label: "Scheduled & Recurring",
          desc: "Set up one-time or recurring events synced to your community calendar.",
        },
        {
          icon: Mic,
          label: "Multi-host Support",
          desc: "Invite co-hosts and guest speakers directly from your member list.",
        },
        {
          icon: PlayCircle,
          label: "Auto-Replay Posting",
          desc: "Recordings are automatically posted to your community after the session ends.",
        },
        {
          icon: Download,
          label: "Downloadable Recordings",
          desc: "Members can download replays as MP4 for offline viewing.",
        },
        {
          icon: BarChart3,
          label: "Attendance Analytics",
          desc: "See who showed up, how long they stayed, and what they engaged with.",
        },
        {
          icon: Radio,
          label: "RSVP & Reminders",
          desc: "Members RSVP and get in-app reminders 24 hours and 1 hour before.",
        },
      ]}
    />
  );
}
