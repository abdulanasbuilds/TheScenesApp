# The Scenes — Current Project Status

**Last updated:** 6 November 2026
**Current stage:** Phase 3A — Waves 1–2 accepted; Wave 3 authentication/profile foundation in progress
**Production status:** not deployed; no production provider, payment or user data is connected

This is the one current plain-English checkpoint. Plans, audits and evidence files preserve history,
but their old status paragraphs do not override this page, `AGENTS.md` or accepted ADRs.

## Simple progress view

These are milestone estimates, not percentages generated from lines of code:

- clickable fixture application: **100%**;
- Phase 3A real-data foundation: **about 55%**;
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
  local rate limiting, initial repository/service boundary and client-bundle protection.

## What is not complete

Wave 3 now has shared registration/profile schemas and direct server-function/service foundations for
signup, login, logout, verified viewer and profile update. UI connection and live local auth/browser
evidence remain incomplete. Waves 3–5 and every later production service remain incomplete. The local database stack is stopped.

Profile updates now preserve omitted optional fields, clear only explicit `null`, and route persistence
through the profile repository. The local limiter now removes expired buckets and enforces a fixed
maximum bucket count without adding a provider or dependency.
The focused local Auth suite now passes in the supported WSL2 environment: registration/profile
bootstrap, verified claims, hostile metadata, duplicate-handle atomicity, safe login failure, partial
profile updates and profile isolation all execute with user-scoped clients. The earlier JWT-expired
failure was an approximately eight-hour Windows/WSL clock mismatch; running GoTrue and the Auth test
process together inside WSL resolved it without weakening expiry or claim verification. A dedicated
`test:integration:auth` command prevents the unrelated database concurrency suite from being selected.
No hosted project, retired credential or production service was contacted.

## Latest verified checks — 6 November 2026

- TypeScript check: passed;
- ESLint: passed;
- unit tests: **126 passed, 0 failed**;
- application build: passed;
- fixture browser suite: **26 passed, 4 intentional duplicate viewport skips**;
- dependency audit: passed with the repository's documented ignored advisory;
- Git working tree before this status-policy update: clean and synchronized with `origin/main`.

These checks prove that the fixture application and static Wave 1 tooling are healthy. They do not
prove that the database implementation works at runtime.

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

## Official working mode — lean build + staging

The founder approved this mode on 6 November 2026:

1. Build one useful end-to-end vertical slice instead of broad disconnected infrastructure.
2. Reuse approved decisions and plans; do not repeat speculative reviews without new evidence.
3. Run each essential local security/data gate once, rerunning only after a relevant change or failure.
4. Make integrations plug-ready with an environment contract, adapter, setup/health check and test.
5. At the point of need, inspect and use authorized skills, CLIs, MCPs and browser/runtime tools.
6. If a required capability is missing, ask the founder once, in plain language, with purpose, cost,
   permission impact and the work that can continue without it.
7. Ask for fresh staging configuration only when the corresponding integration is ready to verify.
8. Never request secrets in chat. The founder places them in an ignored local file or approved secret
   store, and the agent verifies their presence without printing values.
9. Staging does not authorize production, deployment, payments or live customer data.

## Exact next step

Add transformed server-function HTTP tests for safe signup/login responses, cookie creation/clearing,
verified viewer identity, wrong methods, CSRF and logout. Run the server process in WSL with the local
stack so claim validation uses one clock, then connect the accepted auth/settings UI and root viewer.

## When staging will be requested

After the vertical slice works locally and has a setup checker, the agent will present one staging
request containing:

- the exact provider/account needed;
- the exact non-secret identifiers and secret variable names;
- where the founder should configure them securely;
- any cost or remote change;
- the verification and rollback commands.

Only after explicit approval may a fresh business-controlled staging resource be created, linked,
migrated or tested. Retired accounts and credentials must never be reused.

## Checkpoint state

- Founder input needed: **no**;
- working tree: clean after the Wave 3 foundation checkpoint;
- ADR-040 documentation checkpoint: `d335749`;
- Wave 1 live-attempt checkpoint: `57eebfe`;
- Wave 1 completion checkpoint: `2d58659`;
- Wave 2 implementation checkpoint: `0389591`;
- Wave 2 completion checkpoint: `7ac5089`;
- Wave 3 foundation checkpoint: `d023fe2`;
- Wave 3 profile/limiter checkpoint: `f5173aa`;
- unresolved risks: database lint records one Low-severity unused local variable warning in
  `public.leave_community`; Waves 3–5 remain incomplete.
