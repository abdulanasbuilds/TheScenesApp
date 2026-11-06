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

Wave 1 has now run against the local PostgreSQL/Supabase engine, but it has **not passed** its complete
gate. All migrations and the deterministic seed executed, database types were generated, and
the latest focused pgTAP run reached 234 passing assertions with no assertion failure. The pgTAP
process still failed because two remaining RLS test queries read the deliberately non-granted internal
`courses.status` column. The real API integration suite has therefore not run yet.

Waves 2–5 and every later production service remain incomplete. The local database stack was stopped
after the failed attempt. No hosted project, old credential or production service was contacted.

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

## Wave 1 live attempt — 6 November 2026

- `bun run phase3:stack:start`: **passed**; four listeners were loopback-only and the wrapper reported
  `isolated: true`;
- `bun run db:reset`: **passed**; all 18 migrations and the deterministic seed applied;
- `bun run db:types:write`: **passed**; `db/database.types.ts` was generated and inspected;
- `bun run test:db`: **failed at pgTAP** after both reset fingerprints matched
  `3dfef29769540bdd5896bcb5ba8ec659`;
- first focused repair check, `bun run db:test`: **failed** after exposing deeper test-shape issues;
- second focused repair check, `bun run db:test`: **failed process exit** with **234 assertions passed,
  0 assertion failures**; execution stopped at `supabase/tests/0003_rls_matrix_test.sql:388` because the
  test queried a non-readable internal column;
- `bun run test:integration`: **not run** because the database gate did not pass;
- `bun run phase3:stack:stop`: **passed**; no project containers remain.
- `bun test scripts/phase3-db.test.ts`: **16 passed, 0 failed** after generated-type whitespace
  normalization was added;
- `git diff --check`: **passed** for the checkpoint.

The two permitted repair attempts are exhausted for this run. This is a test-query blocker, not proof
that the underlying authorization boundary failed: the database correctly denied reading an ungranted
column. Wave 1 remains unaccepted until the corrected suite and complete gate pass.

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

In `supabase/tests/0003_rls_matrix_test.sql`, replace the remaining `where status = 'draft'` checks at
the current lines 385 and 419 with checks for the known draft course ID
`50000000-0000-4000-8000-000000000003`. This tests row visibility without requesting the intentionally
hidden `status` column.

Then start the isolated stack, reset it, run `bun run db:test`, and only if that focused check passes,
run the complete `bun run test:db` gate once. After a passing database gate, obtain the approved local
URL/publishable key in memory, run `bun run test:integration`, and stop the stack unconditionally.

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

## Checkpoint state

- Founder input needed: **no**;
- working tree: clean after the local checkpoint commits;
- ADR-040 documentation checkpoint: `d335749`;
- Wave 1 live-attempt checkpoint: `57eebfe`;
- unresolved risk: Wave 1 database lint, type drift and real API concurrency/authorization integration
  remain unproven because pgTAP has not yet returned a successful process exit.
