# Phase 3A Wave 1 — Live Local Acceptance Evidence

**Run ID:** `2026-11-06-phase3a-wave1-live`
**Date:** 6 November 2026
**Phase:** Phase 3A (Revision 3) — Wave 1
**Code tree:** working tree on top of `e0d4653` (`main`), committed with this evidence
**Result:** **PASS — Wave 1 accepted locally**

No hosted project, retired credential, production service, deployment, or remote mutation was used.
Only the approved loopback URL and local publishable key were passed in memory to the integration test
process. No credential value, token, cookie, password, or raw provider output is recorded here.

## Verification

| Check | Result |
|---|---|
| Loopback stack start | passed; API and PostgreSQL listeners bound to `127.0.0.1`; `isolated: true` |
| Migration and seed reset | passed; all 18 migrations and deterministic seed executed |
| Focused pgTAP | 5 files, 239 tests passed, 0 failed |
| Deterministic resets | both fingerprints `3dfef29769540bdd5896bcb5ba8ec659` |
| Complete database gate | passed: two resets, pgTAP, lint, generated-type drift |
| Generated types | `db/database.types.ts` matches the local schema exactly |
| Real API integration | 7 tests passed, 0 failed, 117 assertions |
| Wrapper/unit checks | 127 tests passed, 0 failed |
| TypeScript | passed, including `db/database.types.ts` |
| ESLint | passed; generated provider output is excluded from formatting lint and remains drift/type checked |
| Production build | passed |
| Diff whitespace check | passed |
| Stack cleanup | passed; zero project containers remain |

## Security evidence

- anonymous command and protected-table access was denied;
- direct membership/enrolment table writes and immutable-handle updates were denied;
- cross-user membership, enrolment, completion reads and mutations were denied;
- private/unlisted community joins were concealed;
- protected lesson content required active membership plus enrolment;
- repeated and 20-way concurrent join/enrol/complete calls produced one transition per operation;
- all database resets, pgTAP helpers, lint containers and database listeners used the dedicated
  loopback Docker network;
- the stack was stopped after verification.

## Findings and repairs

The live run found test assertions that queried intentionally hidden columns and found that the
Supabase CLI can recreate or launch helper containers on its default network during reset/testing.
Tests now use visible IDs for row-visibility assertions. Container-based local database commands now
receive the approved loopback network explicitly; generated types remain host-loopback because the CLI
generates them in-process and rejects a Docker network flag.

Database lint reports one non-blocking `warning extra`: `public.leave_community` declares `v_row` but
does not read it. This is recorded as Low severity and does not weaken behavior, grants, or RLS.

## Non-claims

- This is local Wave 1 evidence, not staging or production evidence.
- Waves 2–5 and the connected browser journey remain incomplete.
- No production capacity, recovery target, or hosted-provider claim is made.
