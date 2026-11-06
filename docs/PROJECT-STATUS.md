# The Scenes — Current Project Status

**Last updated:** 6 November 2026
**Current stage:** Phase 3A — Wave 1 accepted; Wave 2 implementation checkpoint awaiting one promotion rerun
**Production status:** not deployed; no production provider, payment or user data is connected

This is the one current plain-English checkpoint. Plans, audits and evidence files preserve history,
but their old status paragraphs do not override this page, `AGENTS.md` or accepted ADRs.

## Simple progress view

These are milestone estimates, not percentages generated from lines of code:

- clickable fixture application: **100%**;
- Phase 3A real-data foundation: **about 25%**;
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

Wave 2 has not been promoted because its complete fixture Playwright command encountered two different
development-server/test-harness failures. Every affected test passed when rerun on a fresh server, but
the complete command still needs one clean pass before promotion. Waves 3–5 and every later production
service remain incomplete. The local database stack is stopped. No hosted project, retired credential
or production service was contacted.

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

## Wave 2 implementation checkpoint — 6 November 2026

- focused server/boundary tests: **14 passed, 0 failed**;
- complete unit suite: **139 passed, 0 failed**;
- `bun run typecheck`, `bun run lint`, `bun run build`, `bun run verify:client-boundary`, and
  `git diff --check`: **passed**;
- first fixture run: **25 passed, 1 failed, 4 intentional skips**; a Playwright screenshot caret
  mutation caused a hydration warning, and `caret: "initial"` fixed the targeted desktop test;
- second fixture run: **23 passed, 3 failed, 4 intentional skips** after Vite temporarily failed to
  serve its own dynamic client entry; the three affected checks then passed on fresh servers
  (**3 desktop route/visual + 1 tablet creator-flow test**);
- review: no Critical or High finding remains; no provider implementation or privileged marker appears
  in the client bundle; fixture mode refuses provider creation before network access.

Wave 2 is implemented but not yet promoted because retry-hidden infrastructure failures are not counted
as a clean full gate.

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

Run `bun run test:fixture` once on a fresh server. If all 26 expected checks pass with four intentional
viewport skips, promote Wave 2, update this status, and begin Wave 3 authentication/profile functions.

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
- working tree: contains the Wave 2 checkpoint until its local commit is created;
- ADR-040 documentation checkpoint: `d335749`;
- Wave 1 live-attempt checkpoint: `57eebfe`;
- Wave 1 completion checkpoint: `2d58659`;
- Wave 2 implementation checkpoint: this pending local commit (identifier recorded in Git after commit);
- unresolved risks: the Wave 2 fixture promotion rerun is pending; database lint records one
  Low-severity unused local variable warning in `public.leave_community`; Waves 3–5 remain incomplete.
