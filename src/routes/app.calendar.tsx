import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [
    { title: "Community Calendar · SukaSpace" },
    { name: "description", content: "Live sessions, course deadlines, and community meetups in a single monthly grid." },
  ] }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Community Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live sessions, course deadlines, and community meetups.</p>
        </div>
        <button className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[primary] px-3 py-2 text-xs font-semibold text-white hover:bg-[primary/90]"><Plus size={14} />Add Event</button>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <img src={UPLOADED_MOCKUPS.communityCalendar} alt="SukaSpace community calendar with live sessions and deadlines" className="w-full object-cover" />
      </div>
    </div>
  );
}
