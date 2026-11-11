# Phase 4 P4-S1 — Account email and password recovery (code/local)

**Date:** 11 November 2026
**Slice:** P4-S1 — Account email and password recovery
**Approval:** ADR-042 (code/local only). Approved remote actions: NONE. Providers: NONE.
**Target:** local code and fixture browser environment only. No Supabase project or provider was
contacted, configured or mutated.
**Base revision:** `9cc91e3` (Phase 4 revision-2 review). This change set is the P4-S1 implementation.
**Contains sensitive material:** no.

## Scope implemented

Supabase Auth remains the sole confirmation/recovery token authority. The application only asks Auth to
start a reset and consumes the PKCE code it returns.

- Pure helpers: `src/features/auth/recovery.ts` (acknowledgement, provider-error classification, PKCE
  code shape, recovery-link parsing + URL clean path).
- Redirect allowlist: `src/features/auth/redirects.ts` (loopback pinned to `127.0.0.1:5000`; hosted must
  be HTTPS; unapproved origin fails closed; recovery always targets `/reset-password`).
- Schemas: `passwordRecoveryRequestSchema`, `recoveryExchangeSchema`, `recoveredPasswordSchema`.
- Contracts: acknowledgement / recovery-status / recovered-password status + client-safe setup view.
- Repository: `AuthRecoveryRepository` over the request-scoped user client only (no admin/service key),
  reducing provider responses to `status`/`code`.
- Service: `requestPasswordRecovery`, `completePasswordRecovery`, `updateRecoveredPassword` with the
  fixtures short-circuit and safe error mapping.
- Server functions: `requestAccountPasswordRecovery`, `completeAccountPasswordRecovery`,
  `updateRecoveredAccountPassword`, plus `getAuthEmailSetupStatus`.
- Routes: rewritten `/forgot-password` (request + acknowledgement + operator setup check) and new
  recovery-only `/reset-password`; `/login` shows a `reset=complete` banner.
- Setup checker: `inspectAuthEmailSetup` reports names and state only (never a value).
- Tests: `tests/unit/password-recovery.test.ts` and `e2e/password-recovery.spec.ts`.
- Docs: `docs/ACCOUNT-EMAIL-SETUP.md`; ADR-042 and status/plan/integration updates.

## Verification (all commands run in this change set)

```text
bun run test:unit        -> 197 pass, 0 fail (18 files)
bun run build            -> success (vite + nitro; route tree regenerated for /reset-password)
bun run typecheck        -> clean (app + scripts)
bun run lint             -> clean
bun run verify:client-boundary -> client/server boundary verified
bun run test:fixture     -> 48 tests: 32 passed, 16 skipped (connected suites skip in fixtures mode)
git diff --check         -> clean (exit 0)
git status --short       -> reviewed; only P4-S1 files listed
```

Fixture browser evidence for the slice (`e2e/password-recovery.spec.ts`, 6/6 across desktop/tablet/
mobile):

- `/forgot-password` rejects an invalid address with an inline error and never shows the inbox state;
- a valid address returns the acknowledgement with the honest "no reset email was sent" copy — no
  delivery claim;
- `/reset-password?code=...` strips the code from the visible URL and refuses in preview;
- `/reset-password?error=access_denied&error_code=otp_expired` strips provider parameters and refuses.

Tool versions: Bun `1.4.4`, Node `v26.12.1`, TypeScript `5.9.3`, Playwright `1.64.1`.

## Security review summary

- Known and unknown accounts receive identical acknowledgements; provider 4xx (except 429) is treated
  as acknowledged, avoiding account enumeration.
- Recovery parameters (`code`, `error`, `error_code`, `error_description`, `token`, `token_hash`) are
  removed from the visible URL before any network call.
- Redirects are restricted to the approved origin + `/reset-password`; Supabase's redirect allowlist is
  the authoritative second layer.
- Provider responses are reduced to `status`/`code`; no email address, token, recovery code or provider
  body is logged or stored.
- Fixture mode never contacts a provider and never claims delivery; a configured integration never
  silently falls back to fixtures.
- Critical findings: 0. High findings: 0.

## Hosted configuration (ADR-043, 11 November 2026)

The founder approved hosted account-email configuration on THE SCENES `okdzuqgzgnmmbtjxdaci` only. The
application environment is already correctly staged (verified read-only): the git-ignored
`.env.staging.local` parses to `dataMode=supabase-staging`,
`url=https://okdzuqgzgnmmbtjxdaci.supabase.co`, publishable (non-secret) key. No secret was printed.

**No remote change was made.** While attempting a read-only project lookup, the Supabase MCP in this
session resolved to VOICE SYSTEM (`extdmvwwvgqstoayzhhy`) because a global OpenCode config defines the
`supabase` server against that project and overrides the project-level `okdzuqgzgnmmbtjxdaci` binding.
That tool is therefore unsafe for this work and was not used for any write. The returned values were
discarded and not written to any file.

Remaining work is founder dashboard/account work: Supabase Auth URL allowlist + Resend custom SMTP on
THE SCENES, a Resend account and verified domain, then one founder-controlled inbox test. No database
migration is required.

## Not run under this approval

- **Connected/hosted recovery** (real inbox, Supabase Auth custom SMTP, Resend) — approved in principle
  by ADR-043 but not executed; blocked by the misbound MCP plus pending founder dashboard/Resend steps.
- No migration, deploy, message, push subscription or provider account.
- ADR-041 Wave 5 capacity/recovery rehearsal remains deferred and blocks any load/launch/scale claim.

## Residual risks and follow-ups

- Real delivery correctness is unverified until the Resend/Supabase SMTP approval and one
  founder-controlled inbox test.
- Provider-backed rate limiting is a later slice (P4-S2); code/local uses the existing local limiter.
- Confirmation-email template accessibility is documented but not visually verified in a real client.
