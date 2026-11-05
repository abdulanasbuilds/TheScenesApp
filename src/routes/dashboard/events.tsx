import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  Copy,
  Download,
  MapPin,
  Pencil,
  Plus,
  Radio,
  Search,
  Ticket,
  Users,
  Video,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  buttonClass,
} from "@/components/ui";
import { events, getCreator, members } from "@/data/seed";
import type { EventItem } from "@/data/types";
import { formatCompact, formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/events")({
  head: () => ({ meta: [{ title: "Events — The Scenes creator workspace" }] }),
  component: EventManagementPage,
});

type ManagedStatus = "scheduled" | "draft" | "past" | "cancelled";
type ManagedEvent = EventItem & { status: ManagedStatus };

const initialEvents: ManagedEvent[] = events
  .filter((event) => event.communitySlug === "ai-builders-guild")
  .map((event) => ({ ...event, status: event.replay ? "past" : "scheduled" }));

const statusTone = {
  scheduled: "green",
  draft: "amber",
  past: "slate",
  cancelled: "clay",
} as const;

const kindLabels: Record<EventItem["kind"], string> = {
  live: "Live session",
  workshop: "Workshop",
  "office-hours": "Office hours",
  meetup: "Meetup",
};

const kindIcons: Record<EventItem["kind"], typeof Video> = {
  live: Video,
  workshop: Radio,
  "office-hours": Users,
  meetup: MapPin,
};

function EventManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [eventList, setEventList] = useState<ManagedEvent[]>(initialEvents);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [tab, setTab] = useState<ManagedStatus>("scheduled");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedEvent | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ManagedEvent | null>(null);
  const [attendeeTarget, setAttendeeTarget] = useState<ManagedEvent | null>(null);
  const [attendeeQuery, setAttendeeQuery] = useState("");

  const counts = useMemo(
    () => ({
      scheduled: eventList.filter((event) => event.status === "scheduled").length,
      draft: eventList.filter((event) => event.status === "draft").length,
      past: eventList.filter((event) => event.status === "past").length,
      cancelled: eventList.filter((event) => event.status === "cancelled").length,
    }),
    [eventList],
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return eventList.filter((event) => {
      const queryMatch =
        !normalized ||
        `${event.title} ${event.description} ${event.location}`.toLowerCase().includes(normalized);
      const kindMatch = kind === "all" || event.kind === kind;
      return event.status === tab && queryMatch && kindMatch;
    });
  }, [eventList, kind, query, tab]);

  const scheduled = eventList.filter((event) => event.status === "scheduled");
  const registered = scheduled.reduce((sum, event) => sum + event.attendees, 0);
  const seats = scheduled.reduce((sum, event) => sum + event.capacity, 0);
  const fill = seats ? Math.round((registered / seats) * 100) : 0;

  const updateStatus = (event: ManagedEvent, status: ManagedStatus, message: string) => {
    setEventList((current) =>
      current.map((item) => (item.id === event.id ? { ...item, status } : item)),
    );
    toast(
      message,
      "This changes local preview state only. No calendar invite or reminder is sent.",
    );
  };

  const duplicate = (event: ManagedEvent) => {
    const copy: ManagedEvent = {
      ...event,
      id: `ev-local-${Date.now()}`,
      slug: `local-event-${Date.now()}`,
      title: `${event.title} (copy)`,
      attendees: 0,
      status: "draft",
      replay: false,
    };
    setEventList((current) => [copy, ...current]);
    setTab("draft");
    toast("Event duplicated", "The copy is a local draft. It is not on the member calendar.");
  };

  const copyLink = async (event: ManagedEvent) => {
    if (event.id.startsWith("ev-local-")) {
      toast(
        "Local drafts have no public page",
        "Only fixture events resolve on the member calendar.",
      );
      return;
    }
    const url = `${window.location.origin}/c/${event.communitySlug}/events/${event.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Event link copied", url);
    } catch {
      toast("Could not copy automatically", url);
    }
  };

  const saveEvent = (next: ManagedEvent) => {
    setEventList((current) => {
      const exists = current.some((event) => event.id === next.id);
      return exists
        ? current.map((event) => (event.id === next.id ? next : event))
        : [next, ...current];
    });
    setEditing(null);
    setCreateOpen(false);
    setTab(next.status === "scheduled" ? "scheduled" : "draft");
    toast(
      next.status === "scheduled" ? "Event marked scheduled" : "Event saved as a draft",
      "Local preview only. No invitation, reminder or calendar sync occurred.",
    );
  };

  return (
    <CreatorShell active="events">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Live and scheduled
                </p>
                <Badge tone="amber">Fixture calendar · no reminders</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Events
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Plan sessions, manage capacity and review registrations. Calendar sync, reminders
                and live-room provisioning are deliberately not connected.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> New event
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Scheduled"
            value={counts.scheduled}
            hint="Fixture events plus local changes"
          />
          <Stat
            label="Registered"
            value={formatCompact(registered)}
            hint="Across scheduled events"
          />
          <Stat
            label="Seat fill"
            value={`${fill}%`}
            hint={`${formatCompact(seats)} seats in total`}
          />
          <Stat label="Drafts" value={counts.draft} hint="Not shown to members" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="event-admin-search" className="sr-only">
              Search events
            </label>
            <Input
              id="event-admin-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search event title, description or room"
              className="pl-9"
            />
          </div>
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="w-44"
            aria-label="Filter events by kind"
          >
            <option value="all">All event types</option>
            <option value="live">Live session</option>
            <option value="workshop">Workshop</option>
            <option value="office-hours">Office hours</option>
            <option value="meetup">Meetup</option>
          </Select>
          <a href="/c/ai-builders-guild/calendar" className={buttonClass("secondary", "md")}>
            Member calendar <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-5">
          <Tabs value={tab} onValueChange={(value) => setTab(value as ManagedStatus)}>
            <TabsList>
              <TabsTrigger value="scheduled">Upcoming ({counts.scheduled})</TabsTrigger>
              <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
              <TabsTrigger value="past">Past &amp; replays ({counts.past})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              <Card className="mt-4 overflow-hidden">
                {visible.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                        <tr>
                          <th scope="col" className="px-4 py-2.5">
                            Event
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            When
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Host
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Attendance
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-2.5 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visible.map((event) => {
                          const host = getCreator(event.hostHandle);
                          const KindIcon = kindIcons[event.kind];
                          const local = event.id.startsWith("ev-local-");
                          const fillPercent = event.capacity
                            ? Math.min(100, Math.round((event.attendees / event.capacity) * 100))
                            : 0;
                          return (
                            <tr key={event.id} className="hover:bg-slate-50">
                              <td className="max-w-80 px-4 py-3">
                                <div className="flex items-start gap-2">
                                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                                    <KindIcon className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">
                                      {event.title}
                                    </p>
                                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                                      <span>{kindLabels[event.kind]}</span>
                                      <span aria-hidden="true">·</span>
                                      <span className="truncate">{event.location}</span>
                                      {local ? <Badge tone="slate">Local</Badge> : null}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-900">
                                  {formatDate(event.start)}
                                </p>
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                                  <Clock3 className="h-3 w-3" />
                                  {formatTime(event.start)}–{formatTime(event.end)} {event.timezone}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-slate-900">
                                  {host?.name ?? "Host"}
                                </p>
                                <p className="text-xs text-slate-500">@{event.hostHandle}</p>
                              </td>
                              <td className="w-40 px-4 py-3">
                                <p className="text-xs font-semibold tabular-nums text-slate-700">
                                  {event.attendees} / {event.capacity}
                                </p>
                                <Progress value={fillPercent} className="mt-1.5 h-1.5" />
                              </td>
                              <td className="px-4 py-3">
                                <Badge tone={statusTone[event.status]}>
                                  {event.status === "scheduled" ? (
                                    <Check className="h-3 w-3" />
                                  ) : null}
                                  {event.status === "cancelled" ? (
                                    <AlertTriangle className="h-3 w-3" />
                                  ) : null}
                                  {event.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Dropdown>
                                  <DropdownTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                      aria-label={`Manage ${event.title}`}
                                    >
                                      Manage
                                    </button>
                                  </DropdownTrigger>
                                  <DropdownContent>
                                    {!local ? (
                                      <DropdownItem
                                        onSelect={() => {
                                          void router.navigate({
                                            href: `/c/${event.communitySlug}/events/${event.id}`,
                                          });
                                        }}
                                      >
                                        <ArrowUpRight className="h-4 w-4" /> View member page
                                      </DropdownItem>
                                    ) : null}
                                    {event.status !== "past" ? (
                                      <DropdownItem onSelect={() => setEditing(event)}>
                                        <Pencil className="h-4 w-4" /> Edit event
                                      </DropdownItem>
                                    ) : null}
                                    {event.status !== "past" ? (
                                      <DropdownItem onSelect={() => duplicate(event)}>
                                        <Copy className="h-4 w-4" /> Duplicate as draft
                                      </DropdownItem>
                                    ) : null}
                                    <DropdownItem onSelect={() => void copyLink(event)}>
                                      <Copy className="h-4 w-4" /> Copy event link
                                    </DropdownItem>
                                    <DropdownSeparator />
                                    {event.status === "draft" ? (
                                      <DropdownItem
                                        onSelect={() =>
                                          updateStatus(event, "scheduled", "Event marked scheduled")
                                        }
                                      >
                                        <Check className="h-4 w-4" /> Mark scheduled
                                      </DropdownItem>
                                    ) : null}
                                    {event.status === "scheduled" ? (
                                      <DropdownItem
                                        onSelect={() =>
                                          updateStatus(event, "draft", "Event moved back to draft")
                                        }
                                      >
                                        <CalendarDays className="h-4 w-4" /> Move to draft
                                      </DropdownItem>
                                    ) : null}
                                    {event.status === "cancelled" ? (
                                      <DropdownItem
                                        onSelect={() =>
                                          updateStatus(event, "draft", "Event restored as a draft")
                                        }
                                      >
                                        <CalendarDays className="h-4 w-4" /> Restore as draft
                                      </DropdownItem>
                                    ) : null}
                                    {event.status === "scheduled" || event.status === "draft" ? (
                                      <DropdownItem onSelect={() => setCancelTarget(event)}>
                                        <AlertTriangle className="h-4 w-4" /> Cancel event
                                      </DropdownItem>
                                    ) : null}
                                    {event.status === "scheduled" || event.status === "past" ? (
                                      <DropdownItem
                                        onSelect={() => {
                                          setAttendeeQuery("");
                                          setAttendeeTarget(event);
                                        }}
                                      >
                                        <Users className="h-4 w-4" /> View attendees
                                      </DropdownItem>
                                    ) : null}
                                  </DropdownContent>
                                </Dropdown>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<CalendarDays className="h-5 w-5" />}
                    title={
                      tab === "draft"
                        ? "No drafts in this view"
                        : tab === "cancelled"
                          ? "No cancelled events"
                          : tab === "past"
                            ? "No past events or replays"
                            : "No events match"
                    }
                    description={
                      query || kind !== "all"
                        ? "Clear the search or event-type filter to see the rest of the calendar."
                        : tab === "draft"
                          ? "Duplicate an event or create a new one to start a draft."
                          : "Create an event to plan the next session."
                    }
                    action={
                      query || kind !== "all" ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setQuery("");
                            setKind("all");
                          }}
                        >
                          Reset filters
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                          <Plus className="h-4 w-4" /> New event
                        </Button>
                      )
                    }
                  />
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Local events do not appear on the member calendar or resolve as event pages.
          </p>
          <a href="/help#status" className="font-bold underline underline-offset-2">
            See what is connected
          </a>
        </div>
      </div>

      {createOpen ? (
        <EventFormModal mode="create" onClose={() => setCreateOpen(false)} onSave={saveEvent} />
      ) : null}

      {editing ? (
        <EventFormModal
          key={editing.id}
          mode="edit"
          event={editing}
          onClose={() => setEditing(null)}
          onSave={saveEvent}
        />
      ) : null}

      <Modal
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => (!open ? setCancelTarget(null) : undefined)}
        title={`Cancel “${cancelTarget?.title ?? "event"}”?`}
        description="Cancelling is a local preview state change."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Keep event
            </Button>
            <Button
              className="bg-rose-700 hover:bg-rose-800"
              onClick={() => {
                if (!cancelTarget) return;
                updateStatus(cancelTarget, "cancelled", "Event cancelled locally");
                setCancelTarget(null);
              }}
            >
              <AlertTriangle className="h-4 w-4" /> Cancel event
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>
            In production, cancelling would notify registered members, release seats, update the
            calendar and preserve an audit record. None of those services are connected here.
          </p>
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            No attendee is emailed and no refund is issued. The event is only marked cancelled in
            this browser session.
          </div>
        </div>
      </Modal>

      <AttendeesModal
        event={attendeeTarget}
        query={attendeeQuery}
        onQueryChange={setAttendeeQuery}
        onClose={() => setAttendeeTarget(null)}
      />
    </CreatorShell>
  );
}

function toDateInput(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDateInput() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function EventFormModal({
  mode,
  event,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  event?: ManagedEvent;
  onClose: () => void;
  onSave: (event: ManagedEvent) => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(event ? toDateInput(event.start) : defaultDateInput());
  const [time, setTime] = useState(event ? toTimeInput(event.start) : "17:00");
  const [duration, setDuration] = useState(
    event
      ? String(
          Math.max(
            15,
            Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000),
          ),
        )
      : "60",
  );
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 100));
  const [kind, setKind] = useState<EventItem["kind"]>(event?.kind ?? "live");
  const [location, setLocation] = useState(event?.location ?? "Live room · The Scenes");
  const [status, setStatus] = useState<"draft" | "scheduled">(
    event?.status === "scheduled" ? "scheduled" : "draft",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    const next: Record<string, string> = {};
    const durationValue = Number(duration);
    const capacityValue = Number(capacity);

    if (title.trim().length < 5) next.title = "Use at least 5 characters.";
    if (description.trim().length < 20) next.description = "Add at least 20 characters of context.";
    if (!date) next.date = "Choose a date.";
    if (!time) next.time = "Choose a start time.";
    if (!Number.isFinite(durationValue) || durationValue < 15)
      next.duration = "Use at least 15 minutes.";
    if (!Number.isFinite(capacityValue) || capacityValue < 1)
      next.capacity = "Capacity must be at least 1.";
    if (location.trim().length < 3) next.location = "Name the room or place.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const startDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startDate.getTime())) {
      setErrors({ date: "Choose a valid date and time." });
      return;
    }
    const endDate = new Date(startDate.getTime() + durationValue * 60000);
    const stamp = Date.now();

    onSave({
      id: event?.id ?? `ev-local-${stamp}`,
      slug: event?.slug ?? `local-event-${stamp}`,
      communitySlug: "ai-builders-guild",
      title: title.trim(),
      description: description.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timezone: event?.timezone ?? "GMT",
      hostHandle: event?.hostHandle ?? "nanaadjei",
      location: location.trim(),
      kind,
      attendees: event?.attendees ?? 0,
      capacity: Math.round(capacityValue),
      replay: event?.replay ?? false,
      accentHue: event?.accentHue ?? 246,
      status,
    });
  };

  return (
    <Modal
      open
      onOpenChange={(open) => (!open ? onClose() : undefined)}
      title={mode === "create" ? "Create an event" : "Edit event"}
      description="Scheduling is local to this preview. No calendar invite, reminder or live room is created."
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="event-form">
            {mode === "create" ? (
              <CalendarPlus className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {mode === "create" ? "Create event" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form id="event-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Event title" htmlFor="event-title" error={errors.title} required>
          <Input
            id="event-title"
            value={title}
            onChange={(inputEvent) => setTitle(inputEvent.target.value)}
            placeholder="e.g. Agent architecture teardown"
            invalid={Boolean(errors.title)}
          />
        </Field>
        <Field
          label="What will happen?"
          htmlFor="event-description"
          hint="Be specific about the format and what members should bring."
          error={errors.description}
          required
        >
          <Textarea
            id="event-description"
            value={description}
            onChange={(inputEvent) => setDescription(inputEvent.target.value)}
            className="min-h-24"
            invalid={Boolean(errors.description)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="event-date" error={errors.date} required>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(inputEvent) => setDate(inputEvent.target.value)}
              invalid={Boolean(errors.date)}
            />
          </Field>
          <Field label="Start time" htmlFor="event-time" error={errors.time} required>
            <Input
              id="event-time"
              type="time"
              value={time}
              onChange={(inputEvent) => setTime(inputEvent.target.value)}
              invalid={Boolean(errors.time)}
            />
          </Field>
          <Field
            label="Duration (minutes)"
            htmlFor="event-duration"
            error={errors.duration}
            required
          >
            <Input
              id="event-duration"
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(inputEvent) => setDuration(inputEvent.target.value)}
              invalid={Boolean(errors.duration)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Event type" htmlFor="event-kind">
            <Select
              id="event-kind"
              value={kind}
              onChange={(inputEvent) => setKind(inputEvent.target.value as EventItem["kind"])}
            >
              <option value="live">Live session</option>
              <option value="workshop">Workshop</option>
              <option value="office-hours">Office hours</option>
              <option value="meetup">Meetup</option>
            </Select>
          </Field>
          <Field label="Capacity" htmlFor="event-capacity" error={errors.capacity} required>
            <Input
              id="event-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(inputEvent) => setCapacity(inputEvent.target.value)}
              invalid={Boolean(errors.capacity)}
            />
          </Field>
          <Field label="Status" htmlFor="event-status">
            <Select
              id="event-status"
              value={status}
              onChange={(inputEvent) => setStatus(inputEvent.target.value as "draft" | "scheduled")}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </Select>
          </Field>
        </div>
        <Field label="Room or place" htmlFor="event-location" error={errors.location} required>
          <Input
            id="event-location"
            value={location}
            onChange={(inputEvent) => setLocation(inputEvent.target.value)}
            invalid={Boolean(errors.location)}
          />
        </Field>
        <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <p className="font-semibold text-slate-800">Preview boundary</p>
          <p className="mt-1">
            This form writes to browser memory only. It does not send invitations, create a video
            room, charge for tickets or update the member calendar.
          </p>
        </div>
      </form>
    </Modal>
  );
}

function AttendeesModal({
  event,
  query,
  onQueryChange,
  onClose,
}: {
  event: ManagedEvent | null;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const roster = useMemo(() => {
    if (!event) return [];
    const normalized = query.trim().toLowerCase();
    return members
      .filter((member) => member.communities.includes(event.communitySlug))
      .filter(
        (member) =>
          !normalized ||
          `${member.name} ${member.handle} ${member.location}`.toLowerCase().includes(normalized),
      )
      .slice(0, 8)
      .map((member, index) => ({
        ...member,
        rsvp: index < 5 ? "Going" : index < 7 ? "Waitlist" : "Invited",
      }));
  }, [event, query]);

  const exportCsv = () => {
    if (!event) return;
    const rows = [
      ["Name", "Handle", "RSVP"],
      ...roster.map((member) => [member.name, member.handle, member.rsvp]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.slug}-attendees.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("CSV exported", "Generated in the browser from the fixture roster.");
  };

  return (
    <Modal
      open={Boolean(event)}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
      title={event ? `Attendees — ${event.title}` : "Attendees"}
      description="A fixture roster. Registration, ticketing and check-in are not connected."
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={exportCsv} disabled={!roster.length}>
            <Download className="h-4 w-4" /> Export visible roster
          </Button>
        </div>
      }
    >
      {event ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Registered
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-slate-900">
                {event.attendees}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Capacity
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-slate-900">
                {event.capacity}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Seats left
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-slate-900">
                {Math.max(0, event.capacity - event.attendees)}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="attendee-search" className="sr-only">
              Search attendees
            </label>
            <Input
              id="attendee-search"
              value={query}
              onChange={(inputEvent) => onQueryChange(inputEvent.target.value)}
              placeholder="Search the visible fixture roster"
              className="pl-9"
            />
          </div>

          {roster.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Member
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Location
                    </th>
                    <th scope="col" className="px-3 py-2">
                      RSVP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size={30} online={member.online} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-900">
                              {member.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">@{member.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{member.location}</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tone={
                            member.rsvp === "Going"
                              ? "green"
                              : member.rsvp === "Waitlist"
                                ? "amber"
                                : "slate"
                          }
                        >
                          {member.rsvp}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Ticket className="h-5 w-5" />}
              title="No attendees in this view"
              description={
                query
                  ? "No fixture member matches that search."
                  : "Drafts have no registrations. Scheduled fixture events show a sample roster."
              }
            />
          )}

          <p className="text-[11px] leading-5 text-slate-500">
            Showing {roster.length} of {event.attendees} registered. The full roster, ticket records
            and check-in status require a registration backend.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
