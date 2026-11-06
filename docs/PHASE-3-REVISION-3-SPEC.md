# The Scenes — Phase 3A Backend Learning Slice Specification (Revision 3)

**Status:** ACTIVE — LOCAL EVIDENCE FIRST; REQUEST-ONLY FRESH STAGING GATE UNDER ADR-040
**Prepared:** 5 November 2026
**Phase boundary:** Phase 3A, bounded learner slice; local proof before any staging request
**Production/remote authorization:** no production; no staging mutation until an exact request is approved
**Prior revision:** `PHASE-3-BACKEND-SPEC.md` revision 2 (historical review record)
**Detailed data contract:** `PHASE-3-DATA-AUTHORIZATION-CONTRACT.md`
**File-by-file build order:** `PHASE-3-IMPLEMENTATION-PLAN-R3.md`
**Executable checks:** `PHASE-3-VERIFICATION-RUNBOOK.md`

## 1. Authority and purpose

This document is the canonical contract for the first Phase 3 backend slice. It resolves the
material gaps found by five independent read-only reviews of revision 2. The founder approved the six
product rules and isolated local implementation on 5 November 2026, then approved ADR-040 lean build +
staging mode on 6 November. Wave 0 is complete. Executable local gates now decide promotion; no further
broad speculative review is required unless new evidence changes scope or exposes a material risk. A
fresh staging request may be presented only after local integration readiness. No production data,
deployment, payment or later-phase feature is authorized.

Where revision 2 conflicts with this document or its named child contracts, revision 3 controls. The
older files remain evidence of the review history and must not be used as implementation authority.

## 2. Outcome

Prove locally that The Scenes can replace fixture state for one coherent learner journey while
preserving the accepted fixture application as a separate, explicit mode:

```text
register with display name + handle + email + password
→ sign in with a server-managed session
→ see the same server-derived profile in navigation and settings
→ explicitly join Product Design Studio
→ enrol in Interface Critique That Helps
→ open an allowed lesson and complete it
→ reload
→ sign out and sign in again
→ observe the same membership, enrolment, and progress in My Learning
```

The proof also demonstrates that a second account and an anonymous caller cannot read account-only
profile data or cross the first learner's membership, enrolment, lesson-content, or progress boundaries.
The deliberate public profile projection remains readable as defined by the data contract.

## 3. Business and user value

The slice tests the smallest durable learner loop: identity → community access → course access →
learning progress. It reduces the risk of building creator operations, referrals, moderation,
payments, or marketplace behavior on an incorrect identity, tenant, or authorization foundation.

Success is behavior-level evidence, not the existence of files:

- one fictional learner completes the approved journey across a new session;
- the same UI remains usable in explicit fixture mode without a backend;
- unauthorized direct calls fail at the server and database boundaries;
- local reset and recovery are reproducible;
- measured results are recorded without claiming production capacity.

## 4. Scope

### 4.1 In scope

- a pinned local Supabase CLI stack with loopback-only exposure;
- local email/password Auth with confirmation disabled only for this disposable proof;
- server-managed SSR cookies and verified claims;
- profiles and a tenant-ready workspace foundation;
- categories, listed/unlisted communities, and caller-bound membership commands;
- courses, modules, lesson outlines, protected lesson content, and validated external links;
- caller-bound course enrolment and lesson completion;
- server-derived progress and learner projections;
- grants, RLS, hardened database helpers/commands, and negative tests;
- explicit fixture and `supabase-local` application modes with no error-triggered fallback;
- structured errors, safe logs, request IDs, a bounded local abuse guard, and CSRF protection;
- local migration/reset, deterministic seed, query/load evidence, and recovery rehearsal.

### 4.2 Explicit non-goals

- hosted Supabase during the local proof, and all production Supabase use; a fresh staging connection
  is a separate ADR-040 promotion request after local integration readiness;
