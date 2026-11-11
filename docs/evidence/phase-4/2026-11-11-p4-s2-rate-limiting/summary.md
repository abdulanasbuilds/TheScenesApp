# P4-S2 evidence — distributed rate limiting (code/local)

**Date:** 2026-11-11
**Slice:** P4-S2 — Distributed rate limiting
**Approval:** ADR-044 (code/local; remote actions NONE)
**Target:** local code and fixture browser only. No provider contacted. No Supabase project contacted.
No migration or deployment.

## Implemented

- Stable `RateLimiter` interface plus a shared decision shape (`allowed`, `remaining`, `limit`,
  `retryAfterSeconds`, `reason`).
- `MemoryRateLimiter` wraps the existing bounded `LocalRateLimiter` for fixture/local mode.
- `UpstashRateLimiter` uses one fetch-compatible REST `EVAL` per request, so the increment and TTL read
  are atomic in Redis.
- HMAC-SHA256 subject hashing: emails are trimmed/lower-cased, identities trimmed, and only the hex hash
  reaches bucket keys (`rl:<policy>:<hash>`). Raw email/IP/user ID never appears in keys or logs.
- Explicit, documented policies for `signup`, `login`, `password-reset`, `community-join`,
  `course-enrol`, `lesson-complete` and `feedback`.
- Applied to signup, login, password recovery, community join, course enrol and lesson completion.
  `feedback` is defined for P4-S4; no feedback endpoint exists yet.
- Policy failure modes: auth/password/feedback fail closed after a bounded local emergency allowance;
  authenticated learning writes fail open, so Redis is never a learning dependency.
- A selected-but-incomplete Upstash configuration is reported as `misconfigured` with variable names
  only and treated as a provider failure. It is never silently downgraded to memory.
- A one-time staging warning makes per-process memory limits explicit.
- `Retry-After` remains clamped to 1–300 seconds by the existing safe error response.

## Verification

| Check                                          | Result                           |
| ---------------------------------------------- | -------------------------------- |
| `bun test tests/unit/p4-s2-rate-limit.test.ts` | 15 passed, 0 failed              |
| `bun run test:unit`                            | 212 passed, 0 failed (19 files)  |
| `bun run typecheck`                            | clean (app + scripts)            |
| `bun run lint`                                 | clean                            |
| `bun run verify:client-boundary`               | pass                             |
| `bun run build`                                | success                          |
| `bun run test:fixture`                         | 32 passed, 16 skipped (48 total) |
| `git diff --check`                             | clean                            |

Environment: Bun 1.4.4, Node v26.12.1, TypeScript 5.9.3, Playwright 1.64.1.

## Security review summary

- Subjects are one-way hashed before storage; tests assert the raw address never appears in the request
  body and that changing the secret changes the hash.
- Concurrent Upstash requests are counted by Redis atomically; a 20-way concurrency test with a limit of
  5 yields exactly 5 allowances.
- Configuration errors report variable names only; tests assert a rejected URL value is not echoed.
- Failure logs contain policy and cause only; a test asserts logs never contain the test address.
- Provider failures never fabricate success for auth: after the emergency allowance the response is a
  safe `503` (`UNAVAILABLE`), and over-limit responses are `429` with `Retry-After`.
- Critical findings: 0. High findings: 0.

## Not run / not authorized

- No Upstash account/database/token was created and no hosted staging secrets were set.
- No hosted migration was written or applied; this slice needs no schema change.
- No deployment, load test or capacity claim (ADR-041 Wave 5 remains deferred).
- The feedback policy is not yet exercised by an endpoint (arrives with P4-S4).

## Files

- `src/server/security/rate-limit.server.ts`
- `src/server/security/rate-limit-config.server.ts`
- `src/server/security/rate-limit-upstash.server.ts`
- `src/server/services/{auth,password-recovery,community,learning}.service.server.ts`
- `tests/unit/p4-s2-rate-limit.test.ts`, `tests/unit/password-recovery.test.ts`
- `docs/RATE-LIMITING.md`, `.env.example`

## Rollback

Remove the three new `rate-limit*.server.ts` modules and restore the previous direct `localRateLimiter`
calls in the four services. No data, provider or migration state exists to undo.
