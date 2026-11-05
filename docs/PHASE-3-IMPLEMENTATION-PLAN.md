# The Scenes — Phase 3 Implementation Plan (Revision 2 — Historical)

> **Superseded for implementation:** This plan omitted material product, schema, RLS, fixture-mode,
> framework-file, verification, local-isolation, and recovery decisions. Use
> `PHASE-3-IMPLEMENTATION-PLAN-R3.md` only after revision 3 is reviewed and approved. This file remains
> historical evidence and does not authorize a wave.

**Status:** SUPERSEDED — NOT IMPLEMENTATION AUTHORITY
**Created:** 5 November 2026  
**Technical/security review:** 5 November 2026
**Parent specification:** [PHASE-3-BACKEND-SPEC.md](./PHASE-3-BACKEND-SPEC.md)  
**Mandatory gate:** [PHASE-PLANNING-GATE.md](./PHASE-PLANNING-GATE.md)  
**Platform boundary:** local-only Supabase proof. No hosted project, no credentials, no production use.

## 0. How to read this document

This plan converts the approved specification into a concrete build order: exact files, what each
contains, and which gate must pass before the next file is written.

Rules:

1. This is a plan, not an implementation. Exact SQL and TypeScript are written during the waves below,
   one file at a time, after the applicable gate passes.
2. No wave starts before the previous wave's gate passes.
3. Any change to provider, scope, auth model, tenant boundary, or cost returns to Review.
4. Nothing here authorizes a hosted Supabase project, deployment, payments, real email, or native
   media.
5. "Supports millions" means the design leaves a path to millions of registered accounts and proves
   staged, measured capacity. It never means a promise of issue-free scale.

## 1. Verified ground truth (inspected, not assumed)

Evidence was gathered from the working tree on 5 November 2026.

| Area | Current reality | Consequence for this plan |
|---|---|---|
| Framework | TanStack Start `1.168.27`, React 19, Vite 8, Tailwind 4 | Use the native `createServerFn` / `createStart` APIs, no new framework |
| Server functions | `createServerFn`, `createMiddleware`, `createStart` all exported by the installed package | No extra server framework needed |
| Cookie/request helpers | `getCookie`, `setCookie`, `deleteCookie`, `getRequest`, `getRequestHeader`, `setResponseHeader`, `setResponseStatus` exported from `@tanstack/react-start/server` | SSR session cookies are supported natively |
| Start instance | **Absent.** `src/routeTree.gen.ts` still imports the bare `createStart` type, which confirms no start file is registered | Create `src/start.ts`; explicitly include CSRF because a custom Start instance disables the automatic fallback |
| Server entry | `src/server.ts` — 5 lines, bare `createStartHandler` | Keep it unchanged; global middleware belongs in `src/start.ts` |
| Server-only boundary | `vite.config.ts` `importProtection.client.files = ["**/server/**"]` | Provider code under `src/server/**` is already blocked from the client bundle |
| Path alias | `@/*` → `./src/*` (`tsconfig.json`, `vite.config.ts`) | Keep the alias; no alias changes |
| Validation library | `zod` **already installed** | No new validation dependency |
| Database packages | **None.** No `@supabase/*`, `pg`, Drizzle, Prisma, or Kysely anywhere | Add only what the proof needs |
| Session state | `src/store/app-store.tsx` — in-memory React reducer; resets on reload | Must be split into UI-only state plus server reads |
| Login | `src/routes/login.tsx` calls `signInDemo(email)` after a 500 ms timer | Replaced by a real server call |
| Register | `src/routes/register.tsx` calls `signInDemo(values.email)` | Replaced by signup + profile creation |
| Join/leave | `src/store/app-store.tsx` (`joinCommunity`/`leaveCommunity`) called from `cards.tsx`, `communities/$communityId.tsx`, `community-shell.tsx` | Replaced by one idempotent server command |
| Enrol | `classroom/$courseId.tsx` → `enroll(course.id)` | Replaced by server command |
| Lesson complete | `classroom/$courseId/$lessonId.tsx` → `completeLesson(lesson.id)` | Replaced by server command with idempotency |
| Progress display | `my-learning.tsx` derives progress from client arrays | Replaced by server-derived progress |
| Local tooling | Docker `29.9.2`, Docker Compose `v5.6.1`, Bun `1.4.4`, Node `26.12.1` present. Docker Desktop engine was **not running** during review. `supabase` CLI and `psql` are not on PATH | Start/verify Docker; pin CLI as a dev dependency; run it with `bunx`; run `psql` inside the DB container |
| Playwright | 3 viewports (1440×900, 768×1024, 390×844), `waitForApp` hydration gate | Extend existing suites, do not replace them |
| Baseline verification | Lint, typecheck and build pass. Parallel browser run produced external-font connection errors/timeouts | Remove Google Fonts as a runtime dependency and require a deterministic green baseline before backend wiring |

