import "@tanstack/react-start/server-only";

/**
 * Runtime environment source for the server.
 *
 * The application must be deployable to Cloudflare Workers, where configuration is supplied as
 * dashboard variables and secrets rather than build-time files. Two sources are merged:
 *
 * 1. `process.env` — Node development, local preview and any runtime that populates it (Node with
 *    `nodejs_compat` and the Cloudflare process-env compatibility flag).
 * 2. `globalThis.__env__` — the Cloudflare bindings object that the Nitro `cloudflare-module`
 *    preset assigns on every request.
 *
 * Binding values win over `process.env` because Cloudflare is authoritative on the edge. Only string
 * values are read: object bindings (assets, KV, D1, R2, queues) are never environment variables and
 * are ignored. Values are returned to callers that validate them; nothing here is logged or sent to
 * the client.
 */

export type RuntimeEnvSource = Readonly<Record<string, string | undefined>>;

function readCloudflareBindings(): Record<string, unknown> | undefined {
  const candidate = (globalThis as { __env__?: unknown }).__env__;
  if (candidate === null || typeof candidate !== "object") return undefined;
  return candidate as Record<string, unknown>;
}

function readProcessEnv(): Record<string, string | undefined> {
  if (typeof process === "undefined" || process.env === null || process.env === undefined) {
    return {};
  }
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

/** Merge the process environment with any Cloudflare bindings, without exposing values. */
export function readRuntimeEnv(): RuntimeEnvSource {
  const merged = readProcessEnv();
  const bindings = readCloudflareBindings();
  if (bindings) {
    for (const [key, value] of Object.entries(bindings)) {
      if (typeof value === "string") merged[key] = value;
    }
  }
  return merged;
}
