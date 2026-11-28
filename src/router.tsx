import { createRouter } from "@tanstack/react-router";
import { RouteError, RoutePending } from "@/components/feedback/route-states";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
