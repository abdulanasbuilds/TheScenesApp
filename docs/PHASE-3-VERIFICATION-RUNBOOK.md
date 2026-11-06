# The Scenes — Phase 3A Verification and Recovery Runbook

**Status:** FOUNDER-APPROVED LOCAL DIRECTION; FINAL TECHNICAL RE-REVIEW PENDING
**Parent:** `PHASE-3-REVISION-3-SPEC.md`

## 1. Evidence rules

Verification is attached to an exact Git commit or, while the tree is intentionally uncommitted, a
recorded tree/diff hash plus changed-path manifest. A previous run is not evidence for a changed tree.

Raw artifacts go only to ignored `.phase3-artifacts/<run-id>/`:

- dumps;
- browser traces/videos;
- raw HTTP headers;
- load samples;
- query-plan JSON;
- container logs;
- synthetic identity manifests.

Committed evidence is redacted and limited to:

- `docs/evidence/phase-3/<run-id>/summary.md`;
- `docs/evidence/phase-3/<run-id>/manifest.json`.

No dump, token, cookie, password, full fictional email, raw request body, or unredacted Auth trace is
committed or uploaded as an ordinary CI artifact. Failure artifacts have short retention and are
withheld when they contain session material.

## 2. Planned command surface

Wave 0 adds cross-platform scripts for:

```text
test:unit                 Bun unit/contract tests
test:fixture              accepted fixture Playwright suite
test:db                   reset x2 + fingerprint + pgTAP + database lint + type drift
test:integration          real local-stack server/Data API/RPC tests
test:phase3               local auth/learning/security Playwright suite
db:reset                  apply migrations + deterministic seed locally
db:test                   pgTAP suites only
db:lint                   database lint only
db:fingerprint            semantic seed fingerprint only
db:types:write            write db/database.types.ts
verify:db-types           generate to temp and compare with committed types
verify:client-boundary    forbidden import + client-bundle scan
phase3:stack:start        start local stack with in-memory parse/redacted output
phase3:stack:status       return only approved URL/publishable values to child processes
phase3:stack:stop         stop only the wrapper-owned project in finally
phase3:serve              built Nitro preview on loopback with readiness/ownership checks
phase3:generate-data      deterministic disposable benchmark data
phase3:query-plans        RLS-aware JSON plans
phase3:load               Playwright-context local HTTP workload
phase3:recover            dump/restore/reconciliation wrapper
```

`tsconfig.json` includes `scripts/**/*.ts` and `tests/**/*.ts`, or each uses a dedicated strict checked
config. Code not covered by typechecking is not a gate.

The stack wrapper captures CLI JSON/stdout/stderr in memory, parses it, masks values in CI, prints only
sanitized service/bind status, and passes only the API URL, database URL when an administrative child
requires it, and publishable key through child-process environment. Secret/JWT/service-role values are
discarded and never written to `.env.local`, raw artifacts, logs, console, or evidence. Cleanup stops
only the wrapper-owned project, never `supabase stop --all`.

`test:unit` selects pure co-located unit/contract tests only; it never discovers
`tests/integration/**`. `test:integration` explicitly selects that directory after the local stack
starts. Fixture and local Playwright commands set `VITE_DATA_MODE` in `webServer.env`, start a fresh
server for gates, and assert a safe `data-data-mode` app marker in
`waitForApp(page, expectedMode)`. Fixture CI sets the mode at job level for build/typecheck and browser
tests.

## 3. Common end-of-wave gate

Every wave runs:

```powershell
bun run test:unit
bun run typecheck
bun run lint
bun run build
git diff --check
git status --short
```

Pass conditions:

- zero failed tests and no unexpected skip;
- critical suites have no retry-hidden flake;
- no secret/session material appears in output;
- changed paths belong to the approved wave;
- fixture regression remains green;
- exact commands, versions, tree identity, duration, and result are recorded.

## 4. Wave 0 — governance, isolation, reproducibility, and CI

### Preconditions

- founder-approved revision 3 has passed final technical re-review;
- legacy hosted accounts/credentials are blocked from every command and environment;
- hosted legacy cleanup/audit remains a separately tracked incident action;
- no remote/production action authorized.

### Checks

1. Add exact package versions and verify `bun install --frozen-lockfile` from a clean checkout.
2. Verify `bunx supabase --version` equals the locked CLI version.
3. Confirm `supabase/config.toml` has no hosted reference and telemetry is disabled per process with
   `SUPABASE_TELEMETRY_DISABLED=1`.
