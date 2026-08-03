import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home, GraduationCap, MessagesSquare, BarChart3, Settings,
  Bell, Search, BookOpen, Calendar, Users, Wallet, LayoutDashboard,
  Radio, Zap, Share2, MessageCircle, Compass, Download, X as XIcon, type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { Avatar } from "./BrowserFrame";
import { useAppStore } from "@/lib/app-store";
import { Logo } from "@/components/Logo";
import { GlobalFeedbackDrawer, openFeedbackDrawer } from "@/components/GlobalFeedbackDrawer";
import { xpToTier } from "@/lib/catalog";
import { hapticTap, SPRING_FAST, SPRING_STRUCTURAL, captureInstallPrompt, hasInstallPrompt, triggerInstallPrompt } from "@/lib/pwa";
import { AppLoadingSkeleton } from "@/components/PageSkeleton";

// ─── Nav item type ─────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

// ─── Nav definitions ───────────────────────────────────────────────────────────

const CREATOR_NAV: NavItem[] = [
  { to: "/app/creator",      label: "Creator Hub",  icon: BarChart3 },
  { to: "/app/analytics",    label: "Analytics",    icon: BarChart3 },

  { to: "/app/feed",         label: "Community",    icon: Home },
  { to: "/app/courses",      label: "Courses",      icon: BookOpen },
  { to: "/app/classroom",    label: "Classroom",    icon: GraduationCap },
  { to: "/app/members",      label: "Members",      icon: Users },
  { to: "/app/calendar",     label: "Calendar",     icon: Calendar },
  { to: "/app/messages",     label: "Messages",     icon: MessagesSquare },
  { to: "/app/billing",      label: "Billing",      icon: Wallet },
  { to: "/app/payouts",      label: "Payouts",      icon: Wallet },
  { to: "/discover",         label: "Discover",     icon: Compass },
  { to: "/app/live",         label: "Live",         icon: Radio,    comingSoon: true },
  { to: "/app/automations",  label: "Automations",  icon: Zap,      comingSoon: true },
  { to: "/app/affiliate",    label: "Affiliate",    icon: Share2,   comingSoon: true },
  { to: "/app/leaderboard",  label: "Leaderboard",  icon: BarChart3 },
  { to: "/app/search",       label: "Search",       icon: Search },
  { to: "/app/settings",     label: "Settings",     icon: Settings },
];

