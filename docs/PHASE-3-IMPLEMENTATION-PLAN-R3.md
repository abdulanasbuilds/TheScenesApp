# The Scenes — Phase 3A Implementation Plan (Revision 3)

**Status:** ACTIVE — WAVE 0 COMPLETE; WAVE 1 IMPLEMENTED WITH LIVE LOCAL GATE PENDING; LEAN BUILD + STAGING APPROVED
**Parent specification:** `PHASE-3-REVISION-3-SPEC.md`
**Data/authorization contract:** `PHASE-3-DATA-AUTHORIZATION-CONTRACT.md`
**Verification runbook:** `PHASE-3-VERIFICATION-RUNBOOK.md`
**Remote/production authorization:** no production; request-only staging gate after local integration readiness

## 1. Build rule

No dependent wave is promoted before the previous wave's evidence passes. Work that does not depend on
an unproven behavior may continue inside the same approved vertical slice. Provider, hosted target,
auth/cookie model, tenant/access boundary, or material scope/cost changes return to Review. Do not
repeat speculative review when scope and evidence are unchanged; executable gates decide promotion
under ADR-040. Preserve unrelated work and never use a broad reset/revert.

The Phase 3A packages are **installed and locked at these approved versions**:

| Package | Locked version | Purpose |
|---|---:|---|
| `@supabase/supabase-js` | `2.119.0` | user-scoped server Data API/Auth client |
| `@supabase/ssr` | `0.12.7` | current cookie `getAll/setAll` contract |
| `supabase` | `3.0.0` dev dependency | pinned local stack/migrations/tests/types |
| `wrangler` | `4.157.0` dev dependency | newest stable release outside Bun's 24-hour minimum-release-age guard; local `workerd` runtime |

No ORM, SQL driver, second validation library, test framework, logging package, HTTP client, Redis, or
browser Supabase client is added in this slice. Wrangler is local execution tooling only and does not
authorize login, deployment, or any remote Cloudflare action.

## 2. Target repository shape

```text
supabase/
  config.toml
  migrations/*.sql
  tests/database/*.sql
  seed.sql
src/
  start.ts
  lib/data-mode.ts
  middleware/
    auth.ts
    request-id.ts
    safe-errors.ts
  features/
    shared/safe-handler.ts
    auth/*.schemas.ts
    auth/*.contracts.ts
    auth/*.functions.ts
    community/*.schemas.ts
    community/*.contracts.ts
    community/*.functions.ts
    learning/*.schemas.ts
    learning/*.contracts.ts
    learning/*.functions.ts
  server/
    env.server.ts
    supabase/server-client.server.ts
    supabase/auth.server.ts
    http/errors.server.ts
    http/logger.server.ts
    http/request-context.server.ts
    security/local-rate-limit.server.ts
    db/database.types.ts
    repositories/*.server.ts
    services/*.server.ts
  store/app-store.tsx             fixture-only durable preview adapter/state
  routes/phase3-load.tsx          guarded local load driver; 404 unless PHASE3_LOAD_DRIVER=1
tests/integration/
  authorization.integration.test.ts
  auth.integration.test.ts
  commands-concurrency.integration.test.ts
  cache-session.integration.test.ts
e2e/
  auth-flow.spec.ts
  learning-flow.spec.ts
  security-contract.spec.ts
  auth-route-contract.spec.ts
scripts/
  check-client-boundary.ts
  phase3-generate-data.ts
  phase3-query-plans.ts
  phase3-load.ts
  phase3-recover.ts
.phase3-artifacts/                 ignored raw evidence
docs/evidence/phase-3/             redacted summaries only
```

Sensitive server modules use both protected `*.server.*` names and `server/**` placement where useful,
and import `@tanstack/react-start/server-only` as defense in depth. Route-importable `*.functions.ts`
contain only transformed wrappers and client-safe contracts. `src/start.ts` is client-loaded, so it
imports middleware definitions only from client-reachable `src/middleware/**`. Those wrapper modules
have no protected top-level imports; sensitive behavior stays in compiler-recognized server callbacks
or protected helpers reached only from that server path. A positive build test covers the real start
configuration, while a negative test proves ordinary client code cannot import protected modules.

## 3. Complete affected-file inventory

### 3.1 Configuration and generated files

- `package.json`, `bun.lock`;
- `.env.example`, `.gitignore`;
- `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`;
- `.github/workflows/the-scenes-ci.yml`;
- `src/start.ts`;
- `src/routeTree.gen.ts` — generated only, never hand-edited;
- `supabase/**`;
- planned scripts/tests/evidence docs.

