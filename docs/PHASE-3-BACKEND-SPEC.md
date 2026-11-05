# The Scenes — Phase 3 Backend Foundation Specification

**Status:** PLANNING — implementation blocked by review and outstanding Gate A safety work  
**Created:** 4 November 2026  
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

### Parameters that must be measured before a hosted/production decision

The proof report must define or propose values for:

- registered accounts and annual growth;
- MAU/DAU and learner-to-creator ratio;
- peak concurrent sessions;
- peak/sustained request rate and read/write mix;
- average communities joined per learner;
- average posts/comments per community and retention;
- courses/modules/lessons per workspace;
- enrolments and progress rows per active learner;
- geographic traffic distribution;
- realtime connection/message needs;
- p50/p95/p99 latency and acceptable error rate;
- recovery-point and recovery-time objectives;
- monthly infrastructure budget at launch and growth stages.

Those values are not invented in this specification. A hosted pilot/load plan requires founder review
after local correctness is proven.

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

## 7. Initial domain model

Detailed rationale and later-phase boundaries are in `docs/DATA-LAYER-RESEARCH.md`.

### Phase 3 tables

| Table | Purpose | Critical constraints |
|---|---|---|
| `profiles` | public-safe application profile linked to Auth | Auth ID primary/foreign key; unique normalized handle |
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
| `audit_events` | privileged/security-relevant history | append-only; actor/action/target/correlation |

### Data conventions

- database-generated UUIDs;
- `timestamptz` in UTC, with IANA timezone only where needed;
- required fields use `NOT NULL`;
- named checks for state/value invariants;
- component children cascade only where lifecycle truly matches;
- durable/audit history is restricted rather than silently cascaded;
- no money tables in Phase 3;
- JSONB only for versioned, validated content metadata—not relationships or permissions.

## 8. Core workflows and invariants

### Authentication/session

- local signup creates an Auth identity and an application profile through an idempotent, tested path;
- server code validates/refreshes the session using the official SSR pattern;
- logout revokes/clears the session cookie;
- no role/tenant authority comes from editable profile metadata;
- local email tooling only; no claim of production email delivery.

### Community membership

- public metadata is readable according to publication policy;
- private content requires active membership;
- a public join command is idempotent;
- banned/paused membership is not treated as active;
- a learner cannot assign their own elevated role;
- membership role changes are outside the learner proof except deterministic seed/setup.

### Enrolment

- enrolment requires an authenticated user and a published/accessible course;
- repeated enrolment returns the existing row rather than duplicating it;
- the client cannot enrol another user by submitting a user ID;
- paid-course entitlement is not implemented while payments are held; proof courses are free/included
  fixture equivalents.

### Lesson completion

- completion requires the user's active enrolment;
- the lesson must belong to the enrolled course;
- repeated completion is idempotent;
- server/database sets authoritative timestamps;
- progress cannot be written for another learner;
- derived course percentage is calculated/reconciled from lesson progress, not trusted from a client.

## 9. Server/API contract direction

Exact TypeScript/Zod schemas must be written before each endpoint/server function. The first contract
set is:

| Operation | Input | Output | Important failures |
|---|---|---|---|
| `getSessionProfile` | session only | public-safe profile + scoped capabilities | unauthenticated, profile missing |
| `updateOwnProfile` | allowed profile fields | updated public-safe profile | invalid handle, duplicate handle, forbidden field |
| `listCommunities` | cursor, category, visibility-safe filters | bounded page + next cursor | invalid cursor/filter |
| `joinCommunity` | community ID/slug | membership and whether it was newly created | unauthenticated, private/invite required, blocked |
| `getCourse` | course ID/slug | accessible course/module/lesson outline | not found or not authorized without resource leak |
| `enrolInCourse` | course ID | existing/new enrolment | inaccessible/unpublished course |
| `completeLesson` | enrolment ID + lesson ID | authoritative lesson/course progress | wrong learner, wrong course, no enrolment |
| `getMyLearning` | cursor/status | bounded enrolment/progress projection | unauthenticated, invalid cursor |

Contract rules:

- never accept authoritative `user_id`, role, workspace, price or ownership from the client;
- use stable machine error codes with safe human messages;
- do not reveal whether a private resource exists when the caller lacks access;
- cursor pagination for potentially growing lists;
- request IDs in logs and safe error responses;
- mutations are idempotent by natural unique key or explicit idempotency key;
- no stack traces, SQL text, tokens or sensitive row data in user-facing errors.

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

## 12. Realtime plan

Realtime is not required to prove persistence. Add it only after normal requests and RLS pass.

Potential proof use: notify the same learner session that lesson progress changed. If tested:

- private channels only;
- authorized topic naming that cannot be switched to another user/community;
- bounded subscriptions and cleanup on navigation/logout;
- no broadcast of full private records when a small invalidation event is enough;
- test revoked membership/session behavior;
- measure connection/message use rather than assuming the free tier is capacity.

## 13. Reliability, migration and recovery

- migrations and grants/policies are reviewed together and committed in order;
- a clean local reset must rebuild the complete schema and deterministic seed;
- applied migrations are never edited as a shortcut;
- destructive migration paths require expand/migrate/contract and separate approval;
- export with `pg_dump` and restore to a clean local PostgreSQL/Supabase stack;
- record restore duration and failures;
- define production RPO/RTO before a hosted launch decision;
- write commands so retries do not duplicate membership, enrolment or progress;
- future external side effects use an outbox/job boundary rather than “database write then hope.”

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

- generate synthetic users, memberships, courses, lessons, enrolments and progress at a documented
  local-test scale;
- record machine/runtime/database settings and dataset size;
- benchmark approved read/write paths, not artificial “hello world” queries;
- capture throughput, p50/p95/p99 latency, error rate and query plans;
- test overload/connection exhaustion behavior at a bounded local level;
- compare results against phase targets set during Review;
- never extrapolate a local result into a “supports millions” production claim.

## 16. Implementation sequence after approval gates

The concrete file-by-file order, migrations, RLS policies, server functions and per-wave gates are in
[PHASE-3-IMPLEMENTATION-PLAN.md](./PHASE-3-IMPLEMENTATION-PLAN.md). The sequence there supersedes this
summary; both must pass the planning gate before Wave 0 starts.

1. Complete/authorize outstanding Gate A security work.
2. Review this specification and fill the measurable proof targets.
3. Inspect local Docker/container and Supabase CLI capability.
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

## 18. Blockers and decisions before implementation

1. Full-history local secret scan is not yet authorized/completed.
2. Expanded security rules/permission/privacy/embed policy is not yet authorized/completed.
3. This specification needs founder review after measurable local proof targets are filled.
4. Local Docker/Supabase CLI capability has not yet been established.
5. Production provider/region/backup budget is deliberately deferred and does not block local
   planning, but it blocks hosted production.

## 19. Approval record

```text
Planning status: DRAFT / PLANNING
Founder approval: NOT YET APPROVED FOR IMPLEMENTATION
Approved platform boundary: local-only Supabase proof
Approved first vertical slice: full learning persistence journey
Production actions authorized: NONE
Known blockers: secret scan; security-rule expansion; measurable proof targets; plan review
Required re-review triggers: provider, scope, auth model, tenant boundary, production/remote use,
payments, native files/video/live, or material scale/cost change
```
