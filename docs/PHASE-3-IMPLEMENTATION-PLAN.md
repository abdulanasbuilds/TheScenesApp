# The Scenes — Phase 3 Implementation Plan (File by File)

**Status:** PLANNING — **no code, migration, dependency, or configuration has been written for this plan**  
**Created:** 5 November 2026  
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
| Start instance | **Absent.** `src/routeTree.gen.ts` still imports the bare `createStart` type, which confirms no start file is registered | Create `src/start.ts`; the generator picks it up |
| Server entry | `src/server.ts` — 5 lines, bare `createStartHandler` | Extended by middleware registration, not rewritten |
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
| Local tooling | Docker `29.9.2`, Docker Compose `v5.6.1`, Bun `1.4.4`, Node `26.12.1` present. `supabase` CLI and `psql` **not** on PATH | CLI added as a dev dependency; `psql` runs inside the DB container |
| Playwright | 3 viewports (1440×900, 768×1024, 390×844), `waitForApp` hydration gate | Extend existing suites, do not replace them |

## 2. Dependencies to add

| Package | Type | Why it is required | Rejected alternative |
|---|---|---|---|
| `@supabase/supabase-js` | runtime | Official client used server-side with the user's session | Hand-rolled PostgREST calls (fragile, unsupported) |
| `@supabase/ssr` | runtime | Cookie-based session read/write for SSR | `auth-helpers` (superseded), manual cookie forging (insecure) |
| `supabase` | dev | Local stack, migrations, generated types, pgTAP runner | Global install (unpinned, machine-dependent) |

Explicitly **not** added: any ORM/query builder, `pg`, a second validation library, an HTTP client, a
logging framework, or a state-management library. Rationale: Supabase's generated types plus
server-side Zod validation keep one source of truth in PostgreSQL and avoid vendor/SDK sprawl.

## 3. Repository layout after this plan

```text
supabase/
  config.toml                     local-only project config (no hosted ref)
  migrations/                     forward-only, ordered, never edited after apply
  tests/                          pgTAP: constraints, invariants, RLS allow/deny
  seed/seed.sql                   deterministic fictional fixtures
src/
  start.ts                        NEW  start instance + global request middleware
  server.ts                       (extended) handler wiring
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
    functions/*.ts                createServerFn endpoints
  routes/**                       modified to call server functions
  store/app-store.tsx             reduced to UI-only state
e2e/
  learning-flow.spec.ts           NEW  the approved journey
  auth-flow.spec.ts               NEW  signup/login/logout/expiry
```

## 4. Database layer (file by file)

Migration files are forward-only and never edited after they are applied. Each migration carries its
own tables, constraints, indexes, RLS and the matching pgTAP test file, so schema and policy are
reviewed together.

Conventions applied throughout:

- `uuid` primary keys, database-generated (`gen_random_uuid()`);
- `timestamptz` in UTC; `created_at` / `updated_at` with a shared `set_updated_at()` trigger;
- constrained values use `text` + named `CHECK` constraints instead of `enum` types (additive change
  instead of a type migration);
- slugs/handles stored lowercase with a `CHECK` pinning lowercase and a unique index;
- no money tables and no money columns in Phase 3; course access is expressed as
  `access in ('included','restricted')`;
- `JSONB` only for versioned content (lesson body), never for relationships or permissions;
- every helper function is `SECURITY DEFINER`, `STABLE`, `SET search_path = ''`, and
  schema-qualified to prevent search-path hijacking.

### 4.1 `supabase/config.toml`

Local-only configuration: project name, port map, `[auth]` email/password enabled with confirmation
disabled for local tests, and `[db]` `major_version` pinned. Contains no hosted project ref and no
secrets. Committed.

### 4.2 `supabase/migrations/0001_foundation.sql`

- `create extension if not exists pgtap with schema extensions` (tests only);
- `create schema if not exists app` for helpers;
- `app.set_updated_at()` trigger function;
- `app.current_user_id()` returning `auth.uid()`;
- `create role` / grants are handled in `0008`.

### 4.3 `supabase/migrations/0002_profiles.sql`

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

Also in this file:

- `on_auth_user_created` trigger: idempotent profile bootstrap from the Auth user;
- **`app_public_profiles` view** (`security_invoker = true`): `id, handle, display_name, avatar_url,
  headline` — the only public-safe projection, so `profiles` itself is never broadly readable;
