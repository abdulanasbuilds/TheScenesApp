import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, MessageSquare, Users, BookOpen, Calendar, CheckCircle,
  AlertCircle, Megaphone, Rocket, Sparkles, ArrowRight, Check,
} from "lucide-react";
import { useAppStore, type AppNotification, type NotificationType } from "@/lib/app-store";
import { SPRING_FAST } from "@/lib/pwa";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · SukaSpace" }] }),
  component: NotificationsPage,
});

// ─── Type → icon + color ──────────────────────────────────────────────────────

interface NotifMeta {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  fg: string;
  label: string;
}

function notifMeta(type: NotificationType | undefined): NotifMeta {
  switch (type) {
    case "new_message":      return { icon: MessageSquare, bg: "bg-blue-50",    fg: "text-blue-600",   label: "Message" };
    case "new_comment":      return { icon: MessageSquare, bg: "bg-indigo-50",  fg: "text-indigo-600", label: "Comment" };
    case "new_member":       return { icon: Users,         bg: "bg-emerald-50", fg: "text-emerald-600",label: "New Member" };
    case "new_post":         return { icon: Megaphone,     bg: "bg-violet-50",  fg: "text-violet-600", label: "Post" };
    case "course_published": return { icon: BookOpen,      bg: "bg-sky-50",     fg: "text-sky-600",    label: "Course" };
    case "lesson_published": return { icon: BookOpen,      bg: "bg-sky-50",     fg: "text-sky-600",    label: "Lesson" };
    case "event":            return { icon: Calendar,      bg: "bg-amber-50",   fg: "text-amber-600",  label: "Event" };
    case "payment_success":  return { icon: CheckCircle,   bg: "bg-green-50",   fg: "text-green-600",  label: "Payment" };
    case "payment_failed":   return { icon: AlertCircle,   bg: "bg-red-50",     fg: "text-red-600",    label: "Alert" };
    case "announcement":     return { icon: Megaphone,     bg: "bg-orange-50",  fg: "text-orange-600", label: "Announcement" };
    case "community_live":   return { icon: Rocket,        bg: "bg-primary/10", fg: "text-primary",    label: "Community" };
    case "welcome":          return { icon: Sparkles,      bg: "bg-primary/10", fg: "text-primary",    label: "Welcome" };
    case "onboarding":       return { icon: Sparkles,      bg: "bg-primary/10", fg: "text-primary",    label: "Setup" };
    default:                 return { icon: Bell,          bg: "bg-slate-100",  fg: "text-slate-500",  label: "Notification" };
  }
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(time: string | number): string {
  if (time === "Just now") return "Just now";
  const n = typeof time === "number" ? time : parseInt(time, 10);
  if (isNaN(n)) return String(time);
  const diff = Date.now() - n;
  if (diff < 60_000)   return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ n, onRead }: { n: AppNotification; onRead: (n: AppNotification) => void }) {
  const nav = useNavigate();
  const meta = notifMeta(n.type);
  const Icon = meta.icon;

  const handleClick = () => {
    onRead(n);
    if (n.link) nav({ to: n.link as any });
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING_FAST}
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-accent ${!n.read ? "bg-primary/5" : ""}`}
    >
      {/* Icon badge */}
      <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.bg} ${meta.fg}`}>
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
          {n.text}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">{relativeTime(n.time)}</span>
          {n.actorName && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {n.actorName}
            </span>
          )}
          {!n.read && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
        </div>
      </div>

      {/* Arrow if has link */}
      {n.link && <ArrowRight size={13} className="mt-1 shrink-0 text-muted-foreground/40" />}
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function NotificationsPage() {
  const store = useAppStore();
  const notifications = [...store.notifications].sort((a, b) => {
    // Unread first, then by id (newest first)
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.id - a.id;
  });
  const unread = notifications.filter(n => !n.read);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
          </p>
        </div>
        {unread.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => store.markAllNotificationsRead()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <Check size={12} />
            Mark all read
          </motion.button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
            <Bell size={24} className="text-slate-400" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">You're all caught up</p>
          <p className="mt-1 text-sm text-muted-foreground">New notifications will appear here.</p>
        </div>
      )}

      {/* Unread section */}
      {unread.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Unread
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <AnimatePresence initial={false}>
              {unread.map(n => (
                <NotifRow key={n.id} n={n} onRead={store.markNotificationRead} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Earlier section */}
      {notifications.filter(n => n.read).length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Earlier
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <AnimatePresence initial={false}>
              {notifications.filter(n => n.read).map(n => (
                <NotifRow key={n.id} n={n} onRead={store.markNotificationRead} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
