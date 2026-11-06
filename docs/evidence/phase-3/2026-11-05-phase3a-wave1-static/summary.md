# Phase 3A Wave 1 — Static Review Evidence

**Run ID:** `2026-11-05-phase3a-wave1-static`
**Date:** 5 November 2026
**Phase:** Phase 3A (Revision 3) — Wave 1 (migrations, RLS, commands, seed)
**Code tree under review:** working tree on top of `350cfe2` (`main`), committed together with this
evidence.
**Result:** **Static review passes. The live database gate has NOT been executed. Wave 1 is NOT
complete.**

No hosted Supabase project, credential, deployment, provider-side mutation, or production database
operation was performed. No Docker stack was started for this run; live validation is intentionally
deferred at the founder's direction.

## 1. Scope of this review

Wave 1 adds:

- 18 dependency-ordered migrations under `supabase/migrations/` (`0001`–`0018`);
- a deterministic seed in `supabase/seed.sql`;
- five pgTAP suites under `supabase/tests/`;
- a real-stack integration suite at `tests/integration/database/commands.test.ts`;
- a local-only database gate wrapper at `scripts/phase3-db.ts` plus 16 unit tests;
- database scripts in `package.json` and documentation updates.

The authoritative requirements are `docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md` §2–§6 and §9.
The execution procedure is `docs/PHASE-3-VERIFICATION-RUNBOOK.md` §5.

## 2. Verification actually performed

| Check | Command | Result |
|---|---|---|
| TypeScript (app config) | `bun run typecheck` | exit 0 |
| ESLint | `bun run lint` | exit 0 |
| Bun unit tests | `bun run test:unit` | 126 passed, 0 failed, 12 files |
| Whitespace/diff check | `git diff --check` | clean |
| Policy/index name scan | static extraction of `create policy` / `create index` | no duplicate policy names per table; no duplicate index names |

These checks validate the TypeScript wrapper, its tests, the documentation build inputs, and basic
file hygiene. They do **not** execute any SQL.

## 3. Static contract review

Each item below was reviewed by reading the migration set against the contract. None is a runtime
claim.

| Contract requirement | Static evidence |
|---|---|
| Dependency-ordered migrations; no edits after application | `0001` schemas/default ACLs → `0002` profiles/auth trigger → `0003` helpers → catalogue tables → memberships/enrolments → `0018` commands. The set is unapplied and therefore still editable in this commit. |
| Every exposed table pairs grants, RLS, and indexes | 15 exposed tables enable RLS, revoke table-level client DML, grant exact columns, and carry the contract indexes. `0001`/`0002` pgTAP suites assert the ACL and RLS coverage. |
| Bounds and CHECK constraints | Every text/range/enum field in §3 has a named CHECK; composite FKs enforce course/community/workspace consistency. `0001_schema_constraints_test.sql` covers representative rejections. |
| Definer helpers and commands pin `search_path = ''` | `0002`, `0003`, and `0018` use `security definer` + `set search_path = ''`; `0002_acl_grants_test.sql` scans the named functions. |
| No automatic EXECUTE for `PUBLIC`/`anon`/`authenticated` | `0001` revokes default function EXECUTE for `postgres` in `public`/`private`; each function is explicitly revoked/granted. `0002_acl_grants_test.sql` scans project functions. |
| Caller-bound commands; no actor/role/status/timestamp input | `0018` derives `auth.uid()`, requires an active profile, rejects null `request_id`, and grants EXECUTE only to `authenticated`. |
| Idempotency and one audit event per real transition | `0018` uses `INSERT ... ON CONFLICT ... RETURNING` for absent rows and a locked conditional update for `left → active`; audit inserts occur only on `changed = true`. `0005_commands_test.sql` asserts the state machine and audit counts. |
| Deterministic seed | `seed.sql` fixes all UUIDs, slugs, positions, and timestamps; the profile touch trigger is disabled only for the administrative timestamp backfill and re-enabled before commit. The fingerprint query restricts catalogue Auth rows to `@catalogue.invalid`. |
| Draft/archived rows are not exposed through membership | `0006` now grants members only `status = 'published'` communities; `0009` requires a visible parent community in addition to membership. `0003_rls_matrix_test.sql` adds a draft-community + published-course case for an active member and an editor. |
| Preview versus protected content | `0013`/`0014` expose preview rows to visible lessons and protected rows only through `private.can_access_course_content`, which requires an active profile, active own enrolment, and active community membership. |
| Seed actors cannot log in | Seed Auth rows have no password hash, identity, or session; `0004_seed_trigger_test.sql` asserts all three and the integration suite attempts a real password sign-in. |

## 4. What remains unverified

The following checks require the WSL2 Linux Docker Engine and have **not** run:

- `bun run db:reset` — migrations and seed against PostgreSQL 17;
- `bun run test:db` — two resets, fingerprint comparison, pgTAP, database lint, and type drift;
- `bun run db:types:write` — generation of `db/database.types.ts` (the file does not exist yet);
- `bun run verify:db-types` — generated-type comparison;
- `bun run test:integration` — real Auth/Data API/RPC calls, direct-table denial, cross-user
  isolation, and 20-way concurrency.

Until those pass, the migrations, seed, pgTAP suites, and integration suite are statically reviewed
only. No database execution or security proof is claimed.

### Material risks to resolve in the first live run

1. SQL syntax or semantic errors that only PostgreSQL can detect.
2. pgTAP access to `extensions.pgtap` while `set local role anon/authenticated` is active. The
   suites assume the local Supabase image grants `USAGE` on `extensions` and keeps default EXECUTE
   on pgTAP functions; this must be observed, not assumed.
3. Column-level grants plus RLS policies that reference non-granted columns such as
   `profiles.status` and `communities.status`. Earlier empirical work indicates policy quals are not
   column-privilege-checked, but the live gate must confirm it for this exact image.
4. Seed/Auth compatibility: the exact `auth.users` NOT NULL/default set and the `@catalogue.invalid`
   sign-in failure must be confirmed against the pinned local image.
5. The fingerprint query uses `docker exec` against the project database container and therefore
   only works where the WSL2 Docker engine is reachable.
6. `db/database.types.ts` is absent, so the gate fails fast until `db:types:write` is run and the
   generated file is committed.

## 5. Reproduction on the supported stack

From WSL2 Ubuntu 24.04, after the stack wrapper passes its loopback gate:

```bash
bun run phase3:stack:start          # must print "isolated: true"
bun run db:reset
bun run db:types:write              # commit db/database.types.ts
bun run test:db
bun run phase3:stack:status --json  # approved API_URL / PUBLISHABLE_KEY
export PHASE3_API_URL="<approved API_URL>"
export PHASE3_PUBLISHABLE_KEY="<approved PUBLISHABLE_KEY>"
bun run test:integration
bun run phase3:stack:stop
```

Record the live results in a separate evidence run. Do not mark Wave 1 complete from this document.

## 6. Non-claims

- This is not Wave 1 acceptance.
- This is not evidence that RLS, grants, or command concurrency behave correctly at runtime.
- This is not production or hosted-Supabase authorization.
- No provider, deployment, or destructive database action occurred.
