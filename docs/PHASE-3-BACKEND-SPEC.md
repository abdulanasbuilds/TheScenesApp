# The Scenes — Phase 3 Backend Foundation Specification (Revision 2 — Historical)

> **Superseded for implementation:** Five independent reviews found material identity, access,
> schema, data-mode, verification, isolation, and recovery gaps in revision 2. The proposed canonical
> replacement is `PHASE-3-REVISION-3-SPEC.md` and its child contracts. This file remains review history
> and does not authorize implementation.

**Status:** SUPERSEDED — NOT IMPLEMENTATION AUTHORITY
**Created:** 4 November 2026  
**Technical review completed:** 5 November 2026
**Approved platform boundary:** local-only Supabase proof-of-fit  
**Approved first slice:** full learning persistence flow  
**Production/remote authorization:** none  
**File-by-file build order:** [PHASE-3-IMPLEMENTATION-PLAN.md](./PHASE-3-IMPLEMENTATION-PLAN.md)

## 1. Outcome

Prove that The Scenes can safely replace fixture state for one coherent learning journey without
coupling the product to insecure client state or an irreversible provider design.

Approved observable journey:

```text
sign up/login
→ create/read profile
→ join/read an allowed community
→ enrol in a course
→ complete a lesson
→ reload/sign in again
→ observe persisted enrolment and lesson progress
```

The result is a local, reproducible backend foundation—not a production launch.

## 2. Product and business reason

This slice tests the core learner value loop (join → learn → progress) and the most important
technical boundaries at once:

- durable identity/session;
- public versus private/community-member access;
- creator/workspace ownership;
- course structure and enrolment integrity;
- learner-owned progress;
- server-side validation and database authorization;
- migrations, seeds, backup/export and restore.

If this foundation is wrong, later creator, referral, moderation, marketplace and payment work would
compound the error. The phase therefore optimizes for correctness, security and migration safety
before feature breadth.

## 3. In scope

- local Supabase stack and reproducible configuration;
- Supabase Auth for local email/password test flows;
- SSR cookie session integration with TanStack Start;
- profile records linked one-to-one with Auth users;
- workspace and workspace-membership foundation;
- categories and public/private communities;
- community memberships with scoped roles/status;
- courses, modules and lessons using external resource links;
- course enrolments;
- lesson completion/progress persistence;
- RLS, grants, server authorization and negative tests;
- deterministic local seeds based on fictional fixture data;
- repository/service adapters so routes do not call provider code directly;
- basic structured errors and request correlation;
- migration reset, logical export and local restore rehearsal;
- representative query plans and local synthetic-data load checks.

## 4. Explicitly out of scope

- hosted or production Supabase project;
- production secrets, custom domains or deployment;
- production email delivery, Resend or real password-recovery email;
- payments, subscriptions, payouts, orders or webhooks;
- native creator file/video/live hosting or R2 creator quotas;
- referrals, entitlement ledger implementation or reward providers;
- private messaging, moderation automation or admin impersonation;
- marketplace delivery;
- AI features or semantic search;
- multi-region writes, microservices or premature database partitioning;
- migration of real user data.

## 5. Scale direction and honest capacity model

### Long-term target

The architecture must leave a credible path to **millions of registered accounts over time**. This is
not a requirement for millions of simultaneous sessions and is not a claim that the local proof has
demonstrated production capacity.

### Local proof envelope and pass targets

These are **engineering proof targets**, not production forecasts or promises. The evidence report must
record the machine, Docker/CLI/database versions, dataset size, warm-up, command, duration, concurrency,
and raw result location so the numbers are reproducible.

| Measure | Local proof target |
|---|---|
| Representative data | 10,000 profiles; 500 workspaces; 1,000 communities; 2,000 courses; 20,000 lessons; 25,000 community memberships; 30,000 enrolments; 150,000 progress rows |
| Bounded list defaults/maxima | 24 default; 50 hard maximum; keyset cursor only for growing lists |
| Request mix | 80% reads / 20% idempotent writes across catalogue, membership, enrolment and progress paths |
| Sustained run | 25 concurrent sessions, 25 requests/second for 5 minutes after warm-up |
| End-to-end latency | reads p95 ≤ 500 ms and p99 ≤ 1,000 ms; writes p95 ≤ 750 ms and p99 ≤ 1,500 ms on the documented local machine |
| Database latency | approved indexed queries p95 ≤ 75 ms after warm-up; no unexplained sequential scan over a growing membership/enrolment/progress table |
| Error rate | < 1% unexpected 5xx/transport errors; expected validation/auth denials are reported separately |
| Correctness under retry | zero duplicate memberships, enrolments, completions, or audit events for the tested command/retry keys |
| Bounded overload | a short 100-concurrent-request probe may slow or reject cleanly, but must not corrupt state, leak data, exhaust the app permanently, or produce unhandled process failures |
| Reset/recovery | clean reset + seed ≤ 10 minutes; local logical restore ≤ 15 minutes; row-count/checksum reconciliation passes |
| Cost | $0 provider spend; local CPU, peak memory, database size, and Docker disk use are recorded |

