import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, BookOpen, CalendarDays, Check, MessageCircle, UserRound } from "lucide-react";
import { MemberShell } from "@/components/layout/member-shell";
import { Avatar, Badge, Button, Card, Chip, EmptyState } from "@/components/ui";
import { getMember, creators } from "@/data/seed";
import { cn, relativeTime } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — The Scenes" }] }),
  component: NotificationsPage,
});

const kindIcons = {
  comment: MessageCircle,
  mention: UserRound,
  event: CalendarDays,
  course: BookOpen,
  system: Bell,
};

function NotificationsPage() {
  const { state, markRead, markAllRead, unreadCount } = useApp();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const visible = state.notifications.filter((item) => filter === "all" || !item.read);
  return (
    <MemberShell active="notifications">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Activity centre
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Comments, mentions, events and learning updates in one place.
              </p>
            </div>
            <Button variant="secondary" size="sm" disabled={!unreadCount} onClick={markAllRead}>
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          </div>
          <div className="mt-5 flex gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All · {state.notifications.length}
            </Chip>
            <Chip active={filter === "unread"} onClick={() => setFilter("unread")}>
              Unread · {unreadCount}
            </Chip>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {visible.length ? (
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {visible.map((item) => {
              const Icon = kindIcons[item.kind];
              const actor = item.actorId
                ? (getMember(item.actorId) ??
                  creators.find((creator) => creator.id === item.actorId))
                : undefined;
              return (
                <a
                  key={item.id}
                  href={item.href ?? "/notifications"}
                  onClick={() => markRead(item.id)}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] gap-3 p-4 transition-colors hover:bg-slate-50 sm:p-5",
                    !item.read && "bg-indigo-50/45",
                  )}
                >
                  <div className="relative">
                    {actor ? (
                      <Avatar
                        name={actor.name}
                        size={42}
                        online={Boolean("online" in actor && actor.online)}
                      />
                    ) : (
                      <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-slate-100 text-indigo-700">
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-700 ring-1 ring-slate-200">
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      {!item.read ? (
                        <Badge tone="indigo" className="px-1.5 py-0 text-[9px]">
                          New
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                    <p className="mt-1 text-xs text-slate-600">{relativeTime(item.createdAt)}</p>
                  </div>
                  {!item.read ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        markRead(item.id);
                      }}
                      className="mt-1 h-3 w-3 rounded-full bg-indigo-600"
                      aria-label="Mark as read"
                    />
                  ) : (
                    <span />
                  )}
                </a>
              );
            })}
          </Card>
        ) : (
          <EmptyState
            icon={<Bell className="h-5 w-5" />}
            title={filter === "unread" ? "You’re all caught up" : "No notifications yet"}
            description={
              filter === "unread"
                ? "There are no unread updates. Switch to All to revisit earlier activity."
                : "Community and classroom activity will appear here."
            }
            action={
              filter === "unread" ? (
                <Button variant="secondary" onClick={() => setFilter("all")}>
                  Show all
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </MemberShell>
  );
}
