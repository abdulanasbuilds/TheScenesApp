import { describe, expect, test } from "bun:test";
import { readRateLimitConfig } from "../../src/server/security/rate-limit-config.server";
import {
  assertRateLimit,
  createRateLimitService,
  deriveSubjectHash,
  MemoryRateLimiter,
  RATE_LIMIT_POLICIES,
  UpstashRateLimiter,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "../../src/server/security/rate-limit.server";
import {
  consumeUpstash,
  RateLimitProviderError,
} from "../../src/server/security/rate-limit-upstash.server";

const HASH_SECRET = "test-hash-secret-0123456789";
const UPSTASH_URL = "https://example-cluster.upstash.io";
const UPSTASH_TOKEN = "upstash-token-0123456789";

function policy(overrides: Partial<RateLimitPolicy> = {}): RateLimitPolicy {
  return {
    name: "login",
    limit: 2,
    windowMs: 60_000,
    subject: "email",
    onProviderFailure: "fail-closed",
    ...overrides,
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("P4-S2 policies and subject hashing", () => {
  test("publishes an explicit policy for every protected action", () => {
    expect(Object.keys(RATE_LIMIT_POLICIES)).toEqual([
      "signup",
      "login",
      "password-reset",
      "community-join",
      "course-enrol",
      "lesson-complete",
      "feedback",
    ]);
    expect(RATE_LIMIT_POLICIES.signup).toMatchObject({ limit: 10, windowMs: 900_000 });
    expect(RATE_LIMIT_POLICIES.login.onProviderFailure).toBe("fail-closed");
    expect(RATE_LIMIT_POLICIES["password-reset"].onProviderFailure).toBe("fail-closed");
    expect(RATE_LIMIT_POLICIES.feedback.onProviderFailure).toBe("fail-closed");
    expect(RATE_LIMIT_POLICIES["community-join"].onProviderFailure).toBe("fail-open");
    expect(RATE_LIMIT_POLICIES["course-enrol"].onProviderFailure).toBe("fail-open");
    expect(RATE_LIMIT_POLICIES["lesson-complete"].onProviderFailure).toBe("fail-open");
  });

  test("hashes email subjects one way and normalizes case/whitespace", async () => {
    const first = await deriveSubjectHash(
      HASH_SECRET,
      RATE_LIMIT_POLICIES.signup,
      "Learner@Example.test",
    );
    const second = await deriveSubjectHash(
      HASH_SECRET,
      RATE_LIMIT_POLICIES.signup,
      "  learner@example.test  ",
    );
    const other = await deriveSubjectHash(
      HASH_SECRET,
      RATE_LIMIT_POLICIES.signup,
      "other@example.test",
    );
    const otherSecret = await deriveSubjectHash(
      "another-secret-0123456789",
      RATE_LIMIT_POLICIES.signup,
      "learner@example.test",
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain("learner");
    expect(first).not.toContain("@");
    expect(other).not.toBe(first);
    expect(otherSecret).not.toBe(first);
  });
});

describe("P4-S2 memory limiter", () => {
  test("allows up to the limit, blocks with Retry-After, and resets at the window", async () => {
    const limiter = new MemoryRateLimiter();
    const rule = policy({ limit: 2, windowMs: 60_000 });

    expect(await limiter.consume({ policy: rule, subjectHash: "subject", now: 1 })).toMatchObject({
      allowed: true,
      remaining: 1,
      limit: 2,
      policy: "login",
    });
    expect(await limiter.consume({ policy: rule, subjectHash: "subject", now: 2 })).toMatchObject({
      allowed: true,
      remaining: 0,
    });
    expect(await limiter.consume({ policy: rule, subjectHash: "subject", now: 3 })).toMatchObject({
      allowed: false,
      reason: "limit",
      retryAfterSeconds: 60,
      remaining: 0,
    });
    expect(
      await limiter.consume({ policy: rule, subjectHash: "subject", now: 60_002 }),
    ).toMatchObject({ allowed: true, remaining: 1 });
  });

  test("keeps separate buckets for separate subjects and policies", async () => {
    const limiter = new MemoryRateLimiter();
    const rule = policy({ limit: 1, windowMs: 60_000 });
    expect(await limiter.consume({ policy: rule, subjectHash: "a", now: 1 })).toMatchObject({
      allowed: true,
    });
    expect(await limiter.consume({ policy: rule, subjectHash: "a", now: 2 })).toMatchObject({
      allowed: false,
    });
    expect(await limiter.consume({ policy: rule, subjectHash: "b", now: 3 })).toMatchObject({
      allowed: true,
    });
    expect(
      await limiter.consume({
        policy: policy({ name: "signup", limit: 1 }),
        subjectHash: "a",
        now: 4,
      }),
    ).toMatchObject({ allowed: true, policy: "signup" });
  });
});

describe("P4-S2 configuration", () => {
  test("defaults to memory and accepts a complete Upstash configuration", () => {
    expect(readRateLimitConfig({})).toEqual({ driver: "memory" });

    expect(
      readRateLimitConfig({
        RATE_LIMIT_DRIVER: "upstash",
        UPSTASH_REDIS_REST_URL: `${UPSTASH_URL}/`,
        UPSTASH_REDIS_REST_TOKEN: UPSTASH_TOKEN,
        RATE_LIMIT_HASH_SECRET: HASH_SECRET,
      }),
    ).toEqual({
      driver: "upstash",
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
      hashSecret: HASH_SECRET,
    });
  });

  test("reports only variable names for an incomplete or unsafe configuration", () => {
    const incomplete = readRateLimitConfig({
      RATE_LIMIT_DRIVER: "upstash",
      UPSTASH_REDIS_REST_URL: "http://insecure.example.test",
      UPSTASH_REDIS_REST_TOKEN: "short",
      RATE_LIMIT_HASH_SECRET: "tiny",
    });
    expect(incomplete).toEqual({
      driver: "misconfigured",
      problems: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "RATE_LIMIT_HASH_SECRET"],
    });
    expect(JSON.stringify(incomplete)).not.toContain("insecure.example.test");

    expect(readRateLimitConfig({ RATE_LIMIT_DRIVER: "redis-cluster" })).toEqual({
      driver: "misconfigured",
      problems: ["RATE_LIMIT_DRIVER"],
    });
  });
});

describe("P4-S2 Upstash counter", () => {
  test("uses one atomic EVAL with the hashed key and window", async () => {
    let captured: { url: string; init: RequestInit } | undefined;
    const fetchImpl = async (url: string, init: RequestInit) => {
      captured = { url, init };
      return jsonResponse({ result: [1, 900_000] });
    };

    const counter = await consumeUpstash({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
      key: "rl:login:deadbeef",
      windowMs: 900_000,
      fetchImpl,
    });

    expect(counter).toEqual({ count: 1, ttlMs: 900_000 });
    expect(captured?.url).toBe(UPSTASH_URL);
    const body = JSON.parse(String(captured?.init.body)) as unknown[];
    expect(body[0]).toBe("EVAL");
    expect(body[2]).toBe("1");
    expect(body[3]).toBe("rl:login:deadbeef");
    expect(body[4]).toBe("900000");
    expect(String(captured?.init.body)).not.toContain("learner@example.test");
    expect(new Headers(captured?.init.headers).get("authorization")).toBe(
      `Bearer ${UPSTASH_TOKEN}`,
    );
  });

  test("maps the Redis count onto the shared decision shape", async () => {
    const limiter = new UpstashRateLimiter({ url: UPSTASH_URL, token: UPSTASH_TOKEN }, async () =>
      jsonResponse({ result: [21, 50_000] }),
    );
    expect(
      await limiter.consume({ policy: RATE_LIMIT_POLICIES.login, subjectHash: "deadbeef" }),
    ).toMatchObject({
      allowed: false,
      reason: "limit",
      remaining: 0,
      retryAfterSeconds: 50,
      limit: 20,
    });
  });

  test("concurrent requests cannot exceed the allowance through a race", async () => {
    let counter = 0;
    const limiter = new UpstashRateLimiter({ url: UPSTASH_URL, token: UPSTASH_TOKEN }, async () => {
      counter += 1;
      return jsonResponse({ result: [counter, 60_000] });
    });
    const decisions = await Promise.all(
      Array.from({ length: 20 }, () =>
        limiter.consume({
          policy: policy({ limit: 5, windowMs: 60_000 }),
          subjectHash: "same-hash",
        }),
      ),
    );
    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(5);
    expect(decisions.filter((decision) => !decision.allowed)).toHaveLength(15);
  });

  test("turns transport, HTTP and body failures into a typed provider error", async () => {
    await expect(
      consumeUpstash({
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
        key: "k",
        windowMs: 1_000,
        fetchImpl: async () => {
          throw new Error("offline");
        },
      }),
    ).rejects.toBeInstanceOf(RateLimitProviderError);
    await expect(
      consumeUpstash({
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
        key: "k",
        windowMs: 1_000,
        fetchImpl: async () => jsonResponse({ error: "bad request" }, 400),
      }),
    ).rejects.toBeInstanceOf(RateLimitProviderError);
    await expect(
      consumeUpstash({
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
        key: "k",
        windowMs: 1_000,
        fetchImpl: async () => jsonResponse({ result: "unexpected" }),
      }),
    ).rejects.toBeInstanceOf(RateLimitProviderError);
  });
});

describe("P4-S2 failure modes", () => {
  const logs: { level: string; event: string; detail: Record<string, unknown> }[] = [];
  const logger = (
    level: "info" | "warn" | "error",
    event: string,
    detail: Record<string, unknown>,
  ) => logs.push({ level, event, detail });

  function failingService() {
    return createRateLimitService({
      config: {
        driver: "upstash",
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
        hashSecret: HASH_SECRET,
      },
      fetchImpl: async () => {
        throw new Error("provider offline");
      },
      memoryHashSecret: HASH_SECRET,
      logger,
    });
  }

  test("fails auth closed after a bounded local emergency allowance", async () => {
    logs.length = 0;
    const service = failingService();
    const decisions: RateLimitDecision[] = [];
    for (let index = 0; index < 6; index += 1) {
      decisions.push(await service.consume("signup", "learner@example.test"));
    }

    expect(decisions.slice(0, 5).every((decision) => decision.allowed)).toBe(true);
    expect(decisions[5]).toMatchObject({
      allowed: false,
      reason: "unavailable",
      policy: "signup",
    });
    expect(logs.some((entry) => entry.event === "rate_limit_provider_failed")).toBe(true);
    expect(JSON.stringify(logs)).not.toContain("learner@example.test");
  });

  test("fails authenticated learning writes open so Redis is never a dependency", async () => {
    logs.length = 0;
    const service = failingService();
    expect(await service.consume("lesson-complete", "user-123")).toMatchObject({
      allowed: true,
      degraded: true,
      policy: "lesson-complete",
    });
    expect(await service.consume("course-enrol", "user-123")).toMatchObject({
      allowed: true,
      degraded: true,
    });
  });

  test("treats a misconfigured selected driver as a provider failure, not a memory fallback", async () => {
    logs.length = 0;
    const service = createRateLimitService({
      config: { driver: "misconfigured", problems: ["UPSTASH_REDIS_REST_TOKEN"] },
      memoryHashSecret: HASH_SECRET,
      logger,
    });
    expect(await service.consume("signup", "learner@example.test")).toMatchObject({
      allowed: true,
      degraded: true,
    });
    expect(logs[0]).toMatchObject({
      level: "warn",
      event: "rate_limit_configuration_invalid",
      detail: { problems: ["UPSTASH_REDIS_REST_TOKEN"] },
    });
  });

  test("warns when staging runs with per-process memory limits", () => {
    logs.length = 0;
    createRateLimitService({
      config: { driver: "memory" },
      dataMode: "supabase-staging",
      memoryHashSecret: HASH_SECRET,
      logger,
    });
    expect(logs[0]).toMatchObject({ event: "rate_limit_memory_driver_in_staging" });
  });
});

describe("P4-S2 safe error mapping", () => {
  test("passes allowed decisions and maps limit/unavailable decisions safely", () => {
    expect(() =>
      assertRateLimit({ allowed: true, remaining: 1, limit: 2, policy: "login" }, "Please wait."),
    ).not.toThrow();

    try {
      assertRateLimit(
        {
          allowed: false,
          remaining: 0,
          limit: 2,
          policy: "login",
          retryAfterSeconds: 7,
          reason: "limit",
        },
        "Please wait.",
      );
      throw new Error("expected a rate-limit error");
    } catch (error) {
      expect(error).toMatchObject({ code: "RATE_LIMITED", retryAfterSeconds: 7 });
    }

    try {
      assertRateLimit(
        {
          allowed: false,
          remaining: 0,
          limit: 2,
          policy: "login",
          reason: "unavailable",
        },
        "Please wait.",
      );
      throw new Error("expected an unavailable error");
    } catch (error) {
      expect(error).toMatchObject({ code: "UNAVAILABLE" });
    }
  });
});
