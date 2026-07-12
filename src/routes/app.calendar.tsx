import { createFileRoute } from "@tanstack/react-router";
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Radio, Clock3, Users2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MOCK_CALENDAR_EVENTS } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [
    { title: "Community Calendar · SukaSpace" },
    { name: "description", content: "Live sessions, course deadlines, and community meetups in a single monthly grid." },
  ] }),
  component: CalendarPage,
});

type CalEvent = { id: number; title: string; date: string; type: "session" | "deadline" | "meetup" };

const TYPE_STYLES: Record<CalEvent["type"], { dot: string; chip: string; label: string; icon: typeof Radio }> = {
  session: { dot: "bg-primary", chip: "bg-sky-100 text-sky-700", label: "Live session", icon: Radio },
  deadline: { dot: "bg-rose-500", chip: "bg-rose-100 text-rose-700", label: "Deadline", icon: Clock3 },
  meetup: { dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700", label: "Meetup", icon: Users2 },
};

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toKey(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function CalendarPage() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<CalEvent["type"]>("session");
  const [events, setEvents] = useState<CalEvent[]>(MOCK_CALENDAR_EVENTS as CalEvent[]);
  const [cursor, setCursor] = useState(() => { const d = new Date(2026, 6, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const todayKey = "2026-07-12";

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const submit = () => {
    if (!title.trim() || !date) return;
    const created: CalEvent = { id: Date.now(), title: title.trim(), date, type };
    setEvents((e) => [...e, created]);
    store.pushNotification(`Event "${created.title}" was added to the calendar on ${created.date}.`);
    setTitle(""); setDate(""); setType("session"); setOpen(false);
    setSelected(created.date);
  };

  const removeEvent = (id: number) => setEvents((e) => e.filter((ev) => ev.id !== id));

  const changeMonth = (delta: number) => {
    setCursor((c) => {
      let month = c.month + delta;
      let year = c.year;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      return { year, month };
    });
  };

  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date)).filter((e) => e.date >= todayKey).slice(0, 5);
  const selectedEvents = selected ? eventsByDate.get(selected) || [] : [];

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Community Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live sessions, course deadlines, and community meetups.</p>
        </div>
        <button onClick={() => { setDate(""); setOpen(true); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><Plus size={14} />Add Event</button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><ChevronLeft size={16} /></button>
            <div className="text-sm font-semibold text-foreground">{monthLabel}</div>
            <button onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-border text-center text-[10px] font-semibold uppercase text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="h-20 border-b border-r border-border bg-background/40 sm:h-24" />;
              const key = toKey(cursor.year, cursor.month, day);
              const dayEvents = eventsByDate.get(key) || [];
              const isToday = key === todayKey;
              const isSelected = key === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(key)}
                  className={`flex h-20 flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition sm:h-24 ${isSelected ? "bg-sky-50" : "hover:bg-accent"}`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${isToday ? "bg-primary text-white" : "text-foreground"}`}>{day}</span>
                  <div className="flex w-full flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span key={e.id} className={`truncate rounded px-1 text-[9px] font-semibold ${TYPE_STYLES[e.type].chip}`}>{e.title}</span>
                    ))}
                    {dayEvents.length > 2 && <span className="text-[9px] font-semibold text-muted-foreground">+{dayEvents.length - 2} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
            {upcoming.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No upcoming events.</p>}
            <ul className="mt-2 space-y-2">
              {upcoming.map((e) => {
                const Icon = TYPE_STYLES[e.type].icon;
                return (
                  <li key={e.id} className="flex items-start gap-2 rounded-lg border border-border p-2">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${TYPE_STYLES[e.type].chip}`}><Icon size={12} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-foreground">{e.title}</div>
                      <div className="text-[10px] text-muted-foreground">{e.date}</div>
                    </div>
                    <button onClick={() => removeEvent(e.id)} aria-label="Remove event" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-rose-600"><Trash2 size={12} /></button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{selected}</h2>
                <button onClick={() => setSelected(null)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X size={12} /></button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">No events this day.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {selectedEvents.map((e) => (
                    <li key={e.id} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${TYPE_STYLES[e.type].chip}`}>{e.title}</li>
                  ))}
                </ul>
              )}
              <button onClick={() => { setDate(selected); setOpen(true); }} className="mt-3 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">+ Add event on this day</button>
            </div>
          )}
        </div>
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Type</label>
                <div className="mt-1 flex gap-1.5">
                  {(Object.keys(TYPE_STYLES) as CalEvent["type"][]).map((t) => (
                    <button key={t} onClick={() => setType(t)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${type === t ? "border-primary bg-sky-50 text-primary" : "border-border text-muted-foreground"}`}>{TYPE_STYLES[t].label}</button>
                  ))}
                </div>
              </div>
              <button onClick={submit} disabled={!title.trim() || !date} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
