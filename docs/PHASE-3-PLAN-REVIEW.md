# The Scenes — Phase 3 Plan Review

> **Historical revision-2 review:** Later independent review found additional material gaps. See
> `PHASE-3-REVISION-3-REVIEW.md` and the revision-3 contract set before making an implementation
> decision.

**Review date:** 5 November 2026  
**Scope:** `PHASE-3-BACKEND-SPEC.md`, `PHASE-3-IMPLEMENTATION-PLAN.md`, current frontend,
Supabase/TanStack documentation, security rules, tests, and local capabilities  
**Historical verdict (superseded):** This review considered revision 2 conditionally suitable for the
bounded local proof. The later five-track review found additional material gaps, so revision 2 is not
implementation authority. No hosted/production action is authorized.

## Evidence inspected

- current repository implementation and fixture state;
- `AGENTS.md`, phase/planning/security/data/testing/CI documents;
- installed TanStack Start APIs and current official TanStack middleware/server-function guidance;
- current official Supabase SSR, RLS, Data API, database-function, testing, seeding and CLI guidance;
- current npm metadata/provenance for the three proposed Supabase packages;
- local Bun, Node, Docker CLI/Compose and Git status;
- lint, typecheck, production build and Playwright baseline behavior.

Official references were accessed on 5 November 2026:

- <https://supabase.com/docs/guides/auth/server-side/creating-a-client>
- <https://supabase.com/docs/guides/database/postgres/row-level-security>
- <https://supabase.com/docs/guides/api/securing-your-api>
- <https://supabase.com/docs/guides/database/functions>
- <https://supabase.com/docs/guides/local-development/cli/getting-started>
- <https://supabase.com/docs/guides/database/testing>
- <https://supabase.com/docs/guides/local-development/seeding-your-database>
- <https://tanstack.com/start/latest/docs/framework/react/guide/middleware>
- <https://tanstack.com/start/latest/docs/framework/react/guide/server-functions>

## Findings and resolutions

