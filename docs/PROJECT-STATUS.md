# The Scenes — Current Project Status

**Last updated:** 6 November 2026
**Current stage:** Phase 3A — local database gate, then lean end-to-end learning slice
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
- Wave 1 static review and non-database checks.

## What is not complete

Wave 1 has not run against the local PostgreSQL/Supabase engine. Therefore SQL execution, row-level
security, grants, Auth behavior, generated database types and concurrency are not yet proven. Waves
2–5 and every later production service remain incomplete.

The local database container is currently stopped. No hosted project or production service was
contacted during the 6 November status check.

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

Run the Wave 1 local gate in the supported WSL2 environment:

1. start the loopback-isolated local stack;
2. apply all migrations and deterministic seed;
3. generate the database type file;
4. run reset/fingerprint, pgTAP, database lint and type-drift checks;
5. run real local Auth/Data API/RPC integration tests;
6. stop the stack and record redacted evidence.

If that passes, accept Wave 1 and build Waves 2–4 as the approved account → profile → community →
course → lesson completion → persisted progress slice. Do not pause for another broad planning cycle
unless the implementation exposes a new material product, security, data or provider decision.

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