- a production data-platform decision, region, budget, RPO, or RTO;
- real email delivery, verification delivery, or password-reset email;
- production/distributed rate limiting, CAPTCHA, or Redis;
- creator approval, creator role grants, or real creator-workspace operations;
- community posts/comments, events, notifications, search ranking, or marketplace persistence;
- payments, subscriptions, payouts, orders, webhooks, referrals, or entitlements;
- native file, video, or live hosting;
- Realtime;
- moderation automation, private messaging, admin/service impersonation, AI, or semantic search;
- real user data, production migration/deployment, or any provider-side remote change that was not
  separately presented and approved under ADR-040.

## 5. Resolved product contract

### 5.1 Registration and profile bootstrap

Registration collects all data required to create a valid profile in one operation:

- display name;
- handle;
- email;
- password.

One shared client-safe Zod schema defines the handle everywhere:

```text
lowercase; 3–30 characters;
first character is a letter or number;
remaining characters are letters, numbers, `_`, or `-`;
regex: ^[a-z0-9][a-z0-9_-]{2,29}$
```

The normalized handle is immutable during Phase 3A. Onboarding and settings display it read-only.
Duplicate email, duplicate handle, and profile-trigger conflicts return one safe public signup message;
provider/database details remain server-only and redacted.

### 5.2 Learner/creator selection

"Learner" and "creator" in registration/onboarding are UI intent, not roles or authorization. Choosing
creator may open the existing fixture-only creator workspace, which remains clearly labelled as not
connected. It does not create a workspace, membership, capability, claim, or role.

### 5.3 Onboarding

- interests remain ephemeral in Phase 3A and are not claimed as saved;
- the user explicitly selects each recommended community to join;
- finishing onboarding never silently joins every recommendation;
- no durable `onboarding_complete` state is claimed;
- repeating or skipping the wizard does not weaken access control.

### 5.4 Community and course access

- published, **listed** community metadata is public even when member content is private;
- unlisted community existence is concealed unless the caller has approved access;
- only a published `listed + public + open` community can be self-joined or rejoined;
- an included course scoped to a community requires an active community membership to enrol;
- every Phase 3A course belongs to a community; standalone/unscoped courses are deferred;
- restricted courses may expose approved metadata/outline and explicit preview lessons, but cannot be
  enrolled and never expose non-preview content in Phase 3A;
- lesson outline metadata is separate from lesson content;
- non-preview lesson content and resource URLs require the caller's active enrolment in the course;
- non-preview content and new completion mutations also require a current active membership in the
  course's community; leaving, pausing, or banning locks content/resources without deleting enrolment
  or completion history, and an allowed rejoin restores access;
- an explicit preview lesson may be read without enrolment only when its parent course/community
  metadata is visible;
- progress belongs to the authenticated learner and is never public.

The happy path uses Product Design Studio and Interface Critique That Helps. AI Builders Guild remains
a private/invite negative-test target, not the local proof's happy path.

### 5.5 Lifecycle semantics

Community membership:

| Current state | Join | Leave |
|---|---|---|
| absent | create `active/member` | successful no-op, no mutation |
| active member | successful no-op | transition to `left` |
| left member in a currently self-joinable community | transition to `active` | successful no-op |
| left member in an unlisted/private/invite community | concealed denial | successful no-op |
| invited | deny; invitation acceptance is deferred | deny |
| paused or banned | deny without revealing private data | deny |
| moderator or manager | no learner self-mutation | no learner self-removal |

Course enrolment:

| Current state | Enrol |
|---|---|
| absent and allowed | create `active` |
| active | successful no-op |
| cancelled | deny in Phase 3A; reactivation is deferred |
| inaccessible/restricted | concealed not-found or safe forbidden result, as defined by visibility |

Lesson completion is represented by one completion row. Repeating completion is a successful no-op.
Course status (`not-started`, `in-progress`, `completed`) is derived from lesson counts; no mutable
client percentage or stored course-completed state exists in this slice.

An audit row is written only for a real state transition. A retry/no-op creates no second state-change
audit event. Request IDs are correlation values, not idempotency keys or authority.

