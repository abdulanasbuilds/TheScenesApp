# Cloudflare deployment and runtime configuration

**Status:** code/local ready. Deployment itself is a separately approved operation and has not been
performed. This document describes how the built application is configured on Cloudflare so that a
founder-approved deployment can be made without changing code.

Related: `docs/INTEGRATIONS.md`, `docs/PHASE-4-PLAN.md`, ADR-045.

## How configuration reaches the application

The server resolves configuration from the **merged runtime environment**:

1. `process.env` (Node development, local preview, CI); overlaid by
2. `globalThis.__env__` — the Cloudflare binding object that Nitro's `cloudflare-module` preset assigns
   on every request.

Binding values win. Only string values are read; object bindings (assets, KV, R2, queues) are ignored.
The server validates the values on each request and tells the client which `dataMode` is active. No
secret is ever inlined into the browser bundle.

This means **the hosting dashboard is the source of truth in production**, not a build-time file. A
local `.env.local` file remains the source for local development.

## What gets built

`bun run build` produces:

- `.output/server/index.mjs` — the Worker entry (Nitro `cloudflare-module`);
- `.output/public/` — static assets, including `manifest.webmanifest`, `sw.js`, `offline.html` and
  `public/icons/*`;
- `.output/server/wrangler.json` and `.wrangler/deploy/config.json` — generated Wrangler config.

The generated Worker config declares `compatibility_flags: ["nodejs_compat"]`. Keep that flag: the
Supabase SSR client and the runtime environment reader rely on the Node compatibility surface.

## Variables to set in the Cloudflare dashboard

Set these under **Workers → (worker) → Settings → Variables and Secrets**. Use _Secret_ for every value
that must not be readable in the dashboard log, and _Variable_ for non-secret modes/names.

### Required for a connected deployment

| Name                            | Kind     | Example / rule                                                                          |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `VITE_DATA_MODE`                | Variable | `supabase-staging` (or `fixtures` for a public preview with no backend)                 |
| `VITE_SUPABASE_URL`             | Variable | `https://okdzuqgzgnmmbtjxdaci.supabase.co` (must match `https://<20-char>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Variable | `sb_publishable_...` (publishable key only; never a secret/service key)                 |
| `APP_ORIGIN`                    | Variable | Exact deployed HTTPS origin, for example `https://app.example.com`; no path or wildcard |
| `PWA_MODE`                      | Variable | `enabled` normally; `retire` only for an approved service-worker rollback               |

`VITE_` values are the only configuration the browser may see. The publishable key is designed to be
public; Row Level Security is what protects data.

### Rate limiting (P4-S2) — required before public launch

| Name                       | Kind     | Notes                                                 |
| -------------------------- | -------- | ----------------------------------------------------- |
| `RATE_LIMIT_DRIVER`        | Variable | `upstash` to enable the distributed limiter           |
| `UPSTASH_REDIS_REST_URL`   | Secret   | Scoped Upstash REST endpoint                          |
| `UPSTASH_REDIS_REST_TOKEN` | Secret   | Scoped Upstash REST token                             |
| `RATE_LIMIT_HASH_SECRET`   | Secret   | At least 16 characters; used to hash limiter subjects |

If `RATE_LIMIT_DRIVER=upstash` is set but any value is missing or invalid, the limiter reports
`misconfigured` (it does not silently fall back to per-instance memory in a hosted deployment).

### Feedback (P4-S4) — optional internal Telegram bot

| Name                        | Kind     | Notes                                                          |
| --------------------------- | -------- | -------------------------------------------------------------- |
| `FEEDBACK_PROVIDER`         | Variable | `telegram` to deliver to the internal chat; default `memory`   |
| `TELEGRAM_BOT_TOKEN`        | Secret   | Bot token from the founder-controlled bot                      |
| `TELEGRAM_FEEDBACK_CHAT_ID` | Secret   | Numeric private/group chat ID; group IDs are commonly negative |

An incomplete Telegram configuration fails closed and is reported `misconfigured`; feedback submissions
return the safe `UNAVAILABLE` contract instead of silently going nowhere.

### Account email (P4-S1) — configured in Supabase, not here

Confirmation and password-recovery email is delivered by **Supabase Auth custom SMTP**. Configure it in
the Supabase dashboard for `okdzuqgzgnmmbtjxdaci` (see `docs/ACCOUNT-EMAIL-SETUP.md`). The application
runtime does not read SMTP credentials.

## Integrations that are NOT activated by adding keys

These are reported `disabled` in **Settings → Account → Connected services**, regardless of variables,
because their code path is not enabled in this build:

| Integration                     | Variables it would read                                                                 | Why it stays disabled                                                |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Web push (P4-S6)                | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`                                | Needs founder approval plus a Cloudflare/workerd compatibility proof |
| Application email (Resend)      | `RESEND_API_KEY`, `EMAIL_FROM`                                                          | No approved application-originated email event                       |
| Platform object storage (P4-S7) | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | No approved concrete platform-managed object                         |

Adding these variables alone will not activate the feature. Do not set them expecting an effect.

## Deploy and verify

1. Apply the P4-S3 notifications migration to the hosted project **after separate approval** (see
   `docs/NOTIFICATIONS.md`).
2. Set the variables above in the dashboard.
3. Build and deploy the generated Worker with the approved Wrangler/nitro command for the project.
4. Verify, in this order:
   - `/` loads without the "Configuration required" notice;
   - `/manifest.webmanifest` returns the manifest and `/sw.js` returns the worker;
   - the browser can install the app (or shows Add to Home Screen on iOS);
   - **Settings → Account → Connected services** reports provider-backed services as
     `Configured — verify` until a real-provider check has been recorded;
   - feedback submission reaches the internal Telegram chat (one founder-controlled test message).
5. Record the run as evidence under `docs/evidence/phase-4/`.

If a connected mode is misconfigured, the root renders a **Configuration required** page listing the
missing variable names (never values). This is the intended failure: it never pretends to be fixtures.

## Rollback

- **Application:** redeploy the previous Worker version, or set `VITE_DATA_MODE=fixtures` for a
  read-mostly public preview (fixtures must be an explicit choice, never an automatic fallback).
- **PWA:** set `PWA_MODE=retire` and deploy the rollback build. Each visiting browser unregisters the
  root-scope worker and deletes only `thescenes-pwa-*` caches. The app continues as an ordinary web
  page. After the retirement window, remove the manifest link in a reviewed follow-up if installability
  is being withdrawn permanently.
- **Integrations:** unset the provider variables; the corresponding integration reports `disabled` or
  `misconfigured` and fails safe.

## Security notes

- Never put a service-role key, database password, SMTP password, bot token or Redis token behind a
  `VITE_` name. Anything `VITE_` is visible to the browser.
- Never commit real values. Local values belong in the ignored `.env.local`; hosted values belong in
  the platform secret store.
- The integration report exposes variable **names** and states only. It is safe to screenshot.
