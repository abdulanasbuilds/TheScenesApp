import { createFileRoute } from "@tanstack/react-router";
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Radio, Clock3, Users2, StickyNote, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [
    { title: "Community Calendar · SukaSpace" },
    { name: "description", content: "Live sessions, course deadlines, and community meetups in a single monthly grid." },
  ] }),
  component: CalendarPage,
});

type HostPlatform = "native" | "zoom" | "meet" | "youtube" | "custom";
type Visibility = "all" | "premium";
type CalEvent = {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "session" | "deadline" | "meetup" | "personal";
  hostPlatform: HostPlatform;
  meetingUrl?: string;
  visibility: Visibility;
};
type ViewMode = "month" | "week" | "day";
type CalKey = "session" | "deadline" | "meetup" | "personal";

const HOST_OPTIONS: { key: HostPlatform; label: string; placeholder?: string; cta: string }[] = [
  { key: "native", label: "Sukaspace Call (Native)", cta: "Join Sukaspace Call" },
  { key: "zoom", label: "Zoom", placeholder: "Paste your Zoom Meeting Link (e.g., https://zoom.us...)", cta: "Join Zoom Meeting" },
  { key: "meet", label: "Google Meet", placeholder: "Paste your Google Meet Link (e.g., https://google.com...)", cta: "Join Google Meet" },
  { key: "youtube", label: "YouTube Live", placeholder: "Paste your YouTube Live/Unlisted video URL", cta: "Watch on YouTube" },
  { key: "custom", label: "Custom Link", placeholder: "https://your-event-link.com", cta: "Open Event Link" },
];
const hostMeta = (k: HostPlatform) => HOST_OPTIONS.find((h) => h.key === k)!;

