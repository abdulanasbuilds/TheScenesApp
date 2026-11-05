# The Scenes — Integration Boundaries

External services are implementation details behind internal adapters.

## Cloudflare

Use for hosting, edge delivery, security/perimeter controls, and domain/DNS where appropriate.

## Supabase

**Current status:** approved for a bounded, local-only Phase 3 proof-of-fit after the remaining Gate A
safety work; not approved as a hosted/production commitment and not yet connected.

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

**Conditional / later:** ADR-029 makes launch base plans external-link-only. R2 may be evaluated for
narrow platform-managed objects (for example, approved system assets or exports) in a later phase;
it is not launch creator hosting and not a current referral reward.

If separately approved, use for:

- course resources;
- creator files;
- media/object storage;
- exports where appropriate.

Private objects require controlled access.

## Resend

Use for important transactional email.

Do not make client-side pages responsible for privileged mail sending.

## Redis-compatible service

Use for:

- rate limiting;
- short-lived counters/locks;
- carefully scoped cache.

Never treat it as durable source of truth.

## Bunny.net

Use for video delivery and selected interactive/live capabilities.

Keep provider-specific secrets server-side.

## Telegram

Use for internal feedback/operational alerts.

Never expose bot tokens to the client.

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

Notification preferences and abuse controls are required.

## Research rule

Provider APIs change. Check current official documentation immediately before implementation and record important decisions in `docs/DECISIONS.md`.