## 2. Dependencies to add

| Package | Type | Why it is required | Rejected alternative |
|---|---|---|---|
| `@supabase/supabase-js@2.119.0` | runtime | Official client used server-side with the user's session | Hand-rolled PostgREST calls (fragile, unsupported) |
| `@supabase/ssr@0.12.7` | runtime | Current `getAll`/`setAll` cookie contract for SSR | `auth-helpers` (superseded), manual cookie forging (insecure) |
| `supabase@3.0.0` | dev | Local stack, migrations, generated types, pgTAP runner | Global install (unpinned, machine-dependent) |

Versions above were checked against the official npm registry on 5 November 2026. The packages are
official Supabase packages, MIT licensed, publish npm provenance attestations, and support the current
Node runtime. They are installed exactly and locked by `bun.lock`.

Explicitly **not** added: any ORM/query builder, `pg`, Vitest, a second validation library, an HTTP
client, a logging framework, or a state-management library. Bun's test runner covers TypeScript unit
contracts; Supabase/pgTAP covers database behavior; Playwright covers the user journey.

## 3. Repository layout after this plan

```text
supabase/
  config.toml                     local-only project config (no hosted ref)
  migrations/                     forward-only, ordered, never edited after apply
  tests/database/                 pgTAP: constraints, invariants, RLS allow/deny
  seed.sql                        deterministic platform-owned catalogue fixtures
src/
  start.ts                        NEW  start instance + CSRF/request-id middleware
  server.ts                       unchanged handler wiring
  features/
    auth/*.schemas.ts             shared, client-safe Zod inputs/results
    auth/*.functions.ts           createServerFn RPC wrappers safe for route imports
    community/*.schemas.ts
    community/*.functions.ts
    learning/*.schemas.ts
    learning/*.functions.ts
  server/                         server-only; blocked from the client bundle
    env.ts
    supabase/server-client.ts
    supabase/auth.ts
    http/errors.ts
    http/request-context.ts
    http/logger.ts
    middleware/request-id.ts
    middleware/auth.ts
    db/database.types.ts          generated, committed
    repositories/*.ts
    services/*.ts
  routes/**                       modified to call server functions
  store/app-store.tsx             reduced to UI-only state
e2e/
  learning-flow.spec.ts           NEW  the approved journey
  auth-flow.spec.ts               NEW  signup/login/logout/expiry
scripts/
  phase3-load.ts                  bounded local HTTP load/evidence script (Bun; no new dependency)
```

Routes import only `*.functions.ts` wrappers. Provider/database modules stay under `src/server/**`.
There is no automatic fallback from a failed backend call to fixture data: data mode is explicit and a
backend error must remain visible rather than silently showing false fixture success.

## 4. Database layer (file by file)

Migration files use CLI-generated timestamp prefixes, are forward-only, and are never edited after
they are applied. Each table migration carries its constraints, indexes, RLS, grants and matching
pgTAP file so no table exists in an exposed schema while waiting for a later security migration.

Conventions applied throughout:

- `uuid` primary keys, database-generated (`gen_random_uuid()`);
- `timestamptz` in UTC; `created_at` / `updated_at` with a shared `set_updated_at()` trigger;
- constrained values use `text` + named `CHECK` constraints instead of `enum` types (additive change
  instead of a type migration);
- slugs/handles stored lowercase with a `CHECK` pinning lowercase and a unique index;
- no money tables and no money columns in Phase 3; course access is expressed as
  `access in ('included','restricted')`;
