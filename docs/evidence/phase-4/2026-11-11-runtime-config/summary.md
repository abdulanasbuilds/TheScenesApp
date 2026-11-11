# Runtime configuration + integration health — evidence (code/local)

**Date:** 2026-11-11
**Scope:** deployment-driven runtime configuration and non-leaking integration health (ADR-045)
**Approval:** ADR-044 (code/local); ADR-045 (decision record)
**Target:** local code, fixture browser and a built Worker artifact. No provider contacted. No
deployment. No hosted project mutated.

## Implemented

- `src/server/runtime-env.server.ts`: `readRuntimeEnv()` merges `process.env` with Cloudflare's
  `globalThis.__env__` bindings. Binding values win; only string values are read; object bindings are
  ignored.
- `env.server.ts`, `server-client.server.ts`, `rate-limit-config.server.ts`, `rate-limit.server.ts` and
  `auth-email-setup.server.ts` now read the merged runtime environment instead of `process.env` only.
- Removed the build-time `src/lib/data-mode.ts`. The server resolves `dataMode` per request and delivers
  it to the client through the root loader.
- `src/features/shared/runtime-mode.ts`: `resolveRuntimeConfiguration()` / `resolveRuntimeDataMode()`.
  Client results are memoized per browser session; the server is never cached.
- `useDataMode()` in `src/store/app-store.tsx`; login/register/forgot/reset/onboarding/settings/catalog
  loaders read the runtime mode.
- Root renders the `Configuration required` notice (variable names only) when a connected mode is
  present but invalid. A missing mode resolves to fixtures (documented default).
- `src/server/integrations/health.server.ts` + `getIntegrationsHealth` + `IntegrationHealthCard`
  (Settings → Account): each integration by name and state, required and missing variable **names**
  only. `ok` is false only when an integration is `misconfigured`.
- Web push (P4-S6), R2 (P4-S7) and application email (Resend) are reported `disabled` with the
  variable names they would read. Account email is reported as owned by Supabase Auth SMTP.
- `vite.config.ts` publishes loaded `VITE_` values into `process.env` for local development (an
  existing environment value always wins), keeping runtime readers working with `.env.local`.

## Verification

| Check | Result |
| --- | --- |
| `bun test tests/unit/runtime-env.test.ts` | 4 passed, 0 failed |
| `bun run test:unit` | 264 passed, 0 failed (23 files) |
| `bun run typecheck` | clean (app + scripts) |
| `bun run lint` | clean |
| `bun run verify:client-boundary` | pass |
| `bun run build` | success; built Worker reads `globalThis.__env__` |
| `bun run test:fixture` | 32 passed, 16 skipped, 0 failed (same final tree/run as P4-S5) |
| `git diff --check` | clean |

Manual browser check: `VITE_DATA_MODE=supabase-staging` with empty URL/key returned HTTP 200, rendered
the configuration notice, showed no fixture identity and did not leak the configured mode.

Environment: Bun 1.4.4, Node v26.12.1, TypeScript 5.9.3, Playwright 1.64.1.

## Security review summary

- No secret value is read back to a client. Health reports carry names and states only.
- A provider-valued object binding (e.g. `ASSETS`) is ignored, so it cannot masquerade as a variable.
- A misconfigured connected deployment fails closed; it never renders fixtures.
- Only documented `VITE_` values reach the browser bundle; the client-boundary scan passed.
- Critical findings: 0. High findings: 0.

## Not run / not authorized

- No deployment, no Cloudflare dashboard change, no hosted project mutation.
- No provider connection (Upstash, Telegram, Resend, VAPID).
- ADR-041 Wave 5 capacity/recovery remains deferred.

## Rollback

Restore `src/lib/data-mode.ts` and its imports, and revert the server readers to `process.env`; remove
`runtime-mode.ts`, `health.server.ts` and the Settings card. No remote state exists to undo.