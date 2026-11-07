import { useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Store,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  buttonClass,
} from "@/components/ui";
import { Brand } from "./public-shell";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

type CreatorSection = "overview" | "community" | "members" | "courses" | "events" | "commerce";

const navigation: Array<{
  id: CreatorSection;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", href: "/dashboard/creator", icon: LayoutDashboard },
  { id: "community", label: "Community", href: "/dashboard/community", icon: MessageSquareText },
  { id: "members", label: "Members", href: "/dashboard/members", icon: Users },
  { id: "courses", label: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { id: "events", label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { id: "commerce", label: "Commerce", href: "/dashboard/commerce", icon: CreditCard },
];

export function CreatorShell({
  active,
  children,
}: {
  active: CreatorSection;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { currentMember, unreadCount, signOut, dataMode } = useApp();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center gap-3 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open workspace navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:w-[232px]">
            <Brand />
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
            <span>/</span>
            <span className="font-semibold text-slate-700">Creator workspace</span>
            <Badge tone="clay">Preview</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/marketplace" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
              <Store className="h-4 w-4" /> View marketplace
            </a>
            <a
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label={`${unreadCount} unread notifications`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount ? (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-clay-600 ring-2 ring-white" />
              ) : null}
            </a>
            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full p-0.5 pr-1 hover:bg-slate-100"
                  aria-label={`AB ${currentMember?.name ?? "Ama Boateng"} creator account menu`}
                >
                  <Avatar name={currentMember?.name ?? "Ama Boateng"} size={34} online />
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownTrigger>
              <DropdownContent>
                <div className="px-2.5 py-2">
                  <p className="text-sm font-semibold text-slate-900">{currentMember?.name}</p>
                  <p className="text-xs text-slate-500">@{currentMember?.handle}</p>
                </div>
                <DropdownSeparator />
                <DropdownItem
                  onSelect={() =>
                    void router.navigate({
                      href: `/c/ai-builders-guild/members/${currentMember?.id}`,
                    })
                  }
                >
                  <Users className="h-4 w-4" /> Your member profile
                </DropdownItem>
                <DropdownItem onSelect={() => void router.navigate({ href: "/settings" })}>
                  <Settings className="h-4 w-4" /> Account settings
                </DropdownItem>
                <DropdownItem
                  onSelect={() => void router.navigate({ href: "/c/ai-builders-guild" })}
                >
                  <MessageSquareText className="h-4 w-4" /> View as member
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  onSelect={() =>
                    void (async () => {
                      await signOut();
                      await router.invalidate();
                      await router.navigate({ href: "/login" });
                    })()
                  }
                >
                  <LogOut className="h-4 w-4" />
                  {dataMode === "fixtures" ? "Log out of preview" : "Log out"}
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </header>

      <aside className="fixed inset-y-16 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <WorkspaceNav active={active} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Close workspace navigation"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] border-r border-slate-200 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close workspace navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WorkspaceNav active={active} />
          </aside>
        </div>
      ) : null}

      <main id="main-content" className="lg:ml-64">
        {children}
      </main>
    </div>
  );
}

function WorkspaceNav({ active }: { active: CreatorSection }) {
  return (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
          Workspace
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-700 text-xs font-extrabold text-white">
            AB
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">
              AI Builders Guild
            </span>
            <span className="block text-[11px] text-slate-500">Creator view</span>
          </span>
        </div>
      </div>
      <nav className="mt-4 space-y-1" aria-label="Creator workspace">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                active === item.id
                  ? "bg-indigo-50 text-indigo-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon className="h-[18px] w-[18px]" /> {item.label}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 border-t border-slate-200 pt-3">
        <a
          href="/dashboard/community#settings"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        >
          <Settings className="h-[18px] w-[18px]" /> Settings
        </a>
        <a
          href="/c/ai-builders-guild"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        >
          <MessageSquareText className="h-[18px] w-[18px]" /> View as member
        </a>
      </div>
    </div>
  );
}
