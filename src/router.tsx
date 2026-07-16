import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Serve cached data instantly; re-validate silently in the background
        staleTime: 5 * 60 * 1000,   // 5 minutes
        gcTime:    30 * 60 * 1000,  // 30 minutes — keep in memory well past stale
        retry: 2,
        refetchOnWindowFocus: false, // avoid jarring re-fetches when switching tabs
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent", // preload routes on hover/focus for instant navigation
  });

  return router;
};
