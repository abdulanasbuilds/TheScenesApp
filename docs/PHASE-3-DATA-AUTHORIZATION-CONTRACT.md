# The Scenes — Phase 3A Data and Authorization Contract

**Status:** APPROVED IMPLEMENTATION CONTRACT; EXECUTABLE LOCAL GATES REMAIN
**Applies to:** Phase 3A learner slice in local mode and any later explicitly approved fresh staging environment
**Parent:** `PHASE-3-REVISION-3-SPEC.md`

## 1. Purpose

This document closes the schema and authorization decisions that must not be invented while writing
SQL. Migrations remain the eventual executable source of truth, but they must implement this contract
without changing entity ownership, field-level access, lifecycle, or referential behavior.

## 2. Global conventions

- PostgreSQL major and local Supabase image digests are recorded in Wave 0 before the first migration.
- IDs are database-generated UUIDs except deterministic seed UUIDs.
- Timestamps are `timestamptz` in UTC and database-authored.
- Every required field is `NOT NULL`; every optional field is named explicitly below.
- State values use named `CHECK` constraints, not PostgreSQL enums.
- Slugs and handles are stored lowercase and checked at the database boundary. Slugs also match
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` in addition to each table's stated length.
- All text has a stated character bound; unbounded user text is forbidden.
- JSONB is used only for versioned lesson blocks and bounded audit metadata.
- Public functions default to `SECURITY INVOKER`; every definer exception is listed and tested.
- Every definer function uses `SET search_path = ''` and schema-qualified objects.
- `PUBLIC`, `anon`, and `authenticated` receive no automatic function execution.
- Exposed tables pair grants, RLS policies, indexes, and pgTAP tests in the same migration.
- No migration is edited after application. Destructive future changes use expand → migrate → contract.

## 3. Entity and DDL appendix

The checks below are semantic requirements. Migration names may add a stable prefix, but column and
relationship meaning must not drift.

### 3.1 `public.profiles`

| Column | Contract |
|---|---|
| `id` | `uuid` PK; FK to `auth.users(id) ON DELETE CASCADE` |
| `handle` | `text NOT NULL`; 3–30; lowercase regex `^[a-z0-9][a-z0-9_-]{2,29}$`; unique |
| `display_name` | `text NOT NULL`; trimmed length 2–80 |
| `headline` | nullable text; ≤140 |
| `bio` | nullable text; ≤2,000 |
| `location` | nullable text; ≤80 |
| `status` | `active|suspended|deleted`; default `active`; never client writable |
| timestamps | `created_at`, `updated_at`; database-set |

Phase 3A does not add an avatar URL. The accepted UI continues to use initials; upload/provider work is
deferred. Profile deletion is not exposed. A later account-deletion specification must settle owned
content and legal retention before it can call Auth deletion.

`private.handle_auth_user_created()` is an `AFTER INSERT` trigger on `auth.users`. It validates hostile
metadata, inserts exactly one profile, and is the only profile insert path. It is `SECURITY DEFINER`,
has an empty search path, and cannot be executed directly by client roles. A trigger failure must roll
back the Auth insert and leave no profileless account.

### 3.2 `public.workspaces`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `kind` | `creator|platform` |
| `name` | text 2–100 |
| `slug` | lowercase text 3–60; unique |
| `status` | `active|archived`; default `active` |
| `created_by` | non-null FK to `profiles(id) ON DELETE RESTRICT` |
| timestamps | database-set |

The deterministic platform workspace is owned by a fictional, non-login-capable catalogue actor. No
workspace create/update/delete endpoint exists in Phase 3A.

### 3.3 `public.workspace_memberships`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `workspace_id` | non-null FK to workspaces, delete restricted |
| `user_id` | non-null FK to profiles, delete restricted |
| `role` | `owner|admin|editor|viewer` |
| `status` | `active|invited|paused|removed`; default `active` |
| timestamps | database-set |

Unique `(workspace_id, user_id)`. Partial unique index enforces at most one active owner per workspace.
No role/status mutation exists in this slice; a later transaction must preserve at least one owner.

### 3.4 `public.categories`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `slug` | lowercase 2–60; unique |
| `name` | text 2–80 |
| `blurb` | text 1–240 |
| `accent_hue` | smallint 0–359 |
| `sort_order` | integer ≥0 |
| `status` | `active|hidden`; default `active` |
| timestamps | database-set |

No client writes.

### 3.5 `public.communities`

| Column | Contract |
|---|---|
| `id` | UUID PK; also unique `(id, workspace_id)` |
| `workspace_id` | non-null FK to workspaces, delete restricted |
| `slug` | lowercase 3–80; globally unique |
| `name` | text 2–100 |
| `tagline` | text 1–160 |
| `description` | text 1–4,000 |
| `privacy` | `public|private` |
| `join_policy` | `open|invite` |
| `discoverability` | `listed|unlisted`; default `listed` |
| `status` | `draft|published|archived` |
| `accent_hue` | smallint 0–359 |
| `languages` | non-null array of 1–8 unique lowercase tags; each ≤16 and matches `^[a-z]{2,3}(?:-[a-z]{2})?$` |
| `published_at` | nullable; present iff status is `published` |
| timestamps | database-set |

Check: a private community must use `join_policy='invite'`. Publication/timestamp agreement is a
biconditional. No catalogue writes are exposed.

### 3.6 `public.community_categories`

- non-null `community_id` and `category_id`, both delete restricted;
- `is_primary boolean NOT NULL DEFAULT false`;
- PK `(community_id, category_id)`;
- partial unique index permits at most one primary category per community;
- reverse index `(category_id, community_id)` supports discovery.

### 3.7 `public.community_memberships`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `community_id` | non-null FK, delete restricted |
| `user_id` | non-null profile FK, delete restricted |
| `role` | `member|moderator|manager`; default `member` |
| `status` | `active|invited|paused|banned|left` |
| `joined_at` | nullable only before first activation; database-authored |
| timestamps | database-set |

Unique `(community_id, user_id)`. Index `(user_id, status, community_id)` supports own membership and
RLS predicates. Learner RPCs may create/reactivate only `role='member'`.

### 3.8 `public.courses`

| Column | Contract |
|---|---|
| `id` | UUID PK; unique `(id, workspace_id)` |
| `workspace_id` | non-null FK to workspaces, delete restricted |
| `community_id` | non-null in Phase 3A; composite FK `(community_id, workspace_id)` → communities, update/delete restricted |
| `category_id` | nullable category FK, delete restricted |
| `instructor_id` | non-null profile FK, delete restricted; attribution only, never authority |
| `slug` | lowercase 3–100 |
| `title` | text 2–140 |
| `subtitle` | text 1–220 |
| `description` | text 1–5,000 |
| `level` | `beginner|intermediate|advanced` |
| `access` | `included|restricted` |
| `status` | `draft|published|archived` |
| `published_at` | nullable; present iff published |
| timestamps | database-set |

Unique `(workspace_id, slug)`. Index `(community_id, status, published_at DESC, id DESC)` supports the
community course list. Instructor attribution never substitutes for active workspace membership.

### 3.9 `public.course_outcomes`

- UUID PK;
- non-null `course_id` FK `ON DELETE CASCADE`;
- `position smallint` in 1–12;
- `body text` length 1–240;
- unique `(course_id, position)`.

### 3.10 `public.course_modules`

- UUID PK;
- non-null `course_id` FK `ON DELETE CASCADE`;
- `title text` length 2–140;
- `position smallint` ≥1;
- unique `(course_id, position)` and unique `(course_id, id)`.

### 3.11 `public.lessons`

| Column | Contract |
|---|---|
| `id` | UUID PK; unique `(id, course_id)` |
| `course_id` | non-null course FK, delete cascade |
| `module_id` | non-null; composite FK `(course_id,module_id)` → course_modules, update restricted, delete cascade |
| `slug` | lowercase 3–100 |
| `title` | text 2–180 |
| `summary` | text 1–500 |
| `kind` | `video|reading|exercise` |
| `duration_minutes` | smallint 1–600 |
| `is_preview` | boolean not null default false |
| `position` | smallint ≥1 |
| timestamps | database-set |

Unique `(course_id, slug)` and `(module_id, position)`. There is no synchronization trigger; composite
keys structurally enforce module/course consistency.

### 3.12 `public.lesson_contents`

- `lesson_id` UUID PK/FK `ON DELETE CASCADE`;
- `body_version smallint NOT NULL DEFAULT 1 CHECK = 1` for this slice;
- `body jsonb NOT NULL`, array length 1–100;
- timestamps database-set.

Version 1 accepts only:

```ts
type LessonBlockV1 =
  | { type: "paragraph"; text: string } // text 1–4,000
  | { type: "heading"; level: 2 | 3; text: string } // text 1–160
  | { type: "callout"; tone: "info" | "tip" | "warning"; text: string } // 1–1,000