- `JSONB` only for versioned content (lesson body), never for relationships or permissions;
- functions are `SECURITY INVOKER` by default; only reviewed membership helpers and atomic commands
  use `SECURITY DEFINER`, `SET search_path = ''`, schema-qualified objects and explicit caller checks;
- every function's default `PUBLIC` execute privilege is revoked before narrow grants are added;
- ordinary user commands never accept a user ID, role, status, timestamp, tenant owner or progress
  percentage from the caller.

### 4.1 `supabase/config.toml`

Local-only configuration generated by `bunx supabase init`: project name, non-conflicting port map,
`[auth]` email/password enabled with confirmation disabled only for local tests, bounded password
policy, `[db]` `major_version` pinned, and `[db.seed]` pointing to `./seed.sql`. It contains no hosted
project ref or secret and is committed. CLI telemetry is disabled for the proof via the documented
environment/CLI setting; the repository is never linked with `supabase link`.

### 4.2 `supabase/migrations/<timestamp>_security_foundation.sql`

- create the unexposed `private` schema for authorization helpers/audit data;
- `private.set_updated_at()` trigger function (`SECURITY INVOKER`);
- revoke automatic table/sequence/function privileges for future public objects from `anon` and
  `authenticated`, and revoke global default function execute from `PUBLIC`;
- revoke `USAGE` on `private` by default and grant only the narrow helper execution needed by policies;
- do **not** install pgTAP in the application migration history; the database test bootstrap verifies
  the local test extension.

### 4.3 `supabase/migrations/<timestamp>_profiles.sql`

| Column | Type / constraint |
|---|---|
| `id` | `uuid` PK, `references auth.users(id) on delete cascade` |
| `handle` | `text not null`, unique, lowercase-only, `^[a-z0-9][a-z0-9_-]{2,29}$` |
| `display_name` | `text not null`, length 2–80 |
| `headline` | `text`, ≤ 140 |
| `bio` | `text`, ≤ 2000 |
| `location` | `text`, ≤ 80 |
| `avatar_url` | `text`, must match `^https://` when present |
| `status` | `text not null default 'active'`, in `('active','suspended','deleted')` |
| timestamps | database-set `created_at`, `updated_at` |

Also in this file:

- `on_auth_user_created` trigger: idempotent profile bootstrap using validated non-authoritative Auth
  signup metadata; malformed/missing handle/display name fails signup rather than granting a partial
  account;
- table-level grants are revoked; `anon`/`authenticated` may select only the deliberate public columns,
  while `authenticated` may update only `display_name`, `headline`, `bio`, `location`, `avatar_url`;
- RLS permits public-column reads of active profiles and own-row reads, plus own-row updates; no client
  insert/delete, handle/status/ID update, email field, role field or wildcard `select *` contract;
- application/repository queries always name columns explicitly;
- pgTAP: handle uniqueness/case, metadata validation, column grants, forbidden ID/handle/status update,
  suspended-row visibility, own update, and cross-user denial.

### 4.4 `supabase/migrations/<timestamp>_workspaces.sql`

`workspaces`: `id`, `kind` in `('creator','platform')`, `name`, unique lowercase `slug`, `status` in
`('active','archived')`, `created_by` → `profiles(id)`.

`workspace_memberships`: `id`, `workspace_id`, `user_id`, `role` in
`('owner','admin','editor','viewer')`, `status` in `('active','invited','paused','removed')`,
unique `(workspace_id, user_id)`, plus a partial unique index enforcing **at most one** active owner per
workspace. Phase 3 creates no workspace/role mutation endpoint; a later creator-phase transaction must
enforce the separate “at least one owner” lifecycle invariant before role changes are enabled.

RLS: active scoped members may read their workspace/membership; catalogue policies use a reviewed
`private.is_workspace_member()` definer helper to avoid recursive policies. All direct writes and role
changes are revoked in Phase 3. Index `(user_id, status, workspace_id)` supports “my workspaces” and
policy predicates. Tests prove the helper cannot enumerate another user's memberships.

### 4.5 `supabase/migrations/<timestamp>_communities.sql`

