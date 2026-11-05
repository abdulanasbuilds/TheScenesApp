import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarPlus, Check, Clock3, ExternalLink, MapPin, Share2, Users } from "lucide-react";
import { CommunityShell } from "@/components/layout/community-shell";
import { Avatar, AvatarStack, Badge, Button, Card, CoverArt } from "@/components/ui";
import { getCommunity, getCreator, getEvent, members } from "@/data/seed";
import { formatDate, formatTime } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/events/$eventId")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    const event = getEvent(params.eventId);
    if (!community || !event || event.communitySlug !== community.slug) throw notFound();
    return { community, event };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.event.title ?? "Event"} — The Scenes` }],
  }),
  component: EventDetailsPage,
});

function EventDetailsPage() {
  const { community, event } = Route.useLoaderData();
  const host = getCreator(event.hostHandle);
  const { state, toggleRsvp } = useApp();
  const { toast } = useToast();
  const going = state.rsvps.includes(event.id);
  const full = event.attendees >= event.capacity;

  const copyEventLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Event link copied", url);
    } catch {
      toast("Copy unavailable", `Copy this address manually: ${url}`);
    }
  };
  return (
    <CommunityShell community={community} active="calendar">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <a
            href={`/c/${community.slug}/calendar`}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-700"
          >
            Calendar / <span className="text-slate-800">{event.title}</span>
          </a>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-7 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <CoverArt
            seed={event.slug}
            hue={event.accentHue}
            rounded="rounded-2xl"
            className="aspect-[16/8]"
            label={event.kind.replace("-", " ")}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="indigo">{event.kind.replace("-", " ")}</Badge>
            {event.replay ? (
              <Badge tone="green">Replay available</Badge>
            ) : (
              <Badge tone="outline">Upcoming</Badge>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-slate-700">{event.description}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Card className="flex gap-3 p-4">
              <CalendarPlus className="mt-0.5 h-5 w-5 text-indigo-700" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Date</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(event.start)}</p>
              </div>
            </Card>
            <Card className="flex gap-3 p-4">
              <Clock3 className="mt-0.5 h-5 w-5 text-indigo-700" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Time</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatTime(event.start)} · {event.timezone}
                </p>
              </div>
            </Card>
            <Card className="flex gap-3 p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-indigo-700" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Where</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{event.location}</p>
              </div>
            </Card>
            <Card className="flex gap-3 p-4">
              <Users className="mt-0.5 h-5 w-5 text-indigo-700" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Attendance</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {event.attendees} / {event.capacity} places
                </p>
              </div>
            </Card>
          </div>
          <section className="mt-8">
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              About this session
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-7 text-slate-700">
              <p>
                This session belongs to the {community.name} event programme. Members can RSVP in
                the preview and keep the event on their local calendar state.
              </p>
              <p>
                Live room delivery, email reminders and attendance tracking are not connected in
                this frontend phase. The interface never generates an external meeting link.
              </p>
            </div>
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
              Your place
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">
              {event.replay
                ? "Watch replay"
                : full && !going
                  ? "Waitlist"
                  : going
                    ? "You’re going"
                    : "Reserve a place"}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              RSVP changes are stored locally and do not send a confirmation email.
            </p>
            <Button
              className="mt-4 w-full"
              size="lg"
              variant={going ? "secondary" : "primary"}
              disabled={full && !going}
              onClick={() => {
                toggleRsvp(event.id);
                toast(
                  going ? "RSVP removed" : "Place reserved locally",
                  "No external event service was contacted.",
                );
              }}
            >
              {going ? <Check className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {going ? "Going" : full ? "Event full" : "RSVP"}
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => void copyEventLink()}>
              <Share2 className="h-4 w-4" /> Share event
            </Button>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
              Hosted by
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={host?.name ?? "Host"} size={44} online />
              <div>
                <a
                  href={`/creators/${host?.handle}`}
                  className="text-sm font-bold text-slate-900 hover:text-indigo-700"
                >
                  {host?.name}
                </a>
                <p className="text-xs text-slate-500">{host?.location}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{host?.headline}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Attending
              </p>
              <span className="text-xs font-semibold text-slate-500">{event.attendees}</span>
            </div>
            <div className="mt-3">
              <AvatarStack names={members.slice(0, 7).map((member) => member.name)} max={6} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Attendance shown is fixture data for interface testing.
            </p>
          </Card>
        </aside>
      </div>
    </CommunityShell>
  );
}
