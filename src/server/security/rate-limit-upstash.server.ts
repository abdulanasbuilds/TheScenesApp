import "@tanstack/react-start/server-only";

/**
 * Fetch-compatible Upstash Redis REST counter used by the P4-S2 rate limiter.
 *
 * The increment and the conditional TTL read run inside one Lua `EVAL`, so two concurrent requests
 * cannot both read the same count and then both decide they are allowed. Keys are caller-supplied and
 * already hashed; this module never sees a raw email address, IP address or user ID.
 *
 * Cost model (Upstash bills an `EVAL` as 1 command plus 1 per `redis.call`):
 *   - allowed request: INCR (+ PEXPIRE on the first request in a window) = 1 or 2 calls;
 *   - rejected request: INCR + PTTL = 2 calls, because `Retry-After` needs the real remaining TTL.
 * An allowed request never pays for `PTTL`; only a rejected one does.
 */

export class RateLimitProviderError extends Error {
  constructor(readonly cause: "network" | "http" | "body" | "configuration") {
    super(`Rate limit provider failed (${cause}).`);
    this.name = "RateLimitProviderError";
  }
}

export type UpstashFetch = (input: string, init: RequestInit) => Promise<Response>;

export type UpstashCounter = Readonly<{ count: number; ttlMs: number }>;

const EVAL_SCRIPT = [
  'local current = redis.call("INCR", KEYS[1])',
  'if current == 1 then redis.call("PEXPIRE", KEYS[1], ARGV[1]) end',
  'if current > tonumber(ARGV[2]) then return { current, redis.call("PTTL", KEYS[1]) } end',
  "return { current, 0 }",
].join("\n");

export async function consumeUpstash(input: {
  readonly url: string;
  readonly token: string;
  readonly key: string;
  readonly windowMs: number;
  readonly limit: number;
  readonly fetchImpl?: UpstashFetch;
  readonly timeoutMs?: number;
}): Promise<UpstashCounter> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 2_000);

  let response: Response;
  try {
    response = await fetchImpl(input.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        EVAL_SCRIPT,
        "1",
        input.key,
        String(input.windowMs),
        String(input.limit),
      ]),
      signal: controller.signal,
    });
  } catch {
    throw new RateLimitProviderError("network");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new RateLimitProviderError("http");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new RateLimitProviderError("body");
  }

  if (!payload || typeof payload !== "object" || "error" in payload) {
    throw new RateLimitProviderError("body");
  }

  const result = (payload as { result?: unknown }).result;
  if (!Array.isArray(result) || result.length < 2) throw new RateLimitProviderError("body");

  const count = Number(result[0]);
  const ttlMs = Number(result[1]);
  if (!Number.isFinite(count) || count < 0 || !Number.isFinite(ttlMs)) {
    throw new RateLimitProviderError("body");
  }

  return { count, ttlMs: ttlMs > 0 ? ttlMs : 0 };
}