- `categories`: `id`, unique lowercase `slug`, `name`, `blurb`, `sort_order`, `status` in
  `('active','hidden')` — public read when active;
- `communities`: `id`, `workspace_id`, unique lowercase `slug`, `name`, `tagline`, `description`,
  `privacy` in `('public','private')`, `join_policy` in `('open','invite')`, `status` in
  `('draft','published','archived')`, `accent_hue`, `languages text[]`, `published_at`; check
  `privacy = 'public' or join_policy = 'invite'`;
- `community_categories`: PK `(community_id, category_id)`, partial unique index allowing at most one
  `is_primary` per community;
- `community_memberships`: `id`, `community_id`, `user_id`, `role` in
  `('member','moderator','manager')`, `status` in `('active','invited','paused','banned','left')`,
  `joined_at`, unique `(community_id, user_id)`;
- `private.is_community_member(uuid, text[])` helper returning whether the caller has an active
  membership with an allowed role.

RLS summary: published public communities are readable by everyone (including anonymous);
private/draft rows are readable only by active members or workspace managers. Direct membership and
community writes are revoked. `public.join_community`/`leave_community` commands (Section 4.9) are the
only learner write path; they derive the caller, permit only public/open joins, preserve banned/paused
states, and cannot assign an elevated role.

Indexes: unique `communities(slug)`; `(privacy, status, published_at desc)` for discovery;
`community_memberships(user_id, status, community_id)`.

### 4.6 `supabase/migrations/<timestamp>_curriculum.sql`

- `courses`: `id`, `workspace_id`, nullable `community_id`, unique `(workspace_id, slug)`,
  `level` in `('beginner','intermediate','advanced')`, `access` in `('included','restricted')`,
  `status` in `('draft','published','archived')`, `instructor_id`, nullable `category_id`,
  `published_at`;
- `course_modules`: unique `(course_id, position)` with `position >= 1`;
- `lessons`: `id`, `module_id`, **denormalized `course_id`** maintained by a
  `lessons_sync_course()` trigger, unique `(module_id, position)`, and `unique (id, course_id)`
  so a composite foreign key can enforce the lesson/course invariant;
- `lessons.body_version` as a constrained positive small integer and `lessons.body` as
  `jsonb not null default '[]'` with `jsonb_typeof(body) = 'array'`; application Zod supports only the
  reviewed versioned block shapes and no raw HTML block;
- `lesson_resources`: `lesson_id`, `label`, `kind` in `('link','pdf','sheet','repo')`, `url` with a
  `^https://` check (external-link-only model per ADR-029), unique `(lesson_id, position)`;
- `private.can_manage_course(uuid)` helper.

RLS: a published course/module/lesson/resource is public only when it is unscoped or belongs to a
published **public** community. Published content in a private community requires active membership;
draft/archived content requires scoped workspace access. `restricted` courses are not enrolable in
Phase 3. All direct curriculum writes are revoked.

Resource URLs are additionally validated in TypeScript with `new URL`: `https:` only, no credentials
or control characters, ≤ 2,048 characters, canonicalized, and no token/signed-secret query material.
The server does not fetch user URLs in this phase.

### 4.7 `supabase/migrations/<timestamp>_learning.sql`

- `course_enrollments`: `id`, `course_id`, `user_id`, `status` in
  `('active','completed','cancelled')`, `source` in `('self','invite','seed')`, `enrolled_at`,
  `completed_at`, unique `(course_id, user_id)`, `unique (id, course_id)`,
  check `completed_at is null or status = 'completed'`;
- `lesson_progress`: `id`, `enrollment_id`, `lesson_id`, `course_id`, `status` in
  `('in_progress','completed')`, `completed_at`, unique `(enrollment_id, lesson_id)`, plus two
  composite foreign keys:
  - `(enrollment_id, course_id) → course_enrollments(id, course_id)`
  - `(lesson_id, course_id) → lessons(id, course_id)`

  Together these make it **structurally impossible** to record progress for a lesson that does not
  belong to the enrolled course — enforced by the database, not by application code;
- `private.has_active_enrollment(uuid)` helper.