| ID | Severity | Draft-plan defect | Revision-2 resolution |
|---|---|---|---|
| P3R-001 | Critical | Custom `src/start.ts` added request middleware but omitted TanStack Start's automatic CSRF protection, which no longer applies after a custom Start instance is defined. | Explicitly install `createCsrfMiddleware()` for server functions and test cross-site rejection. |
| P3R-002 | Critical | Session helper was ambiguous and could trust `getSession()` cookie data. | Verify every private endpoint with `auth.getClaims()`; `getSession()` is never an authorization source. |
| P3R-003 | High | SSR cookie adapter used obsolete/simplified `getCookie`/`setCookie` assumptions and ignored provider cache headers. | Use current `getAll`/`setAll`, propagate all refreshed cookies and cache headers, and mark private/session responses `no-store`. |
| P3R-004 | Critical | Auth functions planned to return `session + profile`, exposing raw access/refresh tokens to client code. | Session remains only in cookies; functions return safe profile/result DTOs. |
| P3R-005 | Critical | All helpers were declared `SECURITY DEFINER`, unnecessarily expanding RLS-bypass risk. | Default to invoker; use definer only for reviewed recursion-breaking helpers and caller-bound atomic commands with pinned search path and narrow execute grants. |
| P3R-006 | Critical | Grants were deferred to a final migration, leaving earlier exposed-schema tables dependent on broad Supabase defaults. | Each table migration enables RLS, revokes defaults, grants the minimum columns/operations and adds tests immediately; default privileges are restricted first. |
| P3R-007 | Critical | Published courses/lessons/resources were globally readable even when attached to private communities. | Every curriculum policy includes parent community visibility/membership; private published content remains private. |
| P3R-008 | High | `lesson_progress` policy text referred to a nonexistent `user_id` column. | Ownership is derived through the enrolment relationship and covered by RLS/direct-call tests. |
| P3R-009 | Critical | Direct membership/enrolment/progress table writes could choose statuses/timestamps and made atomic audit/idempotency unclear. | Revoke direct writes; expose four caller-bound database commands that derive `auth.uid()`, set timestamps, enforce state and write audit history atomically. |
| P3R-010 | Critical | Audit table grants allowed user insert/select, enabling forged events and broad history access. | Move audit data to unexposed `private`; no user grants; controlled commands are the only insert path. |
| P3R-011 | High | Partial unique owner index was described as enforcing “exactly one” owner although it enforces only “at most one.” | Correct the invariant; Phase 3 exposes no role/workspace mutation, and a later creator transaction must enforce at-least-one before enabling transfer/removal. |
| P3R-012 | High | Server-function wrappers lived under `src/server/**`, while that path is blocked from route/client imports. | Put route-importable `*.functions.ts` wrappers and schemas under `src/features/**`; keep provider/repository/service code under `src/server/**`. |
| P3R-013 | High | Error handling assumed custom `Error` classes/codes would cross the server-function serialization boundary intact. | Use an internal error plus explicit serializable discriminated result/error DTO. |
| P3R-014 | High | Seed plan wrote test users into Supabase Auth internals, coupling reproducibility to provider-private schema. | Seed platform catalogue only; E2E users are created through the real signup flow. |
| P3R-015 | High | Realtime was optional inside the slice without an authorization/cost contract. | Realtime is explicitly out of scope; persisted reload/new login proves the slice. |
| P3R-016 | High | Performance goals, dataset size, error ceiling and recovery times were unresolved. | Add numeric local dataset, pagination, throughput, latency, error, overload, reset, restore and zero-spend targets. |
| P3R-017 | High | External lesson links had only a weak SQL `^https://` check. | Add parser-based protocol/credential/control-character/length/token validation; no server-side URL fetch or raw HTML in Phase 3. |
| P3R-018 | High | Browser regression gate was not deterministic because every route waited on Google Fonts; tests showed connection closures/timeouts. | Remove runtime external-font dependency and require a green baseline before backend wiring. |
| P3R-019 | Medium | CLI commands assumed a global install and stale test/seed paths. | Pin official CLI, run with `bunx`, use `supabase/tests/database/` and `supabase/seed.sql`. |
| P3R-020 | High | Security policy lacked a concrete permission matrix, embed/XSS rules, privacy/retention boundaries and admin MFA requirements. | `SECURITY-RULES.md` now contains numbered, testable rules and the Phase 3 matrix. |
| P3R-021 | High | Approval and measurable-target records were blank. | Record the user's conditional approval for revision 2 and the exact remaining Wave 0 gates. |
| P3R-022 | Medium | Docker was described as available without verifying the daemon. | Record CLI/Compose as installed but engine unavailable; local stack start is a hard Wave 0 gate. |

## Baseline evidence before remediation

- `bun run lint`: passed.
- `bun run typecheck`: passed.
- `bun run build`: passed.
- `bun run test:e2e`: 23 passed, 3 failed, 4 skipped. Failures were an external resource
  `ERR_CONNECTION_CLOSED` and navigation timeout while pages waited for the Google Fonts stylesheet.
- Docker CLI `29.9.2` and Compose `v5.6.1`: installed.
- Docker daemon: unavailable during review.
- Supabase CLI: not yet project-pinned.
- Gitleaks: not installed; official v8.30.1 asset/checksum selected for the authorized local scan.

## Gate decision

The revised architecture is solid enough to implement **only** this local vertical slice. Wave 0 may
proceed after this review. Wave 1 must not begin until all of the following evidence exists:

1. checksum-verified, redacted Gitleaks history + working-tree report;
2. deterministic green frontend baseline without external-font requests;
3. exact dependency lock and local-only environment guard;
4. running Docker engine and successful local Supabase start/stop;
5. Wave 0 lint, unit, typecheck, build, diff and changed-path review.

Any provider/remote target, auth model, tenant boundary, payment, native media, production cost/scale,
or production privacy/recovery change returns the affected plan to review.

## Wave 0 evidence update

- Google Fonts runtime request removed from `src/routes/__root.tsx`.
- Local Playwright workers bounded to three to avoid turning the dev server into an accidental load
  test.
- Full baseline rerun: **26 passed, 4 intentionally skipped, 0 failed** across desktop, tablet and
  mobile.
- Docker Desktop engine started and reports server `29.9.2`.
- Exact Supabase CLI `3.0.0` executes locally.
- Gitleaks v8.30.1 scan: working tree clean; 13 redacted historical findings. The credential response
  is documented in `SECURITY-SCAN-RESULTS.md` and is the remaining account-owner blocker.
