/**
 * Verifies the local `supabase/config.toml` keeps non-Phase-3A services disabled.
 *
 * SEC-077 and the Wave 0 scope require Realtime, Studio, Mailpit (local SMTP),
 * Storage, Edge Functions and Analytics to remain off for the proof.
 */

export type ServiceState = boolean | null;

/** Services that must be explicitly disabled for the Phase 3A local proof. */
export const REQUIRED_DISABLED_SERVICES = [
  "realtime",
  "studio",
  "local_smtp",
  "storage",
  "edge_runtime",
  "analytics",
] as const;

/**
 * Minimal TOML section scanner: returns the first `enabled` value seen in each
 * `[section]`. This avoids adding a TOML parser dependency for one check.
 */
export function readServiceEnablement(toml: string): Record<string, ServiceState> {
  const state: Record<string, ServiceState> = {};
  let section = "";
  for (const rawLine of toml.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      continue;
    }
    const enabledMatch = /^enabled\s*=\s*(true|false)\b/.exec(line);
    if (enabledMatch && section && !(section in state)) {
      state[section] = enabledMatch[1] === "true";
    }
  }
  return state;
}

export interface DisabledServiceCheck {
  ok: boolean;
  states: Record<string, ServiceState>;
  offenders: string[];
}

/** Confirms every required service is explicitly `false` in config. */
export function verifyDisabledServices(
  toml: string,
  required: readonly string[] = REQUIRED_DISABLED_SERVICES,
): DisabledServiceCheck {
  const states = readServiceEnablement(toml);
  const offenders = required.filter((name) => states[name] !== false);
  return { ok: offenders.length === 0, states, offenders };
}

/** Container-name fragments that must not be running if a service is disabled. */
export const DISABLED_SERVICE_CONTAINER_FRAGMENTS: Record<string, string> = {
  realtime: "supabase_realtime_",
  studio: "supabase_studio_",
  local_smtp: "supabase_inbucket_",
  storage: "supabase_storage_",
  edge_runtime: "supabase_edge_runtime_",
  analytics: "supabase_analytics_",
};

/** Flags running containers that belong to a service that must be disabled. */
export function findDisabledServiceContainers(containerNames: readonly string[]): string[] {
  const offenders: string[] = [];
  for (const [service, fragment] of Object.entries(DISABLED_SERVICE_CONTAINER_FRAGMENTS)) {
    for (const name of containerNames) {
      if (name.startsWith(fragment)) offenders.push(`${service}:${name}`);
    }
  }
  return offenders;
}