RLS: users may read only their own enrolments/progress (progress ownership is derived by joining its
enrolment). Direct insert/update/delete grants are revoked; the commands in Section 4.9 are the only
learner mutation path. No policy refers to a nonexistent `lesson_progress.user_id`, and timestamps are
database authoritative.

Indexes: `course_enrollments(user_id, status, updated_at desc)`; `lesson_progress(enrollment_id)`;
`(course_id)` where needed for aggregate reconciliation.

### 4.8 `supabase/migrations/<timestamp>_audit.sql`

Append-only `private.audit_events`: `id`, `actor_id` (nullable), `action`, `target_type`, `target_id`,
`request_id`, bounded `metadata jsonb`, `created_at`. `anon` and `authenticated` receive no schema/table
privileges. Only the controlled command functions below insert rows. No update/delete path exists.

### 4.9 `supabase/migrations/<timestamp>_learner_commands.sql`

Expose four purpose-built functions in `public`: `join_community`, `leave_community`,
`enrol_in_course`, and `complete_lesson`. Each function:

- is `SECURITY DEFINER` only because it performs an atomic caller-bound command while direct table
  writes are closed;
- sets `search_path = ''`, schema-qualifies every object, rejects null `auth.uid()`, accepts no user ID,
  role, status, timestamp, price, entitlement, enrolment ID or course percentage;
- locks/reads the target state needed to make retries/concurrent calls idempotent;
- enforces community/course visibility and current membership/enrolment status without leaking private
  existence;
- writes the domain row and one audit row in the same transaction, with database timestamps;
- has default execute revoked from `PUBLIC`, `anon`, and `authenticated`, then explicitly grants only
  the reviewed signature to `authenticated`;
- returns only the bounded public result needed by the service.

pgTAP calls each RPC directly as anonymous, owner, stranger, paused/banned member and valid learner;
concurrent/retry integration tests prove unique constraints and command logic prevent duplicates.

### 4.10 `supabase/tests/database/*.sql`

pgTAP files, one per table/command: grants, column privileges, constraint tests, invariant tests
(at-most-one active owner, primary category, lesson-belongs-to-course), function execution privileges,
and a **deny matrix** for anonymous, signed-in stranger, active member, paused/banned member and scoped
manager. A first bootstrap test verifies pgTAP in the local test database. Run with
`bunx supabase test db`.

### 4.11 `supabase/seed.sql`

Deterministic fictional **platform catalogue** only: a platform workspace, categories, public/private
communities, courses/modules/lessons and safe external `https://` resources. It contains no Auth users,
emails, real names, memberships, enrolments, progress, copied third-party content or secrets. E2E
learner accounts are created through the real signup flow, avoiding direct coupling to Supabase Auth's
internal seed schema. Larger synthetic load data is generated separately and never committed as a dump.

## 5. Server layer (file by file)

| File | Contains | Rule it satisfies |
|---|---|---|
| `src/start.ts` | `createStart(...)` with `createCsrfMiddleware({ filter: serverFn })` plus `requestIdMiddleware` as global request middleware | Preserve same-origin protection and per-request correlation |
| `src/server/env.ts` | Zod-validates `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; URL must be local HTTP (`127.0.0.1`/`localhost`); it has no service/secret-key variable | No silent env invention or accidental hosted target |
| `src/server/supabase/server-client.ts` | Request-scoped client using current `getCookies()` + `cookies.getAll/setAll`; applies every returned cookie and cache header; no privileged client | Correct SSR refresh/caching and user-scoped RLS |
| `src/server/supabase/auth.ts` | `getVerifiedClaims()`, `requireUser()`, `signOutCurrentSession()`; identity is verified with `auth.getClaims()`, never authorized from `getSession()` | One trusted authentication decision |
| `src/server/http/errors.ts` | Internal `AppError` plus a serializable `{ ok, data/error }` result mapper with stable codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`) | No class-serialization assumption or provider detail leak |
| `src/server/http/request-context.ts` | Request id, correlation, per-request logger bound to the id | Structured logging |
| `src/server/http/logger.ts` | Structured JSON logs; redaction of emails, tokens and bodies | Privacy-safe observability |
| `src/server/middleware/request-id.ts` | Generates/accepts `x-request-id`, sets the response header | Traceability |
| `src/server/middleware/auth.ts` | `createMiddleware({ type: 'function' })` injecting `{ supabase, user }`; every private server function attaches it even when its route has `beforeLoad` | Endpoint authentication boundary |
| `src/server/db/database.types.ts` | Generated from the local database and committed | Schema/types cannot drift |
| `src/server/repositories/*.ts` | Thin data access (`profiles`, `communities`, `courses`, `learning`) — the only files that touch Supabase tables | Provider code stays in one layer |
| `src/server/services/*.ts` | Use-case authorization and invariants (`profile-service`, `community-service`, `course-service`, `learning-service`) | UI never holds authority |
| `src/features/*/*.schemas.ts` | Client-safe bounded Zod inputs and serializable result DTOs; no provider types | One explicit contract |
| `src/features/*/*.functions.ts` | Route-importable `createServerFn` wrappers; handlers call server-only services | Validated RPC boundary without importing blocked provider modules into UI |

