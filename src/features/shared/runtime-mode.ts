import type { DataMode } from "@/lib/env";
import { getSetupStatus } from "./setup.functions";

/**
 * Browser-safe view of the server's runtime configuration.
 *
 * The server is the only authority on `dataMode`: it reads the merged runtime environment (Cloudflare
 * bindings over `process.env`) so a deployment is configured from the hosting dashboard rather than at
 * build time. Every route loader that needs to branch on the mode asks for it here.
 *
 * `dataMode` is the effective mode used for rendering. `requestedMode` keeps the raw server verdict so
 * a misconfigured connected deployment can be surfaced instead of silently pretending to be fixtures.
 */
export type RuntimeConfigurationStatus = Readonly<{
  dataMode: DataMode;
  requestedMode: "fixtures" | "supabase-local" | "supabase-staging" | "missing" | "invalid";
  ok: boolean;
  missingVariables: readonly string[];
  message: string;
}>;

const UNAVAILABLE: RuntimeConfigurationStatus = Object.freeze({
  dataMode: "fixtures" as DataMode,
  requestedMode: "invalid" as const,
  ok: false,
  missingVariables: Object.freeze([]),
  message:
    "The application could not read its runtime configuration. Check the hosting environment variables.",
});

function toEffectiveMode(requestedMode: RuntimeConfigurationStatus["requestedMode"]): DataMode {
  return requestedMode === "supabase-local" || requestedMode === "supabase-staging"
    ? requestedMode
    : "fixtures";
}

/** Read the server's runtime configuration diagnostic without ever throwing. */
async function readConfiguration(): Promise<RuntimeConfigurationStatus> {
  const result = await getSetupStatus({ data: undefined });
  if (!result.ok) return UNAVAILABLE;
  const diagnostic = result.data;
  return Object.freeze({
    dataMode: toEffectiveMode(diagnostic.dataMode),
    requestedMode: diagnostic.dataMode,
    ok: diagnostic.ok,
    missingVariables: diagnostic.missingVariables,
    message: diagnostic.message,
  });
}

/**
 * Serialized result for the browser session. The server is never cached: a deployment can change its
 * variables and the next request must observe that. In the browser the mode is stable for the page
 * session, so loader calls share one result instead of one round-trip each.
 */
let clientConfiguration: Promise<RuntimeConfigurationStatus> | undefined;

export async function resolveRuntimeConfiguration(): Promise<RuntimeConfigurationStatus> {
  if (typeof window === "undefined") return readConfiguration();
  clientConfiguration ??= readConfiguration();
  return clientConfiguration;
}

/** Convenience wrapper for loaders that only branch on the effective mode. */
export async function resolveRuntimeDataMode(): Promise<DataMode> {
  return (await resolveRuntimeConfiguration()).dataMode;
}
