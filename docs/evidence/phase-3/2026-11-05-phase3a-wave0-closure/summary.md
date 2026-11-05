# Phase 3A Wave 0 — Closure Evidence

**Run ID:** `2026-11-05-phase3a-wave0-closure`
**Date:** 5 November 2026
**Phase:** Phase 3A (Revision 3) — Wave 0
**Code tree under test:** `a538a2931dcdd7acdbe45817f4140ee2f00a17bf` (`main`)
**Result:** **Checks 1–5 and 7–9 pass. Check 6 (live Docker isolation) is waived by founder direction. The local-stack CI job is deferred until Wave 1 supplies migrations and database tests. Wave 1 has not started.**

Remote/production authorization: none. No hosted Supabase project, credential, deployment, or
provider-side mutation was performed.

## 1. Tree and environment

- Branch: `main`
- Code commit: `a538a29` (clean tree at gate time)
- The evidence commit that adds this file is docs-only; the code under test is `a538a29`.

| Component                              | Version         |
| -------------------------------------- | --------------- |
| OS                                     | Windows (win32) |
| Bun                                    | 1.4.4           |
| Node                                   | 26.12.1         |
| Supabase CLI (locked `supabase@3.0.0`) | 3.0.0           |
| Docker Engine (Docker Desktop)         | 29.9.2          |

## 2. Wave 0 check results

|   # | Check                                                | Status     | Evidence                                                                                                                                       |
| --: | ---------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Exact versions + frozen clean install                | **PASS**   | `bun install --frozen-lockfile` exit 0, 436 installs / 532 packages, no changes                                                                |
|   2 | `bunx supabase --version` equals locked CLI          | **PASS**   | CLI `3.0.0`; `bun.lock` pins `supabase@3.0.0` and all platform binaries `3.0.0`                                                                |
|   3 | Local-only config, telemetry disabled per process    | **PASS**   | `supabase/config.toml` has no active hosted target; `[analytics] enabled = false`; wrapper sets `SUPABASE_TELEMETRY_DISABLED=1` on every child |
|   4 | Local-only env parser + tests, no network            | **PASS**   | `src/lib/env.ts`, `tests/unit/env.test.ts`: 27 tests, 0 fail                                                                                   |
|   5 | Vite binds loopback only, no arbitrary host override | **PASS**   | `vite.config.ts`: `server.host = "127.0.0.1"`, `port = 5000`, `strictPort: true`; no `allowedHosts` override                                   |
|   6 | Live Docker/Windows listener isolation               | **WAIVED** | Founder direction: live Docker isolation proof is not necessary. Wrapper remains fail-closed; see §4                                           |
|   7 | Fixture suite with `VITE_DATA_MODE=fixtures`         | **PASS**   | `bun run test:fixture`: 26 passed, 4 skipped, 0 failed (2.7m)                                                                                  |
|   8 | Current-tree secret scanning                         | **PASS**   | `docs/SECURITY-SCAN-RESULTS.md`: current tree 0 findings (Gitleaks 8.30.1); no secret material added by this run                               |
|   9 | Plans/evidence tracked; `git diff --check` clean     | **PASS**   | plans and evidence tracked; `git diff --check` exit 0                                                                                          |

### Environment parser coverage

`parseAppEnv` is pure: it performs no I/O and contacts no provider. Tests cover:

- `fixtures` accepted with only `VITE_DATA_MODE`; optional Supabase values are not parsed;
- `fixtures` still rejects secret-looking `VITE_` names and JWT/secret/service-role values;
- missing, blank, and unknown modes rejected;
- `supabase-local` accepts `http://127.0.0.1:54321` and `http://localhost:54321`;
- hosted URL, HTTPS, wrong port, userinfo, query, fragment, extra path, and malformed URL rejected;
- missing URL/key, JWT-form key, `sb_secret_`, `sbp_`, service-role material, and the documented
  placeholder rejected;
- error messages never echo the rejected value;
- the parsed result is frozen.

This closes the Wave 0 parser deliverable. Request-lazy wiring into `src/server/env.server.ts` and the
Vite build/start path remains Wave 2 work.

## 3. Dependency audit exception

`bun audit` reports one remaining advisory:

- `minimatch@10.2.5` — **moderate, dev-only**, transitive via `eslint → @eslint/config-array` and
  `typescript-eslint → @typescript-eslint/typescript-estree`;
- no in-range fix exists; dependents require `^10.x` and the patched release is `>=11.0.1`;
- not reachable at runtime.

`bun run audit` therefore ignores exactly `GHSA-g3hv-75wg-m249`, and any other advisory fails the
command. Result: `No vulnerabilities found (checked 505 packages, 1 ignored)`, exit 0. Remove the
exception when the dependents move to `minimatch >= 11.0.1`.

## 4. Isolation status and waiver

Founder direction on 5 November 2026: the live Docker isolation proof is not necessary for this local
proof. The historical attempt and runtime finding remain recorded in
`docs/evidence/phase-3/2026-11-05-phase3a-wave0a/`.