### 3.2 Shared application/provider boundary

- `src/routes/__root.tsx`;
- `src/store/app-store.tsx`;
- `src/components/layout/public-shell.tsx`;
- `src/components/layout/member-shell.tsx`;
- `src/components/layout/community-shell.tsx`;
- `src/components/layout/creator-shell.tsx`;
- `src/components/domain/cards.tsx`;
- `src/components/layout/auth-shell.tsx`;
- `src/lib/data-mode.ts` and feature contracts/adapters.

### 3.3 Routes

- `login.tsx`, `register.tsx`, `forgot-password.tsx`, `onboarding.tsx`, `settings.tsx`;
- `help.tsx` and `e2e/helpers.ts`/`e2e/README.md` for mode-accurate copy/helpers;
- `home.tsx`, `explore.tsx`, `communities/$communityId.tsx`, `my-learning.tsx`;
- `c/$communityId/classroom.tsx`;
- `c/$communityId/classroom/$courseId.tsx`;
- rename `c/$communityId/classroom/$courseId/$lessonId.tsx` to `$lessonSlug.tsx`;
- local-mode labels/locks in `search.tsx`, `notifications.tsx`, `creators/$handle.tsx`,
  `marketplace.tsx`, `marketplace/$productId.tsx`, `c/$communityId/index.tsx`,
  `c/$communityId/posts/new.tsx`, `c/$communityId/posts/$postId.tsx`,
  `c/$communityId/members.tsx`, `c/$communityId/members/$memberId.tsx`,
  `c/$communityId/calendar.tsx`, `c/$communityId/events/$eventId.tsx`,
  `c/$communityId/leaderboard.tsx`, and `dashboard/**`.

Posts, events, notifications, marketplace, creator/admin analytics, and other later-phase surfaces
remain fixture-only and visibly labelled in local mode. They never receive a silent persistence claim.

## 4. Exact framework integration

### 4.1 `src/start.ts`

```ts
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestIdMiddleware, csrfMiddleware],
  functionMiddleware: [safeErrorMiddleware],
}));
```

`src/server.ts` remains unchanged. Request ID wraps CSRF so rejected calls receive a safe ID.
`src/start.ts` imports only client-reachable middleware wrappers; it never imports `src/server/**` or a
`*.server.*` module.

### 4.2 Request-lazy environment/client

Cloudflare/Nitro runtime variables and TanStack cookie helpers are accessed only during a request.
`getServerEnv()` parses on demand. The Supabase client is request-scoped; at most it is memoized in a
`WeakMap<Request,...>` for calls sharing one request. No user client/session is global.

The Supabase cookie adapter converts TanStack `getCookies()` into `getAll()` entries. `setAll()` calls
`setCookie` for every cookie and applies every cache header with `setResponseHeader`. It never guesses
chunk names or overwrites multiple `Set-Cookie` values with one header.

### 4.3 Middleware API

Function middleware does not assume a direct `request` argument. Request/cookie access uses TanStack
server helpers or composed request middleware. `getClaims()` treats any error or missing data as
unauthenticated and uses `data.claims.sub` on success.

### 4.4 Compiler-recognized server functions and safe handlers

The installed TanStack Start compiler recognizes only a direct root import of `createServerFn` from
`@tanstack/react-start`; it does not transform calls to a project-defined wrapper factory. A
`createSafeServerFn(...).handler(...)` chain would silently lose server-function extraction and produce
an unusable or incorrectly bundled RPC. The plan therefore forbids that shape.

Every public function is written as this exact compiler-visible chain:

```ts
import { createServerFn } from "@tanstack/react-start";

export const signUp = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(withSafeHandler(signUpSchema, async ({ data }) => { /* ... */ }));
```

- `nonThrowingTypedPassthrough` only types and forwards the raw input; it never throws.
- `withSafeHandler(schema, handler)` lives in `src/features/shared/safe-handler.ts`. It parses with Zod
  inside the wrapped handler, catches validation/domain/Auth/provider/database errors, sets the approved
  status/cache headers, redacts logs, and returns the declared safe envelope.
- The shared abstraction wraps handler and validation behavior only. It must never wrap, replace, alias,
  or re-export `createServerFn`.
- A build test asserts every `*.functions.ts` imports `createServerFn` directly and produces a matching
  client stub. A custom factory or re-export fails that test.

