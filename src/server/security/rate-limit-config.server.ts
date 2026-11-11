import "@tanstack/react-start/server-only";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";

/**
 * Server-only rate-limit configuration (P4-S2).
 *
 * `RATE_LIMIT_DRIVER` selects the implementation:
 * - `memory` (default) keeps the bounded process-local limiter used by fixture/local mode;
 * - `upstash` uses the fetch-compatible Upstash Redis REST API for connected staging.
 *
 * A selected-but-incomplete Upstash configuration is never silently downgraded to memory. It is
 * reported as `misconfigured`, and the caller applies each policy's documented failure mode.
 * Problems list variable names only; values are never read back out of this module.
 */

export type RateLimitConfig =
  | Readonly<{ driver: "memory" }>
  | Readonly<{ driver: "upstash"; url: string; token: string; hashSecret: string }>
  | Readonly<{ driver: "misconfigured"; problems: readonly string[] }>;

const UPSTASH_URL = /^https:\/\/[a-z0-9-]+\.upstash\.io\/?$/i;
const OPAQUE_TOKEN = /^\S{8,512}$/;
const MIN_HASH_SECRET_LENGTH = 16;

/** Parse the rate-limit driver settings from the runtime environment. */
export function readRateLimitConfig(source: RuntimeEnvSource = readRuntimeEnv()): RateLimitConfig {
  const driver = (source.RATE_LIMIT_DRIVER ?? "memory").trim().toLowerCase();

  if (driver === "memory") return Object.freeze({ driver: "memory" as const });

  if (driver !== "upstash") {
    return Object.freeze({ driver: "misconfigured" as const, problems: ["RATE_LIMIT_DRIVER"] });
  }

  const url = (source.UPSTASH_REDIS_REST_URL ?? "").trim();
  const token = (source.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
  const hashSecret = (source.RATE_LIMIT_HASH_SECRET ?? "").trim();
  const problems: string[] = [];

  if (!UPSTASH_URL.test(url)) problems.push("UPSTASH_REDIS_REST_URL");
  if (!OPAQUE_TOKEN.test(token)) problems.push("UPSTASH_REDIS_REST_TOKEN");
  if (hashSecret.length < MIN_HASH_SECRET_LENGTH) problems.push("RATE_LIMIT_HASH_SECRET");

  if (problems.length > 0) {
    return Object.freeze({ driver: "misconfigured" as const, problems: Object.freeze(problems) });
  }

  return Object.freeze({
    driver: "upstash" as const,
    url: url.replace(/\/$/, ""),
    token,
    hashSecret,
  });
}
