# Rate limiting (P4-S2)

**Status:** P4-S2 implemented as code/local work (ADR-044, 11 November 2026) and, from 19 November
2026, **local development is connected to a permanent Free-tier Upstash Redis database in Cape Town
(`af-south-1`)** with a full 26/26 proof run. Remote actions so far: one temporary database minted by
the official Upstash CLI at the founder's explicit request, then claimed into the founder's Personal
team. No staging or production secret is set and nothing is deployed.

This document is the operator and reviewer reference for the shared rate limiter.

## In plain English

Each limit is a bouncer with a clicker at one door. Three questions define a rule: **whose door**, **how
long the memory lasts**, and **what happens if the counter service is down**.

- **Whose door** — `email` rules count per email address, so one person cannot hammer a form from one
  address. `identity` rules count per logged-in account, so one learner cannot spam actions.
- **How long the memory lasts** — a rolling window. When the window ends, the counter resets to zero.
  It is not a daily cap and not a permanent ban.
- **At the limit** — the next request is refused with a "slow down" message and a wait time
  (`Retry-After`). Nothing is deleted and the account is not locked.
- **If the counter service is down** — safety-first rules (`fail-closed`) stop the action; learner-first
  rules (`fail-open`) let it through so a Redis outage never blocks learning.

| Rule | Plain meaning | Who it protects |
| --- | --- | --- |
| `signup` | 10 new accounts per email per 15 min | Stops mass account creation |
| `login` | 20 sign-in attempts per email per 15 min | Stops password guessing |
| `password-reset` | 5 reset emails per address per 15 min | Stops inbox bombing and email cost |
| `community-join` | 30 joins per account per 5 min | Stops scripted join spam |
| `course-enrol` | 30 enrolments per account per 5 min | Stops scripted enrolment spam |
| `lesson-complete` | 120 completions per account per 5 min | Stops fake progress farming |
| `feedback` | 5 messages per account per hour | Stops feedback spam and Telegram noise |

To change a limit, edit `limit` or `windowMs` for that rule in `RATE_LIMIT_POLICIES`
(`src/server/security/rate-limit.server.ts`) and re-run the unit tests. The numbers are deliberately
frozen objects, so a change is a code change with a review, never a runtime surprise.

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

### Connected database (19 November 2026)

`npx -y upstash start-redis` minted an anonymous database, which was then **claimed into the founder's
Personal team** and is now a permanent Free-tier database: `the-scenes-rate-limit`, **Cape Town,
South Africa (`af-south-1`)**, $0/month. It is wired into the git-ignored `.env` and stores only `rl:*`
keys.

To return to purely local behaviour, set `RATE_LIMIT_DRIVER=memory`. If the database is deleted or the
token is revoked while `RATE_LIMIT_DRIVER=upstash` is still set, auth policies fail closed (safe `503`
after the emergency allowance) rather than silently falling back to memory — this is intended.

### Measured behaviour of the connected path

| Signal                       | Result                                                    |
| ---------------------------- | --------------------------------------------------------- |
| Two-process shared limit     | 24 concurrent `login` attempts → 20 allowed, 4 blocked     |
| Cold start (new process)     | immediately limited, no local state                        |
| Memory control (same test)   | 24/24 allowed → the 20/24 result is genuinely shared        |
| Provider counter after run   | `24`, TTL ≈ 15 min                                          |
| Latency, `af-south-1`        | `p50 77.7 ms` / `p95 85.6 ms`, equal to a bare `PING`       |
| Latency, default region      | `p50 239 ms` (why Cape Town was chosen)                     |
| Client bundle                | no host, token, secret or `upstash.io` string in 119 files  |

The latency figure is the public-internet round trip from one development machine in Ghana to Cape
Town. It is **not** a production latency claim: measure again with the Worker deployed near the
database.

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

## Resource cost

Upstash bills `EVAL` as one command plus one per `redis.call`, so the Lua script is written to make as
few calls as possible:

| Path | Before | Now |
| --- | --- | --- |
| Allowed request, first in a window | 4 (EVAL + INCR + PEXPIRE + PTTL) | 3 (EVAL + INCR + PEXPIRE) |
| Allowed request, later in the window | 3 (EVAL + INCR + PTTL) | **2** (EVAL + INCR) |
| Rejected request, first time | 3 (EVAL + INCR + PTTL) | 3 (unchanged — `Retry-After` needs the real TTL) |
| Rejected request, repeated in the same window | 3 | **0** (answered from a local, provider-confirmed block cache) |

Two deliberate choices:

- `PTTL` is only requested when a request is actually rejected, because that is the only case that
  needs an accurate `Retry-After`.
- A refusal the provider already returned is remembered for that subject until its window expires.
  The cache can only ever **deny**, never allow, and it is never used when the provider fails — that
  still throws into the documented fail-open / fail-closed logic. It is capped at 10,000 entries with
  FIFO eviction, so a flood of distinct subjects cannot grow memory without bound.

Rough capacity on the Free tier (500K commands/month): a typical allowed check costs 2 commands, so
about **250,000 checks/month** — roughly 1.5× the previous ~166,000. A brute-force flood becomes nearly
free after the first refusal per subject, because repeats no longer reach Redis. The quota is **per
database**, so other apps on other Upstash databases do not consume this one's allowance.

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
bun run verify:rate-limit          # presence of every variable, by name only
bun run verify:rate-limit:prove    # two processes, cold start, failure modes, latency, bundle
bun run build
```

`verify:rate-limit:prove` writes its evidence to `.audit/p4-s2-upstash/` (git-ignored). It prints only
variable names, states, PIDs, counts and truncated key prefixes — never a token, URL or secret.

## Rollback

Delete the three new `rate-limit*.server.ts` files and revert the service call sites to the previous
direct `localRateLimiter` calls. No migration, data or provider state is created by this slice.

## Not authorized

The 19 November 2026 connection was limited to one database minted by the official CLI and claimed into
the founder's Personal team, **for local development**, at the founder's explicit request. Still not
authorized:

- creating further databases or changing the plan (Free tier, no payment method);
- setting hosted staging or production secrets;
- applying any migration (this slice adds none);
- deploying, load testing or making a scale claim (ADR-041 Wave 5 remains deferred).