- RLS: `select` own row; `update` own row with `with check` blocking `status` and `id` changes;
  no client `insert` (trigger-owned) and no client `delete`;
- pgTAP: handle uniqueness/case, forbidden self-status change, cross-user read denied.

### 4.4 `supabase/migrations/0003_workspaces.sql`

`workspaces`: `id`, `kind` in `('creator','platform')`, `name`, unique lowercase `slug`, `status` in
`('active','archived')`, `created_by` → `profiles(id)`.

`workspace_memberships`: `id`, `workspace_id`, `user_id`, `role` in
`('owner','admin','editor','viewer')`, `status` in `('active','invited','paused','removed')`,
unique `(workspace_id, user_id)`, plus a partial unique index enforcing exactly one active owner per
workspace.

RLS: members read their own workspace; only `owner`/`admin` write; a user can never change their own
`role` or `status` upward. Index on `(user_id, status, workspace_id)` for "my workspaces" and for the
policy predicate.

### 4.5 `supabase/migrations/0004_communities.sql`

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
- `app.is_community_member(uuid, text[])` helper returning whether the caller has an active
  membership with an allowed role.

RLS summary: published public communities are readable by everyone (including anonymous);
private/draft rows are readable only by active members or workspace managers; a user may insert a
membership row **only** for themselves with `role = 'member'` and an allowed status; only
`manager`/`moderator` may update other members' rows; no client may write a community row.

Indexes: unique `communities(slug)`; `(privacy, status, published_at desc)` for discovery;
`community_memberships(user_id, status, community_id)`.

### 4.6 `supabase/migrations/0005_curriculum.sql`

- `courses`: `id`, `workspace_id`, nullable `community_id`, unique `(workspace_id, slug)`,
  `level` in `('beginner','intermediate','advanced')`, `access` in `('included','restricted')`,
  `status` in `('draft','published','archived')`, `instructor_id`, nullable `category_id`,
  `published_at`;
- `course_modules`: unique `(course_id, position)` with `position >= 1`;
- `lessons`: `id`, `module_id`, **denormalized `course_id`** maintained by a
  `lessons_sync_course()` trigger, unique `(module_id, position)`, and `unique (id, course_id)`
  so a composite foreign key can enforce the lesson/course invariant;
- `lessons.body` as `jsonb not null default '[]'` with `jsonb_typeof(body) = 'array'`;
- `lesson_resources`: `lesson_id`, `label`, `kind` in `('link','pdf','sheet','repo')`, `url` with a
  `^https://` check (external-link-only model per ADR-029), unique `(lesson_id, position)`;
- `app.can_manage_course(uuid)` helper.

RLS: published courses/lessons/resources are readable by everyone; draft/archived content is
readable only to workspace members and the course instructor; all writes are manager-only.

### 4.7 `supabase/migrations/0006_learning.sql`

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
- `app.has_active_enrollment(uuid)` helper.

RLS: a user may read and insert only their own enrolments and progress rows, with `with check`
pinning `user_id`; updates limited to the `status`/`completed_at` columns; deletes allowed only for
the user's own `active` enrolment (cancel path).

Indexes: `course_enrollments(user_id, status, updated_at desc)`; `lesson_progress(enrollment_id)`;
`(course_id)` where needed for aggregate reconciliation.

### 4.8 `supabase/migrations/0007_audit_events.sql`

Append-only `audit_events`: `id`, `actor_id` (nullable), `action`, `target_type`, `target_id`,
`request_id`, `metadata jsonb` with a size check, `created_at`. Grants allow **insert and select only**
— no `update`, no `delete` — so history cannot be silently rewritten.

### 4.9 `supabase/migrations/0008_grants.sql`

- `revoke all on all tables in schema public from anon, authenticated;`
- then explicit, minimal grants: `select` on `app_public_profiles` and published catalogue rows;
  `insert`/`update` only where the policies above allow it;
- `revoke execute on all functions in schema app from public, anon;` then `grant execute` to
  `authenticated` for the four caller-scoped helper functions only;
- views created with `security_invoker = true` so underlying RLS still applies.

This file is written last so it reflects the real objects rather than a guess.

### 4.10 `supabase/tests/*.sql`

pgTAP files, one per migration: constraint tests, invariant tests (single owner, primary category,
lesson-belongs-to-course), and a **deny matrix** per table for anonymous, signed-in stranger, active
member, and manager principals. Run with `supabase test db`.