Global `safeErrors` middleware is defense in depth only: it returns `next()` normally; if an error
escapes the handler, it performs redacted logging and throws one tested generic 500 transport response.
The route-call adapter normalizes that fallback to `INTERNAL`; raw provider/programming details never
become the client DTO. This fallback path is tested against the exact installed TanStack version.

Side-effect-free reads use GET. Signup, login, logout, profile update, join, leave, enrol and complete
use `createServerFn({ method: "POST" })`. Wrong-method direct requests return 405 and are tested for
every function.

### 4.5 Import protection

Vite protects both:

```text
**/*.server.*
**/server/**
```

The configured marker is `@tanstack/react-start/server-only`. A negative build test and produced-client
bundle scan verify the boundary.

## 5. Build waves

### Wave 0 — approved safety/configuration foundation

Status: complete. Founder approval and the recorded clean-install/loopback-isolation evidence closed
this gate. Legacy hosted accounts/credentials remain forbidden and their cleanup proceeds separately.

Deliver:

- loopback-only Vite/host configuration;
- exact dependency lock and frozen clean install;
- local-only env parser and tests;
- import-protection correction and test fixture;
- initialized unlinked Supabase config with exact Postgres/image evidence;
- Docker listener-isolation proof;
- explicit fixture/local test scripts;
- CI fixture and local-stack jobs;
- ignored raw evidence path;
- deterministic fixture baseline.

Gate: Section 4 of the verification runbook.

Rollback: stop services and remove only Wave 0 additions if abandoned; fixture application remains
complete. No remote link/project exists.

### Wave 1 — schema, grants, RLS, commands, seed

Implement migrations in dependency order. Every exposed table migration includes constraints, indexes,
grants, RLS, and its matching test. Implement the exact data contract, including:

- hardened Auth profile trigger;
- composite workspace/community and course/module/lesson keys;
- separate lesson outline/content;
- caller-bound membership/enrolment/completion commands;
- private transition audit;
- deterministic fictional catalogue actors/content.

Gate: reset twice, seed fingerprint, pgTAP, DB lint, generated-type drift, app-level direct-call and
concurrency tests.

Rollback: reset the disposable local database. Applied local migration files remain forward history;
no remote migration exists.

### Wave 2 — server boundary and application contracts

Deliver request-lazy env/client, verified auth, result/error mapping, safe logs, request ID, local abuse
guard, CSRF/start instance, repositories/services, generated types, fixture/local contracts, and client
boundary checks.

Gate: Section 6 of the runbook plus fixture regression.

Rollback: select the complete fixture adapter and remove only incomplete Wave 2 wiring. Runtime errors
never select fixtures automatically.

### Wave 3 — Auth/profile/viewer vertical slice

Deliver:

- registration fields aligned to the shared handle schema;
- sign-up/sign-in/local sign-out/get-session/update-profile wrappers;
- root server-derived viewer;
- consistent identity in all shells, home, onboarding, and settings;
- handle read-only after registration;
- creator choice labelled as intent/preview only;
- honest forgot-password state and disabled/removed local "Remember me";
- local settings show verified email read-only and remove/disable email-change and password-change
  credential inputs because those writes are out of scope;
- all logout consumers using the same awaited server function.

Gate: Auth, cookie/cache, CSRF, hostile-origin, forged-session, two-context logout, bundle/log redaction,
and all three viewports.

Rollback: fixture Auth adapter remains available only in fixture mode; reset disposable local users.

### Wave 4 — community/course/lesson/progress vertical slice

Deliver:

- community listing/detail and caller membership state;
- explicit onboarding community selection;
- community course list and course outline;
- enrolment;
- lesson detail by slug with protected blocks/resources and completion by UUID;
- server-derived My Learning;
- loader invalidation after profile/join/leave/enrol/complete/sign-in/sign-out;
- external resource anchors with `rel="noopener noreferrer"`;
- unavailable/expired/empty/rollback/retry states.

Gate: complete persistence journey, access matrix, cross-account isolation, direct-call denial,
concurrency/audit counts, all viewports, and independent fixture regression.

Rollback: choose fixture mode; do not revert unrelated files or use broad Git commands.

### Wave 5 — capacity, recovery, and acceptance

Deliver the deterministic benchmark generator, RLS-aware plans, Playwright-context workload, resource
measurements, allowlisted data-only restore into a second isolated local Supabase stack, portability
mapping/export, evidence manifests, and unresolved functionality register.

