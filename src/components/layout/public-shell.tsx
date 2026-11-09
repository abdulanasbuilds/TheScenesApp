import { useState, type ReactNode } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { Avatar, Badge, buttonClass } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useGlobalSearchShortcut } from "@/lib/use-global-search-shortcut";

export function Brand({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <a href="/" className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-extrabold",
          inverted ? "bg-white text-indigo-800" : "bg-indigo-700 text-white",
        )}
        aria-hidden="true"
      >
        S
      </span>
      {!compact ? (
        <span
          className={cn(
            "font-display text-[15px] font-extrabold tracking-[0.08em]",
            inverted ? "text-white" : "text-slate-950",
          )}
        >
          THE SCENES
        </span>
      ) : null}
    </a>
  );
}

const publicLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/creators/nanaadjei", label: "For creators" },
];

export function PublicHeader({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const { user, currentMember, unreadCount } = useApp();
  useGlobalSearchShortcut();

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {publicLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active === item.href
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/search"
              className="hidden h-9 w-44 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-white md:flex"
            >
              <Search className="h-4 w-4" />
              <span>Search…</span>
              <kbd aria-hidden="true" className="ml-auto text-[10px] font-semibold text-slate-600">
                ⌘K
              </kbd>
            </a>
            {user ? (
              <>
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
                <a href="/home" className="rounded-full" aria-label="Open your home">
                  <Avatar name={currentMember?.name ?? user.name} size={34} online />
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="hidden px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-950 sm:block"
                >
                  Log in
                </a>
                <a href="/register" className={buttonClass("primary", "sm")}>
                  Join free
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[min(22rem,88vw)] border-l border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <a
              href="/search"
              className="mt-7 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
            >
              <Search className="h-4 w-4" /> Search The Scenes
            </a>
            <nav className="mt-5 space-y-1" aria-label="Mobile navigation">
              {publicLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-semibold",
                    active === item.href
                      ? "bg-indigo-50 text-indigo-800"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            {!user ? (
              <div className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-200 pt-6">
                <a href="/login" className={buttonClass("secondary", "md")}>
                  Log in
                </a>
                <a href="/register" className={buttonClass("primary", "md")}>
                  Join free
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PublicFooter() {
  const { dataMode } = useApp();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Practical learning, focused communities and creator-led education — built in Africa,
              open to the world.
            </p>
            <Badge tone="green" className="mt-4">
              {dataMode === "fixtures"
                ? "● Frontend preview · fixture data"
                : "● Connected pre-production catalogue"}
            </Badge>
          </div>
          {[
            {
              title: "Discover",
              links: [
                ["Explore communities", "/explore"],
                ["Browse courses", "/search?type=courses"],
                ["Marketplace", "/marketplace"],
              ],
            },
            {
              title: "Create",
              links: [
                ["Creator workspace", "/dashboard/creator"],
                ["Pricing", "/pricing"],
                ["Creator profile", "/creators/nanaadjei"],
              ],
            },
            {
              title: "The Scenes",
              links: [
                ["About", "/about"],
                ["Help centre", "/help"],
                ["Product status", "/help#status"],
              ],
            },
          ].map((column) => (
            <div key={column.title}>
              <h2 className="text-xs font-bold tracking-[0.12em] text-slate-900 uppercase">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-slate-600 hover:text-indigo-700">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 The Scenes. Designed for useful knowledge.</p>
          <p>
            {dataMode === "fixtures"
              ? "Payments, auth and live services are not connected in this frontend preview."
              : "Authentication and learning progress are connected. Payments and live services remain unavailable."}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({
  children,
  active,
  className,
}: {
  children: ReactNode;
  active?: string;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader active={active} />
      <main id="main-content" className={className}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