```

No HTML, script, style, iframe, arbitrary attributes, or executable URL block exists. SQL verifies the
top-level array/version; the shared Zod schema verifies every block before rendering.

### 3.13 `public.lesson_resources`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `lesson_id` | non-null lesson FK `ON DELETE CASCADE` |
| `label` | text 1–120 |
| `kind` | `link|pdf|sheet|repo` |
| `url` | text 1–2,048; `https:` only; no control characters or credentials |
| `position` | smallint ≥1 |
| timestamps | database-set |

Unique `(lesson_id, position)`. The application URL parser additionally canonicalizes, rejects userinfo,
tokens/signed-secret query names, and executable/invalid schemes. The server never fetches the URL.

### 3.14 `public.course_enrollments`

| Column | Contract |
|---|---|
| `id` | UUID PK; unique `(id, course_id)` |
| `course_id` | non-null course FK, delete restricted |
| `user_id` | non-null profile FK, delete restricted |
| `status` | `active|cancelled`; default `active` |
| `source` | `self|seed`; Phase 3A runtime creates only `self` |
| `enrolled_at` | database-authored |
| timestamps | database-set |

Unique `(course_id, user_id)`. Index `(user_id, updated_at DESC, id DESC)` supports unfiltered My
Learning; `(user_id, status, updated_at DESC, id DESC)` supports status-filtered pages. No
cancel/reactivate operation is exposed.

### 3.15 `public.lesson_completions`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `enrollment_id` | non-null |
| `lesson_id` | non-null |
| `course_id` | non-null |
| `completed_at` | database-authored |
| `created_at` | database-authored |

Unique `(enrollment_id, lesson_id)`. Composite FKs:

- `(enrollment_id, course_id)` → `course_enrollments(id, course_id)`;
- `(lesson_id, course_id)` → `lessons(id, course_id)`.

Both composite FKs use `ON UPDATE RESTRICT ON DELETE RESTRICT`.

These make cross-course completion structurally impossible. No mutable percentage or `in_progress` row
exists. The unique index already serves enrollment lookups; do not add a redundant prefix index.

### 3.16 `private.audit_events`

| Column | Contract |
|---|---|
| `id` | UUID PK |
| `actor_id` | nullable profile FK `ON DELETE SET NULL` |
| `action` | `community.joined|community.left|course.enrolled|lesson.completed` |
| `target_type` | `community|course|lesson` |
| `target_id` | UUID |
| `request_id` | UUID, validated/generated by server |
| `metadata` | JSONB object ≤4 KiB, no sensitive values |
| `created_at` | database-authored |

No client schema/table privilege exists. Command functions insert one event only when they win a real
state transition. Denied attempts are redacted application security logs because transaction failure
would roll back an audit insert.

## 4. Catalogue actors and deterministic seed

The committed seed uses fixed UUIDs, slugs, positions, and timestamps. It may create the minimum
fictional Auth rows required for creator/catalogue foreign keys, subject to these rules:

- catalogue actors have reserved `.invalid` addresses;
- they have no password, identity record, session, confirmation path, or login capability;
- profile rows are produced through the same hardened trigger metadata contract;
- a test proves password sign-in cannot succeed for them;
- no browser/E2E learner account is seeded;
- browser learners are created only through the real signup flow;
- the exact inserted Auth columns are pinned to and tested against the Wave 0 local image.

Seed content includes the public/open Product Design Studio happy path and a private/invite AI Builders
Guild denial target. Reset twice must produce the same semantic fingerprint.

## 5. Authorization helpers and command functions

### 5.1 Private helpers

Approved definer helpers are narrowly scoped and `STABLE` when semantically valid:

- `private.is_active_profile()`;
- `private.is_workspace_member(workspace_id, allowed_roles[])`;
- `private.is_community_member(community_id, allowed_roles[])`;
- `private.has_active_enrollment(course_id)`;
- `private.can_access_course_content(course_id)`.

Authenticated policies receive `USAGE` on `private` and execute only on the helper signatures they call.
Anonymous policies use simple public-row predicates and never depend on inaccessible private helpers.
Helpers return only a Boolean and cannot enumerate membership rows.

### 5.2 Caller-bound public commands

Approved definer commands:

- `public.join_community(community_id uuid, request_id uuid)`;
- `public.leave_community(community_id uuid, request_id uuid)`;
- `public.enrol_in_course(course_id uuid, request_id uuid)`;
- `public.complete_lesson(lesson_id uuid, request_id uuid)`.

Each derives `auth.uid()`, requires an active profile, accepts no actor/role/status/timestamp/percentage,
implements the state table in the parent spec, and returns a bounded result. Default execution is
revoked; only `authenticated` receives the exact signature.

Every command rejects a null request ID before mutation. The Start server validates or generates the
UUID; direct RPC callers cannot omit it. `join_community` checks `published + listed + public + open`
before both absent→active and left→active transitions. Existing active members receive an idempotent
no-op even if later catalogue visibility changes; absent/left callers to an unlisted or otherwise
ineligible community receive the same concealed result as missing.

`can_access_course_content` requires an active profile, active own enrolment, and active membership in
the course's community. Content/resource SELECT policies and `complete_lesson` use it. Leaving, pausing,
or banning revokes non-preview content and new completion access; own enrolment/completion history
remains readable.

For absent-row races, commands use `INSERT ... ON CONFLICT ... RETURNING`; only the winner audits. For
state transitions such as `left → active`, a locked conditional update returns the winner; only that
winner audits. Losing concurrent requests re-read and return the resulting no-op state.

## 6. Table/operation/grant/RLS matrix

| Object | `anon` SELECT | `authenticated` SELECT | Direct writes |
|---|---|---|---|
| profiles: `id,handle,display_name,headline,bio,location` | active rows | active rows | update own allowed columns only |
| workspaces | none | own active membership scope | none |
| workspace memberships | none | own row only | none |
| active categories | allow | allow | none |
| listed published communities | allow metadata | allow metadata + own membership state through service | none |
| unlisted community metadata | none | active member or named workspace manager roles | none |
| community categories | only when parent metadata visible | same | none |
| community memberships | none | own row only | commands only |
| published course/module/lesson outline | when parent metadata is visible | same, plus scoped manager access | none |
| course outcomes | only when parent course outline is visible | same | none |
| preview lesson content/resources | when parent metadata is visible | same | none |
| non-preview lesson content/resources | none | active own enrolment + active course-community membership | none |
| enrolments/completions | none | own rows only | commands only |
| private audit events | none | none | controlled commands only |

Profile updates grant only `display_name`, `headline`, `bio`, and `location`; handle, ID, status, and
timestamps are not writable. Both `USING` and `WITH CHECK` pin the row to `(select auth.uid())` and an
active profile. All text bounds remain database constraints, so direct Data API callers cannot bypass
the approved shape.

Draft/archived community and curriculum rows are never readable merely because someone is a community
member. Only explicitly named active workspace roles (`owner|admin|editor`) receive scoped draft access;
`viewer` receives published scoped reads only.

Profile `status`, `created_at`, and `updated_at` receive no public/client column grant. Account-disabled
UX comes from the bounded session-profile service result, not a broad status-column read.

## 7. Keyset queries and indexes

Every growing list is bounded to default 24 / maximum 50 and uses an opaque, versioned cursor.

| Query | Cursor tuple | Required index direction |
|---|---|---|
| community discovery | `(published_at DESC, id DESC)` | partial `(published_at DESC,id DESC) WHERE status='published' AND discoverability='listed'` |
| community courses | `(published_at DESC, id DESC)` | `(community_id,status,published_at DESC,id DESC)` |
| My Learning | `(updated_at DESC, id DESC)` | `(user_id,updated_at DESC,id DESC)` plus status-filtered companion index |

Cursors encode filter version + tuple, are authenticated only as input shape (not authority), and reject
filter mismatch/tampering safely. Index hypotheses are retained only when representative plans justify
them; foreign-key and RLS predicate columns are reviewed explicitly.

## 8. API DTO contract

Route/server-function inputs remain shared Zod types and never expose provider types.

Shared output projections are exact:

| Projection | Fields |
|---|---|
| `PublicProfile` | `id, handle, displayName, headline, bio, location` |
| `ViewerDTO` | `null` or `id,displayName,handle,headline,bio,location,accountEmail,joinedCommunities[]` |
| `CategorySummary` | `id, slug, name, blurb, accentHue` |
| `OwnMembership` | `communityId, role, status, joinedAt` |
| `CommunitySummary` | `id, slug, name, tagline, description, privacy, joinPolicy, discoverability, accentHue, languages, primaryCategory, ownMembership?` |
| `CourseSummary` | `id, slug, communitySlug, title, subtitle, level, access, instructor: PublicProfile, category?, lessonCount, durationMinutes, ownEnrollment?, learningStatus?, progressPercent?` |
| `LessonOutline` | `id, slug, title, summary, kind, durationMinutes, isPreview, position, completed?` |

`memberCount`, `online`, `postsPerWeek`, ratings/reviews, pricing amounts, rules, highlights, followers,
and student counts are not Phase 3A database fields. Fixture mode may render them. Local mode hides them
or labels a whole fixture-only section; it never presents them as live backend data.

Required reads:

| Function | Input | Bounded result |
|---|---|---|
| `getSessionProfile` | none | `ViewerDTO | safe account-state error` |
| `listCategories` | none | active `CategorySummary[]`, max 100 |
| `listCommunities` | `{ cursor?, category?, limit? }` | visible `CommunitySummary[] + nextCursor` |
| `listMyCommunities` | `{ cursor?, limit? }` | authenticated own active memberships, including unlisted communities, + summaries + cursor |
| `getCommunityDetail` | `{ slug }` | one visible `CommunitySummary`; no feed/posts |
| `listCommunityCourses` | `{ communitySlug, cursor?, level?, limit? }` | visible `CourseSummary[] + nextCursor` |
| `getCourseOutline` | `{ communitySlug, courseSlug }` | course summary, description, outcomes, ordered modules/lesson outlines |
| `getLessonDetail` | `{ communitySlug, courseSlug, lessonSlug }` | protected/preview lesson result described below |
| `getMyLearning` | `{ cursor?, learningStatus?, limit? }` | own course items + cursor; status is `not-started|in-progress|completed` |

`getMyLearning.learningStatus` is derived from completion count, never the enrolment's
`active|cancelled` state. Filtering happens in the server/database query before pagination. The initial
index is `(user_id,updated_at DESC,id DESC)`; representative filtered/unfiltered plans decide whether a
later reconciled projection is justified. The current slice has no cancel command and returns active
enrolments only.

Each My Learning item contains `enrollmentId, enrollmentStatus, CourseSummary, learningStatus,
completedLessons, totalLessons, progressPercent, nextLessonSlug?`, plus `accessState:
available|membership-required`. Leaving/pausing/banning keeps history visible with
`membership-required` and locks lesson bodies until an allowed rejoin.

`ViewerDTO.accountEmail` comes from the verified Auth claim/user result, never `profiles`. Each joined
community is bounded to `{id,slug,name,accentHue}` and includes active own memberships, including
unlisted communities, maximum 50. The root loader obtains this DTO, supplies it to the application
provider, and reruns after auth or membership mutation. In local mode, avatar/profile controls link to
`/settings` while the member-directory backend remains out of scope; fixture notification counts,
points, levels and member-directory IDs are hidden or labelled fixture.

`getLessonDetail` returns `courseId, lessonId, communitySlug, courseSlug, LessonOutline, bodyVersion,
blocks, resources[{id,label,kind,url,position}], previousLessonSlug?, nextLessonSlug?, enrollmentStatus,
completed, completedLessons, totalLessons, progressPercent`. It never returns protected body/resources
before `can_access_course_content` passes.

Required writes and exact success shapes:

| Function | Input | Success result | Invalidate |
|---|---|---|---|
| `signUpWithPassword` | `{displayName,handle,email,password}` | `{ changed:true, profile:PublicProfile }` | viewer/auth routes |
| `signInWithPassword` | `{email,password}` | `{ changed:true, profile:PublicProfile }` | root viewer + private loaders |
| `signOutCurrentSession` | none | `{ changed:true, signedOut:true }` | all viewer/private loaders |
| `updateOwnProfile` | `{displayName,headline?,bio?,location?}` | `{ changed, profile:PublicProfile }` | viewer/profile |
| `joinCommunity` | `{communityId}` | `{ changed, membership:{communityId,role:'member',status:'active'} }` | lists/detail/home |
| `leaveCommunity` | `{communityId}` | `{ changed, membershipState:'left'|'not-member' }` | lists/detail/home/learning/course/lesson |
| `enrolInCourse` | `{courseId}` | `{ changed, enrollment:{id,courseId,status:'active'} }` | course/lesson/learning/home |
| `completeLesson` | `{lessonId}` | `{ changed, completion:{id,lessonId,completedAt}, learningStatus, completedLessons, totalLessons, progressPercent }` | lesson/course/learning/home |

Every function returns the common `{ ok:true,data,requestId } | { ok:false,error:{code,message,
fieldErrors?,retryAfterSeconds?},requestId }` envelope. `changed=false` is a successful idempotent no-op,
not an error. No ordinary input accepts user ID, role, workspace authority, profile status, timestamp,
enrolment ID, course percentage, price, entitlement, request ID, or audit actor; request ID is attached
by trusted server middleware.

## 9. Required database tests

Before Wave 1 passes, pgTAP and application-level tests prove:

- every required/unique/check/composite FK and referential action;
- cross-workspace course/community rejection;
- cross-course module/lesson/completion rejection;
- at-most-one active workspace owner and primary category;
- exact ACL/default-privilege/function-execute state;
- RLS enabled on every exposed table;
- anonymous, owner, active member, signed-in stranger, paused/banned member, suspended profile, manager,
  enrolled learner, and cross-user cases where relevant;
- public outline versus preview versus protected content/resource access;
- direct join/rejoin denial for known unlisted UUIDs and membership-loss content/completion revocation;
- trigger search path/ACL, malformed metadata, duplicate handle, atomic rollback, and successful signup;
- concurrent join/enrol/complete behavior across separate connections;
- one state transition and one audit event under retry/concurrency;
- seed actor cannot log in;
- reset/fingerprint determinism.