If the available local machine cannot sustain this dataset, the report records the largest completed
dataset and the exact resource constraint. That is a failed/unresolved capacity criterion, not a reason
to lower the target silently. A hosted pilot still requires separate founder review and must add real
launch assumptions for accounts, MAU/DAU, regions, production concurrency, RPO/RTO, and budget.

### Scale-safe choices required now

- stateless TanStack server handlers;
- UUID database-generated identifiers;
- explicit `workspace_id` / `community_id` ownership boundaries;
- normalized relationships rather than nested ID arrays;
- keyset/cursor pagination for unbounded feeds/lists;
- bounded column selection and payloads;
- unique/idempotent enrolment and lesson-progress writes;
- indexes based on approved queries and RLS predicates;
- no per-user server memory or local filesystem state;
- selective realtime only after request/response behavior passes;
- append-only audit/outbox path available for later phases;
- standard PostgreSQL migrations and exports to preserve portability.

### Deliberately deferred scale mechanisms

Do not add sharding, microservices, multi-primary databases, cross-region writes or table partitioning
in the local proof. They add failure modes before evidence exists. The schema must use stable keys,
timestamps and tenant boundaries so those options remain possible when table size, query plans or
regional latency justify them.

## 6. Architecture and trust boundaries

```text
Browser
  | secure cookie; no privileged key
  v
TanStack Start route/server function
  | validate input (Zod)
  | authenticate session
  | authorize use case
  | attach request/correlation ID
  v
Application service / repository interface
  | provider-specific implementation stays server-only
  v
Supabase Auth + Data API + PostgreSQL RLS
```

Rules:

1. UI visibility is never authorization.
2. User-scoped server calls retain the user's identity so RLS applies.
3. A privileged/secret client is not needed for ordinary learner workflows.
4. Any future privileged client is server-only, narrowly used and paired with explicit authorization
   plus audit events.
5. Route components depend on application interfaces, not Supabase directly.
6. Browser-direct database writes are not the default for the proof.
7. External lesson/resource URLs are validated; no provider access token is stored in content rows.
8. Defining `src/start.ts` must explicitly preserve TanStack Start's CSRF middleware for server
   functions.
9. Server identity checks use Supabase `auth.getClaims()`; unverified `getSession()` data is never an
   authorization source.
10. Authenticated/session-changing responses are `no-store`, and all cookie/cache headers returned by
    `@supabase/ssr` are propagated.
11. User commands use narrowly granted, caller-bound database functions for atomic/idempotent writes;
    direct table writes for membership, enrolment, progress, and audit rows remain revoked.

## 7. Initial domain model

Detailed rationale and later-phase boundaries are in `docs/DATA-LAYER-RESEARCH.md`.

### Phase 3 tables

| Table | Purpose | Critical constraints |
|---|---|---|
| `profiles` | application/public profile linked to Auth | Auth ID primary/foreign key; unique normalized handle; no email/role/secret fields; status not client writable |
| `workspaces` | stable creator/tenant root | constrained kind/status; created-by identity |
| `workspace_memberships` | scoped creator-team authorization | unique workspace/user; controlled role/status; owner invariant |
| `categories` | expandable taxonomy | unique normalized slug; active/sort state |
| `communities` | public/private learning community | workspace FK; unique slug; privacy/publication checks |
| `community_categories` | community taxonomy | unique pair; at most one primary category |
| `community_memberships` | learner/manager access | unique community/user; controlled role/status |
| `courses` | workspace-owned curriculum | optional community FK; scoped slug; status checks |
| `course_modules` | ordered course section | unique course/position |
| `lessons` | ordered learning unit | unique module/position; versioned content shape |
| `lesson_resources` | validated external learning link | lesson FK; kind/order; safe URL policy |
| `course_enrollments` | learner access/state | unique course/user; controlled status/source |
| `lesson_progress` | learner lesson state | unique enrolment/lesson; lesson belongs to enrolled course |
| `private.audit_events` | privileged/security-relevant history | append-only; no direct Data API grants; controlled command/trigger inserts only |

