# The Scenes — Tooling and Capability Contract

## Principle

Tools are capabilities, not authority.

An MCP server, CLI, browser automation tool, provider SDK, or model can perform an action; it does not decide whether the action belongs in the current phase.

## Required capability groups

### Repository / Git

Agents should be able to:

- inspect status/diff/history;
- create branches;
- read/write files;
- review changes.

### CLI

Use CLI for:

- package inspection;
- formatting;
- linting;
- typechecking;
- build;
- tests;
- local dev server;
- approved migrations.

Do not use destructive shell commands without explicit authorization.

### Browser/UI verification

Use browser-capable tooling for:

- route verification;
- responsive checks;
- critical user flows;
- visual comparison;
- form/error-state checks.

Installed baseline: Playwright (`@playwright/test`, `playwright.config.ts`, `e2e/`).

- `bunx playwright install chromium` — browser for a new machine or CI (not committed).
- `bun run test:e2e` — suite against the dev server, auto-started on port 5000 (`npm run test:e2e` also works).
- `bun run test:e2e:ui` — interactive mode while designing.
- `PLAYWRIGHT_BASE_URL=…` — target an already-running server instead of starting one.
- Projects: `desktop`, `tablet`, and `mobile` (Pixel 7), so mobile-first is checked by default.
- Artifacts go to `.playwright/`: gitignored and excluded from lint. Tests live in `e2e/`.

### Documentation

Before provider-specific implementation:

- read current official docs;
- record material assumptions;
- keep volatile provider behavior out of long-lived prompts where possible.

### MCP

Use only approved MCPs whose permissions and data handling are understood.

### Skills

Use the relevant project skill(s) for:

- product/business analysis;
- research/evidence;
- frontend/design variants;
- accessibility;
- implementation;
- security;
- testing/QA;
- release/CI.

If the environment does not expose a named skill, do not pretend it exists. Use the closest verified capability or report the gap.

## Provider capability matrix

| Capability          | Intended provider                   | Stage                |
| ------------------- | ----------------------------------- | -------------------- |
| Hosting / edge      | Cloudflare                          | Direction            |
| Auth                | Supabase                            | Direction            |
| Database            | Supabase Postgres                   | Direction            |
| Realtime            | Supabase Realtime                   | Direction            |
| File storage        | Cloudflare R2                       | Direction            |
| Transactional email | Resend                              | Direction            |
| Rate limiting       | Redis-compatible                    | Direction            |
| Video / live        | Bunny.net / LiveKit / Daily / Agora | Evaluate by use case |
| Internal feedback   | Telegram                            | Direction            |
| Payments            | TBD                                 | HOLD                 |
| Search              | Postgres first; dedicated/AI later  | Deferred             |
| Notifications       | PWA / Web Push                      | Direction            |

## Referral-specific tooling

Referral/quota work needs:

- database transaction/idempotency capability;
- rate limiting;
- audit logging;
- provider usage reconciliation;
- secure secret handling;
- browser verification of quota/entitlement UI.

## CI

The repository CI contract is in `docs/CI-CONTRACT.md`.

At minimum, CI should prove:

- lockfile install;
- lint;
- typecheck;
- build;
- agent-contract integrity.

The current workflow also runs `bun run test:unit` (Bun unit tests for `scripts/` and `tests/unit/`),
`bun run audit` with the documented dev-only advisory exception, and the fixture Playwright suite
after installing Chromium. The local-stack CI job is deferred until Wave 1 supplies migrations and
database tests.

## Local Supabase stack tooling (Phase 3A Wave 0)

`scripts/phase3-stack.ts` + `scripts/phase3-stack/*` wrap the pinned `supabase@3.0.0` CLI for the
loopback-only local proof. Guarantees:

- `SUPABASE_TELEMETRY_DISABLED=1` on every child; hosted credential/target env variables stripped;
- CLI output captured in memory and printed redacted only;
- hosted commands, hosted project refs, and `stop --all` refused;
- `stop` is project-targeted only;
- a loopback Docker bridge network is used at start, and the isolation gate stops the stack when any
  published port is not loopback-only.

On Windows with Docker Desktop, `com.docker.network.bridge.host_binding_ipv4` is not honoured for
published ports, so the gate fails closed. The supported local-stack path on this machine is a Linux
Docker Engine inside WSL2. See `docs/evidence/phase-3/2026-11-05-phase3a-wave0a/summary.md` for the
original runtime finding and `docs/evidence/phase-3/2026-11-05-phase3a-wsl-isolation/summary.md` for
the passing WSL2 proof.

### Running the stack under WSL2 (supported path)

Prerequisites (installed inside the WSL2 distro `Ubuntu-24.04`, not on Windows): Linux Docker Engine
(apt `docker.io`) started per session, Bun `1.4.4` at `/root/.bun/bin/bun`, and the pinned Linux
Supabase CLI `3.0.0` at `/opt/supabase-cli/package/bin/supabase` (SHA-512 verified against
`bun.lock`).

```bash
# In WSL2 Ubuntu-24.04 as root:
export PATH="/root/.bun/bin:$PATH"
export SUPABASE_CLI_BINARY_OVERRIDE=/opt/supabase-cli/package/bin/supabase
cd '/mnt/c/Users/DELL/Desktop/THE SCENCES/TheScenesApp'
bun scripts/phase3-stack.ts start   # gate must print "isolated: true"
bun scripts/phase3-stack.ts status
bun scripts/phase3-stack.ts stop
```

Notes:

- The Docker engine and CLI live entirely inside the WSL2 guest; no Windows host or firewall change
  is made.
- `supabase status` can race a cold-start health check; the wrapper retries recognised transient
  readiness failures (up to 6 attempts, 2s apart) and fails immediately on real errors.
- WSL2 must be running for the stack to be reachable from Windows; the guest engine is not a Windows
  service.

### Database gate tooling (Phase 3A Wave 1)

`scripts/phase3-db.ts` reuses the stack wrapper's CLI resolution, telemetry, environment stripping and
redaction, and adds local-only database commands:

```bash
bun run db:reset          # supabase db reset --local (migrations + seed)
bun run db:test           # supabase test db --local (pgTAP)
bun run db:lint           # supabase db lint --local --level warning --fail-on error
bun run db:fingerprint    # semantic md5 fingerprint of the deterministic seed
bun run db:types:write    # write db/database.types.ts from the local schema
bun run verify:db-types   # generate and compare without writing
bun run test:db           # full Wave 1 gate: reset x2 + fingerprint + pgTAP + lint + type drift
```

Every command is constructed with `--local`; hosted flags and `--linked` are rejected before the child
runs. The fingerprint query runs through `docker exec` inside the local database container, so it is
only available where the WSL2 Docker engine is reachable. `test:db` compares the fingerprint across two
clean resets before running any test that writes rows.

The first successful run needs `db:reset` and `db:types:write` before `test:db`, because the gate
checks the committed `db/database.types.ts` for drift and fails when the file is missing.

## Model hierarchy rule

High-capability models should strengthen durable project docs.

Lower-capability models should consume those docs rather than reconstruct architecture from code.

No model may weaken:

- security;
- phase gates;
- product scope;
- provider boundaries;
- design-first rules.

## Environment rule

Never claim a tool/CLI/MCP exists because it is named in documentation.

Detect actual capability first.

If missing:

- use an approved fallback;
- or stop and report the blocker.

## Verification

Prefer evidence:

- command output;
- browser evidence;
- test result;
- diff inspection;
- official documentation.
