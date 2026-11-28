# Cloudflare deployment and runtime configuration

**Status:** a **fixtures-mode preview** is deployed and public at
`https://thescenesapp.abdulanas.workers.dev/` (Cloudflare Worker `thescenesapp`, account
`e42e083bcff4407bb54742be6c390108`). It carries no connected backend: `VITE_DATA_MODE=fixtures`.
Connected/staging deployment remains a separately approved operation and has not been performed. This
document describes how the built application is configured on Cloudflare.

Related: `docs/INTEGRATIONS.md`, `docs/PHASE-4-PLAN.md`, ADR-045.

## How this repository deploys (GitHub-connected Workers Builds)

Deployment is driven from GitHub, not from a developer machine:

- the repo root contains a committed `wrangler.jsonc` whose `name` **must** match the Worker name in
  the dashboard (`thescenesapp`), pinned `compatibility_date` and `nodejs_compat`;
- Cloudflare **Workers Builds** is connected to `abdulanasbuilds/TheScenesApp`, branch `main`, with
  build command `bun run build` and deploy command `npx wrangler deploy`;
- a push to `main` builds and deploys; other branches produce preview URLs.

Non-secret runtime variables live in the `vars` block of `wrangler.jsonc` so the committed config and
the dashboard cannot drift. Secrets must never be committed there. The same recipe applies to other
projects: a root Wrangler config whose `name` matches the Worker, then connect the repo in Cloudflare.

The Worker was originally created as `abdulanasbuilds-thescenesapp` and renamed to `thescenesapp`
(Cloudflare renames the Worker and keeps the Git connection, deployments and variables).

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

Set these under **Workers → (worker) → Settings → Variables and Secrets**. Use *Secret* for every value
that must not be readable in the dashboard log, and *Variable* for non-secret modes/names.

### Required for a connected deployment

| Name | Kind | Example / rule |
|---|---|---|
| `VITE_DATA_MODE` | Variable | `supabase-staging` (or `fixtures` for a public preview with no backend) |
| `VITE_SUPABASE_URL` | Variable | `https://okdzuqgzgnmmbtjxdaci.supabase.co` (must match `https://<20-char>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Variable | `sb_publishable_...` (publishable key only; never a secret/service key) |

`VITE_` values are the only configuration the browser may see. The publishable key is designed to be
public; Row Level Security is what protects data.

### Rate limiting (P4-S2) — required before public launch

| Name | Kind | Notes |
|---|---|---|
| `RATE_LIMIT_DRIVER` | Variable | `upstash` to enable the distributed limiter |
| `UPSTASH_REDIS_REST_URL` | Secret | Scoped Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Scoped Upstash REST token |
| `RATE_LIMIT_HASH_SECRET` | Secret | At least 16 characters; used to hash limiter subjects |

If `RATE_LIMIT_DRIVER=upstash` is set but any value is missing or invalid, the limiter reports
`misconfigured` (it does not silently fall back to per-instance memory in a hosted deployment).

### Feedback (P4-S4 / ADR-049) — optional GitHub Issue channel

| Name | Kind | Notes |
|---|---|---|
| `FEEDBACK_PROVIDER` | Variable | `github` creates Issues; `memory` keeps a local preview inbox (default; reported `disabled` in hosted mode) |
| `GITHUB_FEEDBACK_REPO` | Variable | Repository as `owner/name`, for example `thescenes-app/thescenes-feedback` |
| `GITHUB_FEEDBACK_TOKEN` | Secret | Fine-grained token scoped to the feedback repository with Issues read/write |
| `GITHUB_FEEDBACK_API_BASE` | Variable | Optional; defaults to `https://api.github.com` |

A complete GitHub configuration reports `ready`; an incomplete one reports `misconfigured` and
submissions fail closed with `UNAVAILABLE` instead of silently going nowhere. Success is claimed only
after GitHub confirms an Issue number. Setup: `docs/GITHUB-FEEDBACK-SETUP.md`.

### Account email (P4-S1) — configured in Supabase, not here

Confirmation and password-recovery email is delivered by **Supabase Auth custom SMTP**. Configure it in
the Supabase dashboard for `okdzuqgzgnmmbtjxdaci` (see `docs/ACCOUNT-EMAIL-SETUP.md`). The application
runtime does not read SMTP credentials.

## Integrations that are NOT activated by adding keys

These are reported `disabled` in **Settings → Account → Connected services**, regardless of variables,
because their code path is not enabled in this build:

| Integration | Variables it would read | Why it stays disabled |
|---|---|---|
| Web push (P4-S6) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Needs founder approval plus a Cloudflare/workerd compatibility proof |
| Application email (Resend) | `RESEND_API_KEY`, `EMAIL_FROM` | No approved application-originated email event |
| Platform object storage (P4-S7) | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | No approved concrete platform-managed object |

Adding these variables alone will not activate the feature. Do not set them expecting an effect.

## Deploy and verify

1. Apply the P4-S3 notifications migration to the hosted project **after separate approval** (see
   `docs/NOTIFICATIONS.md`).
2. Set the variables above in the dashboard (or the non-secret ones in `wrangler.jsonc` `vars`).
3. Push to `main`; Workers Builds builds and deploys, or run the approved Wrangler/nitro command for
   the project from the repo root.
4. Verify, in this order:
   - `/` loads without the "Configuration required" notice;
   - `/manifest.webmanifest` returns the manifest and `/sw.js` returns the worker;
   - the browser can install the app (or shows Add to Home Screen on iOS);
   - **Settings → Account → Connected services** reports Supabase `Ready`, rate limiting `Ready` when
     Upstash is configured, and account email `Ready`;
   - feedback creates a GitHub Issue (one founder-controlled test message) and reports `ready` in the
      integration report;
5. Record the run as evidence under `docs/evidence/phase-4/`.

If a connected mode is misconfigured, the root renders a **Configuration required** page listing the
missing variable names (never values). This is the intended failure: it never pretends to be fixtures.

## Rollback

- **Application:** redeploy the previous Worker version, or set `VITE_DATA_MODE=fixtures` for a
  read-mostly public preview (fixtures must be an explicit choice, never an automatic fallback).
- **PWA:** remove the manifest link and unregister the service worker; the app continues as an ordinary
  web page. The worker's cache only holds versioned `/assets/*`, `/icons/*` and the offline shell.
- **Integrations:** unset the provider variables; the corresponding integration reports `disabled` or
  `misconfigured` and fails safe.

## Security notes

- Never put a service-role key, database password, SMTP password, bot token or Redis token behind a
  `VITE_` name. Anything `VITE_` is visible to the browser.
- Never commit real values. Local values belong in the ignored `.env.local`; hosted values belong in
  the platform secret store.
- The integration report exposes variable **names** and states only. It is safe to screenshot.
