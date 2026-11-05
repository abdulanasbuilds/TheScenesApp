import type { ReactNode } from "react";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { InternalNavigationBridge } from "@/components/internal-navigation-bridge";
import { AppProvider, ToastProvider } from "@/store/app-store";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "description",
        content:
          "The Scenes is where creators build communities, teach what they know, and get paid for it. Discover communities, courses, events and digital products.",
      },
      { title: "The Scenes — Learn, build and belong" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Tight:wght@600;700;800&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <ToastProvider>
        <AppProvider>
          <InternalNavigationBridge />
          <a
            href="#main-content"
            className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
          >
            Skip to content
          </a>
          <Outlet />
        </AppProvider>
      </ToastProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase">
        404 — Scene not found
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900">
        This page has left the stage.
      </h1>
      <p className="mt-2 max-w-md text-slate-600">
        The link may be broken, or the page may have moved. Try the homepage or explore what the
        community is building right now.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="rounded-full bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
        >
          Back home
        </Link>
        <Link
          to="/explore"
          search={{ q: "", category: "all", price: "all", sort: "featured" }}
          className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          Explore communities
        </Link>
      </div>
    </div>
  );
}