## 6. Explicit data modes

`VITE_DATA_MODE` accepts exactly:

- `fixtures` — the accepted Phase 2 reducer/seed behavior;
- `supabase-local` — the local Phase 3A adapters and server functions.

The application selects one mode at startup. A Supabase error never activates fixture data. In local
mode, fixture identity, membership, enrolment, and progress are never authoritative and must not appear
as if they belong to the signed-in user.

The UI depends on stable application contracts. Each contract has a fixture implementation and a
Supabase-local implementation. The fixture reducer may retain its existing mutations only behind the
fixture adapter. Rollback is a configuration switch to a complete implementation, not a partial route
revert or broad Git operation.

The root route bootstraps a safe server-derived viewer in local mode. Public, member, community, and
creator shells use that viewer. All real logout controls call the same awaited server function.

## 7. Authentication and session contract

- every request creates or reuses a client scoped to that request, never to the process/user globally;
- `auth.getClaims()` verifies identity; missing claims or any error is unauthenticated;
- the verified principal is `claims.sub`;
- `getSession()` is never an authorization source;
- raw access/refresh tokens and provider sessions never enter route DTOs;
- logout calls `auth.signOut({ scope: "local" })` and propagates every cookie deletion;
- all identity-dependent RPC and SSR responses are `Cache-Control: no-store`;
- session cookies for this server-mediated local proof are host-only, `Path=/`, `SameSite=Lax`,
  `HttpOnly`, and explicitly non-`Secure` only because the approved endpoint is loopback HTTP;
- browser JavaScript does not create a Supabase client in this no-Realtime slice;
- the existing "Remember me" control is removed or visibly disabled in local mode because Phase 3A
  defines one persistence policy;
- access JWTs can remain valid until expiry after refresh-token revocation; high-risk immediate
  revocation is a later production design.

Auth input/session values are binding:

- email is trimmed, Unicode-normalized where supported, lowercased for submission, and limited to 254
  characters;
- password input is 8–128 characters; the local Auth configuration enforces a minimum of 8, while the
  Start boundary enforces the maximum because local GoTrue has no matching configurable maximum;
- access-token expiry is 3,600 seconds;
- refresh-token rotation remains enabled with the provider-recommended 10-second reuse interval;
- the local cookie `Max-Age` is 604,800 seconds (7 days);
- the disposable proof has no additional inactivity timeout, timebox, or single-session restriction;
- all values are re-reviewed before hosted use, and direct local Auth tests record provider behavior
  for oversized email/password input.

The profile bootstrap trigger is a reviewed exception to the invoker default. It lives in `private`, is
`SECURITY DEFINER`, pins `search_path = ''`, schema-qualifies every object, validates hostile metadata,
and has direct execution revoked from `PUBLIC`, `anon`, and `authenticated`.

## 8. Application/server architecture

```text
Route/component
  → stable application contract / DTO
    → fixture adapter OR route-importable createServerFn wrapper
      → request-scoped auth + safe-error middleware
        → service (use-case authorization)
          → repository (explicit columns only)
            → user-scoped Supabase Data API / caller-bound RPC
              → grants + RLS + constraints
```

Provider/database modules stay under protected server-only paths. Route-importable wrappers contain no
provider client, key, raw session, or database implementation. The generated route tree may change only
through the TanStack generator.

Required read contracts include community listing/detail, community course listing, course outline,
lesson detail, and My Learning. Lesson detail returns the protected body/resources, previous/next lesson
selectors, and authoritative progress. UUIDs remain mutation identifiers; stable slugs remain URL
selectors.

## 9. Local isolation and abuse boundary

The local proof is not considered isolated merely because the Supabase URL contains `localhost`.

Before the stack starts:

- Vite binds to `127.0.0.1`, not `0.0.0.0`;
- unrestricted host acceptance is removed;
- every Docker-published Supabase/Postgres/Studio/Mailpit/API port is inspected;
- a second-device or equivalent isolation check proves the services are not reachable off-host;
- if Docker Desktop cannot provide loopback-only publication, an explicit firewall/isolation policy is
  required and its residual risk is recorded.

