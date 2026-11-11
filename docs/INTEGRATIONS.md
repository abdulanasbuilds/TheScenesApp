# The Scenes — Integration Boundaries

External services are implementation details behind internal adapters.

## Runtime configuration (ADR-045)

Deployment configuration is resolved at runtime from `process.env` overlaid by Cloudflare's
`globalThis.__env__` bindings, so changing a hosting variable does not require a rebuild. A connected
mode that is misconfigured fails closed with a variable-name-only notice; it never falls back to
fixtures. Settings → Account renders a read-only integration report by name and state (never values).
See `docs/CLOUDFLARE-DEPLOYMENT.md` for the variable contract, verification and rollback.

## Cloudflare

Use for hosting, edge delivery, security/perimeter controls, and domain/DNS where appropriate.

## Supabase

**Current status:** selected and connected for the accepted Phase 3A learning slice. THE SCENES
(`okdzuqgzgnmmbtjxdaci`) is classified as **PRE-PRODUCTION**; 18 migrations and the founder-approved
fictional catalogue are present. This is not production, deployment, payment or real-customer approval.
Wave 5 capacity/recovery evidence remains deferred under ADR-041.

Use for:

- authentication;
- PostgreSQL;
- realtime;
- relational backend;
- learning/progress persistence.

Do not expose service-role credentials to the client.

Start with the HTTPS Data API and user-scoped SSR sessions. Add direct SQL/Hyperdrive or an ORM only
after measured need. Free tier is for development only; production requires an approved region,
backup/recovery target and budget.

## Cloudflare R2

**Conditional / separately approved:** ADR-029 makes launch base plans external-link-only. Phase 4
revision 2 permits only a separately approved narrow platform-managed object after its exact access,
retention, cost and rollback contract is accepted. R2 is not launch creator hosting or a referral reward.

Possible approved uses are limited to system assets or exports. Creator course resources/files,
video/live media and storage rewards remain excluded.

Private objects require controlled access.

## Resend

**Planned Phase 4 provider; hosted account-email configuration approved on THE SCENES only.** ADR-042
approves P4-S1 code/local work; ADR-043 approves Supabase Auth URL configuration and Resend custom SMTP
on `okdzuqgzgnmmbtjxdaci` only. Use Resend first as Supabase Auth custom SMTP so Supabase remains
confirmation/recovery token authority. The application never handles raw SMTP or builds Auth links.

The Resend account, verified sending domain, scoped key and Supabase Auth SMTP values still need to be
created/applied by the founder; the agent does not create them or print them. Connected recovery is
verified by one founder-controlled inbox test. No other project, deployment or provider is authorized.
A direct application email adapter is added only when an approved event, idempotency and
delivery/retry contract exists.

Do not make client-side pages responsible for privileged mail sending. See
`docs/ACCOUNT-EMAIL-SETUP.md` for the configuration names, templates, verification and rollback.

## Redis-compatible service

**Code/local adapter implemented (P4-S2, ADR-044); provider account NOT approved.** Revision 2 proposes
Upstash Redis REST for pre-production because it is fetch-compatible with the Cloudflare/workerd
runtime.

- The agent may add a `RateLimiter` interface with a fetch-compatible Upstash REST adapter that is
  disabled and safe when configuration is missing.
- The in-memory limiter remains the fixture/local implementation; a configured integration never
  silently falls back to memory.
- Creating an Upstash account, setting credentials or pointing staging at a real Redis instance requires
  a separate explicit approval. Re-check current cost/security limits before that request.

Use for:

- rate limiting;
- short-lived counters/locks;
- carefully scoped cache.

Never treat it as durable source of truth.

## Telegram

**Code/local adapter implemented (P4-S4, ADR-044); bot/account NOT approved.** Use only behind a
replaceable server-only feedback adapter for the founder-approved `TS-FEED-001/002` channel, with a
safe no-op/disabled implementation when configuration is absent. Minimize data, rate-limit submits,
never send credentials/protected content and establish the operational deletion process before
enablement. Creating a bot, holding its token or sending a real message requires a separate explicit
approval.

The implementation ships a `memory` provider (local preview, reported `disabled` in a hosted
deployment) and a `telegram` provider selected by `FEEDBACK_PROVIDER`. An incomplete Telegram
configuration is reported `misconfigured` and submissions fail closed with `UNAVAILABLE`; it never
silently falls back to the memory inbox.

## Bunny.net

Use for video delivery and selected interactive/live capabilities.

Keep provider-specific secrets server-side.

## Payments

**HOLD**

No payment processor is selected or implemented in the frontend-first stage.

When activated, define:

- Ghana payment model;
- international payment model;
- provider adapter;
- webhooks;
- idempotency;
- refunds;
- chargebacks;
- creator revenue/payout rules.

## Search

Start with database/full-text search.

Evaluate a dedicated search engine or AI-assisted semantic search only when the evidence justifies the extra complexity.

## PWA/Web Push

Use for installability and consented notifications.

- **P4-S5 (installability, offline shell, icons, safe runtime caching) is implemented as code/local work
  (ADR-044).** The manifest, owned icons, offline shell and a narrowly allowlisted service worker ship
  with the build; the worker is registered only in a production build and caches only versioned
  `/assets/*`, `/icons/*`, the manifest and the offline shell.
- **P4-S6 (Web Push) is NOT approved.** Web Push requires (a) a Cloudflare/workerd compatibility proof
  and (b) a separate approval before creating a VAPID key pair or any push subscription. It is reported
  `disabled` in the integration health report.

Notification preferences and abuse controls are required.

## Research rule

Provider APIs change. Check current official documentation immediately before implementation and record important decisions in `docs/DECISIONS.md`.
