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

The current workflow also runs `bun run test:unit` (Bun unit tests for `scripts/`).

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
published ports, so the gate fails closed. See
`docs/evidence/phase-3/2026-11-05-phase3a-wave0a/summary.md`.

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
