import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, GraduationCap, MessagesSquare, BarChart3, Settings, Bell, Search, BookOpen, Calendar, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "./BrowserFrame";
import { useAppStore } from "@/lib/app-store";

const NAV = [
  { to: "/app/feed", label: "Community", icon: Home },
  { to: "/app/courses", label: "Courses", icon: BookOpen },
  { to: "/app/classroom", label: "Classroom", icon: GraduationCap },
  { to: "/app/messages", label: "Messages", icon: MessagesSquare },
  { to: "/app/members", label: "Members", icon: Users },
  { to: "/app/calendar", label: "Calendar", icon: Calendar },
  { to: "/app/payouts", label: "Payouts", icon: Wallet },
  { to: "/app/creator", label: "Creator Hub", icon: BarChart3 },
  { to: "/app/search", label: "Search", icon: Search },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_NAV = NAV.filter(n => ["/app/feed", "/app/courses", "/app/classroom", "/app/messages", "/app/creator"].includes(n.to));

export function AppShell() {
  const loc = useLocation();
  const nav = useNavigate();
  const store = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (store.isHydrated && !store.session) window.location.replace("/auth");
  }, [store.isHydrated, store.session]);

  if (!store.isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!store.session) return null;

  const displayName = store.session.name;
  const displayInitials = store.session.avatar;
  const displayRole = store.session.role === "creator" ? "Creator" : "Learner";
  const photoUrl = store.session.photoUrl;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-xs font-bold text-white">S</span>
          <span className="text-sm font-semibold tracking-tight text-foreground">SukaSpace</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {NAV.map(item => {
            const active = loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                <Icon size={16} className={active ? "text-primary" : "text-muted-foreground"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link to="/app/settings" className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent">
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="h-8 w-8 rounded-full border border-border object-cover shrink-0" />
            ) : (
              <Avatar initials={displayInitials} tone="sky" size={32} />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{displayRole}</div>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur sm:gap-3 sm:px-4">
          <Link
            to="/app/search"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-accent px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40 md:max-w-md"
          >
            <Search size={14} className="shrink-0" />
            <span className="truncate">Search communities, courses, people…</span>
          </Link>
          <div className="relative shrink-0">
            <button
              aria-label="Notifications"
              onClick={() => setShowNotifs(v => !v)}
              className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-accent"
            >
              <Bell size={16} />
              {store.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {store.unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-border bg-card p-2 shadow-lg">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    <button onClick={() => store.markAllNotificationsRead()} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {store.notifications.length === 0 && <div className="px-2 py-4 text-center text-xs text-muted-foreground">You're all caught up.</div>}
                    {store.notifications.map(n => (
                      <div key={n.id} className={`rounded-lg px-2 py-2 text-sm ${n.read ? "text-muted-foreground" : "bg-accent font-medium text-foreground"}`}>
                        <div>{n.text}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={() => nav({ to: "/app/settings" })} className="shrink-0" aria-label="Account settings">
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="h-8 w-8 rounded-full border border-border object-cover" />
            ) : (
              <Avatar initials={displayInitials} tone="sky" size={30} />
            )}
          </button>
        </header>

        {/* Mobile bottom nav */}
        <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card px-1 py-1.5 md:hidden">
          {MOBILE_NAV.map(n => {
            const Icon = n.icon;
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium ${active ? "bg-sky-50 text-primary" : "text-muted-foreground"}`}>
                <Icon size={18} className="shrink-0" />
                <span className="max-w-full truncate">{n.label === "Creator Hub" ? "Creator" : n.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile scrollable nav */}
        <nav className="sticky top-14 z-20 flex gap-1.5 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
          {NAV.map(n => {
            const active = loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-primary bg-sky-50 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                <Icon size={13} />{n.label === "Creator Hub" ? "Creator" : n.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