## 6. Server function contracts

Every mutation uses `createServerFn({ method: 'POST' })`; reads use `GET` only when side-effect free.
Each uses a bounded Zod `validator`, the function-type auth middleware where required, `no-store` for
private/session results, and the serializable result envelope. Route guards are UX only.

| File | Export | Input (Zod) | Output | Must fail safely when |
|---|---|---|---|---|
| `features/auth/auth.functions.ts` | `signUpWithPassword` | bounded email, password, handle, displayName | safe profile; session remains only in cookies | invalid/duplicate identity or handle, weak password |
| | `signInWithPassword` | bounded email, password | safe profile; session remains only in cookies | bad credentials (identical public message either way) |
| | `signOutCurrentSession` | — | ok + cleared cookies | invalid/expired session remains signed out |
| | `getSessionProfile` | — | profile + capabilities or `null` | expired/invalid session |
| `features/auth/profile.functions.ts` | `updateOwnProfile` | displayName, headline, bio, location, avatarUrl | updated public profile | invalid field or forbidden immutable-field attempt |
| `features/community/community.functions.ts` | `listCommunities` | opaque cursor, category, visibility-safe filters, limit ≤ 50 | bounded page + next cursor | invalid cursor/filter |
| | `getCommunityDetail` | slug | community + membership state | not found or not visible (no existence leak) |
| | `joinCommunity` | slug or id | membership + `created: boolean` | unauthenticated, invite-only, banned |
| | `leaveCommunity` | slug or id | left state | not a member |
| `features/learning/course.functions.ts` | `getCourseOutline` | community slug + course slug | accessible outline + enrolment state | not found / not authorized |
| | `enrolInCourse` | course id | enrolment + `created: boolean` | inaccessible/unpublished |
| `features/learning/learning.functions.ts` | `completeLesson` | lesson id | authoritative lesson + course progress | no own active enrolment or inaccessible lesson |
| | `getMyLearning` | cursor, status | bounded enrolment/progress projection | unauthenticated, invalid cursor |

Contract rules: authoritative `user_id`, role, workspace, price and ownership are **never** accepted
from the client; mutations are idempotent by natural unique key; all lists are cursor-paginated and
bounded; private resources never reveal existence to unauthorized callers; auth functions never
return an access token, refresh token, raw provider session or password field.

## 7. Client integration (existing files to modify)