Phase 3A adds a small process-local development limiter for signup, login, and learner mutations. It is
short-lived coordination, not durable state or a production control. The initial local limits are 10
signup attempts per normalized email plus loopback client in 15 minutes, 20 login attempts per account
plus loopback client in 15 minutes, and 120 learner mutations per authenticated user per minute. They
return a safe `RATE_LIMITED` result with bounded `Retry-After`. Hosted/public Auth remains blocked until
Phase 4 supplies an approved distributed/edge design and direct-provider abuse controls.

## 10. Environment and secret boundary

Both Vite configuration and request-time server code validate local settings:

| Data mode | Required configuration | Provider behavior |
|---|---|---|
| `fixtures` | only `VITE_DATA_MODE=fixtures` | Supabase URL/key are optional, unparsed and never initialized; secret-looking `VITE_` names still fail |
| `supabase-local` | mode + validated URL + publishable key | provider initializes only during a request |

The local-mode URL uses `http:`, exact host `127.0.0.1` or `localhost`, the wrapper-approved API port,
and no username, password, query, or fragment. The key is a bounded `sb_publishable_...` value.

JWT-form keys, `sb_secret_...`, service-role material, secret-looking `VITE_` names, hosted URLs, and
unknown data modes fail before the application contacts a provider. A post-build scan verifies that no
secret/service key pattern, forbidden variable name, token, cookie, or server implementation enters the
client output.

## 11. Errors and degraded states

Every public function uses the direct, compiler-recognized chain
`createServerFn({ method }).validator(nonThrowingTypedPassthrough).handler(withSafeHandler(schema, handler))`,
with `createServerFn` imported straight from `@tanstack/react-start`. The installed Start compiler does
not transform a project wrapper factory, so a custom `createSafeServerFn(...)` is forbidden. It would
bypass server-function extraction and risk bundling server behavior or emitting a broken RPC; a build
test enforces the direct import and client stub.

`withSafeHandler` lives in `src/features/shared/safe-handler.ts` and wraps handler/validation behavior
only. It parses with Zod inside the handler, catches expected validation/domain/Auth/PostgREST/
PostgreSQL errors, and returns the serializable safe envelope. Global function middleware cannot
synthesize a typed handler result in the installed TanStack API; it only redacts/logs and emits the
tested generic fallback if an error escapes the handler. GET is side-effect-free. Signup, login, logout,
profile update, join, leave, enrol and complete are POST-only; wrong methods return 405.

| Code | HTTP status | Public behavior |
|---|---:|---|
| `VALIDATION` | 400 | field-safe message |
| `UNAUTHENTICATED` | 401 | reauthentication prompt with return URL |
| `FORBIDDEN` | 403 | only when existence is already public |
| `NOT_FOUND` | 404 | missing and concealed private resources share one shape |
| `CONFLICT` | 409 | safe retry/state message |
| `RATE_LIMITED` | 429 | bounded `Retry-After` |
| `INTERNAL` | 500 | generic message + validated request ID |

Raw provider errors are never serialized or logged. Request IDs accept only a bounded UUID form;
otherwise the server generates `crypto.randomUUID()`.

Required UI states:

| Condition | Required response |
|---|---|
| missing/invalid local config | deterministic configuration page; no provider call |
| local backend unavailable | visible unavailable state + Retry; no fixture fallback |
| expired session | clear signed-out state, preserve safe return URL |
| missing/inconsistent profile | safe account-setup error; no partial success claim |
| join/enrol/complete pending | disable duplicate submission and expose progress |
| mutation/network failure | rollback optimistic UI and retain retry action |
| empty My Learning | intentional empty state and discovery action |
| inaccessible private resource | same public result as missing resource |