### Data conventions

- database-generated UUIDs;
- `timestamptz` in UTC, with IANA timezone only where needed;
- required fields use `NOT NULL`;
- named checks for state/value invariants;
- component children cascade only where lifecycle truly matches;
- durable/audit history is restricted rather than silently cascaded;
- no money tables in Phase 3;
- JSONB only for versioned, validated content metadata—not relationships or permissions.
- exposed tables have RLS plus explicit grants in the same migration;
- internal RLS helpers live in the unexposed `private` schema;
- `SECURITY DEFINER` is exceptional, caller-bound, search-path-pinned and directly tested;
- lesson content includes an explicit schema version and does not accept raw HTML in this phase.

## 8. Core workflows and invariants

### Authentication/session

- local signup creates an Auth identity and an application profile through an idempotent, tested path;
- server code validates/refreshes the session using `@supabase/ssr`'s current `getAll`/`setAll`
  cookie contract and verifies identity with `auth.getClaims()`;
- logout revokes/clears the session cookie;
- no role/tenant authority comes from editable profile metadata;
- signup/sign-in functions return a safe profile/result, never raw access or refresh tokens;
- the local proof accepts only `http://127.0.0.1`/`http://localhost` Supabase URLs and a publishable
  key; a hosted URL or app secret/service-role key fails closed;
- local email tooling only; no claim of production email delivery.

### Community membership

- public metadata is readable according to publication policy;
- private content requires active membership;
- a public join command is idempotent;
- banned/paused membership is not treated as active;
- a learner cannot assign their own elevated role;
- direct membership table writes are revoked; an authenticated `join_community`/`leave_community`
  command derives the user from `auth.uid()`, enforces state and records the mutation atomically;
- membership role changes are outside the learner proof except deterministic seed/setup.

### Enrolment

- enrolment requires an authenticated user and a published/accessible course;
- repeated enrolment returns the existing row rather than duplicating it;
- the client cannot enrol another user by submitting a user ID;
- paid-course entitlement is not implemented while payments are held; proof courses are free/included
  fixture equivalents.
- published content inside a private community is not public merely because its course status is
  `published`; community visibility/membership is part of every course/module/lesson/resource policy.

### Lesson completion

- completion requires the user's active enrolment;
- the lesson must belong to the enrolled course;
- repeated completion is idempotent;
- server/database sets authoritative timestamps;
- progress cannot be written for another learner;
- derived course percentage is calculated/reconciled from lesson progress, not trusted from a client.
- the database command accepts only a lesson identifier (plus non-authoritative request correlation),
  derives the caller/enrolment/course, sets timestamps, upserts idempotently and records audit history
  in one transaction.

## 9. Server/API contract direction

Exact TypeScript/Zod schemas must be written before each endpoint/server function. The first contract
set is:

| Operation | Input | Output | Important failures |
|---|---|---|---|
| `signUpWithPassword` | bounded email, password, handle, display name | safe profile/result; cookies set server-side | duplicate/invalid identity or handle, weak password |
| `signInWithPassword` | bounded email, password | safe profile/result; cookies set server-side | invalid credentials (one public message) |
| `signOutCurrentSession` | session only | ok; cookies cleared | invalid/expired session remains safely signed out |
| `getSessionProfile` | session only | public-safe profile + scoped capabilities | unauthenticated, profile missing |
| `updateOwnProfile` | display name, headline, bio, location, avatar URL | updated public-safe profile | invalid field or forbidden mutation; handle/status are immutable in this slice |
| `listCommunities` | cursor, category, visibility-safe filters | bounded page + next cursor | invalid cursor/filter |
| `joinCommunity` | community ID/slug | membership and whether it was newly created | unauthenticated, private/invite required, blocked |
| `getCourse` | course ID/slug | accessible course/module/lesson outline | not found or not authorized without resource leak |
| `enrolInCourse` | course ID | existing/new enrolment | inaccessible/unpublished course |
| `completeLesson` | lesson ID | authoritative lesson/course progress | wrong course or no active own enrolment |
| `getMyLearning` | cursor/status | bounded enrolment/progress projection | unauthenticated, invalid cursor |

