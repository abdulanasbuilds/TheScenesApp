import type { ReactNode } from "react";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { InternalNavigationBridge } from "@/components/internal-navigation-bridge";
import { getCurrentViewer } from "@/features/auth/auth.functions";
import { getConnectedCatalog, getLearningState } from "@/features/learning/learning.functions";
import { getNotificationUnreadCount } from "@/features/notifications/notifications.functions";
import { resolveRuntimeConfiguration } from "@/features/shared/runtime-mode";
import { AppProvider, ToastProvider } from "@/store/app-store";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  loader: async () => {
    const configuration = await resolveRuntimeConfiguration();
    const { dataMode } = configuration;

    if (dataMode === "fixtures") {
      return {
        dataMode,
        configuration,
        viewer: null,
        catalog: null,
        learningState: null,
        notificationSummary: null,
      } as const;
    }
    const [viewerResult, catalogResult, learningResult, notificationResult] = await Promise.all([
      getCurrentViewer({ data: undefined }),
      getConnectedCatalog({ data: {} }),
      getLearningState({ data: {} }),
      getNotificationUnreadCount({ data: undefined }),
    ]);
    return {
      dataMode,
      configuration,
      viewer: viewerResult.ok ? viewerResult.data : null,
      catalog: catalogResult.ok ? catalogResult.data : null,
      learningState: learningResult.ok
        ? learningResult.data
        : { enrolledCourseIds: [], completedLessonIds: [] },
      notificationSummary: notificationResult.ok ? notificationResult.data : { unreadCount: 0 },
    } as const;
  },
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
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  const { dataMode, configuration, viewer, catalog, learningState, notificationSummary } =
    Route.useLoaderData();

  if (configuration.requestedMode === "invalid") {
    return (
      <RootDocument>
        <ConfigurationNotice configuration={configuration} />
      </RootDocument>
    );
  }

  return (
    <RootDocument>
      <ToastProvider>
        <AppProvider
          viewer={viewer}
          dataMode={dataMode}
          connectedCatalog={catalog}
          learningState={learningState}
          notificationSummary={notificationSummary}
        >
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

function ConfigurationNotice({
  configuration,
}: Readonly<{ configuration: { missingVariables: readonly string[]; message: string } }>) {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
          Configuration required
        </p>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900">
          This deployment is not fully configured
        </h1>
        <p className="mt-3 text-sm text-slate-700">{configuration.message}</p>
        {configuration.missingVariables.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-slate-800">
            {configuration.missingVariables.map((name) => (
              <li key={name} className="rounded-md bg-white/70 px-3 py-1.5 font-mono text-xs">
                {name}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-xs text-slate-600">
          Set the hosting environment variables and redeploy. No secret value is shown here.
        </p>
      </div>
    </main>
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
