/**
 * SukaSpace — Activity Resilience & Pause Recovery Layer
 *
 * This system prevents the Supabase instance from being paused due to inactivity
 * by generating minimal, legitimate, read-only operational traffic when the app
 * is completely idle, and provides a graceful, self-healing recovery UX for users
 * if a pause or suspension still occurs.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

// ─── Environment & Feature Configuration ─────────────────────────────────────

export const RESILIENCE_CONFIG = {
  /** Feature flag to enable/disable the keep-alive heartbeat system instantly */
  ENABLED: true,

  /** Interval at which background heartbeats are triggered when idle (e.g., 12 hours) */
  HEARTBEAT_INTERVAL_MS: 12 * 60 * 60 * 1000,

  /** Window of user inactivity after which the project is considered idle (e.g., 24 hours) */
  IDLE_WINDOW_MS: 24 * 60 * 60 * 1000,

  /** Max time to wait for a database query before flagging a potential pause timeout */
  QUERY_TIMEOUT_MS: 8000,

  /** Detecting if we are in development, staging, or production */
  ENV: typeof process !== "undefined" && process.env.NODE_ENV ? process.env.NODE_ENV : "production",
};

// ─── Transient Diagnostic State (in-memory) ──────────────────────────────────

interface Diagnostics {
  lastOrganicTraffic: number;
  lastHeartbeatTime: number;
  lastHeartbeatResult: string;
  isPaused: boolean;
  isProPlan: boolean;
}

const diagnosticsState: Diagnostics = {
  lastOrganicTraffic: typeof window !== "undefined" ? Number(window.localStorage.getItem("ss_last_organic_traffic") || Date.now()) : Date.now(),
  lastHeartbeatTime: typeof window !== "undefined" ? Number(window.localStorage.getItem("ss_last_heartbeat_time") || 0) : 0,
  lastHeartbeatResult: "Not run yet",
  isPaused: false,
  isProPlan: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Record that legitimate organic user activity occurred.
 * This keeps the idle timer fresh and prevents redundant keep-alives.
 */
export function recordOrganicTraffic(): void {
  diagnosticsState.lastOrganicTraffic = Date.now();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("ss_last_organic_traffic", String(Date.now()));
    } catch (err) {
      // LocalStorage access issues, ignore
    }
  }
}

/**
 * Determines if a query or network error indicates that the database is currently paused or suspended.
 */
export function isPauseError(error: any): boolean {
  if (!error) return false;
  const msg = (
    typeof error === "string"
      ? error
      : error.message || error.details || JSON.stringify(error)
  ).toLowerCase();

  const pauseIndicators = [
    "enotfound",            // DNS record removed (typical for paused projects)
    "econnrefused",         // Connection refused
    "project_paused",       // PostgREST paused error payload
    "suspended",            // Supabase project suspended text
    "paused",               // Paused text
    "db_paused",
    "failed to fetch",      // Generic CORS/network error when endpoint is down
    "network error",
    "fetch failed",
    "503",                  // Service Unavailable
  ];

  return pauseIndicators.some((indicator) => msg.includes(indicator));
}

/**
 * Set the pause state and trigger optional alerting or listeners
 */
export function setDatabasePausedState(isPaused: boolean): void {
  if (diagnosticsState.isPaused !== isPaused) {
    diagnosticsState.isPaused = isPaused;
    console.warn(`[Resilience] Database pause state changed: ${isPaused ? "PAUSED 🛑" : "ACTIVE ✅"}`);
    if (isPaused) {
      triggerAdminAlert("Supabase database connection failed. Project might be paused or suspended.");
    }
  }
}

/**
 * Log keep-alive actions to console with structured observability metadata
 */
export function logResilienceAction(action: string, result: "success" | "skipped" | "failed", details: string) {
  const timestamp = new Date().toISOString();
  const logMsg = `[Resilience][${timestamp}] Action: ${action} | Result: ${result.toUpperCase()} | Details: ${details}`;
  if (result === "failed") {
    console.error(logMsg);
  } else if (result === "success") {
    console.log(logMsg);
  } else {
    console.info(logMsg);
  }
}

/**
 * Sends a structured webhook alert or logs a high-priority warning
 */
