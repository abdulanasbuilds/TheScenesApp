import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { AppStoreProvider, useAppStore } from "../lib/app-store";
import { Toaster } from "../components/ui/sonner";
import { useState, useRef } from "react";
import { Database, AlertTriangle, RefreshCw, Key, Shield, Info } from "lucide-react";
import { registerServiceWorker } from "../lib/pwa";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // Full-viewport, no zoom — critical for PWA standalone feel
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "SukaSpace — Community + Courses for the AI Era" },
      {
        name: "description",
        content:
          "Launch a premium learning community with linear course tracking and rich multi-channel discussions. Built for AI, engineering, and tech creators.",
      },
      // PWA / iOS
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "SukaSpace" },
      { name: "application-name", content: "SukaSpace" },
      { name: "theme-color", content: "#1D4ED8" },
      // OG / Twitter
      { property: "og:title", content: "SukaSpace — Community + Courses for the AI Era" },
      {
        property: "og:description",
        content: "Community meets courses. Ship your knowledge empire with SukaSpace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-256.png", type: "image/png", sizes: "256x256" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function DatabasePausedFallback() {
  const [retrying, setRetrying] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [statusText, setStatusText] = useState("Checking connection status...");
  const timerRef = useRef<any>(null);

  // Background self-healing loop: continuously check if Supabase wakes up
  useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(`${origin}/api/heartbeat`);
        if (res.ok) {
          setStatusText("Database is awake! Reconnecting now...");
          setTimeout(() => {
            if (active) window.location.reload();
          }, 1000);
        } else {
          setStatusText("Database is still reconnecting/paused. Waking it up...");
        }
      } catch (err) {
        setStatusText("Database is offline. Waking it up in background...");
      }
    }

    checkStatus();
    timerRef.current = setInterval(checkStatus, 5000);

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleManualRetry = async () => {
    setRetrying(true);
    setStatusText("Retrying connection...");
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/heartbeat`);
      if (res.ok) {
        setStatusText("Database active! Reloading...");
        window.location.reload();
      } else {
        setStatusText("Supabase is still waking up. Please give it 1-2 minutes.");
      }
    } catch {
      setStatusText("Connection failed. Still waking up...");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 animate-pulse">
            <Database className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Database Reconnecting
          </h1>

          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            SukaSpace is currently waking up its database. Since this is an inactive or free sandbox environment, Supabase automatically pauses the database when idle to conserve energy.
          </p>
        </div>

        {/* Loading / Status Indicators */}
        <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-slate-700">{statusText}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 pl-8">
            This typically takes 30 to 60 seconds. SukaSpace will automatically refresh as soon as it's awake!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleManualRetry}
            disabled={retrying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Checking..." : "Verify Connection Now"}
          </button>

          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Shield className="h-3.5 w-3.5" />
            {showAdmin ? "Hide Administrator Options" : "Show Administrator Options"}
          </button>
        </div>

        {/* Admin Instructions Section */}
        {showAdmin && (
          <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-start gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wider">
              <Info className="h-4 w-4 text-slate-500" />
              <span>Project Admin Restoration Guide</span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              <p>If the database has been paused for several days, it may require manual restoration from your Supabase Dashboard:</p>

              <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                <li>Log in to the <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">Supabase Platform</a>.</li>
                <li>Locate your project <strong className="text-slate-700 font-medium">qoialgwtskcthscfcgzj</strong>.</li>
                <li>Click the green <strong className="text-slate-700 font-medium">"Restore Project"</strong> button on your dashboard.</li>
                <li>Wait 1-2 minutes for the database to provision.</li>
              </ol>

              <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3 flex gap-2.5">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-yellow-700 text-[11px] leading-normal">
                  <strong>Inactivity Guard Note:</strong> SukaSpace is equipped with an automatic activity generator. However, under extreme idle times or on the Free Plan, Supabase overrides may occur. To permanently prevent pauses, upgrade to Supabase Pro.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        © 2026 SukaSpace Resilience Layer · Self-Healing Connection Active
      </div>
    </div>
  );
}

function RootContent() {
  const store = useAppStore();

  if (store.isDatabasePaused) {
    return <DatabasePausedFallback />;
  }

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Register service worker once on first client mount
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <RootContent />
        <Toaster position="top-right" richColors />
        {/* Global PWA install prompt — shown to first-time visitors on any page */}
        <PWAInstallPrompt />
      </AppStoreProvider>
    </QueryClientProvider>
  );
}
