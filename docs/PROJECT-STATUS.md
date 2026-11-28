# The Scenes — Current Project Status

**Last updated:** 19 November 2026
**Current stage:** Phase 3A Waves 1–4 complete and the learning vertical slice accepted; Wave 5 capacity/recovery evidence formally deferred by founder decision (ADR-041); Phase 4 revision 2 approved for P4-S1 account email/password recovery (ADR-042 code/local; ADR-043 hosted account-email config on THE SCENES) and for the code/local scope of P4-S2 to P4-S5 one slice at a time (ADR-044); P4-S2 rate limiting, P4-S3 connected in-app notifications, P4-S4 feedback channel and P4-S5 PWA are implemented code/local, and deployment configuration is now driven by the runtime environment (ADR-045); P4-S2 now additionally has **local development** connected to a temporary Upstash Redis database with 26/26 proof checks passing (19 November 2026, see below) — this is not staging or production use; P4-S6 (web push) and P4-S7 (R2) remain not approved
**Production status:** not deployed; THE SCENES Supabase project is the final long-term project but remains PRE-PRODUCTION until the release gate passes

This is the one current plain-English checkpoint. Plans, audits and evidence files preserve history,
but their old status paragraphs do not override this page, `AGENTS.md` or accepted ADRs.

## Feedback switched to GitHub Issues — 26 November 2026 (ADR-049)

The WhatsApp direct-chat feedback backend (ADR-048) is replaced by a GitHub Issue created server-side
through the official GitHub REST API. `FEEDBACK_PROVIDER=github` plus `GITHUB_FEEDBACK_REPO` and
`GITHUB_FEEDBACK_TOKEN` selects it; those values are server-only and never committed. Each submission
becomes an Issue with category labels and a title prefix such as `[BUG] Course enrollment problem`.
The private repository is the founder's management interface — no feedback database, no Supabase
feedback table, no owner dashboard. Setup: `docs/GITHUB-FEEDBACK-SETUP.md`. The old
`docs/WHATSAPP-FEEDBACK-SETUP.md` was removed. No real token, hosted variable or deployment is
claimed.

## P4-S2 rate limiter connected to Upstash — 19 November 2026 (local development only)

At the founder's explicit request, the official Upstash CLI (`npx -y upstash setup --opencode`) installed
the **Upstash MCP server** (`https://mcp.upstash.com/mcp`, OAuth on first use) and the **Upstash skills**
into `~/.config/opencode`. The same CLI minted a temporary database, which was then **claimed into the
founder's Personal team** and is now a permanent **Free-tier** database:

- Name `the-scenes-rate-limit`, **Region Cape Town, South Africa (`af-south-1`)**, Free plan, $0/month.
- `RATE_LIMIT_DRIVER=upstash`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and a generated
  64-hex `RATE_LIMIT_HASH_SECRET` live in the git-ignored `.env`; all four are server-only and absent
  from the client bundle. It stores only `rl:*` keys.
- Evidence: `bun run verify:rate-limit:prove` → **26/26 checks passed**, including two separate OS
  processes sharing one bucket (20 allowed / 4 blocked of 24 concurrent `login` attempts), a cold-start
  process inheriting the limit, a `memory` control admitting 24/24, provider-side counter `24` with a
  ~15-minute TTL, fail-closed auth vs fail-open learning writes, a real-endpoint 401 rejection, and a
  clean client bundle. Output: `.audit/p4-s2-upstash/prove-af-south-1.txt` and timestamped JSON.
- Latency from this development machine to `af-south-1`: limiter `p50 77.7 ms` / `p95 85.6 ms`, equal to
  a bare `PING` within noise. (An earlier unclaimed instance in the default region measured 239 ms,
  which is what motivated the Cape Town region choice.) Still not a production latency claim — measure
  again with the Worker deployed near the database.
- Command cost reduced (19 November 2026): an allowed check now costs 2 billed commands instead of 3
  (`PTTL` is only requested when a request is rejected), and repeats of a provider-confirmed block are
  answered locally at 0 commands. Before/after table: `docs/RATE-LIMITING.md#resource-cost`.