const TYPE_STYLES: Record<CalKey, { dot: string; chip: string; label: string; listLabel: string; icon: typeof Radio }> = {
  session: { dot: "bg-sky-500", chip: "bg-sky-100 text-sky-700", label: "Live session", listLabel: "Live Sessions", icon: Radio },
  deadline: { dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700", label: "Deadline", listLabel: "Course Deadlines", icon: Clock3 },
  meetup: { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700", label: "Meetup", listLabel: "Community Meetups", icon: Users2 },
  personal: { dot: "bg-violet-500", chip: "bg-violet-100 text-violet-700", label: "Personal note", listLabel: "Personal Notes", icon: StickyNote },
};


function pad(n: number) { return n.toString().padStart(2, "0"); }
function toKey(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseKey(key: string) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }

function getTodayKey() {
  const d = new Date();
  return toKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function EventCard({ event, onRemove, showDate }: { event: CalEvent; onRemove: (id: number) => void; showDate?: boolean }) {
  const Icon = TYPE_STYLES[event.type].icon;
  const host = hostMeta(event.hostPlatform);
  const isNative = event.hostPlatform === "native";
  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TYPE_STYLES[event.type].chip}`}><Icon size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{event.title}</h3>
            {event.visibility === "premium" && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Premium Tier</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {showDate ? new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : TYPE_STYLES[event.type].label}
            {event.time ? ` · ${event.time}` : ""} · {host.label}
          </p>
          {event.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{event.description}</p>}
        </div>
        <button onClick={() => onRemove(event.id)} aria-label="Remove event" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-rose-600"><Trash2 size={14} /></button>
      </div>
      <div className="mt-3">
        {isNative ? (
          <div className="flex items-center gap-2">
            <button disabled className="cursor-not-allowed rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground opacity-60">{host.cta}</button>
            <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Coming Soon</span>
          </div>
        ) : event.meetingUrl ? (
          <a
            href={event.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
          >
            {host.cta}
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">No link added for this event yet.</span>
        )}
      </div>
    </li>
  );
}



function CalendarPage() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<CalKey>("session");
  const [hostPlatform, setHostPlatform] = useState<HostPlatform>("native");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const todayKey = getTodayKey();
  const [selected, setSelected] = useState<string>(todayKey);
  const [visible, setVisible] = useState<Record<CalKey, boolean>>({ session: true, deadline: true, meetup: true, personal: true });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!visible[e.type]) continue;
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events, visible]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const miniFirstDay = firstDay;
  const miniCells: (number | null)[] = [...Array(miniFirstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (miniCells.length % 7 !== 0) miniCells.push(null);

  const submit = () => {
    if (!title.trim() || !date) return;
    const created: CalEvent = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      time: time.trim() || undefined,
      type,
      hostPlatform,
      meetingUrl: hostPlatform === "native" ? undefined : meetingUrl.trim() || undefined,
      visibility,
    };
    setEvents((e) => [...e, created]);
    store.pushNotification(`Event "${created.title}" added to calendar on ${created.date}.`);
    setTitle(""); setDescription(""); setDate(""); setTime(""); setType("session");
    setHostPlatform("native"); setMeetingUrl(""); setVisibility("all");
    setOpen(false);
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

  const changeWeek = (delta: number) => {
    const d = parseKey(selected);
    d.setDate(d.getDate() + delta * 7);
    setSelected(toKey(d.getFullYear(), d.getMonth(), d.getDate()));
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const changeDay = (delta: number) => {
    const d = parseKey(selected);
    d.setDate(d.getDate() + delta);
    setSelected(toKey(d.getFullYear(), d.getMonth(), d.getDate()));
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const jumpTo = (day: number) => {
    const key = toKey(cursor.year, cursor.month, day);
    setSelected(key);
  };

  const weekDates = useMemo(() => {
    const d = parseKey(selected);
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => { const dd = new Date(start); dd.setDate(start.getDate() + i); return dd; });
  }, [selected]);

  const selectedEvents = eventsByDate.get(selected) || [];
  const upcoming = useMemo(
    () => events
      .filter((e) => visible[e.type] && e.date >= todayKey)
      .sort((a, b) => (a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date.localeCompare(b.date)))
      .slice(0, 6),
    [events, visible, todayKey],
  );

  const toggleVisible = (k: CalKey) => setVisible((v) => ({ ...v, [k]: !v[k] }));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Community Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live sessions, course deadlines, and community meetups.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize ${view === v ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent"}`}>{v}</button>
            ))}
          </div>
          <button onClick={() => { setDate(selected); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><Plus size={14} />Add Event</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">Jump to</span>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[10px]">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="font-semibold text-muted-foreground">{d}</div>)}
              {miniCells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const key = toKey(cursor.year, cursor.month, day);
                const isToday = key === todayKey;
                const isSelected = key === selected;
                return (
                  <button key={i} onClick={() => jumpTo(day)} className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-[11px] ${isSelected ? "bg-primary text-white font-semibold" : isToday ? "border border-primary text-primary font-semibold" : "text-foreground hover:bg-accent"}`}>{day}</button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <span className="px-1 text-[11px] font-semibold uppercase text-muted-foreground">Calendars</span>
            <div className="mt-2 space-y-2">
              {(Object.keys(TYPE_STYLES) as CalKey[]).map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 px-1 text-xs font-medium text-foreground">
                  <input type="checkbox" checked={visible[k]} onChange={() => toggleVisible(k)} className="h-3.5 w-3.5 accent-primary" />
                  <span className={`h-2 w-2 rounded-full ${TYPE_STYLES[k].dot}`} />
                  {TYPE_STYLES[k].listLabel}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <button onClick={() => (view === "month" ? changeMonth(-1) : view === "week" ? changeWeek(-1) : changeDay(-1))} aria-label="Previous" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><ChevronLeft size={16} /></button>
            <div className="text-sm font-semibold text-foreground">
              {view === "month" ? monthLabel : view === "week" ? `Week of ${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : parseKey(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            <button onClick={() => (view === "month" ? changeMonth(1) : view === "week" ? changeWeek(1) : changeDay(1))} aria-label="Next" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><ChevronRight size={16} /></button>
          </div>

          {view === "month" && (
            <>
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
                    <button key={i} onClick={() => setSelected(key)} className={`flex h-20 flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition sm:h-24 ${isSelected ? "bg-sky-50" : "hover:bg-accent"}`}>
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${isToday ? "bg-primary text-white" : "text-foreground"}`}>{day}</span>
                      <div className="flex w-full flex-1 flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((e) => (
                          <span key={e.id} className={`truncate rounded px-1 text-[9px] font-semibold ${TYPE_STYLES[e.type].chip}`}>{e.time ? `${e.time} - ${e.title}` : e.title}</span>
                        ))}
                        {dayEvents.length > 2 && <span className="text-[9px] font-semibold text-muted-foreground">+{dayEvents.length - 2} more</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "week" && (
            <div className="grid grid-cols-7">
              {weekDates.map((d, i) => {
                const key = toKey(d.getFullYear(), d.getMonth(), d.getDate());
                const dayEvents = eventsByDate.get(key) || [];
                const isToday = key === todayKey;
                const isSelected = key === selected;
                return (
                  <button key={i} onClick={() => setSelected(key)} className={`flex min-h-[260px] flex-col items-start gap-1.5 border-b border-r border-border p-2 text-left align-top last:border-r-0 ${isSelected ? "bg-sky-50" : "hover:bg-accent"}`}>
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${isToday ? "bg-primary text-white" : "text-foreground"}`}>{d.getDate()}</span>
                    </div>
                    <div className="flex w-full flex-col gap-1">
                      {dayEvents.map((e) => (
                        <span key={e.id} className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold ${TYPE_STYLES[e.type].chip}`}>{e.time ? `${e.time} · ` : ""}{e.title}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {view === "day" && (
            <div className="p-4">
              {selectedEvents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No events scheduled for this day.</p>
              ) : (
                <ul className="space-y-3">
                  {selectedEvents.map((e) => <EventCard key={e.id} event={e} onRemove={removeEvent} />)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No upcoming events yet. Use “Add Event” to schedule your first Sukaspace session.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {upcoming.map((e) => <EventCard key={e.id} event={e} onRemove={removeEvent} showDate />)}
          </ul>
        )}
      </section>


      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Add event</h2>
                <p className="text-xs text-muted-foreground">Sukaspace · times are stored in UTC</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Event title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly AMA" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What will you cover in this session?" className="mt-1 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Date (UTC)</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Time (UTC)</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="all">All Members</option>
                  <option value="premium">Premium Tier</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Where do you want to host it?</label>
                <select value={hostPlatform} onChange={(e) => { setHostPlatform(e.target.value as HostPlatform); setMeetingUrl(""); }} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
                  {HOST_OPTIONS.map((h) => <option key={h.key} value={h.key}>{h.label}</option>)}
                </select>
                {hostPlatform === "native" ? (
                  <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                    Sukaspace Call feature is coming soon! 🚀
                  </div>
                ) : (
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder={hostMeta(hostPlatform).placeholder}
                    className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Type</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(Object.keys(TYPE_STYLES) as CalKey[]).map((t) => (
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
