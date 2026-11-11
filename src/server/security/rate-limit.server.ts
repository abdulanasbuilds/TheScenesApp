import "@tanstack/react-start/server-only";
import { PublicAppError } from "../../features/shared/safe-handler";
import { logServerEvent } from "../http/logger.server";
import { readRuntimeEnv } from "../runtime-env.server";
import { LocalRateLimiter } from "./local-rate-limit.server";
import { readRateLimitConfig, type RateLimitConfig } from "./rate-limit-config.server";
import {
  consumeUpstash,
  RateLimitProviderError,
  type UpstashFetch,
} from "./rate-limit-upstash.server";

/**
 * P4-S2 rate limiting.
 *
 * Every policy is explicit and documented. `subject` values (email, user ID) are HMAC-SHA256 hashed
 * before they reach a limiter, so neither in-memory buckets nor Redis keys contain a raw address or
 * identity. The connected implementation uses one atomic Redis `EVAL`; the fixture/local
 * implementation stays bounded and process-local.
 *
 * Provider failure follows the policy, not a global default: auth/password/feedback fail closed after a
 * short local emergency allowance, while authenticated learning writes fail open so Redis is never a
 * dependency for learning.
 */

export type RateLimitPolicyName =
  | "signup"
  | "login"
  | "password-reset"
  | "community-join"
  | "course-enrol"
  | "lesson-complete"
  | "feedback";

export type RateLimitPolicy = Readonly<{
  name: RateLimitPolicyName;
  limit: number;
  windowMs: number;
  subject: "email" | "identity";
  onProviderFailure: "fail-closed" | "fail-open";
}>;

export const RATE_LIMIT_POLICIES = Object.freeze({
  signup: Object.freeze({
    name: "signup",
    limit: 10,
    windowMs: 900_000,
    subject: "email",
    onProviderFailure: "fail-closed",
  }),
  login: Object.freeze({
    name: "login",
    limit: 20,
    windowMs: 900_000,
    subject: "email",
    onProviderFailure: "fail-closed",
  }),
  "password-reset": Object.freeze({
    name: "password-reset",
    limit: 5,
    windowMs: 900_000,
    subject: "email",
    onProviderFailure: "fail-closed",
  }),
  "community-join": Object.freeze({
    name: "community-join",
    limit: 30,
    windowMs: 300_000,
    subject: "identity",
    onProviderFailure: "fail-open",
  }),
  "course-enrol": Object.freeze({
    name: "course-enrol",
    limit: 30,
    windowMs: 300_000,
    subject: "identity",
    onProviderFailure: "fail-open",
  }),
  "lesson-complete": Object.freeze({
    name: "lesson-complete",
    limit: 120,
    windowMs: 300_000,
    subject: "identity",
    onProviderFailure: "fail-open",
  }),
  feedback: Object.freeze({
    name: "feedback",
    limit: 5,
    windowMs: 3_600_000,
    subject: "identity",
    onProviderFailure: "fail-closed",
  }),
} as const) satisfies Record<RateLimitPolicyName, RateLimitPolicy>;

export type RateLimitDecision = Readonly<{
  allowed: boolean;
  remaining: number;
  limit: number;
  policy: RateLimitPolicyName;
  retryAfterSeconds?: number;
  reason?: "limit" | "unavailable";
  degraded?: boolean;
}>;

export interface RateLimiter {
  consume(input: {
    readonly policy: RateLimitPolicy;
    readonly subjectHash: string;
    readonly now?: number;
  }): Promise<RateLimitDecision>;
}

const cryptoKeyCache = new Map<string, Promise<CryptoKey>>();

function importHmacKey(secret: string): Promise<CryptoKey> {
  let key = cryptoKeyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    cryptoKeyCache.set(secret, key);
  }
  return key;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * One-way key material for a limiter bucket. Email subjects are trimmed/lower-cased first so the same
 * account always maps to one key; identity subjects are trimmed and otherwise used as-is.
 */
export async function deriveSubjectHash(
  secret: string,
  policy: RateLimitPolicy,
  subject: string,
): Promise<string> {
  const normalized = policy.subject === "email" ? subject.trim().toLowerCase() : subject.trim();
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    new TextEncoder().encode(normalized),
  );
  return toHex(signature);
}

export class MemoryRateLimiter implements RateLimiter {
  constructor(private readonly limiter = new LocalRateLimiter()) {}

  async consume({
    policy,
    subjectHash,
    now,
  }: {
    readonly policy: RateLimitPolicy;
    readonly subjectHash: string;
    readonly now?: number;
  }): Promise<RateLimitDecision> {
    const result = this.limiter.check(
      `rl:${policy.name}:${subjectHash}`,
      { limit: policy.limit, windowMs: policy.windowMs },
      now,
    );
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      limit: policy.limit,
      policy: policy.name,
      ...(result.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: result.retryAfterSeconds }),
      ...(result.allowed ? {} : { reason: "limit" as const }),
    };
  }
}