- Still **not** authorized or done: setting hosted staging or production secrets, any deployment, or any
  load/scale claim (ADR-041).

## Founder working mode update — 13 November 2026 (ADR-046)

The founder set the standing working mode: local-first work with no Docker dependency, code synced to
GitHub when needed; hosted/provider actions run only when the founder connects the required tools and
approves the target; the founder creates provider accounts (Resend, Upstash, others) himself, with the
environment contract kept ready so pasted credentials work; feedback uses a direct WhatsApp chat to
the founder (`wa.me`, ADR-048) instead of the blocked Telegram bot; after a GitHub push and Cloudflare
deployment the founder tests himself; and agents summarize reviews, plans and blockers in chat in plain
English.
The historical root audits (`*_AUDIT.md`, `ARCHITECTURAL_RISKS.md`, `RECOMMENDED_CHANGES.md`,
`FINAL_ARCHITECTURE_ASSESSMENT.md`) describe the pre-implementation Phase 0 state and are superseded
by this page.

## Frontend audit Batch 1 — 14 November 2026

A frontend/competitor audit (`docs/FRONTEND-COMPETITOR-AUDIT-2026-11-14.docx`) reviewed the
implemented surfaces against the reference Skool/Circle material and the creator-setup guidance.
Batch 1 implemented only compute-safe, in-phase public-surface and accessibility work; no
backend, payment, admin, AI or provider wiring was added.

