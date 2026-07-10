import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, GraduationCap, MessagesSquare, BarChart3, Settings, Bell, Search } from "lucide-react";
import { Avatar } from "./BrowserFrame";

const NAV = [
  { to: "/app/feed", label: "Home", icon: Home },
  { to: "/app/classroom", label: "Classroom", icon: GraduationCap },
  { to: "/app/messages", label: "Messages", icon: MessagesSquare },
  { to: "/app/creator", label: "Creator Hub", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Left rail */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white">S</span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">SukaSpace</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map((item) => {
            const active = loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={16} className={active ? "text-[#0284C7]" : "text-slate-500"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <Avatar initials="YU" tone="sky" size={32} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">You</div>
              <div className="truncate text-xs text-slate-500">Learner · Free</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 md:max-w-md">
            <Search size={14} />
            <span>Search communities, lessons, people…</span>
          </div>
          <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
            <Bell size={16} />
          </button>
          <Avatar initials="YU" tone="sky" size={30} />
        </header>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white flex justify-around py-1.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${active ? "text-[#0284C7]" : "text-slate-500"}`}>
                <Icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </div>

        <main className="min-w-0 flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
