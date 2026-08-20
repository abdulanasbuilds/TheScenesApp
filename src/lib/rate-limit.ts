/**
 * Rate limiting via Redis (Upstash REST API — Cloudflare Worker compatible).
 *
 * Uses the Upstash Redis REST API format so this works in both local dev
 * and Cloudflare Workers without an ioredis dependency.
 *
 * If REDIS_URL / REDIS_TOKEN are not set, rate limiting degrades gracefully —
 * operations are allowed through with a console warning. This prevents
 * Redis misconfiguration from breaking the payment flow in development.
 *
 * Env vars needed:
 *   REDIS_URL   — Upstash REST endpoint, e.g. https://xxx.upstash.io
 *   REDIS_TOKEN — Upstash REST API token
 */

// ─── Redis REST primitives ────────────────────────────────────────────────────

async function redis(command: (string | number)[]): Promise<unknown> {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url || !token) {
    // Not configured — degrade silently (allow the operation)
    return null;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result: unknown };
    return json.result;
  } catch {
    // Redis call failed — degrade gracefully (don't block the user)
    console.warn("[rate-limit] Redis call failed — allowing operation through.");
    return null;
  }
}

// ─── Core operations ──────────────────────────────────────────────────────────

async function incr(key: string): Promise<number> {
  const result = await redis(["INCR", key]);
  return typeof result === "number" ? result : 1;
}

async function expire(key: string, seconds: number): Promise<void> {
  await redis(["EXPIRE", key, seconds]);
}

async function get(key: string): Promise<string | null> {
  const result = await redis(["GET", key]);
  return typeof result === "string" ? result : null;
}

async function setex(key: string, seconds: number, value: string): Promise<void> {
  await redis(["SETEX", key, seconds, value]);
}

async function del(key: string): Promise<void> {
  await redis(["DEL", key]);
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

export type RateLimitResult =
  { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number };

/**
 * Sliding window rate limiter.
 *
 * @param key      - Unique key for this action+actor combo (e.g. "webhook:pay_abc123")
 * @param limit    - Max allowed requests in the window
 * @param windowSec - Window duration in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const count = await incr(redisKey);

  // Set expiry only on first request (INCR + EXPIRE is not atomic, but
  // the window slightly extending is acceptable for abuse protection)
  if (count === 1) {
    await expire(redisKey, windowSec);
  }

  if (count > limit) {
    // Window expiry time is approximated; exact TTL would need a separate GET
    return { allowed: false, retryAfterSeconds: windowSec };
  }

  return { allowed: true, remaining: limit - count };
}

// ─── Idempotency lock ─────────────────────────────────────────────────────────

/**
 * Acquire a short-lived lock for an idempotent operation (e.g. webhook processing).
 * Returns true if the lock was acquired (caller should proceed), false if already locked.
 *
 * The lock auto-expires after `ttlSec` seconds, preventing deadlocks.
 */
export async function acquireLock(key: string, ttlSec = 30): Promise<boolean> {
  const lockKey = `lock:${key}`;
  const existing = await get(lockKey);
  if (existing !== null) return false; // Already locked
  await setex(lockKey, ttlSec, "1");
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  await del(`lock:${key}`);
}

// ─── Pre-built limiters for common abuse vectors ──────────────────────────────

/** Prevent Paystack webhook replay attacks: 1 processing per event ID in 5 min window. */
export async function checkWebhookEventRate(eventId: string): Promise<RateLimitResult> {
  return rateLimit(`webhook:${eventId}`, 1, 300);
}

/** Prevent rapid withdrawal attempts: max 3 requests per creator per hour. */
export async function checkWithdrawalRate(creatorEmail: string): Promise<RateLimitResult> {
  return rateLimit(`withdrawal:${creatorEmail}`, 3, 3600);
}

/** Prevent payment callback spam: max 10 verifications per user per minute. */
export async function checkPaymentVerifyRate(userEmail: string): Promise<RateLimitResult> {
  return rateLimit(`verify:${userEmail}`, 10, 60);
}

/** Prevent file access abuse: max 100 presigned URL requests per user per minute. */
export async function checkFileAccessRate(userEmail: string): Promise<RateLimitResult> {
  return rateLimit(`file-access:${userEmail}`, 100, 60);
}

/** General auth form abuse: max 10 attempts per IP per minute. */
export async function checkAuthRate(ip: string): Promise<RateLimitResult> {
  return rateLimit(`auth:${ip}`, 10, 60);
}

/** Prevent feedback form spam: max 5 submissions per 5 minutes per user/identifier. */
export async function checkFeedbackRate(identifier: string): Promise<RateLimitResult> {
  return rateLimit(`feedback:${identifier}`, 5, 300);
}