const LEARNER_NAV: NavItem[] = [
  { to: "/app/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/app/feed",        label: "Community",   icon: Home },
  { to: "/app/classroom",   label: "Classroom",   icon: GraduationCap },
  { to: "/app/courses",     label: "Courses",     icon: BookOpen },
  { to: "/discover",        label: "Discover",    icon: Compass },
  { to: "/app/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { to: "/app/calendar",    label: "Calendar",    icon: Calendar },
  { to: "/app/messages",    label: "Messages",    icon: MessagesSquare },
  { to: "/app/live",        label: "Live",        icon: Radio,   comingSoon: true },
  { to: "/app/search",      label: "Search",      icon: Search },
  { to: "/app/settings",    label: "Settings",    icon: Settings },
];

const CREATOR_MOBILE = ["/app/creator", "/app/feed", "/app/courses", "/app/classroom", "/app/members"];
const LEARNER_MOBILE  = ["/app/dashboard", "/app/feed", "/app/classroom", "/app/courses", "/app/calendar"];

// ─── Notification Bottom Sheet (mobile) ───────────────────────────────────────

function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const store = useAppStore();

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-neutral-100 bg-card focus:outline-none md:hidden"
          style={{ maxHeight: "75vh" }}>
          {/* Drag handle */}
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-neutral-200" />
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <button
              onClick={() => { store.markAllNotificationsRead(); hapticTap(); }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 pb-8 space-y-1">
            {store.notifications.length === 0 ? (
              <div className="px-2 py-10 text-center text-xs text-muted-foreground">
                You&apos;re all caught up.
              </div>
            ) : (
              store.notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg px-3 py-2.5 text-sm ${n.read ? "text-muted-foreground" : "bg-accent font-medium text-foreground"}`}
                >
                  <div className="text-xs">{n.text}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</div>
                </div>
              ))
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Desktop notifications popover
function NotificationsPopover({ onClose }: { onClose: () => void }) {
  const store = useAppStore();
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={SPRING_FAST}
        className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-neutral-100 bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          <button
            onClick={() => store.markAllNotificationsRead()}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-80 space-y-px overflow-y-auto p-1.5">
          {store.notifications.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">You&apos;re all caught up.</div>
          ) : (
            store.notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg px-3 py-2.5 text-sm ${n.read ? "text-muted-foreground" : "bg-accent font-medium text-foreground"}`}
              >
                <div className="text-xs">{n.text}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell() {
  const loc  = useLocation();
  const nav  = useNavigate();
  const store = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Capture PWA install prompt and show banner when available
  useEffect(() => {
    captureInstallPrompt();
    if (hasInstallPrompt()) setShowInstallBanner(true);
    const onAvailable = () => setShowInstallBanner(true);
    window.addEventListener("pwa-install-available", onAvailable);
    return () => window.removeEventListener("pwa-install-available", onAvailable);
  }, []);

  useEffect(() => {
    if (store.isHydrated && !store.session) window.location.replace("/auth");
  }, [store.isHydrated, store.session]);

  if (!store.isHydrated) {
    return <AppLoadingSkeleton />;
  }
  if (!store.session) return null;

  const isCreator = store.session.role === "creator";
  const NAV         = isCreator ? CREATOR_NAV : LEARNER_NAV;
  const MOBILE_TOPS = isCreator ? CREATOR_MOBILE : LEARNER_MOBILE;
  const MOBILE_NAV  = NAV.filter((n) => MOBILE_TOPS.includes(n.to));

  const displayName = store.session.name;
  const initials    = store.session.avatar;
  const displayRole = isCreator ? "Creator" : "Learner";
  const photoUrl    = store.session.photoUrl;

  const tier = xpToTier(0);

  const handleNotifClick = () => {
    hapticTap();
    setShowNotifs((v) => !v);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-neutral-100 px-4">
          <Logo className="h-6 w-auto" />
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {NAV.map((item) => {
            const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => hapticTap()}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-neutral-100 text-foreground"
                    : "text-muted-foreground hover:bg-neutral-50 hover:text-foreground"
                }`}
              >
                <Icon size={15} className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.comingSoon && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-700">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Feedback link */}
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => { openFeedbackDrawer(); hapticTap(); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground"
          >
            <MessageCircle size={15} className="text-muted-foreground" />
            Report a Bug / Give Feedback
          </button>
        </div>

        {/* Profile + XP tier */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="rounded-lg border border-border bg-background px-2.5 py-2">
            <div className="flex items-center justify-between gap-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tier.color}`}>
                {tier.emoji} {tier.name}
              </span>
              <Link to="/app/leaderboard" className="text-[10px] font-semibold text-primary hover:underline">
                Rank →
              </Link>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
            <div className="mt-0.5 text-[9px] text-muted-foreground">0 / {tier.nextAt ?? 500} XP</div>
          </div>

          <Link to="/app/settings" className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent transition-colors" onClick={() => hapticTap()}>
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="h-8 w-8 shrink-0 rounded-full border border-border object-cover" />
            ) : (
              <Avatar initials={initials} tone="sky" size={32} />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{displayRole}</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-neutral-100 bg-card/90 px-3 backdrop-blur sm:gap-3 sm:px-4">
          <Link
            to="/app/search"
            onClick={() => hapticTap()}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-muted-foreground hover:border-neutral-300 md:max-w-md"
          >
            <Search size={14} className="shrink-0" />
            <span className="truncate">Search communities, courses, people…</span>
          </Link>

          {/* Notifications */}
          <div className="relative shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={SPRING_FAST}
              aria-label="Notifications"
              onClick={handleNotifClick}
              className="relative rounded-lg border border-neutral-200 bg-card p-2 text-muted-foreground hover:bg-neutral-50 transition-colors"
            >
              <Bell size={16} />
              {store.unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={SPRING_FAST}
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white"
                >
                  {store.unreadCount > 9 ? "9+" : store.unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Desktop popover */}
            <AnimatePresence>
              {showNotifs && !isMobile && (
                <NotificationsPopover onClose={() => setShowNotifs(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={SPRING_FAST}
            onClick={() => { hapticTap(); nav({ to: "/app/settings" }); }}
            className="shrink-0"
            aria-label="Account settings"
          >
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="h-8 w-8 rounded-full border border-border object-cover" />
            ) : (
              <Avatar initials={initials} tone="sky" size={30} />
            )}
          </motion.button>
        </header>

        {/* Mobile bottom nav */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-neutral-100 bg-card md:hidden">
          {MOBILE_NAV.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname.startsWith(n.to);
            const label = n.label === "Creator Hub" ? "Creator" : n.label;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => hapticTap()}
                className={`flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition-colors ${
                  active ? "bg-neutral-100 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={SPRING_FAST}
                >
                  <Icon size={18} className="shrink-0" />
                </motion.div>
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* PWA install banner — only shows when browser offers a home screen install */}
        {showInstallBanner && (
          <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Download size={13} className="shrink-0 text-primary" />
              <span className="font-medium">Add SukaSpace to your home screen for the fastest experience</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={async () => {
                  hapticTap();
                  await triggerInstallPrompt();
                  setShowInstallBanner(false);
                }}
                className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary/90"
              >
                Install
              </button>
              <button
                onClick={() => { setShowInstallBanner(false); hapticTap(); }}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <XIcon size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile scrollable nav — secondary items only (primary items are in the bottom tab bar) */}
        <nav className="sticky top-14 z-20 flex gap-1.5 overflow-x-auto border-b border-neutral-100 bg-card px-3 py-2 scrollbar-hide snap-x snap-mandatory md:hidden">
          {NAV.filter(n => !MOBILE_TOPS.includes(n.to)).map((n) => {
            const active = loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            const label = n.label === "Creator Hub" ? "Creator" : n.label;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => hapticTap()}
                className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors ${
                  active
                    ? "border-primary bg-neutral-100 text-primary"
                    : "border-neutral-200 bg-card text-muted-foreground hover:border-neutral-300 hover:text-foreground"
                }`}
              >
                <Icon size={13} />
                {label}
                {n.comingSoon && (
                  <span className="rounded-full bg-amber-100 px-1 text-[8px] font-bold text-amber-700">soon</span>
                )}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile notifications bottom sheet */}
      <NotificationsDrawer
        open={showNotifs && isMobile}
        onClose={() => setShowNotifs(false)}
      />

      <GlobalFeedbackDrawer />
    </div>
  );
}
