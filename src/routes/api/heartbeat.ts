/**
 * SukaSpace — Keep-Alive Heartbeat API Endpoint
 * GET /api/heartbeat
 *
 * This endpoint triggers a safe, read-only operational query to Supabase.
 * It is called by background cron jobs or uptime monitors to prevent
 * inactivity-based database pauses.
 */

import { createFileRoute } from "@tanstack/react-router";
import { runLegitimateHeartbeat, getResilienceDiagnostics, RESILIENCE_CONFIG } from "@/lib/activity-resilience";

export const Route = createFileRoute("/api/heartbeat")({
  head: () => ({ meta: [] }),
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await runLegitimateHeartbeat("api");
          const diagnostics = getResilienceDiagnostics();

          return new Response(
            JSON.stringify({
              message: "SukaSpace Activity Resilience Heartbeat complete",
              success: result.success,
              status: result.status,
              environment: RESILIENCE_CONFIG.ENV,
              diagnostics: {
                isPaused: diagnostics.isPaused,
                lastHeartbeatTime: new Date(diagnostics.lastHeartbeatTime).toISOString(),
                lastHeartbeatResult: diagnostics.lastHeartbeatResult,
                lastOrganicTraffic: new Date(diagnostics.lastOrganicTraffic).toISOString(),
                isProPlan: diagnostics.isProPlan,
              },
            }),
            {
              status: result.success ? 200 : 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err: any) {
          console.error("[api/heartbeat] Heartbeat routing handler crashed:", err);
          return new Response(
            JSON.stringify({
              error: "Heartbeat routing handler crashed",
              message: err.message || String(err),
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