function triggerAdminAlert(message: string) {
  const timestamp = new Date().toISOString();
  console.error(`🚨 [CRITICAL ALERT][${timestamp}] SukaSpace Resilience Alert: ${message}`);
  // In production, this can easily dispatch to Telegram, Sentry, or Slack
}

// ─── Legitimate Keep-Alive Heartbeat Execution ───────────────────────────────

/**
 * Performs a highly efficient, read-only query against a static table
 * to generate legitimate database activity and verify connectivity.
 */
export async function runLegitimateHeartbeat(source: "client" | "cron" | "api"): Promise<{
  success: boolean;
  status: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    const status = "Supabase is not configured in this environment.";
    logResilienceAction("Keep-Alive", "skipped", status);
    return { success: false, status };
  }

  if (!RESILIENCE_CONFIG.ENABLED) {
    const status = "Resilience system is disabled via feature flag.";
    logResilienceAction("Keep-Alive", "skipped", status);
    return { success: false, status };
  }

  // 1. Detect Plan Level
  // If the user has upgraded to Pro, we can disable this system entirely
  if (diagnosticsState.isProPlan) {
    const status = "Paid/Pro plan level detected. Heartbeat disabled.";
    logResilienceAction("Keep-Alive", "skipped", status);
    return { success: true, status };
  }

  // 2. Check Recent Organic Traffic
  const timeSinceLastTraffic = Date.now() - diagnosticsState.lastOrganicTraffic;
  if (timeSinceLastTraffic < RESILIENCE_CONFIG.IDLE_WINDOW_MS) {
    const hoursRemaining = ((RESILIENCE_CONFIG.IDLE_WINDOW_MS - timeSinceLastTraffic) / (1000 * 60 * 60)).toFixed(1);
    const status = `Recent organic traffic detected ${ (timeSinceLastTraffic / (1000 * 60)).toFixed(0) }m ago. Skipping keep-alive. Idle window active for another ${hoursRemaining}h.`;
    logResilienceAction("Keep-Alive", "skipped", status);
    return { success: true, status };
  }

  // 3. Prevent aggressive looping (rate limiting)
  const timeSinceLastHeartbeat = Date.now() - diagnosticsState.lastHeartbeatTime;
  const MIN_HEARTBEAT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour safety threshold
  if (timeSinceLastHeartbeat < MIN_HEARTBEAT_COOLDOWN_MS && source !== "api") {
    const status = "Rate limited: heartbeat ran less than 1 hour ago. Cooldown active.";
    logResilienceAction("Keep-Alive", "skipped", status);
    return { success: true, status };
  }

  // 4. Perform Read-only Operational Query
  // We query a small, safe table ('subscription_plans' row count) which has zero side effects and minimal overhead.
  try {
    const queryPromise = supabase
      .from("subscription_plans")
      .select("id", { count: "exact", head: true });

    // Timeout wrap to handle hanging connections on paused projects
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database query timed out (Possible pause)")), RESILIENCE_CONFIG.QUERY_TIMEOUT_MS)
    );

    await Promise.race([queryPromise, timeoutPromise]);

    // Update diagnostic metrics
    diagnosticsState.lastHeartbeatTime = Date.now();
    diagnosticsState.lastHeartbeatResult = "Success";
    setDatabasePausedState(false);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("ss_last_heartbeat_time", String(Date.now()));
      } catch (err) {}
    }

    const status = "Trivial read-only connection active. Supabase heartbeat succeeded.";
    logResilienceAction(`Keep-Alive (source: ${source})`, "success", status);
    return { success: true, status };
  } catch (err: any) {
    diagnosticsState.lastHeartbeatResult = `Failed: ${err.message || JSON.stringify(err)}`;

    if (isPauseError(err)) {
      setDatabasePausedState(true);
      const status = `Supabase project appears PAUSED: ${err.message || JSON.stringify(err)}`;
      logResilienceAction(`Keep-Alive (source: ${source})`, "failed", status);
      return { success: false, status };
    } else {
      const status = `Database heartbeat query failed: ${err.message || JSON.stringify(err)}`;
      logResilienceAction(`Keep-Alive (source: ${source})`, "failed", status);
      return { success: false, status };
    }
  }
}

/**
 * Access the transient diagnostics metrics
 */
export function getResilienceDiagnostics() {
  return { ...diagnosticsState };
}