- New public `/become-a-teacher` teacher-recruitment page (surfaces, steps, honest "what is not
  connected" status, FAQ). Linked from primary nav, footer and category pages.
- New public `/categories/$slug` category landing page from the data-driven seed categories.
  Linked from the landing category grid, Explore's selected-category hint, the public community
  page's category badge, and cross-linked between categories.
- Landing category links now resolve to category pages instead of pre-filtered Explore URLs.
- Accessibility: account/avatar menu accessible names now include initials on the public, member
  and community shells; the category page gained an `h2` section heading to keep heading order
  sequential.
- Docs corrected: `docs/FRONTEND-RESEARCH-EVIDENCE.md` creator routes now use the real
  `/dashboard/*` paths instead of the assumed `/workspace/*`.

Verification at this batch: `typecheck` and `eslint` pass; production build passes; Playwright
fixture suite is **32 passed, 16 skipped, 0 failed** across desktop/tablet/mobile, including the
two new canonical routes and the internal-link graph; Lighthouse on `/c/ai-builders-guild`,
`/become-a-teacher` and `/categories/ai-automation` is accessibility/best-practices/SEO **1.0**
with no failures; zero console errors on the changed pages.

Still intentionally out of scope (needs founder decisions or a later approved phase): real
payments/checkout for creators, admin workspace, marketplace transactions, production auth and
secrets, AI layer, web push, R2, and any one-to-one competitor copy or protected content.

## Frontend audit Batch 2 — 14 November 2026

Batch 2 extended fixture-only onboarding, engagement and creator surfaces. Nothing here connects a
provider or a payment; every "connected" claim is withheld and each surface says plainly what is a
local preview.

- Onboarding: a guided first-run flow and community screening questions (up to three) on the public
  community page before joining.
- Member home "Start here" checklist on the community feed, with dismiss and progress controls.
- Events: email-reminder toggle on the event page (copy states no email is sent), RSVP retained.
- Gamification view: levels, points and leaderboard remaining fixture-driven.
- Creator analytics and referral dashboard: fixture metrics with explicit "not financial data" labels.
- Pricing clarity page copy aligned to the approved external-link launch direction (ADR-029).

Verification at this batch: typecheck, eslint, production build and Playwright all passed; the
interaction review confirmed the checklist counter, event-reminder toggle and welcome notification
work. Prior intermittent failures were React hydration timing and cross-tab fixture-state artifacts,
not code faults.

## Frontend audit Batch 3 — 14 November 2026

Batch 3 closed the remaining competitor-parity gaps that can be implemented safely in the fixture
frontend: no-emoji cleanup, creator branding/media uploads, creator-managed categories, drip content,
Course Key import, deeper affiliate controls, spaces/layouts, discovery keywords, a custom-domain
placeholder, a posting-level gate, a creator setup checklist and a member location summary. Uploads
are preview-only (`URL.createObjectURL`) and every control states that storage is not connected.

- No-emoji policy: removed the last decorative glyphs (`✓`, `✕`, `●`, `→`, `⌘`) from `src`, replacing
  them with real Lucide icons or styled dots. No emoji remain in the product source.
- Branding/media: a shared `MediaCover`/`MediaUploadField` primitive renders real images with generated
  fallback art. Community icon (128×128), wordmark logo (200×50), cover (1084×576) and course cover
  (1460×752) uploads exist in the creator workspace; license-safe generated SVG placeholders live in
  `public/media/`.
- Creator categories: `/dashboard/categories` lets a creator create and remove draft categories, which
  become selectable in the community editor. Public listing still requires review.
- Drip content: lessons support a per-lesson unlock delay measured from the member's join date; locked
  lessons show an unlock explanation and cannot be completed.
- Course Key import: a creator can enter an `ABCD-1234-EFGH` key to duplicate fixture content locally.
- Affiliate depth: 10%–50% commission control, affiliate performance table, invitation links with access
  level, trial length and coupon, and a "payouts not connected" placeholder.
- Spaces/layouts and discovery: community settings gained Branding, Spaces and Discovery tabs (space
  groups, space types, Feed/List/Card layouts, space icon uploads, external links, up to 11 SEO
  keywords, custom-domain placeholder, minimum posting level).
- Creator setup checklist on `/dashboard/creator`; 72-hour email-broadcast cooldown copy; member location
  summary on the community members page.

Verification at this batch: `tsc --noEmit` (app and scripts), `eslint`, and the production build pass;
Playwright route/visual contracts pass; the full fixture suite is unchanged at **32 passed, 16 skipped,
0 failed**. `docs/COMPETITIVE-PARITY-MATRIX.md` maps every report item to implemented, placeholder or
blocked.

## Simple progress view

These are milestone estimates, not percentages generated from lines of code:

- clickable fixture application: **100%**;
- Phase 3A learning vertical slice (Waves 1–4): **complete and verified**;
- Phase 3A capacity/recovery rehearsal (Wave 5): **deferred by founder decision (ADR-041)**;
- complete Phase 0–10 product vision: **about 30%**;
- ready for real public users: **no**.

## What is complete

- Phase 0 governance and architecture foundation;
- Phase 1 design direction;
- Phase 2 fixture-backed frontend with all 32 primary page types;
- responsive fixture verification on desktop, tablet and mobile;
- Phase 3A Wave 0 clean-install, environment and loopback-isolation setup;
- Phase 3A Wave 1 implementation files: 18 migrations, deterministic seed, database security tests,
  command tests and local database gate tooling;
- Phase 3A Wave 1 live local gate: migrations, deterministic resets, 239 database tests, schema lint,
  generated-type drift and seven real API integration tests;
- loopback isolation preserved across database resets and pgTAP helper containers;
- Wave 2 server/security implementation: request-lazy configuration, request-scoped Supabase client,
  hardened cookies/cache headers, verified-claims helper, request IDs, CSRF, safe errors/log redaction,
  local rate limiting, initial repository/service boundary and client-bundle protection;
- focused local Auth integration: 4 tests and 37 assertions covering profile bootstrap, verified claims,
  hostile metadata, duplicate handles, provider-safe login failures, partial profile updates and
  cross-account denial;
- initial connected registration, login, root viewer, onboarding, settings and awaited-logout UI;
- explicit `supabase-staging` environment validation using only an HTTPS project root and a modern
  `sb_publishable_...` key, with cookie security derived from the application request protocol;
- exactly 18 accepted migrations applied to the empty THE SCENES pre-production project with no seed,
  role file, reset or history repair;
- hosted schema/RLS/grant/function/trigger verification and post-migration advisors;
- hosted Auth URL configuration with Confirm Email preserved;
- a confirm-then-password-login handoff that strips provider details and blocks onboarding/settings
  until a verified session exists;
- founder-reported real-inbox verification: pre-confirmation login blocked, confirmation returned to
  login, post-confirmation login succeeded, and onboarding opened;
- Wave 3 closure: 27 negative auth tests covering open-redirect prevention, origin validation,
  confirmation parameter stripping, and approved-path enforcement;
- Wave 4 server foundation: `CommunityRepository`, `LearningRepository`,
  `community.service.server.ts`, `learning.service.server.ts`, `learning.functions.ts` with
  `joinCommunity`, `leaveCommunity`, `enrolInCourse`, `completeLesson`, and `getLearningState`;
  `getSessionProfile` now returns real joined-community membership data;
- Wave 4 connected catalogue/repository, real Explore/community/classroom/lesson/My Learning data,
  protected-content locks, onboarding community selection, real progress hydration, and external HTTPS
  resources;
- hosted deterministic fictional catalogue loaded after founder authorization and exact dry run;
- Wave 4 RLS/access/idempotency/leave-rejoin matrix passed in rolled-back hosted transactions;
- hosted public browser acceptance: 12 checks passed across desktop, tablet, and mobile;
- fresh fixture regression: 26 passed, 16 expected skips (12 hosted-only connected checks plus 4
  duplicate viewport route checks), 0 failed;
- Wave 5 query plans: all 5 core Wave 4 application queries use index scans with no sequential
  scan observed on the hosted pre-production database.
- Phase 4 code/local: runtime configuration resolved from the merged Cloudflare `__env__` bindings plus
  `process.env` (ADR-045); build-time data-mode module removed; a misconfigured connected deployment
  fails closed with a variable-name-only notice. P4-S2 distributed rate limiting, P4-S3 connected
  in-app notifications, P4-S4 GitHub Issues/memory feedback provider and P4-S5 PWA/installability are
  implemented with tests. Settings → Account shows a read-only integration health report (names and
  states only). P4-S6 web push, P4-S7 R2 and application (Resend) email are reported `disabled`.

## What is not complete

The Phase 3A learning vertical slice (Waves 1–4) is complete and independently verified. By founder
decision in ADR-041, the Wave 5 capacity/recovery rehearsal is **formally deferred**: the deterministic
representative dataset, 25-operation/second sustained workload, burst and 30-second recovery
measurement, `EXPLAIN (ANALYZE, BUFFERS)` manifest, allowlisted data-only restore rehearsal, and
portability export are not executed. This is a recorded residual risk, not a claim that every Phase 3
exit criterion is met. The rehearsal remains a mandatory precondition before any staging load test,
public launch, or scale claim. The local database stack is stopped; the Docker engine was unavailable
and the unrelated `call-hola` local Supabase project owns the usual ports, which this project did not
stop or modify. The founder-controlled account did not establish an active session in the shared test
browser, so the authenticated browser replay of join → enrol → protected lesson → complete → reload was
not captured on this tree; those same transitions were verified at the hosted database/RLS boundary.

Profile updates now preserve omitted optional fields, clear only explicit `null`, and route persistence
through the profile repository. The local limiter now removes expired buckets and enforces a fixed
maximum bucket count without adding a provider or dependency.
The focused local Auth suite now passes in the supported WSL2 environment: registration/profile
bootstrap, verified claims, hostile metadata, duplicate-handle atomicity, safe login failure, partial
profile updates and profile isolation all execute with user-scoped clients. The earlier JWT-expired
failure was an approximately eight-hour Windows/WSL clock mismatch; running GoTrue and the Auth test
process together inside WSL resolved it without weakening expiry or claim verification. A dedicated
`test:integration:auth` command prevents the unrelated database concurrency suite from being selected.
The founder designated **THE SCENES** (`okdzuqgzgnmmbtjxdaci`) as the application's final long-term
Supabase project. It is intentionally treated as **PRE-PRODUCTION** until the release gate passes; no
separate staging project will be created. Email confirmation is enabled and must remain enabled. The
remote project now has exactly 19 accepted migration-history entries, 17 expected public tables and the
private audit table. Every expected table has RLS enabled. The founder-authorized deterministic
fictional catalogue is loaded; it contains no seeded learner, customer, payment, membership, enrolment,
or completion. No production deployment is claimed.

Phase 4 code/local gaps that remain explicit:

- the P4-S3 notifications migration (`20261111120000_phase4_0019_notifications.sql`) is written and
  unit-tested but **not applied** to `okdzuqgzgnmmbtjxdaci`; applying it needs a separate approval and a
  reviewed remote migration history;
- the P4-S4 GitHub feedback repository, the P4-S2 Upstash database and the P4-S1 Resend domain/key are **not
  created**; the code is configuration-ready and fails safe without them;
- P4-S5 is code/local only; no deployment has been made and the service worker is registered only in a
  production build;
- P4-S6 (web push) and P4-S7 (R2 objects) are **not approved and not implemented**.

See `docs/CLOUDFLARE-DEPLOYMENT.md` for the variables and verification steps an approved deployment uses.

## Phase 4 code/local verified checks — 11 November 2026

- complete unit suite: **264 passed, 0 failed** across 23 files (adds runtime-environment, P4-S4
  feedback/integration-health and P4-S5 PWA conformance coverage);
- `bun run typecheck`, `bun run lint`, `bun run verify:client-boundary` and `bun run build`: passed;
- production build copies `manifest.webmanifest`, `sw.js`, `offline.html` and owned icons into
  `.output/public`, and the built Worker reads `globalThis.__env__`;
- `bun run test:fixture`: fixture browser suite passed with expected skips and 0 failures (see the
  evidence manifest for the exact counts of the run);
- manual browser check: `VITE_DATA_MODE=supabase-staging` with no URL/key rendered the configuration
  notice (HTTP 200) with no fixture identity and no mode leak.

These are code/local checks. They do not prove a hosted deployment, a real WhatsApp handoff, a real
push subscription, an Upstash connection, or Wave 5 capacity/recovery.

## Phase 3A verified checks — 11 November 2026

- focused environment/server-boundary tests: **40 passed, 0 failed**;
- complete unit suite: **177 passed, 0 failed**;
- TypeScript check: passed;
- ESLint: passed;
- production application build: passed;
- client/server boundary scan: passed;
- dependency audit: no reported vulnerabilities across 505 packages after the repository's one explicit
  advisory exception;
- `git diff --check`: passed;
- hosted-mode browser checks: unauthenticated onboarding/settings redirect safely, no fixture identity
  appears, confirmation parameters are stripped, unsafe return paths are normalized, and no console or
  meaningful network failure was observed;
- founder-reported manual hosted journey: check-email state, pre-confirmation denial, confirmation
  return, post-confirmation login and onboarding all passed;
- Wave 5 query plans: 5 core queries confirmed to use index scans, no sequential scan, on hosted
  pre-production database via MCP `EXPLAIN (FORMAT JSON)`;
- fresh fixture browser regression (11 November review tree): **26 passed, 16 expected skips, 0
  failed**; 12 skips are the hosted-only connected suite and 4 are duplicate viewport route checks;
- hosted public connected browser suite: **12 passed, 0 failed** across all three viewports;
- rolled-back hosted access matrix: join/enrol/complete, cross-user isolation, private concealment,
  idempotency, leave lock, history preservation, and rejoin restoration passed.

These checks verify Waves 1–4 on the current tree. They do not replace Wave 5's capacity, recovery,
restore, portability, and final acceptance gates.

## Wave 1 live acceptance — 6 November 2026

- `bun run phase3:stack:start`: **passed**, `isolated: true`;
- `bun run db:reset`: **passed**, all 18 migrations and seed applied;
- `bun run db:test`: **239 passed, 0 failed**;
- `bun run test:db`: **passed**; both reset fingerprints matched
  `3dfef29769540bdd5896bcb5ba8ec659`, database lint passed and generated types matched;
- `bun run test:integration`: **7 passed, 0 failed**, 117 assertions;
- `bun run test:unit`: **127 passed, 0 failed**;
- `bun run typecheck`, `bun run lint`, `bun run build`, `git diff --check`: **passed**;
- `bun run phase3:stack:stop`: **passed**; no project containers remain.

Redacted evidence is in `docs/evidence/phase-3/2026-11-06-phase3a-wave1-live/`.

## Wave 2 acceptance — 6 November 2026

- focused server/boundary tests: **15 passed, 0 failed**;
- local/server integration: **20 passed, 0 failed**, including a loopback-only local Auth smoke;
- complete unit suite: **139 passed, 0 failed**;
- `bun run typecheck`, `bun run lint`, `bun run build`, `bun run verify:client-boundary`, and
  `git diff --check`: **passed**;
- first fixture run: **25 passed, 1 failed, 4 intentional skips**; a Playwright screenshot caret
  mutation caused a hydration warning, and `caret: "initial"` fixed the targeted desktop test;
- second fixture run: **23 passed, 3 failed, 4 intentional skips** after Vite temporarily failed to
  serve its own dynamic client entry; the three affected checks then passed on fresh servers
  (**3 desktop route/visual + 1 tablet creator-flow test**);
- review: no Critical or High finding remains; no provider implementation or privileged marker appears
  in the client bundle; fixture mode refuses provider creation before network access;
- final fixture promotion run: **26 passed, 4 intentional skips, 0 failed**;
- escaped unexpected errors now log only request ID and safe error class/name before returning the
  generic no-store 500 envelope; missing/cross-site/mismatched-origin CSRF cases are executable denials.

**Wave 2 is promoted.**

## Official working mode — lean build + pre-production final project

The founder approved this mode on 6 November 2026:

1. Build one useful end-to-end vertical slice instead of broad disconnected infrastructure.
2. Reuse approved decisions and plans; do not repeat speculative reviews without new evidence.
3. Run each essential local security/data gate once, rerunning only after a relevant change or failure.
4. Make integrations plug-ready with an environment contract, adapter, setup/health check and test.
5. At the point of need, inspect and use authorized skills, CLIs, MCPs and browser/runtime tools.
6. If a required capability is missing, ask the founder once, in plain language, with purpose, cost,
   permission impact and the work that can continue without it.
7. Use only the founder-designated THE SCENES Supabase project for remote verification; do not create a
   separate staging project.
8. Never request secrets in chat. The founder places them in an ignored local file or approved secret
   store, and the agent verifies their presence without printing values.
9. Pre-production access does not authorize production deployment, payments or live customer data.

## Exact next step

Phase 3A Waves 1–4 are accepted; the Wave 5 capacity/recovery rehearsal is deferred under ADR-041.

Phase 4 revision 2 is approved for **P4-S1** (code/local ADR-042, 11 November 2026; hosted account-email
configuration on THE SCENES `okdzuqgzgnmmbtjxdaci` ADR-043, 11 November 2026) and for the **code/local
scope of P4-S2 ... P4-S5**, one slice at a time (ADR-044, 11 November 2026). Supabase Auth remains the
token authority.

1. The P4-S1 recovery journey, redirect allowlist, setup checker, tests and documentation are implemented
   and committed.
2. Apply the hosted Auth settings on THE SCENES only — URL allowlist plus Resend custom SMTP. The agent
   cannot script these (no Auth tools in the available MCP), so the founder does the dashboard steps.
3. Create the Resend account, verify the domain and place the scoped key in the Supabase project.
4. Run one founder-controlled inbox test, then record connected evidence.
5. P4-S2 (distributed rate limiting) is implemented as code/local work: a stable `RateLimiter`
   interface, HMAC-hashed subjects, bounded memory and fetch-compatible Upstash REST implementations,
   documented policies for signup, login, password reset, join, enrol, complete and the future feedback
   form, and explicit fail-closed/fail-open behaviour. P4-S3 (connected in-app notifications) is also
   implemented as code/local work: an additive migration with owner-only notification/preference tables,
   an atomic audit-trigger that maps `community.joined` and `course.enrolled` to notifications, a
   keyset-paginated connected `/notifications` page, a connected unread badge, and connected preference
   editing in Settings. The local database gate could not run (Docker unavailable), so the live
   RLS/constraint matrix remains owed. P4-S4 (feedback
   channel) and P4-S5 (PWA/installability) follow as code/local slices only, each with its own tests,
   redacted evidence and commit. No provider account, hosted migration application, sending to real
   addresses, deployment or real customer data is authorized. P4-S6 (web push) and P4-S7 (R2 objects)
   are not approved. `docs/PHASE-4-PLAN.md` §11 records each remaining provider decision.

The deferred Wave 5 rehearsal must run before any staging load test or public launch.

## Remote project boundary

- final Supabase project: **THE SCENES**;
- project reference: `okdzuqgzgnmmbtjxdaci`;
- current classification: **PRE-PRODUCTION**;
- separate staging project: **will not be created**;
- email confirmation: **enabled and required**;
- current remote schema/migration state: 18 accepted migrations plus the founder-authorized fictional
  catalogue; no learner seed or customer/payment data;
- forbidden: remote reset/drop, real customer data, payment, service-role material in application
  code, production deployment claim and unapproved Git push.

## Checkpoint state

- Founder action needed: **create a Resend API key (Sending access) and a verified sending domain, then
  enter the Resend SMTP values in Supabase Auth on THE SCENES**, then run one inbox test (ADR-043).
  Verified read-only on 19 November 2026: the Resend account exists but has no domain and no API key, and
  Supabase Auth custom SMTP is still off; the Auth URL allowlist holds one local wildcard entry and the
  Site URL is `http://127.0.0.1:5000/login`. Details in `docs/ACCOUNT-EMAIL-SETUP.md`. The Supabase MCP
  here resolves to VOICE SYSTEM and must not be used until corrected. The deferred Wave 5 rehearsal still
  needs Docker/credit before any staging load test or public launch;
- working tree: **uncommitted fixture media and copy pass on `main` (16 November 2026)**; Phase 4
  revision-2 review committed at `9cc91e3`; P4-S1 code/local committed; hosted account-email config
  approved (ADR-043) and pending the founder dashboard/Resend steps; P4-S2 to P4-S5 code/local
  approved (ADR-044), one slice at a time;
- fixture media/copy pass (16 November 2026): real CC0/public-domain covers with provenance in
  `docs/ASSET-PROVENANCE.md`, four real app screenshots on the public landing page, uploadable
  wordmark logos, and "Coming soon" copy replacing internal engineering wording. No provider or
  storage integration is connected; uploads remain preview-only. Targeted verification: typecheck,
  lint, build and 30 Playwright tests passed;
- P4-S2 rate limiting implemented code/local (memory + Upstash adapter, no account or hosted migration);
- P4-S3 connected in-app notifications implemented code/local (additive migration authored but not
  applied; connected page, badge and preferences; fixture behaviour unchanged; Docker DB gate not run);
- ADR-040 documentation checkpoint: `d335749`;
- Wave 1 live-attempt checkpoint: `57eebfe`;
- Wave 1 completion checkpoint: `2d58659`;
- Wave 2 implementation checkpoint: `0389591`;
- Wave 2 completion checkpoint: `7ac5089`;
- Wave 3 foundation checkpoint: `d023fe2`;
- Wave 3 profile/limiter checkpoint: `f5173aa`;
- Wave 4 hosted integration checkpoint: `fdc5c8f`;
- unresolved risks: database lint records one Low-severity unused local variable warning in
  `public.leave_community`; Supabase leaked-password protection requires Pro; **Wave 5
  capacity/recovery evidence is deferred by founder decision (ADR-041)**.
