import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  MessageCircle,
  UserRound,
  Users,
} from "lucide-react";
import { MemberShell } from "@/components/layout/member-shell";
import { Avatar, Badge, Button, Card, Chip, EmptyState } from "@/components/ui";
import { getMember, creators } from "@/data/seed";
import { NOTIFICATION_PAGE_SIZE, type NotificationItem } from "@/features/notifications/contracts";
import {
  getNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/notifications.functions";
import { cn, relativeTime } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — The Scenes" }] }),
  component: NotificationsRoute,
});

const kindIcons = {
  comment: MessageCircle,
  mention: UserRound,
  event: CalendarDays,
  course: BookOpen,
  system: Bell,
};

const connectedKindIcons = {
  community_joined: Users,
  course_enrolled: BookOpen,
  lesson_completed: CheckCircle2,
  system: Bell,
};

function NotificationsRoute() {
  const { dataMode } = useApp();
  return dataMode === "fixtures" ? <FixtureNotificationsPage /> : <ConnectedNotificationsPage />;
}

function FixtureNotificationsPage() {
  const { state, markRead, markAllRead, unreadCount } = useApp();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const visible = state.notifications.filter((item) => filter === "all" || !item.read);
  return (
    <MemberShell active="notifications">
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAll={markAllRead}
        filter={filter}
        onFilter={setFilter}
        allLabel={`All · ${state.notifications.length}`}
        subtitle="Comments, mentions, events and learning updates in one place."
      />
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
          <NotificationEmpty filter={filter} onShowAll={() => setFilter("all")} />
        )}
      </div>
    </MemberShell>
  );
}

type ListStatus = "loading" | "ready" | "error";

function ConnectedNotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<ListStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const loadFirstPage = useCallback(
    async (targetFilter: "all" | "unread") => {
      setStatus("loading");
      setErrorMessage("");
      const result = await getNotificationsPage({
        data: { filter: targetFilter, cursor: null, limit: NOTIFICATION_PAGE_SIZE },
      });
      if (!result.ok) {
        if (result.error.code === "UNAUTHENTICATED") {
          await router.navigate({
            to: "/login",
            search: { confirmation: undefined, reset: undefined, next: "/home" },
          });
          return;
        }
        setStatus("error");
        setErrorMessage(result.error.message);
        return;
      }
      setItems(result.data.items);
      setNextCursor(result.data.nextCursor);
      setUnreadCount(result.data.unreadCount);
      setStatus("ready");
    },
    [router],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFirstPage(filter), 0);
    return () => window.clearTimeout(timer);
  }, [filter, loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await getNotificationsPage({
      data: { filter, cursor: nextCursor, limit: NOTIFICATION_PAGE_SIZE },
    });
    setLoadingMore(false);
    if (!result.ok) {
      toast("Could not load more", result.error.message);
      return;
    }
    setItems((current) => [...current, ...result.data.items]);
    setNextCursor(result.data.nextCursor);
    setUnreadCount(result.data.unreadCount);
  }, [filter, loadingMore, nextCursor, toast]);

  const markOne = useCallback(
    async (id: string) => {
      if (pending.has(id)) return;
      setPending((current) => new Set(current).add(id));
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      const result = await markNotificationRead({ data: { id } });
      setPending((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      if (!result.ok) {
        toast("Could not update the notification", result.error.message);
        await loadFirstPage(filter);
        return;
      }
      setUnreadCount(result.data.unreadCount);
      await router.invalidate();
    },
    [filter, loadFirstPage, pending, router, toast],
  );

  const markAll = useCallback(async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    const result = await markAllNotificationsRead({ data: {} });
    setMarkingAll(false);
    if (!result.ok) {
      toast("Could not mark everything read", result.error.message);
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(result.data.unreadCount);
    await router.invalidate();
  }, [markingAll, router, toast, unreadCount]);

  return (
    <MemberShell active="notifications">
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAll={() => void markAll()}
        markingAll={markingAll}
        filter={filter}
        onFilter={setFilter}
        allLabel="All"
        subtitle="Community, learning and account updates in one place."
      />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <p className="mb-3 text-xs text-slate-500">
          Connected notifications. Only activity on this account is shown, and each row links to an
          approved in-app destination.
        </p>
        {status === "loading" ? (
          <Card className="p-5" aria-busy="true">
            <div className="space-y-3" role="status" aria-live="polite">
              <span className="sr-only">Loading notifications</span>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex animate-pulse items-start gap-3">
                  <span className="h-[42px] w-[42px] rounded-full bg-slate-200" />
                  <span className="min-w-0 flex-1 space-y-2">
                    <span className="block h-3.5 w-1/3 rounded bg-slate-200" />
                    <span className="block h-3 w-3/4 rounded bg-slate-100" />
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : status === "error" ? (
          <EmptyState
            icon={<Bell className="h-5 w-5" />}
            title="Notifications are unavailable"
            description={errorMessage}
            action={
              <Button variant="secondary" onClick={() => void loadFirstPage(filter)}>
                Try again
              </Button>
            }
          />
        ) : items.length ? (
          <>
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {items.map((item) => (
                <ConnectedNotificationRow
                  key={item.id}
                  item={item}
                  pending={pending.has(item.id)}
                  onMarkRead={(id) => void markOne(id)}
                />
              ))}
            </Card>
            {nextCursor ? (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <NotificationEmpty filter={filter} onShowAll={() => setFilter("all")} />
        )}
      </div>
    </MemberShell>
  );
}

function NotificationHeader({
  unreadCount,
  onMarkAll,
  filter,
  onFilter,
  allLabel,
  subtitle,
  markingAll = false,
}: {
  unreadCount: number;
  onMarkAll: () => void;
  filter: "all" | "unread";
  onFilter: (filter: "all" | "unread") => void;
  allLabel: string;
  subtitle: string;
  markingAll?: boolean;
}) {
  return (
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
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!unreadCount || markingAll}
            onClick={onMarkAll}
          >
            <Check className="h-4 w-4" /> {markingAll ? "Marking…" : "Mark all read"}
          </Button>
        </div>
        <div className="mt-5 flex gap-2">
          <Chip active={filter === "all"} onClick={() => onFilter("all")}>
            {allLabel}
          </Chip>
          <Chip active={filter === "unread"} onClick={() => onFilter("unread")}>
            Unread · {unreadCount}
          </Chip>
        </div>
      </div>
    </section>
  );
}

function NotificationEmpty({
  filter,
  onShowAll,
}: {
  filter: "all" | "unread";
  onShowAll: () => void;
}) {
  return (
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
          <Button variant="secondary" onClick={onShowAll}>
            Show all
          </Button>
        ) : undefined
      }
    />
  );
}

function ConnectedNotificationRow({
  item,
  pending,
  onMarkRead,
}: {
  item: NotificationItem;
  pending: boolean;
  onMarkRead: (id: string) => void;
}) {
  const Icon = connectedKindIcons[item.type];
  const content = (
    <>
      <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-slate-100 text-indigo-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{item.title}</span>
          {!item.read ? (
            <Badge tone="indigo" className="px-1.5 py-0 text-[9px]">
              New
            </Badge>
          ) : null}
        </span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{item.body}</span>
        <span className="mt-1 block text-xs text-slate-600">{relativeTime(item.createdAt)}</span>
      </span>
      {!item.read ? (
        <span className="mt-1 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-indigo-600" aria-hidden="true" />
        </span>
      ) : (
        <span />
      )}
    </>
  );

  const className = cn(
    "grid grid-cols-[auto_1fr_auto] items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 sm:p-5",
    !item.read && "bg-indigo-50/45",
  );

  return (
    <div className="relative">
      {item.href ? (
        <a
          href={item.href}
          onClick={() => onMarkRead(item.id)}
          className={className}
          aria-busy={pending}
        >
          {content}
          <span className="sr-only">Open and mark as read</span>
        </a>
      ) : (
        <div className={className} aria-busy={pending}>
          {content}
        </div>
      )}
      {!item.read ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => onMarkRead(item.id)}
          className="absolute inset-y-0 right-0 w-14"
          aria-label="Mark as read"
        />
      ) : null}
    </div>
  );
}