Gate: Sections 9–11 of the runbook and final independent implementation/security review.

Cleanup: reset disposable source test data; stop/remove only the destination restore stack, its workdir,
ports/resources/volumes and archive; prove the source remains intact; remove raw Auth/load artifacts;
preserve redacted summaries.

## 6. Fixture/local integration rules

- fixture actions stay behind a named fixture adapter;
- local mode always uses server-returned viewer/membership/enrolment/completion state;
- root/public/member/community/creator shells never substitute Ama Boateng in local mode;
- route loaders use stable DTOs and visible errors, not fixture fallbacks;
- mutations invalidate the smallest relevant loader/query boundary;
- the existing fixture route/visual/critical suites always set `VITE_DATA_MODE=fixtures`;
- local suites create real fictional accounts and satisfy membership/enrolment before protected lessons;
- public/local screens label posts, events, notifications, search ranking, creator workspace, and
  marketplace state when they remain fixtures.

### 6.1 Local-mode page/data matrix

| Surface | Real in `supabase-local` | Fixture-labelled / disabled / hidden |
|---|---|---|
| public header/root | session viewer | notification count remains fixture-labelled or hidden |
| Explore | categories, community list, connected course summaries | creators/resources/ranking decorations labelled fixture |
| public community detail | listed metadata, own membership, join/leave | counts, rating, reviews, rules/highlights hidden unless fixture-labelled |
| Home | viewer, own communities (including unlisted), My Learning summary | posts/events blocks carry one visible fixture label or are hidden |
| community shell/index | real metadata/membership; private lock before child content | feed/posts/members/events/leaderboard shown only to allowed members and labelled fixture |
| classroom/course | real course list, outline, enrolment, progress | ratings/student counts/pricing amounts hidden |
| lesson | real outline, protected blocks, resources, completion | simulated video remains explicitly simulated |
| My Learning | real Courses tab and membership-required lock state | Saved and Events tabs labelled not connected |
| Settings | real mutable profile, read-only handle/email, real logout | email/password change inputs absent/disabled; notifications/privacy/danger labelled local fixture |
| Onboarding | real viewer and explicit join actions | interests and creator intent explicitly ephemeral |
| Auth shell/Help | mode-accurate local Auth and service status copy | no claim that all Auth is simulated in local mode |
| Search | fixture-only in Phase 3A | whole result surface labelled fixture; no live-search claim |
| Notifications/marketplace/creator profile/dashboard | none beyond root viewer/logout where present | whole feature labelled fixture/not connected; no production claim |

An unauthorized visitor to a private/unlisted community child route never receives fixture feed,
member, event, leaderboard or lesson content. The route renders the approved concealed/locked state
before any fixture component mounts.

When an allowed local-mode member views fixture-only posts/members/events/leaderboard, hardcoded
`Ama Boateng`, `currentUserId`, `m-you`, composer and edit/create actions are removed or disabled. No
fixture action is attributed to the real viewer. The leaderboard's "you" marker is hidden until that
feature has a backend.

## 7. Remaining unresolved functionality after Phase 3A

Wave 5 records these as fixture-only/not connected:

- posts, comments, likes, follows, and feeds;
- event RSVP/calendar state;
- notifications/read state;
- saved marketplace products, purchases, and downloads;
- creator dashboard content, students, analytics, reviews, earnings, referrals, and role authority;
- admin surfaces;
- search ranking/results outside the connected community/course subset;
- interests/onboarding completion;
- email verification/recovery delivery;
- uploads, native media/live, Realtime, payments, referrals, moderation, AI.

## 8. Approval record

```text
Planning status: ACTIVE UNDER ADR-040 LEAN BUILD + STAGING MODE
Founder approval: LOCAL IMPLEMENTATION APPROVED 5 NOVEMBER; LEAN BUILD + STAGING MODE APPROVED 6 NOVEMBER 2026
Approved scope/date: Phase 3A revision 3 vertical slice / 6 November 2026
First vertical slice: approved in PHASE-3-REVISION-3-SPEC.md
Production actions authorized: NONE
Remote staging actions authorized: NONE YET; agent may present one exact request after local integration readiness
Known blockers:
  Wave 1 live local database/integration gate;
  generated database types;
  Waves 2–4 connected local vertical slice before a staging request.
Parallel incident action: revoke/delete any still-existing legacy hosted project; never reuse it.
```
