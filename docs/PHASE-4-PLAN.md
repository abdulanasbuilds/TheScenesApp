# The Scenes — Phase 4 Plan: Email, files, notifications

**Planning status:** PLANNING (drafted 11 November 2026)
**Founder approval:** NOT APPROVED
**Parent:** `docs/PHASES.md` (Phase 4), ADR-040 (lean build + staged activation), ADR-041
**Gate:** `docs/PHASE-PLANNING-GATE.md`

Nothing in this document authorizes implementation. Phase 4 begins only after the founder approves this
plan and the provider accounts listed in §11. No production, payment, deployment, live-customer or
provider action is approved by this plan.

---

## 1. Outcome and business context

Phase 3A delivers the learning slice (discover → join → enrol → learn → persist). Phase 4 makes the
platform trustworthy and usable in the real world by adding the minimum operational services that a
learning community needs, behind internal adapters:

- **Transactional email** so people can confirm an account, and so important account events arrive
  reliably (currently Auth email uses Supabase's built-in sender in pre-production).
- **Notifications** so learners and creators can be told about meaningful events (enrolment, new lesson,
  community activity) with explicit consent and control.
- **Installability (PWA) and consented web push**, important for mobile-first African audiences on
  variable bandwidth.
- **Rate limiting / abuse control** at the edge of server functions so public endpoints cannot be
  abused, and so login/join/enrol cannot be scripted cheaply.
- **A narrow file/object path** for separately approved platform-managed objects only (not creator
  hosting; see ADR-029).

Measurable value:

- trust: reliable confirmation and account email;
- retention: consented notifications drive return visits;
- reach: installable PWA works better on low-end/limited-bandwidth devices;
- safety: bounded abuse of public endpoints;
- time saved: creators/learners spend less time chasing account state.

This work belongs in Phase 4 because it is the first phase that legitimately requires external providers
beyond Supabase, and the learning slice is now stable enough to attach them.

## 2. Scope control

**In scope (proposed first vertical slices, in order):**

1. **S1 — Transactional email adapter + auth email.** A server-only `EmailProvider` adapter with a
   Resend implementation and a safe no-op/console implementation for local/fixture modes. Wire account
   confirmation and password reset through the adapter where the contract requires our own send.
2. **S2 — Rate limiting adapter.** A `RateLimiter` adapter with a Redis-compatible implementation and an
   existing local in-memory limiter for local/fixture modes. Applied to login, signup, join/enrol and
   other public server functions.
3. **S3 — Notification model + in-app notifications.** A minimal `notifications` table with RLS, an
   unread-count contract, and a notifications surface for authenticated users.
4. **S4 — PWA installability.** Web app manifest, service worker, offline shell, install prompt, and a
   Lighthouse/installability check.
5. **S5 — Consented web push.** VAPID keys, push subscription storage, consent + preferences, and a
   server-side send path behind the notification service.
6. **S6 (conditional, separately approved) — Narrow platform-managed objects.** An `ObjectStore` adapter
   with an R2 implementation for approved system assets/exports only. ADR-029 launch base plans remain
   external-link-only for creator content.

**Out of scope / must remain untouched:**

- creator native file/video/live hosting (ADR-029) and Bunny/LiveKit/etc.;
- payments, payouts, marketplace, orders (Phase 7–8, HOLD);
- the AI/search layer (Phase 9);
- production deployment, production email domains, production data;
- referral/provider quota mechanics beyond what Phase 3A already defines;
- any real customer data.

**Dependencies / blocked decisions:** provider selection and accounts (§11); current official provider
documentation must be re-checked at implementation time; the deferred Wave 5 capacity rehearsal remains a
precondition before any staging load test or launch.

**Reversible vs irreversible:** adapters and local in-memory implementations are reversible; creating
provider accounts, sending real email to real addresses, and storing real push subscriptions are remote
side effects requiring explicit approval.

## 3. Product and interaction contract

- **Notifications surface:** existing `/notifications` route moves from fixture-only to connected for the
  signed-in viewer; unread badge in the authenticated shell; empty/loading/error/unauthorized states;
  "mark read" and "mark all read".
- **Notification preferences:** in Settings, per-category toggles (account/security always on; community,
  learning, product optional) and a web-push enable/disable control that requests browser permission only
  on explicit user action.
- **PWA:** manifest with name/icons/theme; installable on supported browsers; offline fallback for the
  app shell; no requirement that offline data be authoritative.
- **Email:** account confirmation and password reset render plain, accessible HTML + text; no secrets in
  email; unsubscribe only where legally required (transactional email is not marketing).
- **Consent and abuse:** push permission is never requested on load; rate-limited actions show a clear,
  human message when throttled; a `429` is safe and does not leak account existence.
- **Degraded states:** if email/Redis/push provider is unconfigured or down, the app still works;
  email-dependent actions report a safe "temporarily unavailable" state rather than silently succeeding;
  there is no silent fallback that pretends a message was delivered.

**Accessibility:** notifications list has landmarks and live-region-aware unread count; toggles are
keyboard operable with visible focus; install/push prompts are dismissible and screen-reader labelled.

**Analytics needed:** email accepted/rejected counts (no PII), notification created/read counts, push
subscribed/unsubscribed counts, rate-limit rejections by surface.

## 4. Domain and data model

New/updated tables (all RLS-enabled, owner-scoped; migrations via the pinned Supabase CLI):

- `notifications` — `id uuid pk`, `user_id uuid fk auth.users`, `type text`, `title text`, `body text`,
  `href text null`, `read_at timestamptz null`, `created_at timestamptz default now()`; index
  `(user_id, read_at, created_at desc)`.
- `notification_preferences` — `user_id uuid pk fk auth.users`, per-category booleans with safe defaults,
  `updated_at`.
- `push_subscriptions` — `id uuid pk`, `user_id uuid fk`, `endpoint text unique`, `p256dh text`,
  `auth text`, `created_at`, `last_seen_at`; a subscription is deletable by its owner.
- `private.email_outbox` (optional, if we add queued send) — append-only, idempotency key, status;
  private schema, no client access.
- `private.rate_limit_events` (optional, only if we need durable auditing of throttling) — otherwise
  Redis-only.

Rules:

- ownership is `user_id = auth.uid()`; no cross-user reads;
- service-role/admin write paths are server-only and audited;
- deletion: notifications are user-deletable and retention-bounded; unsubscribing removes the push row;
- idempotency: notification creation and email send carry an idempotency key to avoid duplicates;
- append-only where history matters (email outbox, audit events);
- migration/rollback: additive migrations only; rollback = drop the new tables/adapter wiring; no
  destructive change to Phase 3A tables;
- representative queries: unread count, latest N notifications, preferences read, push subscriptions by
  user — each gets a justified index and an `EXPLAIN` check on representative data.

## 5. API and integration contracts

All providers sit behind internal adapters (ADR-006). No vendor SDK is imported directly by routes or
client code. No secrets reach the client bundle.

Adapters (proposed interfaces):

```text
EmailProvider.send({ to, subject, html, text, idempotencyKey }) -> { ok, providerMessageId? }
RateLimiter.consume({ key, limit, windowSeconds }) -> { allowed, remaining, resetAt }
PushProvider.send({ subscriptions, payload }) -> { ok, failed[] }
ObjectStore.put/getSignedUrl/delete({ key, ... }) -> { ... }   // conditional S6 only
```

Implementations:

- `resend` (email), `memory` (local/fixture email = record, never send);
- `redis` (rate limit), `memory` (local in-memory limiter);
- `web-push` (push), `memory` (local no-op);
- `r2` (objects), `memory` (local no-op) — conditional.

Trust boundaries: browser → server functions (existing CSRF/origin/session checks) → adapter → provider.
Providers are called only from server code. Webhook endpoints (if any, e.g. email delivery events) verify
signatures and are idempotent.

Errors/retries/timeouts: provider calls have timeouts, bounded retries with backoff, and a circuit-breaker
style "fail safe" that degrades to the safe state; a failed email never blocks the user flow it belongs
to; a failed push send never fails the triggering request.

Pagination/filtering: notifications are paginated and bounded; preferences/push are single-object reads.

Rate limits and abuse controls: per-IP and per-account limits on auth, join/enrol, and notification
actions; limits are configured values, not magic numbers, and are recorded.

Version/backward compatibility: adapters are internal; adding a provider must not change route contracts.

Provider constraints/costs: confirm against current official documentation at implementation time.

## 6. Security and privacy

- **Permission matrix:** notifications/preferences/push are owner-only; no public read; admin/ops access
  is server-side and audited.
- **Enforcement points:** RLS policies for owner scope; server functions re-check `auth.uid()`; adapter
  credentials live only in server env.
- **Secrets (ADR-017):** names only, stored in ignored local env or the approved platform secret store;
  never in chat, source control, docs, logs or the client bundle. Candidate names:
  `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `APP_BASE_URL`,
  `REDIS_URL` (and `REDIS_TOKEN` if required),
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
  and for conditional S6: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_ENDPOINT`.
- **Safe missing-config behavior:** server functions detect missing provider config and return an explicit
  "not configured" state; they never silently fall back to fixtures after a configured provider fails,
  and never claim an email/push was delivered when it was not.
- **Input validation / output encoding:** validate email/URL/endpoint inputs; encode user content in HTML
  email bodies; never render unsanitized user content into email.
- **Sensitive data:** minimize PII; push endpoints are treated as sensitive; logs redact addresses,
  tokens and endpoints.
- **Audit:** privileged sends and preference changes produce audit events; push/email failures are logged
  without PII.
- **Privacy/safeguarding:** consent for notifications; clear opt-out; no marketing email in this phase.
- **Threats:** email header injection, open-relay abuse, push endpoint spoofing, notification spam,
  rate-limit bypass, SSRF via resource fetches, secret leakage via error messages.

## 7. Scale and performance envelope

Targets are stated for the **pre-production/staging envelope** and must be measured, not assumed. The
long-term direction is millions of registered accounts over time, not millions of concurrent users.

- registered accounts at first staging: bounded test accounts only;
- peak concurrent sessions: measured during staging, not claimed;
- email volume: bounded by auth events and explicit notification triggers; provider rate limits enforced;
- push: bounded by consented subscribers; fan-out is chunked and idempotent;
- rate limiting: Redis holds short-lived counters only; never a durable source of truth;
- latency budgets: notification read APIs p95 ≤ 300 ms, p99 ≤ 800 ms on the documented environment;
  email/push sends are asynchronous or non-blocking relative to the user request;
- overload behavior: rate limits shed load gracefully with `429`; email/push failures degrade safely;
- scaling triggers: if notification/push volume or rate-limit QPS exceeds the measured envelope, add
  indexing, batching or a queue boundary before raising limits;
- cost: provider free/low tiers for staging; production budget is a separate founder decision.

**Note:** the deferred Wave 5 rehearsal (ADR-041) must complete before any Phase 4 load or scale claim.

## 8. Reliability and operations

- dependency failure modes: provider outage → safe degradation, no blocked core flows;
- timeouts/retries/circuit breaker: bounded retries with backoff; stop after threshold; surface safe error;
- backup/recovery: Phase 3A database backup/recovery posture applies; new tables inherit it; the deferred
  restore rehearsal must cover the new tables before launch;
- logs/metrics/traces: structured logs with correlation IDs; counts for sent/failed/rate-limited;
- SLIs/alerts: email failure rate, push failure rate, rate-limit rejection spikes;
- runbooks: setup/health check for each adapter; how to rotate each secret; how to disable a provider;
- rollout/rollback: feature-flag each provider (config presence = enabled); roll back by removing config
  and reverting adapter wiring; additive migrations only;
- cost guardrails: alerting on provider usage; hard caps where the provider supports them.

## 9. Verification plan

- unit tests for each adapter's success/failure/missing-config behavior (no real network);
- contract tests for `EmailProvider`, `RateLimiter`, `PushProvider`, `ObjectStore`;
- RLS/authorization allow/deny tests for notifications/preferences/push (owner-only);
- integration tests against the local stack (or, if approved, pre-production) for the notification read
  path and rate limiting;
- browser checks for the notifications surface, preferences, and consent/denied-permission push states
  across desktop/tablet/mobile;
- accessibility checks for notifications and toggles;
- PWA installability check (manifest, service worker, Lighthouse installability where available);
- rate-limit behavior tests including `429` and no account-existence leak;
- a redacted health/setup checker that reports missing variable **names** without printing values;
- final diff/changed-path review and an independent review for the provider/security boundary.

## 10. Acceptance and handoff

Exit criteria (proposed):

- each implemented slice works with its provider configured and degrades safely without it;
- no secret or provider implementation appears in the client bundle (`verify:client-boundary` passes);
- owner-only RLS verified with positive and negative tests;
- notifications, preferences, PWA and (if approved) push verified in the browser on all three viewports;
- evidence recorded under `docs/evidence/phase-4/<run-id>/` as redacted `summary.md` + `manifest.json`;
- remaining limitations and deferred items documented (including the ADR-041 Wave 5 precondition).

Evidence locations: `docs/evidence/phase-4/`. Durable decisions: `docs/DECISIONS.md`.

## 11. Required founder decisions and provider-account request

To implement Phase 4, the founder must approve this plan and provide/authorize the accounts below. Names
are variables only; no secret value is requested in chat.

| Capability | Provider (proposed) | Variables (names only) | Cost/impact | Verification | Rollback |
|---|---|---|---|---|---|
| Transactional email | Resend (ADR-010) | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `APP_BASE_URL` | free/low tier; sending to real addresses is a side effect | health check + one real confirmation/reset in staging | remove config → adapter falls back to safe no-send |
| Rate limiting | Redis-compatible (e.g. Upstash) | `REDIS_URL`, `REDIS_TOKEN` | free/low tier | throttle test returns `429`; counters expire | remove config → in-memory limiter |
| Web push | Standards Web Push (VAPID) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | free; browser permission required | consented subscribe → receive → unsubscribe | disable push; delete subscription rows |
| PWA | none (standard) | none | none | installability/Lighthouse | remove service worker/manifest |
| Objects (conditional S6) | Cloudflare R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | pay-as-you-go; ADR-029 limits scope | signed URL + access-control test | remove config → adapter no-op |

Decisions needed:

1. Approve this plan (or amend scope) — section 12.
2. Approve which slices to build first (recommend S1 → S2 → S3 → S4/S5; S6 only if needed).
3. Approve the provider accounts and where the secrets live (ignored local file / approved secret store).

## 12. Approval record

```text
Planning status: REVIEWED (drafted 11 November 2026)
Founder approval: NOT APPROVED
Approved scope version/date:
Approved first vertical slice:
Production actions authorized: NONE
Known blockers: Phase 3A Wave 5 capacity/recovery evidence deferred (ADR-041);
                provider accounts not yet created;
                current official provider documentation to be re-checked at implementation time.
Required re-review triggers: any provider/scope change; any request for production, payment or
                live-customer action; a load/scale claim; the ADR-041 Wave 5 precondition being triggered.
```

When the founder approves, copy the approval into this record and update `docs/PROJECT-STATUS.md` and
`docs/PHASES.md`. Chat approval alone is not durable approval.