| File | Change |
|---|---|
| `src/routes/login.tsx` | Replace `signInDemo` with `signInWithPassword`; real pending/error states; remove fake/demo success and use accounts created through signup |
| `src/routes/register.tsx` | Replace `signInDemo` with `signUpWithPassword`; surface duplicate-email/handle errors; hand off to onboarding |
| `src/routes/forgot-password.tsx` | Keep local-only, but state honestly that reset email is **not sent** in the proof; never show a fake "email sent" success |
| `src/routes/onboarding.tsx` | Join recommended communities through `joinCommunity` instead of the synchronous local `joinCommunity` |
| `src/routes/settings.tsx` | Read profile via `getSessionProfile`; save via `updateOwnProfile`; sign out via `signOutCurrentSession` |
| `src/components/domain/cards.tsx` | Join/leave through server functions with optimistic UI and rollback on failure |
| `src/routes/communities/$communityId.tsx` | Same join/leave change |
| `src/components/layout/community-shell.tsx` | Same join/leave change; sign out via server function |
| `src/routes/c/$communityId/classroom/$courseId.tsx` | Loader reads outline + enrolment from the server; `enrolInCourse` replaces local `enroll` |
| `src/routes/c/$communityId/classroom/$courseId/$lessonId.tsx` | Loader reads the signed-in user's progress; `completeLesson` replaces local completion; derived percentage comes from the server |
| `src/routes/my-learning.tsx` | Replace client-derived progress with `getMyLearning`; keep non-slice tabs (saved resources, events) on fixtures with an explicit "not connected yet" label |
| `src/store/app-store.tsx` | Reduce to UI-only state (toasts, filters, ephemeral drafts). Remove `signInDemo`, `joinCommunity`, `leaveCommunity`, `enroll`, `completeLesson` mutations. Add a header comment listing what remains fixture-only |

Auth/private routes add `beforeLoad`/loader UX guards backed by `getSessionProfile`, but every private
server function independently attaches auth middleware. `VITE_DATA_MODE` is validated as either
`fixtures` or `supabase-local`; no error-triggered fallback is allowed.

UI visibility is never treated as authorization: every command re-checks on the server, and every
table re-checks in RLS.

## 8. Test layer

| File | Purpose |
|---|---|
| `supabase/tests/database/*.sql` | Grants, constraints, definer-function direct calls, invariants, and the RLS deny matrix per table/command |
| `src/features/**/*.test.ts` | Bun unit tests for Zod bounds, cursor codec, URL policy and error mapping |
| `e2e/auth-flow.spec.ts` | New signup, existing login, logout, expired/invalid session, duplicate-email error |
| `e2e/learning-flow.spec.ts` | Create account → join → enrol → complete → **reload and new login** → progress persists; second-account direct-call/URL isolation checks |
| `e2e/route-contract.spec.ts` (existing) | Still must pass; private data must not appear for anonymous visitors |
| `e2e/visual-contract.spec.ts` (existing) | Unchanged |
| `e2e/helpers.ts` | Add unique local signup/login helpers; never use a service key or direct Auth-database insert |

Security tests also cover forged/expired cookie behavior, CSRF rejection for cross-site server-function
requests, `Cache-Control: no-store`, direct Data API/RPC calls, column grants, and absence of tokens or
secret keys in browser bundles/log captures.

## 9. Build order in waves (each wave gated)

| Wave | Deliverable | Gate command | Rollback |
|---|---|---|---|
| 0 | Expanded security policy; checksum-verified full-history/working-tree secret scan; external-font baseline fixed; exact dependencies; `.env.example`; local config; Docker/stack capability | redacted scan report; deterministic existing Playwright suite; `bunx supabase start`; local-only URL check | Remove only newly added local config/dependencies if the stack gate fails; fixture app remains usable |
| 1 | Timestamped security/schema/command migrations + pgTAP + catalogue seed | `bunx supabase db reset` and `bunx supabase test db` green; direct Data API/RPC deny tests | Reset disposable local DB; no remote migration exists |
| 2 | Env, SSR client, result mapping, logging, auth/function middleware, CSRF/request ID, generated types | Bun unit tests; typecheck; lint; build; server-only import and CSRF/cache tests | Remove only Wave 2 wiring; fixture data mode remains explicit |
| 3 | Auth/profile functions + login/register/settings/onboarding wiring | `auth-flow.spec.ts` green on all 3 viewports, including invalid/expired/cross-site cases | Set explicit fixture mode and revert only Wave 3 route calls |
| 4 | Community + enrolment + lesson-progress functions and route wiring | `learning-flow.spec.ts` and existing regression suites green on all 3 viewports; second-account isolation passes | Set explicit fixture mode and revert only affected route calls |
| 5 | Representative data/query/load evidence; dump/restore rehearsal; unresolved-functionality register | Section 5 numeric targets, `EXPLAIN (ANALYZE, BUFFERS)`, restore reconciliation, full quality suite | Delete disposable synthetic/restore DB data and evidence containing local identifiers; code remains unchanged |

