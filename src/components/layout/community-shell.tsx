import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Compass,
  Home,
  LayoutGrid,
  Menu,
  Search,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import type { Community } from "@/data/types";
import { communities } from "@/data/seed";
import {
  Avatar,
  Badge,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui";
import { Brand } from "./public-shell";
import { cn, formatCompact } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";
import { useGlobalSearchShortcut } from "@/lib/use-global-search-shortcut";

type CommunityTab = "feed" | "classroom" | "calendar" | "members" | "leaderboard";

const tabs: Array<{ id: CommunityTab; label: string; icon: typeof Home; suffix: string }> = [
  { id: "feed", label: "Community", icon: Home, suffix: "" },
  { id: "classroom", label: "Classroom", icon: BookOpen, suffix: "/classroom" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, suffix: "/calendar" },
  { id: "members", label: "Members", icon: Users, suffix: "/members" },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, suffix: "/leaderboard" },
];

export function CommunityShell({
  community,
  active,
  children,
  contentClassName,
}: {
  community: Community;
  active: CommunityTab;
  children: ReactNode;
  contentClassName?: string;
}) {
  useGlobalSearchShortcut();
  const router = useRouter();
  const { currentMember, unreadCount, signOut, state, joinCommunity, leaveCommunity } = useApp();
  const { toast } = useToast();
  const joined = state.joined.includes(community.slug);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center gap-3 px-4 sm:px-5">
          <div className="lg:w-[232px]">
            <Brand compact={false} />
          </div>
          <button
            type="button"
            className="hidden h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 hover:border-slate-300 md:flex"
            onClick={() => document.getElementById("community-search")?.focus()}
          >
            <Search className="h-4 w-4" />
            <span>Search in {community.name}</span>
            <kbd aria-hidden="true" className="ml-auto text-[10px] font-bold text-slate-600">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <a
              href="/explore"
              className="hidden h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:flex"
            >
              <Compass className="h-4 w-4" /> Explore
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
                  className="flex items-center gap-1 rounded-full p-0.5 pr-1 text-slate-500 hover:bg-slate-100"
                  aria-label={`AB ${currentMember?.name ?? "Ama Boateng"} account menu`}
                >
                  <Avatar name={currentMember?.name ?? "Ama Boateng"} size={34} online />
                  <ChevronDown className="h-3.5 w-3.5" />
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
                      href: `/c/${community.slug}/members/${currentMember?.id}`,
                    })
                  }
                >
                  <Users className="h-4 w-4" /> Your profile
                </DropdownItem>
                <DropdownItem onSelect={() => void router.navigate({ href: "/dashboard/creator" })}>
                  <LayoutGrid className="h-4 w-4" /> Creator workspace
                </DropdownItem>
                <DropdownItem onSelect={() => void router.navigate({ href: "/settings" })}>
                  <Settings className="h-4 w-4" /> Settings
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  onSelect={() => {
                    signOut();
                    void router.navigate({ href: "/login" });
                  }}
                >
                  Log out of preview
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </header>

      <aside className="fixed inset-y-16 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col px-3 py-4">
          <a
            href={`/communities/${community.slug}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-slate-300"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg font-display text-sm font-extrabold text-white"
              style={{ backgroundColor: `hsl(${community.accentHue} 48% 38%)` }}
            >
              {community.name
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">
                {community.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {formatCompact(community.members)} members
              </span>
            </span>
          </a>

          <nav className="mt-4 space-y-1" aria-label={`${community.name} navigation`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const href = `/c/${community.slug}${tab.suffix}`;
              return (
                <a
                  key={tab.id}
                  href={href}
                  aria-current={active === tab.id ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                    active === tab.id
                      ? "bg-indigo-50 text-indigo-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {tab.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <Badge tone="green">● {community.online} online</Badge>
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                    aria-label="Community menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </DropdownTrigger>
                <DropdownContent align="start">
                  <DropdownItem
                    onSelect={() =>
                      void router.navigate({ href: `/communities/${community.slug}` })
                    }
                  >
                    <Compass className="h-4 w-4" /> Public community page
                  </DropdownItem>
                  <DropdownItem
                    onSelect={() => void router.navigate({ href: "/dashboard/community" })}
                  >
                    <Settings className="h-4 w-4" /> Community settings
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    onSelect={() => {
                      if (joined) {
                        leaveCommunity(community.slug);
                        toast("Left community", `${community.name} was removed from your home.`);
                      } else {
                        joinCommunity(community.slug);
                        toast("Community joined", `${community.name} now appears in your home.`);
                      }
                    }}
                  >
                    <Users className="h-4 w-4" /> {joined ? "Leave community" : "Join community"}
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Be generous with context. Useful answers become shared knowledge.
            </p>
          </div>
        </div>
      </aside>

      <main id="main-content" className={cn("pb-20 lg:ml-64 lg:pb-0", contentClassName)}>
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
        aria-label={`${community.name} mobile navigation`}
      >
        <div className="mx-auto flex max-w-lg items-start justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const href = `/c/${community.slug}${tab.suffix}`;
            return (
              <a
                key={tab.id}
                href={href}
                aria-current={active === tab.id ? "page" : undefined}
                className={cn(
                  "flex min-w-[60px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-semibold",
                  active === tab.id ? "text-indigo-700" : "text-slate-500",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label === "Community" ? "Feed" : tab.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
