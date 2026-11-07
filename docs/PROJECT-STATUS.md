# The Scenes — Current Project Status

**Last updated:** 7 November 2026
**Current stage:** Phase 3A — Waves 1–2 accepted; Wave 3 hosted migration complete and email-confirmation flow awaiting one manual inbox test
**Production status:** not deployed; THE SCENES Supabase project is the final long-term project but remains PRE-PRODUCTION until the release gate passes

This is the one current plain-English checkpoint. Plans, audits and evidence files preserve history,
but their old status paragraphs do not override this page, `AGENTS.md` or accepted ADRs.

## Simple progress view

These are milestone estimates, not percentages generated from lines of code:

- clickable fixture application: **100%**;
- Phase 3A real-data foundation: **about 65%**;
- complete Phase 0–10 product vision: **about 30%**;
- ready for real public users: **no**.

## What is complete

- Phase 0 governance and architecture foundation;
- Phase 1 design direction;
- Phase 2 fixture-backed frontend with all 30 primary page types;
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
  until a verified session exists.

## What is not complete

Wave 3 now has shared registration/profile schemas and direct server-function/service foundations for
signup, login, logout, verified viewer and profile update. One real-inbox confirmation click, hosted
Auth behavior tests, complete connected browser acceptance and the complete fresh fixture regression
remain incomplete. Waves 3–5 and every later production service remain incomplete. The local database
stack is stopped.

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
remote project now has exactly 18 accepted migration-history entries, 15 expected public tables and the
private audit table. Every expected table has RLS enabled and remains empty because no seed ran. No
customer data or payment exists, and no production deployment is claimed.

## Latest verified checks — 7 November 2026

- focused environment/server-boundary tests: **40 passed, 0 failed**;
- complete unit suite: **150 passed, 0 failed**;
- TypeScript check: passed;
- ESLint: passed after one formatting-only correction in the new cookie test;
- production application build: passed;
- client/server boundary scan: passed;
- `git diff --check`: passed;
- hosted-mode browser checks: unauthenticated onboarding/settings redirect safely, no fixture identity
  appears, confirmation parameters are stripped, unsafe return paths are normalized, and no console or
  meaningful network failure was observed;
- the previously accepted fixture browser baseline remains **26 passed, 4 intentional duplicate
  viewport skips**, but one complete fresh fixture run has not yet passed on this changed tree and is
  therefore not claimed as a current promotion gate.

These checks verify the hosted-mode foundation and local confirmation handoff on the current tree. They
do not replace the pending real-inbox confirmation and hosted Auth acceptance tests.

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

Use one fictional account with the founder-controlled inbox to register through the local hosted-mode
browser, click the confirmation email manually, then sign in with the password. Do not share the email
password or confirmation link in chat. After that succeeds, finish hosted negative tests and connected
browser acceptance before promoting Wave 3.

## Remote project boundary

- final Supabase project: **THE SCENES**;
- project reference: `okdzuqgzgnmmbtjxdaci`;
- current classification: **PRE-PRODUCTION**;
- separate staging project: **will not be created**;
- email confirmation: **enabled and required**;
- current remote schema/migration state: 18 accepted migrations, no seed, empty application tables;
- forbidden: remote reset/drop, seed, real customer data, payment, service-role material in application
  code, production deployment claim and unapproved Git push.

## Checkpoint state

- Founder input needed: **one manual confirmation-email click after the checkpoint commit**;
- working tree: hosted migration evidence and confirmation flow verified locally, awaiting checkpoint;
- ADR-040 documentation checkpoint: `d335749`;
- Wave 1 live-attempt checkpoint: `57eebfe`;
- Wave 1 completion checkpoint: `2d58659`;
- Wave 2 implementation checkpoint: `0389591`;
- Wave 2 completion checkpoint: `7ac5089`;
- Wave 3 foundation checkpoint: `d023fe2`;
- Wave 3 profile/limiter checkpoint: `f5173aa`;
- unresolved risks: database lint records one Low-severity unused local variable warning in
  `public.leave_community`; hosted confirmation/Auth and current-tree browser gates are incomplete;
  Waves 3–5 remain incomplete.