Each wave ends with `bun test`, `bun run typecheck`, `bun run lint`, `bun run build`,
`git diff --check`, and a changed-path review before the next wave starts. Database waves additionally
run reset + pgTAP. Evidence is stored under `docs/evidence/phase-3/` without credentials, dumps, or
personal data.

## 10. Local operations

```bash
# local stack (requires a running Docker engine)
bunx supabase start
bunx supabase db reset                 # rebuild schema + seed from committed files
bunx supabase test db                  # pgTAP grants/constraints/RLS/RPC deny matrix
bunx supabase gen types typescript --local > src/server/db/database.types.ts

# application
bun run typecheck
bun run lint
bun run build
bun run dev                       # http://127.0.0.1:5000
bunx playwright test
```

`.env.example` documents only `VITE_DATA_MODE`, the local Supabase URL, and the Supabase
**publishable** key placeholder. `.env.local` is ignored and receives the actual local URL/publishable
key printed by `bunx supabase start`. No secret/service-role key variable exists in application code.
`env.ts` fails closed for a hosted/non-loopback URL or missing values.

## 11. Migration, backup, portability

- clean `bunx supabase db reset` must reproduce schema **and** seed deterministically;
- run `pg_dump`/`pg_restore` inside the local DB container into an ignored temporary path, restore into
  a separate clean local database, and reconcile schema, row counts and critical constraints; record
  duration and failures, then delete the dump;
- no migration is edited after it is applied; destructive changes use expand → migrate → contract
  with separate approval;
- UUID keys, `timestamptz`, tenant keys and standard SQL keep the data portable off Supabase if a
  later provider decision changes.

## 12. Explicitly not in this plan

Payments, payouts, orders, webhooks, real email delivery, native file/video/live hosting, R2 creator
quotas, referrals and entitlement ledger, marketplace delivery, private messaging, moderation
automation, admin impersonation, AI features, semantic search, realtime, multi-region writes,
partitioning, microservices, and migration of any real user data.

## 13. Still fixture-only after this slice (unresolved-functionality register)

These remain local/session state and must be labelled as such in the UI, and recorded in a new
`docs/UNRESOLVED-FUNCTIONALITY.md` during Wave 5:

- saved marketplace products and purchases;
- event RSVPs and calendar state;
- posts, comments, likes and community feeds;
- notifications read/unread;
- creator dashboard analytics, reviews, earnings and referral states;
- admin workspace surfaces;
- search results and discovery ranking;
- creator-follow state.

## 14. Remaining Wave 0 evidence

1. **BLOCKER:** account owner confirms revocation/rotation of the historical hosted Supabase
   credentials identified in `docs/SECURITY-SCAN-RESULTS.md`. The checksum-verified scan itself is
   complete (13 redacted history findings; 0 working-tree findings).
2. After that confirmation, start/stop the actual local Supabase stack with the reviewed local-only
   config. Docker engine `29.9.2` is running and exact CLI `3.0.0` capability is verified.
3. The frontend gate is complete: Google Fonts was removed, local workers are bounded to three, and
   Playwright passed with 26 passed / 4 intentionally skipped / 0 failed.

Security-rule expansion, numeric proof targets, technical review and founder approval are complete in
the revision-2 planning artifacts. GitHub secret-scanning/push-protection settings remain a separate
remote action and do not block this local proof.

## 15. Approval record

```text
Historical planning status: REVIEWED on 5 November 2026; later superseded
Historical founder record: prior conditional approval applied only to revision 2 and is superseded
Historical scope version/date: Phase 3 local proof, revision 2 / 5 November 2026
Historical platform boundary: local-only Supabase proof
Historical first vertical slice: signup/login -> profile -> join -> enrol -> complete -> persisted reload
Production/remote actions authorized: NONE
Known blockers at supersession: revision-3 review/approval plus account-owner credential confirmation
Required re-review triggers: provider, scope, auth model, tenant boundary, remote/hosted use,
payments, native files/video/live, material scale or cost change
```