4. Unit-test environment parsing without making a network request:
   - allowed loopback URL/publishable key;
   - reject hosted URL, wrong port, userinfo/query/fragment, JWT, secret/service prefix, unknown mode,
     and secret-looking `VITE_` variable.
5. Prove Vite binds only to loopback and does not accept arbitrary hosts.
6. After the final plan gate, start through `phase3:stack:start` and inspect every Docker/Windows
   listener. Test from
   a second device or equivalent namespace. Any off-host reachability fails the gate.
7. Run the fixture suite with `VITE_DATA_MODE=fixtures`.
8. Run current-tree/new-change secret scanning. Historical known findings use narrow fingerprints, not
   broad path/rule exclusions.
9. Ensure reviewed plans/evidence are tracked and `git diff --check` is clean.

### CI evolution

Two jobs are required:

**Fixture/static job**

- frozen Bun install;
- contract/document checks;
- dependency audit with recorded severity/exception policy;
- lint, typecheck, build;
- `bunx playwright install --with-deps chromium`;
- fixture Playwright suite;
- safe failure artifact handling.

**Phase 3 local-stack job**

- pinned Bun/CLI;
- local stack start;
- reset, pgTAP, DB lint;
- generated-type drift check;
- integration tests;
- local-mode auth/learning/security smoke;
- unconditional stack stop/cleanup.

CI keeps Playwright retries for diagnostics but sets `failOnFlakyTests: true`; a pass on retry fails the
gate.

The five-minute load and recovery rehearsal are manual acceptance workflows, not per-PR jobs.

## 5. Wave 1 — migrations, RLS, commands, and seed

Run inside the supported WSL2 Ubuntu-24.04 environment (see `docs/TOOLING.md`):

```bash
bun run phase3:stack:start          # gate must print "isolated: true"
bun run db:reset                    # apply all 18 migrations + deterministic seed
bun run db:types:write              # first capture; commit db/database.types.ts
bun run test:db                     # reset x2 + fingerprint + pgTAP + lint + type drift
bun run phase3:stack:status --json  # read approved API_URL and PUBLISHABLE_KEY

export PHASE3_API_URL="<approved API_URL>"
export PHASE3_PUBLISHABLE_KEY="<approved PUBLISHABLE_KEY>"
bun run test:integration
bun run phase3:stack:stop
```

`test:db` and `test:integration` never target a hosted project: the database wrapper rejects hosted
flags, and the integration suite refuses a non-loopback URL. The publishable key is the only key passed
to the test process; secret and service-role values remain discarded by the stack wrapper.

Required evidence:

- two resets produce the same semantic seed fingerprint;
- every exposed table has intended grants and RLS;
- default ACL and function-execute introspection matches the contract;
- all constraints and composite tenant/course relationships reject invalid rows;
- permission-matrix allow/deny tests use returned rows/values, not `lives_ok` alone;
- direct Data API/table/RPC bypass attempts fail;
- concurrent commands use separate connections and produce one transition + one audit event;
- generated types match the committed file exactly.

Wave 1 is not complete until this gate passes. Until then, the migrations, seed, pgTAP suites, and
integration suite are statically reviewed only; no database execution is claimed. The current static
record is `docs/evidence/phase-3/2026-11-05-phase3a-wave1-static/`; it must be superseded by a live
run before Wave 1 can be accepted.

## 6. Wave 2 — server boundary and middleware

```powershell
bun run test:unit
bun run test:integration -- server
bun run verify:client-boundary
bun run typecheck
bun run lint
bun run build
```

Required evidence:

- request-lazy environment/client creation works in the actual local runtime;
- fixture mode does not initialize or contact Supabase;
- a deliberate client import of `*.server.*` and `server/**` fails the build;
- client output contains no provider server implementation or forbidden key/token marker;
- custom `src/start.ts` exports `startInstance` and installs:

  ```ts
  createCsrfMiddleware({
    filter: (ctx) => ctx.handlerType === "serverFn",
  })
  ```

- request ID handling wraps CSRF so rejections receive a safe correlation ID;
- missing origin metadata, cross-site Fetch Metadata, and mismatched Origin are rejected;
- safe error mapping covers validator, Auth, provider/database, and unexpected exceptions;
- captured logs/responses contain no passwords, full emails, cookies, tokens, SQL, constraint details,
  or stack traces;
- private/session responses are `no-store`.

## 7. Wave 3 — Auth/profile and viewer propagation

```powershell
bun run db:reset
bun run test:integration -- auth
bunx playwright test e2e/auth-flow.spec.ts
bunx playwright test e2e/security-contract.spec.ts
```

Run auth/user-facing flows on desktop, tablet, and mobile. Protocol checks run once because they are
viewport-independent.