### 4.11 `supabase/seed/seed.sql`

Deterministic fictional data only: a few local test users, workspaces, categories, communities,
courses/modules/lessons with external `https://` resources, memberships, enrolments and partial
progress. No real names, emails, or copied third-party content. Seeding runs as the local database
superuser; the application never holds a service-role key.

## 5. Server layer (file by file)

| File | Contains | Rule it satisfies |
|---|---|---|
| `src/start.ts` | `createStart(...)` exporting the start instance; registers `requestIdMiddleware` as global `requestMiddleware` | Per-request correlation without per-route boilerplate |
| `src/server/env.ts` | Zod-validated server env (`SUPABASE_URL`, anon key only); fails fast with a clear message; **never** reads a service-role key | No silent env invention |
| `src/server/supabase/server-client.ts` | User-scoped Supabase client built per request with the cookie adapter (`getCookie`/`setCookie`/`deleteCookie`); no privileged client | RLS applies because the user's identity is retained |
| `src/server/supabase/auth.ts` | `getSessionUser()`, `requireUser()`, `signOutCurrentSession()` | One place that decides authenticated vs anonymous |
| `src/server/http/errors.ts` | `AppError` with stable machine codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `RATE_LIMITED`); safe human messages | No stack traces, SQL, or tokens leak to users |
| `src/server/http/request-context.ts` | Request id, correlation, per-request logger bound to the id | Structured logging |
| `src/server/http/logger.ts` | Structured JSON logs; redaction of emails, tokens and bodies | Privacy-safe observability |
| `src/server/middleware/request-id.ts` | Generates/accepts `x-request-id`, sets the response header | Traceability |
| `src/server/middleware/auth.ts` | Function middleware injecting `{ supabase, user }`; `requireAuth` variant throwing `UNAUTHENTICATED` | Authorization boundary |
| `src/server/db/database.types.ts` | Generated from the local database and committed | Schema/types cannot drift |
| `src/server/repositories/*.ts` | Thin data access (`profiles`, `communities`, `courses`, `learning`) — the only files that touch Supabase tables | Provider code stays in one layer |
| `src/server/services/*.ts` | Use-case authorization and invariants (`profile-service`, `community-service`, `course-service`, `learning-service`) | UI never holds authority |
| `src/server/functions/*.ts` | `createServerFn` endpoints with Zod `validator` | Validated input at the trusted boundary |

## 6. Server function contracts

Every endpoint uses `createServerFn({ method })`, a Zod `validator`, the `authMiddleware` chain where
required, and a typed `AppError`.

| File | Export | Input (Zod) | Output | Must fail safely when |
|---|---|---|---|---|
| `functions/auth.ts` | `signUpWithPassword` | email, password, handle, displayName | session + profile | email taken, weak password, duplicate handle |
| | `signInWithPassword` | email, password | session + profile | bad credentials (identical message either way) |
| | `signOutCurrentSession` | — | ok | no session |
| | `getSessionProfile` | — | profile + capabilities or `null` | expired/invalid session |
| `functions/profile.ts` | `updateOwnProfile` | displayName, headline, bio, location, avatarUrl | updated public profile | invalid/duplicate handle, forbidden field |
| `functions/community.ts` | `listCommunities` | cursor, category, visibility-safe filters | bounded page + next cursor | invalid cursor/filter |
| | `getCommunityDetail` | slug | community + membership state | not found or not visible (no existence leak) |
| | `joinCommunity` | slug or id | membership + `created: boolean` | unauthenticated, invite-only, banned |
| | `leaveCommunity` | slug or id | left state | not a member |
| `functions/course.ts` | `getCourseOutline` | community slug + course slug | accessible outline + enrolment state | not found / not authorized |
| | `enrolInCourse` | course id | enrolment + `created: boolean` | inaccessible/unpublished |
| `functions/learning.ts` | `completeLesson` | lesson id | authoritative lesson + course progress | no enrolment, wrong course, wrong learner |
| | `getMyLearning` | cursor, status | bounded enrolment/progress projection | unauthenticated, invalid cursor |

Contract rules: authoritative `user_id`, role, workspace, price and ownership are **never** accepted
from the client; mutations are idempotent by natural unique key; all lists are cursor-paginated and
bounded; private resources never reveal existence to unauthorized callers.