Contract rules:

- never accept authoritative `user_id`, role, workspace, price or ownership from the client;
- use stable machine error codes with safe human messages;
- do not reveal whether a private resource exists when the caller lacks access;
- cursor pagination for potentially growing lists;
- request IDs in logs and safe error responses;
- mutations are idempotent by natural unique key or explicit idempotency key;
- no stack traces, SQL text, tokens or sensitive row data in user-facing errors.
- server functions use a serializable discriminated result/error envelope with a stable code, safe
  message and request ID; provider/database errors are mapped and logged only in redacted form.
- private results set `Cache-Control: no-store`; public anonymous catalogue reads may use a separately
  reviewed cache policy only after they are proven identity-independent.

## 10. Authorization matrix

| Action | Visitor | Signed-in non-member | Active member/learner | Workspace/community manager | Platform service/admin |
|---|---:|---:|---:|---:|---:|
| Read published public metadata | Yes | Yes | Yes | Yes | Explicit path |
| Read private community/course | No | No | Yes when entitled | Yes within scope | Audited explicit path |
| Join public community | No | Yes | Idempotent | Not needed | No impersonation by default |
| Update profile | No | Own only | Own only | Own only | Support workflow only |
| Enrol in included course | No | If course accessible | Idempotent | Own learner account only | No impersonation by default |
| Read/write lesson progress | No | Own enrolment only | Own enrolment only | Aggregates only unless policy says otherwise | Audited explicit path |
| Change scoped roles | No | No | No | Allowed hierarchy only | Elevated auth + audit |

For every table/operation, tests must cover anonymous, owner, permitted member, signed-in stranger and
elevated principal where applicable.

## 11. Query and index plan

Initial indexes are hypotheses to verify with synthetic representative data:

- unique `profiles(handle)` after normalization;
- unique `workspace_memberships(workspace_id, user_id)` plus an index beginning with `user_id` for
  “my workspaces” and RLS checks;
- unique `communities(slug)` and an index supporting published/category discovery;
- unique `community_memberships(community_id, user_id)` plus `user_id, status, community_id`;
- `courses(community_id, status, published_at desc)`;
- unique `course_modules(course_id, position)`;
- unique `lessons(module_id, position)`;
- unique `course_enrollments(course_id, user_id)` plus `user_id, status, updated_at desc`;
- unique `lesson_progress(enrollment_id, lesson_id)`;
- indexes on every foreign-key/policy column justified by joins, deletion checks or RLS predicates.

No endpoint may fetch an unbounded membership, course or learning list. The implementation review must
look for N+1 access and verify important queries with `EXPLAIN (ANALYZE, BUFFERS)` using synthetic data.

## 12. Realtime decision

Realtime is **not implemented in this slice**. Persistence, refresh, and a new authenticated session
prove the approved outcome without another authorization/cost boundary. A future amendment must define
private-channel authorization, revocation, bounded subscriptions, payload minimization, cleanup, and
measured connection/message limits before adding Realtime.

## 13. Reliability, migration and recovery

- migrations and grants/policies are reviewed together and committed in order;
- every table migration enables RLS and applies explicit grants/policies immediately; security is not
  deferred to a final catch-all migration;
- a clean local reset must rebuild the complete schema and deterministic seed;
- applied migrations are never edited as a shortcut;
- destructive migration paths require expand/migrate/contract and separate approval;
- export with `pg_dump` and restore to a clean local PostgreSQL/Supabase stack;
- record restore duration and failures;
- define production RPO/RTO before a hosted launch decision;
- write commands so retries do not duplicate membership, enrolment or progress;
- future external side effects use an outbox/job boundary rather than “database write then hope.”
- seed data contains platform-owned catalogue rows only; end-to-end learner accounts are created
  through the real signup flow, avoiding brittle direct writes into Supabase Auth internals.

## 14. Observability plan

The local proof should establish interfaces, not purchase an observability stack:

- structured server logs with timestamp, environment, request ID, route/operation, duration and safe
  error code;
- no tokens, passwords, full email addresses or sensitive bodies in logs;
- counters for auth failures, authorization denials, enrolment/progress mutations and server errors;
- database query duration/slow-query evidence during load checks;
- future production metrics: request rate, p50/p95/p99 latency, error rate, connection/pool usage,
  database size, cache/queue lag, backup age and restore evidence;
- alerts and SLOs become numeric before a hosted pilot.

