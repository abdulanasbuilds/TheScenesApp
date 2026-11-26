import { useSyncExternalStore } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { InlineBanner } from "./banner";
import { StateView } from "./state-view";

/**
 * Route-level safety nets wired into the router (see `src/router.tsx`).
 *
 * - RoutePending replaces the blank screen during a slow navigation.
 * - RouteError is the last line of defence if a render/data error escapes a route.
 * - DegradedNotice is used by the root loader when a connected request fails, so an
 *   outage is never disguised as an empty catalogue.
 */

export function RoutePending() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading this screen</span>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  // Only surface a short, non-secret reference so a failure is debuggable in the real world
  // without leaking stack details or credentials to the user.
  const reference =
    error instanceof Error && error.message
      ? `Reference: ${error.message.slice(0, 120)}`
      : undefined;
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-4 py-16"
    >
      <StateView
        type="error"
        title="Something didn't load"
        description="This screen hit an unexpected error. The rest of The Scenes still works and your saved preview work is safe."
        primaryAction={{
          label: "Try again",
          onClick: reset,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
        secondaryAction={{ label: "Go to home", href: "/", variant: "secondary" }}
        helperText={reference}
        className="w-full"
      />
    </main>
  );
}

export function DegradedNotice({ sources }: { sources: string[] }) {
  const router = useRouter();
  if (!sources.length) return null;
  const unique = Array.from(new Set(sources));
  const listed =
    unique.length === 1 ? unique[0] : `${unique.slice(0, -1).join(", ")} and ${unique.at(-1)}`;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6">
      <InlineBanner
        tone="warning"
        title="Some content couldn't load"
        description={`We couldn't reach ${listed}. Your account and progress are safe — you can keep using the parts that loaded.`}
        action={
          <Button variant="secondary" size="sm" onClick={() => void router.invalidate()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
          </Button>
        }
      />
    </div>
  );
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function ConnectivityBanner() {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => (typeof navigator === "undefined" ? true : navigator.onLine),
    () => true,
  );
  if (online) return null;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6">
      <InlineBanner
        tone="warning"
        title="You're offline"
        description="Pages you have already opened stay readable. New lessons and messages need a connection."
        action={
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
          </Button>
        }
      />
    </div>
  );
}

/** Small helper so pages can nudge forward with an icon-bearing link. */
export function NextStepLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700">
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}