## 7. Client integration (existing files to modify)

| File | Change |
|---|---|
| `src/routes/login.tsx` | Replace `signInDemo` with `signInWithPassword`; real pending/error states; keep a clearly labelled **local-only** test-account affordance instead of a fake success message |
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

UI visibility is never treated as authorization: every command re-checks on the server, and every
table re-checks in RLS.

## 8. Test layer

| File | Purpose |
|---|---|
| `supabase/tests/*.sql` | Constraints, invariants, and the RLS deny matrix per table |
| `e2e/auth-flow.spec.ts` | New signup, existing login, logout, expired/invalid session, duplicate-email error |
| `e2e/learning-flow.spec.ts` | The approved journey: login → join community → enrol → complete lesson → **reload** → progress still present; plus a second-account negative check |
| `e2e/route-contract.spec.ts` (existing) | Still must pass; private data must not appear for anonymous visitors |
| `e2e/visual-contract.spec.ts` (existing) | Unchanged |
| `e2e/helpers.ts` | Add a `signInAsSeededUser` helper only if it does not weaken real-auth coverage |

## 9. Build order in waves (each wave gated)

| Wave | Deliverable | Gate command | Rollback |
|---|---|---|---|
| 0 | Safety blockers closed; Supabase CLI added; `config.toml`; local stack starts | `supabase start`; secret scan report | Remove CLI and config; no data exists yet |
| 1 | Migrations 0001–0008 + pgTAP + seeds | `supabase db reset` and `supabase test db` green | Reset local DB; migrations are unapplied on other machines |
| 2 | Env, client, errors, logging, middleware, `src/start.ts`; generated types | `bun run typecheck`, `bun run lint`, `bun run build` | Revert files; app still runs on fixtures |
| 3 | Auth/profile endpoints + client wiring for login/register/settings | `auth-flow.spec.ts` green on 3 viewports | Revert routes to fixture login |
| 4 | Community + enrolment + lesson-progress endpoints and wiring | `learning-flow.spec.ts` green on 3 viewports | Revert the affected routes only |
| 5 | Evidence: query plans, bounded load run, export/restore rehearsal, unresolved-functionality register | `EXPLAIN (ANALYZE, BUFFERS)` captures, restore log, `bun run build` | Documentation only |

Each wave ends with `bun run typecheck`, `bun run lint`, `bun run build`, `git diff --check`, and a
changed-path review before the next wave starts.

## 10. Local operations

```bash
# local stack (requires Docker; already verified present)
supabase start
supabase db reset                 # rebuild schema + seed from committed files
supabase test db                  # pgTAP constraints + RLS deny matrix
supabase gen types typescript --local > src/server/db/database.types.ts

# application
bun run typecheck
bun run lint
bun run build
bun run dev                       # http://127.0.0.1:5000
npx playwright test --workers=3
```

`.env.local` (git-ignored) holds only the **local** Supabase URL and anon key printed by
`supabase start`. No service-role key is placed in the app. `env.ts` fails fast if a hosted URL is
detected, so a hosted project cannot be used accidentally.

## 11. Migration, backup, portability

- clean `supabase db reset` must reproduce schema **and** seed deterministically;
- `pg_dump` logical export and restore into a clean local stack, with the restore duration recorded;
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

## 14. Inputs still required before Wave 0

1. Authorization for the full-history local **secret scan**.
2. Authorization for the expanded **security rules** (permission matrix, embed/XSS, privacy/retention,
   admin 2FA).
3. Separate authorization for **GitHub** secret scanning / push protection (not required for the local
   proof; required later).
4. The **measurable proof targets** for Wave 5 (dataset size, p50/p95/p99 latency, error-rate ceiling,
   cost envelope) or permission for the agent to propose them.
5. Founder approval recorded on the specification and this plan.

## 15. Approval record

```text
Planning status: DRAFT / PLANNING
Founder approval: NOT YET APPROVED FOR IMPLEMENTATION
Approved platform boundary: local-only Supabase proof
Approved first vertical slice: signup/login -> profile -> join community -> enrol -> complete lesson -> persisted reload
Production/remote actions authorized: NONE
Known blockers: secret scan; security-rule expansion; measurable proof targets; plan + spec review
Required re-review triggers: provider, scope, auth model, tenant boundary, remote/hosted use,
payments, native files/video/live, material scale or cost change
```
