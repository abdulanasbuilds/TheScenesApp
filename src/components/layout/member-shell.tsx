import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Compass,
  Home,
  LayoutGrid,
  Search,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { Brand } from "./public-shell";
import { cn } from "@/lib/utils";
import { useGlobalSearchShortcut } from "@/lib/use-global-search-shortcut";
import { useApp } from "@/store/app-store";

type MemberSection = "home" | "explore" | "learning" | "notifications" | "marketplace" | "settings";

const nav = [
  { id: "home" as const, label: "Home", href: "/home", icon: Home },
  { id: "explore" as const, label: "Explore", href: "/explore", icon: Compass },
  { id: "learning" as const, label: "My learning", href: "/my-learning", icon: BookOpen },
  { id: "notifications" as const, label: "Notifications", href: "/notifications", icon: Bell },
  { id: "marketplace" as const, label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
];

export function MemberShell({ active, children }: { active: MemberSection; children: ReactNode }) {
  const { currentMember, unreadCount, state } = useApp();
  useGlobalSearchShortcut();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center gap-4 px-4 sm:px-5">
          <div className="lg:w-[220px]">
            <Brand />
          </div>
          <a
            href="/search"
            className="hidden h-9 max-w-lg flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 hover:border-slate-300 md:flex"
          >
            <Search className="h-4 w-4" /> Search communities, courses and creators{" "}
            <kbd aria-hidden="true" className="ml-auto text-[10px] font-bold text-slate-600">
              ⌘K
            </kbd>
          </a>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/dashboard/creator"
              className="hidden h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:flex"
            >
              <LayoutGrid className="h-4 w-4" /> Creator workspace
            </a>
            <a
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Account settings"
            >
              <Settings className="h-[18px] w-[18px]" />
            </a>
            <a
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label={`${unreadCount} unread notifications`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount ? (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-clay-600 ring-2 ring-white" />
              ) : null}
            </a>
            <a
              href={`/c/ai-builders-guild/members/${currentMember?.id}`}
              aria-label="Open your profile"
            >
              <Avatar name={currentMember?.name ?? "Ama Boateng"} size={34} online />
            </a>
          </div>
        </div>
      </header>
      <aside className="fixed inset-y-16 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col px-3 py-4">
          <nav className="space-y-1" aria-label="Member application">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={active === item.id ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold",
                    active === item.id
                      ? "bg-indigo-50 text-indigo-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                  {item.id === "notifications" && unreadCount ? (
                    <span className="ml-auto rounded-full bg-clay-600 px-1.5 py-0.5 text-[9px] text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </nav>
          <div className="mt-6">
            <p className="px-3 text-[10px] font-bold tracking-[0.14em] text-slate-600 uppercase">
              Your communities
            </p>
            <div className="mt-2 space-y-1">
              {state.joined.slice(0, 4).map((slug) => (
                <a
                  key={slug}
                  href={`/c/${slug}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
                  {slug
                    .split("-")
                    .map((part) => part[0]?.toUpperCase() + part.slice(1))
                    .join(" ")}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-700" />
              <p className="text-xs font-bold text-slate-900">Preview session</p>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Activity and progress live only in browser memory.
            </p>
            <Badge tone="green" className="mt-2">
              ● Local state
            </Badge>
          </div>
        </div>
      </aside>
      <main id="main-content" className="pb-20 lg:ml-60 lg:pb-0">
        {children}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
        aria-label="Mobile application navigation"
      >
        <div className="mx-auto flex max-w-lg justify-around">
          {nav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={active === item.id ? "page" : undefined}
                className={cn(
                  "flex min-w-[62px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-semibold",
                  active === item.id ? "text-indigo-700" : "text-slate-500",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>
                  {item.id === "notifications" ? "Alerts" : item.label.replace("My ", "")}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