Required cases:

- successful signup creates Auth user + profile atomically;
- malformed metadata/direct Auth calls, weak input, duplicate email/handle, and trigger conflict fail
  with the approved safe public result;
- unknown account and wrong password share one login message;
- root viewer, public shell, member shell, creator preview, home, and settings show the same profile;
- creator intent grants no workspace/role/capability;
- forged, malformed, expired, and missing cookies do not authenticate;
- forced refresh propagates every chunked cookie plus `Cache-Control`, `Expires`, and `Pragma`;
- two browser contexts prove local sign-out affects only the current session;
- every logout UI awaits the real server function;
- hostile-origin server-function POST fails before mutation;
- final reset removes browser test accounts.

## 8. Wave 4 — community, learning, persistence, and degraded states

```powershell
bun run db:reset
bun run test:integration -- learning
bunx playwright test e2e/learning-flow.spec.ts
bunx playwright test e2e/auth-route-contract.spec.ts
bun run test:fixture
```

Required cases:

- the complete approved journey passes at all three viewports;
- user B cannot read or mutate user A's membership/enrolment/completion;
- anonymous, listed visitor, active member, enrolled learner, and private stranger receive the exact
  outline/preview/content/resource access defined by the matrix;
- inaccessible and missing private resources have the same public response shape;
- paused/banned/suspended principals are not active;
- direct join/rejoin of known unlisted community UUIDs is concealed and cannot create membership;
- after enrolment, `left`, `paused`, and `banned` community states preserve history but deny
  non-preview body/resources and new completion; an allowed rejoin restores access;
- direct Data API, database RPC, and Start server-function bypass attempts fail;
- 20 simultaneous join, enrol, and complete calls preserve domain/audit invariants;
- pending controls prevent accidental duplicate submission;
- optimistic join/leave rollback works on forced network failure;
- backend unavailable, expired session, empty My Learning, validation, concealed not-found, and retry
  states pass;
- fixture routes continue to pass only in fixture mode; local-mode tests never expect fixture auth or
  anonymous private lesson access.

## 9. Wave 5 — representative data and workload

### Dataset

The deterministic generator uses fixed seed `20261105`, a run ID, documented distribution/skew, and a
disposable local database:

- 10,000 profiles;
- 500 workspaces;
- 1,000 communities;
- 2,000 courses;
- 20,000 lessons;
- 25,000 community memberships;
- 30,000 enrolments;
- 150,000 completions.

The generator runs as the local PostgreSQL administrative role only after proving the target is a
wrapper-owned loopback disposable stack. It refuses hosted/non-loopback URLs and unknown project IDs.
It inserts deterministic, non-login-capable synthetic Auth/profile rows against the pinned Auth schema;
only the 25 workload users use real signup. It records a dataset fingerprint, runs `ANALYZE`, and resets
the disposable target during cleanup. The normal committed seed remains small.

### Sustained workload

`phase3:load` owns the application lifecycle. It first runs the verified `cloudflare-module` production
build with `VITE_DATA_MODE=supabase-local`, then starts `phase3:serve` through pinned
`wrangler@4.157.0` and the generated `.output/server/wrangler.json`:

```text
node ./node_modules/wrangler/bin/wrangler.js dev
  --config .output/server/wrangler.json
  --ip 127.0.0.1 --port 5000 --local --no-bundle
  --show-interactive-dev-session=false
```

The wrapper supplies local mode/URL/publishable bindings to the child without logging secret values,
forbids `--remote`, fails if the port is already owned, waits for the app-ready marker plus a harmless
server-function smoke, records command/tree hash/PID/readiness time and exact workerd/Wrangler versions,
and stops only its child process in `finally`. It never substitutes Vite development/preview mode and
never contacts Cloudflare.

The harness uses 25 isolated browser contexts authenticated normally. A local-only
`src/routes/phase3-load.tsx` driver imports the transformed `*.functions.ts` wrappers and is available
only when `supabase-local`, `PHASE3_LOAD_DRIVER=1`, and the request is loopback; otherwise it returns
404. The final client/release boundary check proves the flag is absent. No public test API is invented.

The filename deliberately has no leading underscore. In the installed router generator an unescaped
`_` prefix marks a pathless layout, and a pathless node without children is omitted from the generated
tree, leaving the driver with no reachable URL. A Wave 0 router test asserts the generated route tree
contains `/phase3-load` and fails on a pathless or escaped-only variant.

- fixed 60-second warm-up;
- constant aggregate **25 logical application operations/second** for 300 seconds;
- deterministic weights: 30% community discovery, 20% community courses, 15% lesson detail, 15% My
  Learning, 8% join, 6% enrol, 6% complete;
