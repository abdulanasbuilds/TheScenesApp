import "@tanstack/react-start/server-only";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";

export type PwaMode = "enabled" | "retire";

/**
 * Runtime PWA lifecycle switch.
 *
 * `enabled` is the normal default. `retire` is an operational rollback mode: the browser stops
 * registering the worker, unregisters the root-scope worker and deletes only The Scenes-owned
 * caches. An invalid explicit value fails safe to `retire` instead of leaving a stale worker active.
 */
export function readPwaMode(source: RuntimeEnvSource = readRuntimeEnv()): PwaMode {
  const value = source.PWA_MODE?.trim().toLowerCase();
  if (value === undefined || value === "" || value === "enabled") return "enabled";
  return "retire";
}
