import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Check, CheckCheck, Trash2, MessageSquare,
  Users, BookOpen, Calendar, Megaphone, CreditCard, Zap,
  GraduationCap, Radio, Star, ArrowRight,
} from "lucide-react";
import { useAppStore, type AppNotification, type NotificationType } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { SPRING_FAST } from "@/lib/pwa";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · SukaSpace" }] }),
  component: NotificationsPage,
});

// ─── Icon map by notification type ───────────────────────────────────────────

const TYPE_ICON: Record<NotificationType | string, React.ElementType> = {
  welcome:          Star,
  system:           Bell,
  new_post:         MessageSquare,
  new_comment:      MessageSquare,
  new_member:       Users,
  new_message:      MessageSquare,
  event:            Calendar,
  course_published: BookOpen,
  lesson_published: GraduationCap,
  payment_success:  CreditCard,
  payment_failed:   CreditCard,
  announcement:     Megaphone,
  community_live:   Radio,
  onboarding:       Zap,
};

const TYPE_COLOR: Record<NotificationType | string, string> = {
  welcome:          "bg-amber-100 text-amber-600",
  system:           "bg-slate-100 text-slate-500",
  new_post:         "bg-blue-100 text-blue-600",
  new_comment:      "bg-blue-100 text-blue-600",
  new_member:       "bg-emerald-100 text-emerald-600",
  new_message:      "bg-violet-100 text-violet-600",
  event:            "bg-orange-100 text-orange-600",
  course_published: "bg-teal-100 text-teal-600",
  lesson_published: "bg-teal-100 text-teal-600",
  payment_success:  "bg-green-100 text-green-600",
  payment_failed:   "bg-red-100 text-red-600",
  announcement:     "bg-pink-100 text-pink-600",
  community_live:   "bg-red-100 text-red-600",
  onboarding:       "bg-purple-100 text-purple-600",
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function relTime(ts: number | string): string {
  const ms   = typeof ts === "number" ? ts : Date.parse(ts);
  const diff = Date.now() - ms;
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return "just now";
  const min  = Math.floor(sec / 60);
  if (min < 60)  return `${min}m ago`;
  const hr   = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  const day  = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7)   return `${day}d ago`;
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });
}

function tsToMs(n: AppNotification): number {
  if (typeof n.time === "string" && n.time.match(/^\d{4}/)) return Date.parse(n.time);
  if (typeof n.time === "string") return Date.now() - parseInt(n.time, 10) * 1000; // relative fallback
  return Date.now();
}

// ─── Group notifications by day ───────────────────────────────────────────────

type Group = { label: string; items: AppNotification[] };

function groupByDay(list: AppNotification[]): Group[] {
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday     = (d: Date) => d.toDateString() === today.toDateString();
  const isYesterday = (d: Date) => d.toDateString() === yesterday.toDateString();

  const groups: Record<string, AppNotification[]> = {};
  const sorted = [...list].sort((a, b) => tsToMs(b) - tsToMs(a));

  for (const n of sorted) {
    const d = new Date(tsToMs(n));
    const key = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : d.toLocaleDateString([], { month: "long", day: "numeric" });
    (groups[key] = groups[key] ?? []).push(n);
  }

  // Preserve day order
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  n, onRead, onDelete,
}: {
  n: AppNotification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const nav   = useNavigate();
  const Icon  = TYPE_ICON[n.type ?? "system"] ?? Bell;
  const color = TYPE_COLOR[n.type ?? "system"] ?? "bg-slate-100 text-slate-500";

  const handleClick = () => {
    if (!n.read) onRead(n.id);
    if (n.link) nav({ to: n.link as any });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, height: 0 }}
      transition={SPRING_FAST}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl p-3.5 cursor-pointer transition-colors",
        n.read
          ? "hover:bg-slate-50"
          : "bg-blue-50/60 hover:bg-blue-50 border border-blue-100",
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center", color)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        {n.actorName && (
          <span className="text-xs font-semibold text-slate-700">{n.actorName} · </span>
        )}
        <span className={cn("text-sm", n.read ? "text-slate-600" : "text-slate-800 font-medium")}>
          {n.text}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">{relTime(tsToMs(n))}</span>
          {n.link && (
            <span className="text-xs text-blue-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className="absolute top-4 right-10 w-2 h-2 rounded-full bg-blue-500" />
      )}

      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.read && (
          <button
            onClick={e => { e.stopPropagation(); onRead(n.id); }}
            className="p-1 rounded-lg hover:bg-white/80 text-slate-400 hover:text-blue-500"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(n.id); }}
          className="p-1 rounded-lg hover:bg-white/80 text-slate-400 hover:text-red-500"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function NotificationsPage() {
  const store        = useAppStore();
  const notifs       = store.notifications ?? [];
  const unreadCount  = notifs.filter(n => !n.read).length;
  const groups       = groupByDay(notifs);

  const markRead   = (id: number) => store.markNotificationRead?.(id);
  const markAllRead = () => store.markAllNotificationsRead?.();
  const deleteNotif = (id: number) => store.clearNotification?.(id);
  const clearAll   = () => store.clearAllNotifications?.();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {notifs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BellOff className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700">You're all caught up</h3>
          <p className="text-sm text-slate-400 mt-1">New notifications will appear here</p>
        </motion.div>
      )}

      {/* ── Notification groups ── */}
      <AnimatePresence mode="popLayout">
        {groups.map(group => (
          <motion.div key={group.label} layout>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              {group.label}
            </p>
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {group.items.map(n => (
                  <NotifRow
                    key={n.id}
                    n={n}
                    onRead={markRead}
                    onDelete={deleteNotif}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