- read operations use the 5-second deadline; writes use 10 seconds and remain idempotent;
- each scheduled operation must resolve through its safe DTO with expected 2xx transport/status;
- Playwright network instrumentation separately counts matching server-function RPC responses and all
  loader/invalidation HTTP traffic; the resulting network RPS is reported, not conflated with the 25
  logical operations/second target;
- logical-operation latency and matching server-function network latency are reported separately;
- trace, screenshot and video capture are disabled during measured load;
- expected validation/auth denials are separate from unexpected 5xx/transport failures.

Target on the documented machine:

- reads p95 ≤500 ms, p99 ≤1,000 ms;
- writes p95 ≤750 ms, p99 ≤1,500 ms;
- unexpected error rate <1%;
- zero duplicate domain transitions or state-change audits.

The harness then sends one 100-request / 100-concurrency burst. Rejection or slowdown is acceptable if
it is controlled, state remains correct, no data leaks, and health recovers within a recorded 30-second
window.

### Query plans and resources

Use `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` after `ANALYZE`, under applicable `anon` and authenticated
claims. The minimum manifest covers community discovery, community-course keyset page, course outline,
preview lesson, protected lesson detail, My Learning filtered/unfiltered, membership/enrolment RLS
predicates, and join/enrol/complete commands. A modifying plan runs in a rolled-back transaction. Record
estimates, actual rows, loops, rows removed, buffers, and timing; do not fail every sequential scan
without selectivity context.

Record OS, CPU, RAM, Bun, Node, Docker, CLI, image/Postgres versions and Docker allocation. Sample once
before warm-up and every second through warm-up, sustained load, burst and 30-second recovery. Report
peak/median browser CPU/RSS separately from application CPU/RSS; peak/median container CPU/RSS;
connection/pool peak; database/table/index sizes before/after; and Docker disk before generation and
after cleanup.

If the machine cannot complete the target, preserve the largest completed shape and exact resource
constraint as failed/unresolved evidence. Do not silently lower the target or extrapolate to production.

## 10. Recovery rehearsal

Recovery uses a fully isolated second local Supabase stack, not another database behind the source
stack's Auth/Data API.

The checked wrapper:

1. creates `.phase3-artifacts/<run-id>/restore-project/` with a copied migration/config baseline;
2. assigns a distinct local project ID and preflighted non-conflicting loopback ports, then starts it
   with the pinned CLI `--workdir`; both stacks must match image digests and PostgreSQL major;
3. applies migrations to the destination with seed disabled, so schema, function/table owners, ACLs,
   RLS and triggers come from reviewed migrations;
4. builds a custom-format **data-only** source archive from an explicit checked allowlist: the pinned
   password-user Auth FK closure (at minimum `auth.users` and `auth.identities`), every Phase 3A public
   table, and `private.audit_events`; the wrapper fails if the pinned Auth FK closure changes;
5. restores data only with
   `pg_restore --data-only --disable-triggers --exit-on-error --single-transaction` as the destination's
   disposable local admin. It does not restore ownership or schema. It then asserts replication role is
   `origin` and every trigger is enabled;
6. starts/health-checks the destination Auth/Data API and launches a separate app process using only the
   destination API URL/publishable key supplied in memory by the redacting wrapper;
7. performs a fresh destination login, profile read/edit, lesson/progress read and second-account denial;
8. runs `ANALYZE`, row-count/checksum reconciliation, owner/ACL/RLS/policy/function/search-path checks,
   constraints, and pgTAP against the destination DB URL without printing credentials;
9. records duration against 15 minutes;
10. in `finally`, stops only the destination workdir/project, removes its Docker resources/volumes,
    deletes the archive/workdir, and proves the source stack remains intact.

Any warning/error fails review; `--exit-on-error` is mandatory. A separate portability artifact exports
the application-table data (`public` plus approved private audit projection, excluding Supabase-managed
implementation) and an identity-ID mapping. It is imported once into a neutral PostgreSQL validation
schema to reconcile rows/FKs. This proves relational-data export only, not a bootable provider-neutral
application; replacing Supabase Auth/JWT/RLS/Data API remains explicit migration work.

## 11. Final acceptance review

- both fixture and local-mode full suites pass independently;
- CI passes from a clean checkout;
- raw dumps/load/Auth artifacts are deleted;
- only redacted evidence remains;
- final diff and changed-path review pass;
- unresolved fixture-only behavior is documented;
- an independent security reviewer approves the implementation against revision 3;
- production/remote authorization remains none.