Provider/server-function reads use a 5-second deadline and may make at most one automatic retry only
for a pre-response transport failure. Mutations use a 10-second deadline and are never automatically
retried by the UI; the user must choose Retry, while database idempotency keeps that retry safe. A
return URL is accepted only after normalization to a same-origin absolute path beginning with one `/`.
Schemes, hosts, protocol-relative `//` values, backslashes, and control characters are rejected and
replaced with `/home`.

## 12. Scale and performance direction

The long-term direction remains millions of registered accounts over time, not millions of concurrent
sessions. Phase 3A proves only the documented local envelope. Representative data, request mix,
latency/error targets, query-plan evidence, overload behavior, machine resources, and data fingerprints
are defined in `PHASE-3-VERIFICATION-RUNBOOK.md`.

UUIDs, explicit tenant keys, bounded keyset pagination, structural constraints, explicit column lists,
stateless request handlers, and provider adapters preserve a growth path. Sharding, partitioning,
microservices, multi-region writes, queues, and Realtime remain deferred until evidence justifies them.

## 13. Recovery and portability

Revision 3 separates two claims:

1. **Recovery:** the same migrations are applied without seed to a second isolated local Supabase stack
   with the pinned images/configuration and separate loopback ports. A checked data-only archive of the
   allowlisted Auth/application tables is restored there with triggers disabled only for the data
   phase. The destination's own Auth/Data API and a separate app process then verify fresh login,
   profile edit and persisted progress. Schema ownership comes from destination migrations, not the
   archive.
2. **Portability:** application relational data and standard constraints are exportable. Supabase Auth,
   JWT helpers, roles, RLS policies, and Data API behavior require an explicit adapter/migration when
   moving to another provider. Phase 3A documents and validates an application-data export; it does not
   claim a Supabase dump boots an unchanged application on vanilla PostgreSQL.

Raw dumps, browser traces, headers, and load logs are ignored local artifacts. Only redacted summaries
and manifests may be committed.

## 14. Acceptance criteria

Phase 3A can be accepted only when:

- the approved journey persists across reload and a new login;
- fixture mode still passes its accepted regression suite independently;
- local mode never renders fixture identity/membership/progress as real state;
- all explicit schema constraints, grants, RLS policies, and command state machines pass allow/deny and
  direct-call tests;
- lesson outline, preview, content, and resource boundaries match this specification;
- duplicate/concurrent commands produce one domain transition and one state-change audit event;
- signup/profile bootstrap, cookie refresh, local logout, CSRF, cache, bundle, and error-redaction tests
  pass;
- Vite and every local provider listener are proven isolated from non-loopback access;
- reset/seed, database types, query plans, local load, overload recovery, dump/restore, and evidence
  cleanup meet the runbook;
- all relevant checks pass from a clean checkout and the final changed paths are reviewed;
- no unapproved hosted, payment, email, native-media, creator-role, referral, marketplace, Realtime,
  AI, production or live-customer work entered the slice.

## 15. Start blockers and approval record

```text
Planning status: ACTIVE UNDER ADR-040 LEAN BUILD + STAGING MODE
Founder approval: LOCAL IMPLEMENTATION APPROVED 5 NOVEMBER; LEAN BUILD + STAGING MODE APPROVED 6 NOVEMBER 2026
Approved scope version/date: Phase 3A revision 3 / 6 November 2026
Approved first vertical slice: journey in Section 2 and six product rules in Section 5
Production actions authorized: NONE
Remote staging actions authorized: NONE YET; present one exact request after local integration readiness
Known blockers:
  1. Wave 1 live local database/integration gate and generated types;
  2. Waves 2–4 connected local vertical slice before a staging request.
Parallel incident action (not a local blocker): revoke/delete any still-existing legacy hosted project
and review its logs. Legacy accounts/credentials are retired and forbidden from all new work.
Required re-review triggers:
  provider, hosted/remote target, auth model, tenant/access boundary, cookie model,
  payments, native files/video/live, production privacy/recovery, or material scale/cost change.
```
