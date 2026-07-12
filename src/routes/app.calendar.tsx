import { createFileRoute } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [
    { title: "Community Calendar · SukaSpace" },
    { name: "description", content: "Live sessions, course deadlines, and community meetups in a single monthly grid." },
  ] }),
  component: CalendarPage,
});

function CalendarPage() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [events, setEvents] = useState<{ title: string; date: string }[]>([]);

  const submit = () => {
    if (!title.trim() || !date) return;
    setEvents((e) => [...e, { title: title.trim(), date }]);
    store.pushNotification(`Event "${title.trim()}" was added to the calendar.`);
    setTitle(""); setDate(""); setOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Community Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live sessions, course deadlines, and community meetups.</p>
        </div>
        <button onClick={() => setOpen(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><Plus size={14} />Add Event</button>
      </div>

      {events.length > 0 && (
        <div className="mt-4 space-y-2">
          {events.map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
              <span className="font-semibold text-foreground">{e.title}</span>
              <span className="text-muted-foreground">{e.date}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <img src={UPLOADED_MOCKUPS.communityCalendar} alt="SukaSpace community calendar with live sessions and deadlines" className="w-full object-cover" />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Add event</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly AMA" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <button onClick={submit} disabled={!title.trim() || !date} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