export class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly config: Readonly<{ url: string; token: string }>,
    private readonly fetchImpl: UpstashFetch = fetch,
  ) {}

  async consume({
    policy,
    subjectHash,
  }: {
    readonly policy: RateLimitPolicy;
    readonly subjectHash: string;
  }): Promise<RateLimitDecision> {
    const counter = await consumeUpstash({
      url: this.config.url,
      token: this.config.token,
      key: `rl:${policy.name}:${subjectHash}`,
      windowMs: policy.windowMs,
      fetchImpl: this.fetchImpl,
    });
    const allowed = counter.count <= policy.limit;
    return {
      allowed,
      remaining: Math.max(0, policy.limit - counter.count),
      limit: policy.limit,
      policy: policy.name,
      ...(allowed
        ? {}
        : {
            retryAfterSeconds: Math.max(1, Math.ceil(counter.ttlMs / 1000)),
            reason: "limit" as const,
          }),
    };
  }
}

export class MisconfiguredRateLimiter implements RateLimiter {
  constructor(readonly problems: readonly string[]) {}

  async consume(): Promise<RateLimitDecision> {
    throw new RateLimitProviderError("configuration");
  }
}

export type RateLimitService = Readonly<{
  consume: (policyName: RateLimitPolicyName, subject: string) => Promise<RateLimitDecision>;
}>;

export type RateLimitServiceOptions = Readonly<{
  config?: RateLimitConfig;
  fetchImpl?: UpstashFetch;
  now?: () => number;
  dataMode?: string;
  memoryHashSecret?: string;
  logger?: (
    level: "info" | "warn" | "error",
    event: string,
    detail: Record<string, unknown>,
  ) => void;
}>;

const FAILURE_LOG_INTERVAL_MS = 60_000;

export function createRateLimitService(options: RateLimitServiceOptions = {}): RateLimitService {
  const config = options.config ?? readRateLimitConfig();
  const now = options.now ?? (() => Date.now());
  const log = options.logger ?? logServerEvent;
  const emergencyLimiter = new LocalRateLimiter();

  let limiter: RateLimiter;
  let hashSecret: string;

  if (config.driver === "upstash") {
    limiter = new UpstashRateLimiter({ url: config.url, token: config.token }, options.fetchImpl);
    hashSecret = config.hashSecret;
  } else if (config.driver === "misconfigured") {
    limiter = new MisconfiguredRateLimiter(config.problems);
    hashSecret = options.memoryHashSecret ?? `memory:${crypto.randomUUID()}`;
    log("warn", "rate_limit_configuration_invalid", { problems: config.problems });
  } else {
    limiter = new MemoryRateLimiter();
    hashSecret = options.memoryHashSecret ?? `memory:${crypto.randomUUID()}`;
  }

  if (
    config.driver === "memory" &&
    (options.dataMode ?? readRuntimeEnv().VITE_DATA_MODE) === "supabase-staging"
  ) {
    log("warn", "rate_limit_memory_driver_in_staging", {
      note: "Distributed limiting is not configured; limits are per process.",
    });
  }

  const lastFailureLog = new Map<RateLimitPolicyName, number>();

  function logProviderFailure(policyName: RateLimitPolicyName, cause: string): void {
    const at = now();
    const previous = lastFailureLog.get(policyName) ?? 0;
    if (at - previous < FAILURE_LOG_INTERVAL_MS) return;
    lastFailureLog.set(policyName, at);
    log("warn", "rate_limit_provider_failed", { policy: policyName, cause });
  }

  return Object.freeze({
    async consume(policyName: RateLimitPolicyName, subject: string): Promise<RateLimitDecision> {
      const policy = RATE_LIMIT_POLICIES[policyName];
      const subjectHash = await deriveSubjectHash(hashSecret, policy, subject);

      try {
        return await limiter.consume({ policy, subjectHash, now: now() });
      } catch (error) {
        const cause = error instanceof RateLimitProviderError ? error.cause : "unknown";
        logProviderFailure(policyName, cause);

        if (policy.onProviderFailure === "fail-open") {
          return {
            allowed: true,
            remaining: policy.limit,
            limit: policy.limit,
            policy: policyName,
            degraded: true,
          };
        }

        const emergency = emergencyLimiter.check(
          `emergency:${policyName}:${subjectHash}`,
          { limit: Math.max(1, Math.floor(policy.limit / 2)), windowMs: policy.windowMs },
          now(),
        );
        if (emergency.allowed) {
          return {
            allowed: true,
            remaining: emergency.remaining,
            limit: policy.limit,
            policy: policyName,
            degraded: true,
          };
        }
        return {
          allowed: false,
          remaining: 0,
          limit: policy.limit,
          policy: policyName,
          retryAfterSeconds: emergency.retryAfterSeconds,
          reason: "unavailable",
          degraded: true,
        };
      }
    },
  });
}

let defaultService: RateLimitService | undefined;

export function getRateLimitService(): RateLimitService {
  defaultService ??= createRateLimitService();
  return defaultService;
}

/** Test-only reset for the lazily created process singleton. */
export function resetRateLimitServiceForTests(): void {
  defaultService = undefined;
}

export async function consumeRateLimit(
  policyName: RateLimitPolicyName,
  subject: string,
): Promise<RateLimitDecision> {
  return getRateLimitService().consume(policyName, subject);
}

/** Map a decision onto the existing safe error envelope. */
export function assertRateLimit(decision: RateLimitDecision, limitedMessage: string): void {
  if (decision.allowed) return;
  if (decision.reason === "unavailable") {
    throw new PublicAppError(
      "UNAVAILABLE",
      "This action is temporarily unavailable. Please try again shortly.",
    );
  }
  throw new PublicAppError("RATE_LIMITED", limitedMessage, decision.retryAfterSeconds);
}