What remains true:

- the stack wrapper still refuses to start when any published port is not loopback-only;
- no firewall, host-network, or machine mutation was performed;
- no containers or listeners were left running;
- the Windows/Docker Desktop limitation is unchanged:
  `com.docker.network.bridge.host_binding_ipv4` is not honoured for published ports, so the gate fails
  closed on this machine.

**Residual risk:** a Supabase stack started outside the wrapper would publish ports on all interfaces
on this machine. **Wave 1 consequence:** the wrapper cannot start the local stack here, so Wave 1
cannot run its migration/pgTAP gate on this machine unless one of these is chosen:

1. run Docker Engine under Linux (including WSL2) so the loopback network option applies;
2. approve a documented firewall/isolation policy and amend the gate;
3. explicitly authorize a non-loopback local start for development only (not recommended).

No option was chosen or implemented in this run.

## 5. Supabase image/Postgres evidence

Observed local images for the pinned CLI version (recorded before the first migration, as required):

| Image                                          | Digest                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `public.ecr.aws/supabase/postgres:17.11.0.011` | `sha256:7bd84e6a1d5322c7b864b9751873a0ac50f48df3f20a776e88114eadb2948fc0` |
| `public.ecr.aws/supabase/gotrue:v2.197.0`      | `sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b` |
| `public.ecr.aws/supabase/postgrest:v16.5`      | `sha256:1347d7552b88f17832912c06afbf7c43209af6eeeb60834b04aae12c9bd9d5cc` |
| `public.ecr.aws/supabase/kong:2.8.1`           | `sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d` |

`supabase/config.toml` pins `db.major_version = 17`, matching `postgres:17.11.0.011`.

## 6. CI state

The `validate` job is the required **fixture/static job** and now runs:

- frozen Bun install;
- contract integrity checks;
- `bun run audit` with the documented exception;
- lint, typecheck, unit tests, build;
- `bunx playwright install --with-deps chromium`;
- the fixture Playwright suite;
- a three-day retention Playwright report on failure (fixture data only).

The **Phase 3A local-stack job** is not present. It depends on migrations, pgTAP tests, generated
types, and integration tests that do not exist until Wave 1. Adding it now would produce a job that
cannot run meaningfully. This is a recorded deviation from the literal runbook requirement, not a
silent omission.

## 7. Deterministic fixture baseline

`src/data/seed.ts` uses fixed IDs and the fixed base date `2026-11-03T09:00:00.000Z`; the data modules
contain no `Math.random`, `crypto.random*`, `Date.now`, or zero-argument `new Date()`. The accepted
fixture suite is green against that baseline. A committed fingerprint snapshot is optional hardening,
not required by the current checks.

## 8. Commands and results

| Command                           | Result                                  |
| --------------------------------- | --------------------------------------- |
| `bun install --frozen-lockfile`   | exit 0, no changes                      |
| `bunx supabase --version`         | `3.0.0`                                 |
| `bun run typecheck`               | exit 0 (app + `tsconfig.scripts.json`)  |
| `bun run lint`                    | exit 0                                  |
| `bun run test:unit`               | 106 passed / 0 failed, 11 files         |
| `bun test tests/unit/env.test.ts` | 27 passed / 0 failed                    |
| `bun run audit`                   | exit 0, 1 documented exception          |
| `bun run build`                   | exit 0                                  |
| `bun run test:fixture`            | 26 passed / 4 skipped / 0 failed (2.7m) |
| `git diff --check`                | exit 0                                  |
| `git status --short`              | clean at code commit                    |

## 9. Remaining deviations / decisions

1. **Isolation waiver** — recorded in §4; residual risk and Wave 1 consequences are unresolved.
2. **Local-stack CI job** — deferred until Wave 1; the runbook must either accept this sequencing or
   supply the job in Wave 1.
3. **Later-wave command surface** — the runbook §2 lists `test:db`, `test:integration`, `test:phase3`,
   `verify:db-types`, `verify:client-boundary`, `phase3:serve`, `phase3:generate-data`,
   `phase3:query-plans`, `phase3:load`, and `phase3:recover` as "Wave 0 adds". These depend on later
   wave artifacts. Recommendation: amend §2 to say the surface is added across Waves 0–3, or add each
   script when its wave lands. Only `test:unit`, `test:fixture`, `test:e2e`, and `phase3:stack:*` exist
   today.
4. **Import-protection negative fixture** — the Vite and ESLint protections are configured. The
   negative build fixture and produced-client bundle scan are Wave 2 checks because protected server
   modules do not exist yet.
5. **Optional hardening** — commit a deterministic fixture fingerprint test.

## 10. Artifacts and secrets

Raw logs remain under ignored `.phase3-artifacts/wave-0a/`. This summary and its manifest contain no
token, cookie, password, key, or unredacted Auth trace. No historical credential was reused or tested.
