# Rate limiting (P4-S2)

**Status:** P4-S2 implemented as code/local work (ADR-044, 11 November 2026). Remote actions: **NONE**.
No Upstash account exists, no hosted migration applies, and nothing is deployed.

This document is the operator and reviewer reference for the shared rate limiter.

## What it does

Every abuse-sensitive server function calls one stable `RateLimiter` interface:

```text
consume({ policy, subjectHash, now }) -> { allowed, remaining, limit, retryAfterSeconds, reason }
```

- `subjectHash` is an HMAC-SHA256 of the trimmed subject (email lower-cased first). Raw email addresses,
  IP addresses and user IDs never reach a limiter bucket or a Redis key.
- Bucket keys are `rl:<policy>:<hash>`.
- The connected implementation performs the increment and TTL read inside one Redis `EVAL`, so a
  concurrent request cannot read a stale count and slip past the allowance.

## Policies

| Policy            | Limit | Window | Subject | Provider failure |
| ----------------- | ----: | -----: | ------- | ---------------- |
| `signup`          |    10 | 15 min | email   | fail closed      |
| `login`           |    20 | 15 min | email   | fail closed      |
| `password-reset`  |     5 | 15 min | email   | fail closed      |
| `community-join`  |    30 |  5 min | user ID | fail open        |
| `course-enrol`    |    30 |  5 min | user ID | fail open        |
| `lesson-complete` |   120 |  5 min | user ID | fail open        |
| `feedback`        |     5 | 60 min | user ID | fail closed      |

`feedback` is defined now and is enforced when P4-S4 adds the feedback form; there is no feedback
endpoint in this slice.

Learning writes fail open so a Redis outage never blocks a learner's progress. Auth, password recovery
and feedback fail closed after a short local emergency allowance: while the provider is unavailable, a
single process may still admit `floor(limit / 2)` requests, then returns a safe `503 UNAVAILABLE`.
Responses carry a clamped `Retry-After` (1–300 seconds).

## Configuration

Server-only variables, never prefixed with `VITE_`:

| Variable                   | Meaning                                       |
| -------------------------- | --------------------------------------------- |
| `RATE_LIMIT_DRIVER`        | `memory` (default) or `upstash`               |
| `UPSTASH_REDIS_REST_URL`   | `https://<cluster>.upstash.io`                |
| `UPSTASH_REDIS_REST_TOKEN` | scoped Upstash REST token                     |
| `RATE_LIMIT_HASH_SECRET`   | ≥16-character HMAC secret for subject hashing |

Behaviour:

- `memory` is the bounded process-local limiter used for fixture and local mode. In
  `supabase-staging` it logs `rate_limit_memory_driver_in_staging` once so the per-process limitation
  is visible; it is not a distributed guarantee.
- `upstash` requires all three Upstash/secret variables. A selected but incomplete configuration is
  reported as `misconfigured` with variable **names** only and is treated as a provider failure. It is
  never silently downgraded to memory.
- Values are read from the server runtime environment (the platform secret store in a hosted
  environment, or an exported shell variable locally). Never place them in a `VITE_` variable and never
  commit them.

Setup for a future connected environment (requires separate approval):

1. Create a business-controlled Upstash Redis database.
2. Provide the REST URL, a scoped token and a generated hash secret as server-only secrets.
3. Set `RATE_LIMIT_DRIVER=upstash`.
4. Confirm the staging log no longer shows `rate_limit_memory_driver_in_staging`.

## Failure behaviour

| Situation                          | Behaviour                                                      |
| ---------------------------------- | -------------------------------------------------------------- |
| Under the limit                    | request continues                                              |
| Over the limit                     | `RATE_LIMITED` (429) with `Retry-After`                        |
| Provider network/HTTP/body failure | policy failure mode above                                      |
| Misconfigured `upstash` selection  | treated as provider failure, logged once per policy per minute |
| `memory` driver in hosted staging  | allowed but logged; limits are per process                     |

Logs contain the policy name, failure cause and a request ID where available. They never contain the
raw subject, keys or provider response bodies.

## Files

- `src/server/security/rate-limit.server.ts` — policies, hashing, memory/Upstash implementations,
  failure modes, singleton.
- `src/server/security/rate-limit-config.server.ts` — environment parsing, names-only problems.
- `src/server/security/rate-limit-upstash.server.ts` — atomic REST `EVAL` counter.
- `src/server/security/local-rate-limit.server.ts` — unchanged bounded local bucket used by memory mode.
- `tests/unit/p4-s2-rate-limit.test.ts` — contract, concurrency, failure-mode and hashing tests.

## Verification

```text
bun test tests/unit/p4-s2-rate-limit.test.ts
bun run test:unit
bun run typecheck
bun run lint
bun run verify:client-boundary
bun run build
```

## Rollback

Delete the three new `rate-limit*.server.ts` files and revert the service call sites to the previous
direct `localRateLimiter` calls. No migration, data or provider state is created by this slice.

## Not authorized

- creating an Upstash account, database or token;
- setting hosted staging secrets;
- applying any migration (this slice adds none);
- deploying, load testing or making a scale claim (ADR-041 Wave 5 remains deferred).
