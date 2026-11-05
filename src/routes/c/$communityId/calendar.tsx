import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { EventCard } from "@/components/domain/cards";
import { CommunityShell } from "@/components/layout/community-shell";
import { Badge, Button, Card, Chip, EmptyState } from "@/components/ui";
import { events, getCommunity } from "@/data/seed";
import { cn, formatDate, formatTime } from "@/lib/utils";

export const Route = createFileRoute("/c/$communityId/calendar")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Calendar · ${loaderData?.community.name ?? "The Scenes"}` }],
  }),
  component: CommunityCalendarPage,
});

function CommunityCalendarPage() {
  const { community } = Route.useLoaderData();
  const [view, setView] = useState<"month" | "list">("month");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(5);
  const base = new Date(2026, 10 + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(base);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const communityEvents = events.filter((event) => event.communitySlug === community.slug);
  const visibleEvents = communityEvents.filter((event) => {
    const date = new Date(event.start);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const selectedEvents = useMemo(
    () => visibleEvents.filter((event) => new Date(event.start).getDate() === selectedDay),
    [visibleEvents, selectedDay],
  );

  return (
    <CommunityShell community={community} active="calendar">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Learn together
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Community calendar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Workshops, office hours and member meetups.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMonthOffset(0)}>
                Today
              </Button>
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setView("month")}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold",
                    view === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Month
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold",
                    view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                  )}
                >
                  <List className="h-3.5 w-3.5" /> List
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthOffset((value) => value - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-xl font-extrabold text-slate-900">{monthName}</h2>
          <button
            type="button"
            onClick={() => setMonthOffset((value) => value + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {view === "month" ? (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
            <Card className="overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[10px] font-bold tracking-wide text-slate-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, index) => {
                  const dayEvents = day
                    ? visibleEvents.filter((event) => new Date(event.start).getDate() === day)
                    : [];
                  const today = monthOffset === 0 && day === 3;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!day}
                      onClick={() => day && setSelectedDay(day)}
                      className={cn(
                        "relative min-h-20 border-r border-b border-slate-100 p-1.5 text-left transition-colors sm:min-h-28 sm:p-2",
                        !day && "bg-slate-50",
                        day && "hover:bg-slate-50",
                        day === selectedDay && "bg-indigo-50/60",
                        index % 7 === 6 && "border-r-0",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          today ? "bg-indigo-700 text-white" : "text-slate-600",
                        )}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <span
                            key={event.id}
                            className="block truncate rounded bg-indigo-100 px-1.5 py-1 text-[9px] font-semibold text-indigo-900 sm:text-[10px]"
                          >
                            {formatTime(event.start)} {event.title}
                          </span>
                        ))}
                        {dayEvents.length > 2 ? (
                          <span className="text-[9px] font-semibold text-slate-500">
                            +{dayEvents.length - 2} more
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
            <aside>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                  {formatDate(new Date(year, month, selectedDay).toISOString())}
                </h3>
                <Badge tone="outline">{selectedEvents.length}</Badge>
              </div>
              {selectedEvents.length ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="py-9"
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="No event this day"
                  description="Choose a highlighted date or switch to list view."
                />
              )}
            </aside>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleEvents.length ? (
              visibleEvents
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" />}
                title={`No events in ${monthName}`}
                description="Move to another month or return to November's fixture schedule."
                action={
                  <Button variant="secondary" onClick={() => setMonthOffset(0)}>
                    Back to November
                  </Button>
                }
              />
            )}
          </div>
        )}
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 border-dashed p-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Want to host a member session?</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Event creation is available to community administrators in the creator workspace.
            </p>
          </div>
          <a
            href="/dashboard/events"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-900 px-4 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Manage events
          </a>
        </Card>
      </div>
    </CommunityShell>
  );
}