## 15. Verification plan

### Static/repository

- format/lint/typecheck/build;
- secret scan completed before credentials exist;
- deterministic frontend baseline test passes without external font/network dependencies;
- server-only import boundary test;
- generated database types match migrations.

### Database

- clean migration reset and deterministic seed;
- primary/foreign key, unique and check tests;
- RLS/grant tests for every principal class;
- attempts to cross user, community and workspace boundaries;
- idempotent duplicate membership/enrolment/completion tests;
- migration/export/restore rehearsal.

### Application

- new signup/session/profile;
- existing login, logout and expired/invalid session;
- public versus private community access;
- join/enrol/complete/reload journey;
- unauthorized direct URL/server-function calls;
- mobile, tablet and desktop browser journey;
- loading/empty/error/degraded states;
- no material console/network errors.

### Performance and scale evidence

- generate the representative dataset in Section 5 without real identities or provider calls;
- record machine/runtime/database settings and dataset size;
- benchmark approved read/write paths, not artificial “hello world” queries;
- capture throughput, p50/p95/p99 latency, error rate and query plans;
- test overload/connection exhaustion behavior at a bounded local level;
- compare results against the numeric targets in Section 5;
- never extrapolate a local result into a “supports millions” production claim.

## 16. Implementation sequence after approval gates

The concrete file-by-file order, migrations, RLS policies, server functions and per-wave gates are in
[PHASE-3-IMPLEMENTATION-PLAN.md](./PHASE-3-IMPLEMENTATION-PLAN.md). The sequence there supersedes this
summary; both must pass the planning gate before Wave 0 starts.

1. Complete the remaining Gate A safety evidence.
2. Run and record the full-history/working-tree secret scan with redaction.
3. Start the local Docker engine and verify the pinned Supabase CLI capability.
4. Add local-only Supabase configuration and lock dependency versions.
5. Write the first schema migration, grants, RLS and tests together.
6. Add deterministic fictional seeds.
7. Add SSR Auth/session adapter and negative tests.
8. Implement profile/community membership vertical behavior.
9. Implement course enrolment/lesson-progress vertical behavior.
10. Connect existing routes through application interfaces with a controlled fixture fallback only
    if the approved migration strategy needs it.
11. Run query/load evidence, export/restore and full browser verification.
12. Review the final diff and update phase evidence.
13. Ask for a separate remote-development approval; do not silently create or link a hosted project.

## 17. Acceptance criteria

Phase 3 proof is accepted only when:

- the approved journey persists across reload and a new authenticated session;
- schema constraints and RLS enforce every stated invariant/boundary;
- clean local setup/reset is reproducible from committed files;
- no privileged secret reaches client code or Git;
- ordinary operations use user-scoped authorization, not blanket bypass;
- required error/loading/empty states work at all three target viewports;
- migrations and logical backup/restore are exercised;
- representative query/load evidence is recorded with honest limits;
- all required checks pass and the final diff is reviewed;
- production provider, budget, region and deployment remain untouched unless separately approved.

## 18. Remaining start blockers

1. The checksum-verified scan completed: the working tree has zero findings, but Git history has 13
   redacted legacy Supabase/JWT findings, including a historical service-key variable. The owning
   account must confirm revocation/rotation before Wave 1. See `docs/SECURITY-SCAN-RESULTS.md`.
2. Docker engine `29.9.2` is now running and Supabase CLI `3.0.0` executes locally. Starting the actual
   local stack remains the final credential-free capability check after the history credential gate.
3. Frontend baseline is now deterministic after removing Google Fonts and limiting local Playwright to
   three workers: 26 passed, 4 intentionally skipped, 0 failed.
4. Production provider/region/backup budget, legal/privacy retention and numeric production RPO/RTO
   are deliberately deferred. They do not block the local proof and do block hosted production.

## 19. Approval record

```text
Historical planning status: REVIEWED on 5 November 2026; later superseded
Historical founder record: prior conditional approval applied only to revision 2 and is superseded
Historical scope version/date: Phase 3 local proof, revision 2 / 5 November 2026
Historical platform boundary: local-only Supabase proof
Historical first vertical slice: full learning persistence journey
Production actions authorized: NONE
Known blockers at supersession: revision-3 review/approval plus account-owner credential confirmation
Required re-review triggers: provider, scope, auth model, tenant boundary, production/remote use,
payments, native files/video/live, or material scale/cost change
```
