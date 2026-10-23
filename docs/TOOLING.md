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

### Documentation
Before provider-specific implementation:
- read current official docs;
- record material assumptions;
- keep volatile provider behavior out of long-lived prompts where possible.

### Optional launch-video workflow (/brag)

Use the open-source [latent-spaces/brag skill](https://github.com/latent-spaces/brag) to create a short launch video and share copy from The Scenes project code.

This is a developer workflow only. It is **not** a The Scenes runtime feature, app dependency, or reason to change the product architecture.

Install from the TheScenesApp repository root when running in a local coding-agent environment:

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag
```

When the frontend is ready and the design direction has been approved, invoke:

```text
/brag --tone polished --format vertical
```

Run it only when the project contains real UI/product states worth showing. The repository is currently in Phase 0, so do not present an unfinished or text-only workspace as a completed product demo. Prefer real screens from approved design/frontend work, and keep the story grounded in The Scenes: an African-first, globally expandable platform for learning, teaching, focused communities, discovery, and creator-led education. AI is a flagship category, not the entire product. The visual tone should be editorial, practical, human, and credible—not a generic AI-SaaS promo.

The skill's documented requirements are Node.js 22+, FFmpeg on PATH, and the Hyperframes CLI (`npx hyperframes doctor`). Verify the local environment before claiming a render succeeded. Review the generated video and share copy before distribution; verify music/SFX usage rights for the intended channel. Do not add Hyperframes or other video tooling to the app's runtime dependencies, do not fabricate capabilities or results, and do not commit generated video output unless explicitly requested.

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

| Capability | Intended provider | Stage |
|---|---|---|
| Hosting / edge | Cloudflare | Direction |
| Auth | Supabase | Direction |
| Database | Supabase Postgres | Direction |
| Realtime | Supabase Realtime | Direction |
| File storage | Cloudflare R2 | Direction |
| Transactional email | Resend | Direction |
| Rate limiting | Redis-compatible | Direction |
| Video / live | Bunny.net / LiveKit / Daily / Agora | Evaluate by use case |
| Internal feedback | Telegram | Direction |
| Payments | TBD | HOLD |
| Search | Postgres first; dedicated/AI later | Deferred |
| Notifications | PWA / Web Push | Direction |

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
