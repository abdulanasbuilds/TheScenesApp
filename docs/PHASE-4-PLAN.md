# The Scenes — Phase 4 Plan: Email, notifications, PWA and operational services

**Planning status:** APPROVED — P4-S1 implementing; all other slices unchanged
**Revision:** 2 — 11 November 2026
**Founder approval:** APPROVED for P4-S1 code/local (ADR-042) and for hosted account-email configuration on THE SCENES (ADR-043, 11 November 2026)
**Parent:** `docs/PHASES.md`, ADR-006, ADR-009, ADR-010, ADR-012, ADR-017, ADR-029,
ADR-040 and ADR-041
**Gate:** `docs/PHASE-PLANNING-GATE.md`
**Review:** `docs/PHASE-4-PLAN-REVIEW.md`

ADR-042 authorizes P4-S1 code/local work; ADR-043 additionally authorizes hosted account-email
configuration on THE SCENES (`okdzuqgzgnmmbtjxdaci`) only. Nothing in this document authorizes any
other provider creation/configuration, sending real messages, hosted migration, deployment, production
data, payments or spend. Any other slice or remote action begins only after the founder approves it in
§12.

---

## 1. Outcome and business context

Phase 3A provides the accepted learning slice: discover → join → enrol → learn → persist. Phase 4 adds
the minimum operational services that make that slice dependable without introducing creator hosting,
payments or later-phase operations:

- branded account confirmation and password-reset email through Supabase Auth custom SMTP using Resend;
- distributed rate limiting for costly or abuse-sensitive server functions;
- connected owner-only in-app notifications and preferences;
- the founder-approved, replaceable Telegram feedback channel (`TS-FEED-001/002`);
- PWA installability and deliberately bounded low-bandwidth/offline behavior;
- consented web push after a Cloudflare-runtime compatibility proof;
- separately approved narrow platform-managed objects only when a concrete object exists.

Business value:

- **trust:** account emails and security actions are understandable and verifiable;
- **retention:** useful, consented learning/community updates bring people back;
- **reach:** installability and a low-bandwidth shell improve mobile access;
- **safety/cost:** shared rate limits reduce credential abuse, spam and avoidable provider spend;
- **feedback speed:** users can report friction to the founder without exposing credentials.

Success means one bounded slice at a time is plug-ready, degrades honestly when unconfigured, passes
security/browser checks, and has a documented rollback. Provider configuration is not proof of success.

## 2. Scope, slices and phase boundaries

### Proposed implementation order

1. **P4-S1 — Account email and password recovery.** Keep Supabase Auth as the identity/email-event
   authority. Configure Resend as Supabase Auth custom SMTP only after explicit remote-action approval.
   Add the application password-reset request/update journey and safe setup/health documentation. Do
   not replace Supabase confirmation tokens with an application-built token system.
2. **P4-S2 — Distributed rate limiting.** Promote the existing in-memory limiter behind a stable
   `RateLimiter` interface. Add a fetch-compatible Upstash Redis REST implementation for connected
   staging. Preserve the memory implementation for fixture/local mode. Apply configured, documented
   policies to signup, login, password reset, join, enrol, complete and feedback submission.
3. **P4-S3 — Connected in-app notifications.** Add the notification/preference schema, caller-bound
   commands, repository/service/functions, unread count, pagination, owner-only RLS, fixture adapter and
   the existing `/notifications` and Settings UI states. Initial event types are limited to transitions
   already owned by Phase 3A; future creator/event/comment triggers remain deferred.
4. **P4-S4 — Replaceable feedback channel.** Add a server-only `FeedbackProvider` with Telegram and
   memory implementations, a bounded feedback form, rate limit, data-minimization copy and operational
   deletion procedure. Telegram is an internal alert destination, never an authorization or durable
   product database.
5. **P4-S5 — PWA/installability and low-bandwidth shell.** Add the manifest, owned icons, install
   guidance and a service worker that caches versioned public static assets plus a generic offline shell
   only. Never cache authenticated HTML, Supabase responses, server-function responses, cookies,
   notification data or protected lesson content.
6. **P4-S6 — Consented web push.** First prove the selected Web Push implementation works in the
   Cloudflare/workerd production runtime. Then add explicit permission UI, private subscription storage,
   preferences, send/revoke handling and invalid-subscription cleanup. If the runtime proof fails, keep
   in-app notifications/PWA and record push as deferred; do not change the deployment architecture just
   to force push.
7. **P4-S7 — Conditional narrow object storage.** Only after a separate founder approval identifies the
   exact platform-managed object, retention and access contract. R2 remains forbidden for creator
   course files/video/live hosting under ADR-029.

Each slice has an independent approval, implementation, verification, evidence and commit checkpoint.
Do not build all slices in one change set.

### Explicit non-goals

- creator native file/video/live hosting, storage quotas or referral storage rewards;
- comments/posts/events/creator-publishing triggers that belong to Phase 5;
- direct messaging, marketplace, payments, payouts, search/AI or production deployment;
- marketing/broadcast email;
- service-role or secret keys in browser code;
- real customer data;
- claims of capacity, recovery or public-launch readiness while ADR-041 Wave 5 remains deferred.

### Dependencies and reversible actions

- Current official provider documentation must be checked again immediately before each integration.
- Business-controlled provider accounts and fresh scoped credentials require explicit approval.
- Code adapters, additive migrations, fixture/memory implementations and feature-disabled states are
  reversible development work after plan approval.
- Provider account creation/configuration, hosted migrations, sending to real addresses, Telegram bot
  messages, storing real push subscriptions, R2 mutations and deployments are separately approved
  remote actions.

## 3. Product and interaction contract

### Account email and recovery

- Existing email confirmation remains enabled.
- `/forgot-password` accepts an email and always returns the same safe acknowledgement, whether or not
  the account exists.
- Recovery redirect destinations use the existing strict allowlist/origin checks. Recovery parameters
  and tokens are removed from the visible URL and never logged.
- `/reset-password` requires a valid recovery session, validates the new password and signs out other
  sessions if the approved Auth capability supports it; otherwise the limitation is explicit.
- Email has accessible text and HTML versions, a verified sender domain, no tracking by default and no
  claim of delivery until a real staging message arrives.

### Notifications and preferences

- `/notifications` is authenticated, paginated (default 20, maximum 50), newest first, with all/unread,
  loading, empty, retry, unavailable and concealed-unauthorized states.
- "Mark read" and "mark all read" are awaited caller-bound commands; pending controls prevent duplicate
  submission. Badge count comes from the connected state, not fixture data.
- Settings provides channel/category preferences. Account/security notifications are mandatory in-app;
  community/learning/product and email/push channels are opt-in or safely defaulted according to the
  approved matrix.
- Allowed `href` values are internal relative paths from an allowlist; notification data cannot create
  an open redirect.

### Feedback

- The form states that feedback and limited context are sent to an internal Telegram channel.
- Required: message (10–2,000 characters) and current internal route. Optional screenshot, email and
  file attachment are out of scope. Never send cookies, tokens, browser storage, full email, protected
  content or raw request headers.
- The founder receives a pseudonymous user ID (when signed in), route, timestamp, request ID and text.
  Anonymous feedback is allowed only if the approved abuse limit permits it.
- Success means Telegram accepted the message; provider failure shows retryable failure and never
  pretends submission succeeded.

### PWA and push

- Manifest includes name/short name, owned 192px and 512px icons, `start_url`, `scope`, theme/background
  colors and `display: standalone`. Unsupported browsers continue as ordinary web pages.
- Install guidance is user-initiated, dismissible and platform-aware; no fake universal install button.
- Offline shows a generic non-personalized shell. It never presents protected content as current.
- Push permission is requested only from an explicit user gesture after explaining value. Denied,
  unsupported, dismissed, subscribed, expired and revoked states are visible.

### Accessibility and mobile/low bandwidth

- Keyboard access, visible focus, correct labels and status announcements are required.
- Unread status is not conveyed by color alone; counts use accessible names without noisy live updates.
- Forms preserve input on retry and work at mobile widths. Assets are small and versioned; service-worker
  updates are announced without trapping the user on stale code.

## 4. Domain and data model

The project uses imperative, timestamped Supabase migrations. Create migrations with the pinned CLI,
review SQL, and apply remotely only after explicit hosted-mutation approval. New public tables require
explicit grants because Supabase stopped auto-exposing new public tables in 2026.

### `public.notifications`

- `id uuid primary key default gen_random_uuid()`;
- `user_id uuid not null references auth.users(id) on delete cascade`;
- `type text not null` constrained to the approved event enum;
- `title text not null` (1–120 chars), `body text not null` (1–500 chars);
- `href text null` constrained to a safe internal relative-path shape;
- `dedupe_key text not null` (1–160 chars);
- `read_at timestamptz null`, `created_at timestamptz not null default now()`;
- unique `(user_id, dedupe_key)`; keyset index `(user_id, created_at desc, id desc)`; partial unread
  index `(user_id, created_at desc) where read_at is null`.

Authenticated users receive column-limited `SELECT` and `UPDATE (read_at)` for owned rows only. They
cannot insert arbitrary notifications, reassign ownership or update content. Notification creation is
inside reviewed, caller-bound domain commands and is idempotent/atomic with the state transition where
possible. `UPDATE` policies include both `USING` and `WITH CHECK`; direct cross-user reads/writes fail.

### `public.notification_preferences`

- `user_id uuid primary key references auth.users(id) on delete cascade`;
- explicit boolean columns for the approved categories/channels (no opaque settings JSON);
- `updated_at timestamptz not null` maintained by the existing timestamp pattern.

Owner-only select/update/insert with column grants and validation. Defaults are explicit in the
migration and UI. No preference can suppress a legally/security-required account email.

### `private.push_subscriptions`

- `id uuid primary key`, `user_id uuid not null references auth.users(id) on delete cascade`;
- `endpoint_hash text unique not null`; encrypted provider endpoint/key material or a documented
  equivalent at-rest protection approved before S6;
- `created_at`, `last_seen_at`, `revoked_at`.

Push subscription material is sensitive and is not exposed through the Data API. Browser subscribe,
revoke and list-status operations use narrow caller-bound server functions/RPCs; no endpoint or key is
returned after storage. A user can revoke only their own subscription. Expired/410 subscriptions are
revoked automatically.

### Notification event matrix for Phase 4

Initial connected triggers are limited to existing durable transitions:

- `community_joined` — on a changed join, dedupe by membership ID/status transition;
- `course_enrolled` — on a changed enrolment, dedupe by enrollment ID;
- `lesson_completed` — optional and default-off to avoid noise, dedupe by completion ID;
- `system` — only through a privileged, audited server path; not exposed to ordinary users.

Comments, mentions, new creator content and event reminders remain fixture-labelled/deferred until the
owning Phase 5 data exists.

### Lifecycle and retention

- read notifications: delete after 180 days; unread notifications: delete after 365 days;
- revoked/stale push subscriptions: delete after 90 days;
- Redis counters: TTL equals the policy window plus bounded clock tolerance; never durable;
- Resend Free plan provider logs: currently 30 days; no email body is copied into project logs;
- Telegram feedback: operational channel deletion review every 90 days; no duplicate durable project
  copy in this phase. This retention must be operationally feasible before S4 is enabled.

Retention jobs are not invented without an approved scheduler. If no safe scheduler exists, keep the
feature disabled and record the blocker.

## 5. API, provider and adapter contracts

### Auth email boundary

Supabase Auth remains responsible for confirmation/recovery token generation and consumption. Resend is
configured as Supabase custom SMTP (host `smtp.resend.com`, port 465, username `resend`, scoped API key as
password) through the approved Supabase configuration path. The application uses its existing Auth
repository/service boundary to request password recovery. It does not handle raw SMTP or generate Auth
links with an admin key.

Application-originated email, if approved later in Phase 4, uses a separate server-only
`EmailProvider.send()` adapter and Resend API implementation with idempotency; do not build it before an
actual event and delivery/retry contract exist.

### Rate limiter

```text
RateLimiter.consume({ policy, subjectHash, now })
  -> { allowed, remaining, retryAfterSeconds, limit }
```

- `subjectHash` is an HMAC/one-way derived key; raw email, IP or user ID is not stored in Redis keys.
- Connected staging proposes Upstash Redis REST because it is fetch-compatible with Cloudflare/workerd.
- Commands are atomic (provider-supported rate-limit algorithm/script); no read-then-write race.
- Provider failure is policy-specific: auth/password/feedback fails closed with a short safe unavailable
  response after the local emergency guard; ordinary authenticated learning reads do not depend on Redis.
- Responses include safe `Retry-After`; logs contain policy and request ID, never the raw subject.

### Notifications

Repositories and services mirror Phase 3A boundaries. DTOs expose only display-safe fields. Server
functions validate keyset cursors and bounded limits. Mutations invalidate the smallest relevant loader.

### Feedback

```text
FeedbackProvider.submit({ text, route, pseudonymousUserId?, occurredAt, requestId })
  -> { accepted, providerReference? }
```

Telegram is one implementation; memory is deterministic for unit/local tests. Provider secrets and chat
IDs are server-only. Telegram failure is mapped to the existing safe `UNAVAILABLE` contract.

### Push

```text
PushProvider.send({ subscriptionRef, payload })
  -> { delivered, terminalFailure, retryableFailure }
```

Payloads contain a generic title/body and allowlisted internal path only—no protected lesson content or
sensitive personal data. The provider implementation must pass a Cloudflare-module/workerd build and
runtime smoke before adoption; adding a Node-only package that builds but fails at runtime is a gate
failure.

### Conditional objects

`ObjectStore` is not implemented until S7 has a concrete object contract. Any signed URL has a short
TTL, exact object/owner binding, private-by-default bucket and denial tests. No public bucket workaround.

## 6. Security and privacy contract

- Preserve existing request ID, CSRF/origin, safe-error, cookie and no-store boundaries.
- No direct vendor imports in routes/client components. No secret-prefixed `VITE_` variable.
- Candidate server-only names:
  - app email (only if approved later): `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`;
  - Redis REST: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
    `RATE_LIMIT_KEY_SECRET`;
  - Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_FEEDBACK_CHAT_ID`;
  - web push: `VAPID_PUBLIC_KEY` (public), `VAPID_PRIVATE_KEY` (server-only), `VAPID_SUBJECT`;
  - conditional R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
    `R2_ENDPOINT`.
- Supabase custom SMTP credentials live in Supabase Auth configuration, not browser/application config.
- Setup checks report missing variable names and provider state only; never values.
- Logs redact email, IP, feedback text, Telegram identifiers, push endpoints/keys and provider bodies.
- Safe errors do not reveal account existence, row IDs, SQL/constraints, provider credentials or stack
  traces.
- Rate-limit keys are unguessable and environment/policy scoped. Trusted client-IP derivation is
  documented for the actual Cloudflare deployment; do not trust arbitrary forwarding headers locally.
- Push/feedback consent and privacy copy are required before remote enablement.
- Webhook endpoints, if introduced, verify signatures over raw bodies, reject replay and are idempotent.
- Dependencies are reviewed/pinned before addition; prefer platform/fetch APIs where maintainable.

Threat cases to test: account enumeration, recovery redirect abuse, email flooding, rate-limit race and
bypass, forwarded-header spoofing, notification BOLA/IDOR, arbitrary notification injection, open
redirect in `href`, stored script content, Telegram injection/oversharing, push endpoint theft,
subscription reassignment, stale service-worker cache disclosure, and secret/client-bundle leakage.

## 7. Scale, performance and cost envelope

This is a pre-production envelope, not a production capacity claim. ADR-041 Wave 5 must run before any
staging load test, public launch or scale claim.

- notification list: default 20/max 50; unread count is a bounded indexed aggregate;
- notification API target on documented staging: p95 ≤300 ms, p99 ≤800 ms; no target is claimed until
  measured;
- provider calls have explicit timeouts (initial proposal: 3 seconds Redis/Telegram, 5 seconds email or
  push), one bounded retry only for safe/idempotent transient failure, and no unbounded fan-out;
- push/email fan-out is chunked and moves behind an approved durable job boundary before bulk sends;
- Resend current Free plan (checked 11 Nov 2026): 3,000 transactional emails/month, 100/day, one webhook
  endpoint, 30-day provider retention; verified domain required. Pro begins at $20/month for 50,000;
- Upstash Redis current Free plan (checked 11 Nov 2026): 500,000 commands/month, 250 MB, 10 GB bandwidth,
  one database, no SLA/access logs/at-rest encryption. It is acceptable only for pre-production. PAYG is
  currently $0.20/100,000 commands and supports a monthly budget cap;
- Web Push has no message provider fee but incurs application/runtime traffic;
- Telegram Bot API has no planned provider spend; privacy/operational cost still applies;
- R2 pricing and exact limits are researched only if S7 is approved.

Cost guardrails: free tier by default, overages disabled, usage checked during active development,
50/75/90% alerts where available, and no paid upgrade without founder approval.

## 8. Reliability, recovery and operations

- **Core-flow rule:** notification/feedback/push failure must not corrupt join/enrol/complete. Account
  recovery correctly reports temporary unavailability if Auth/email cannot accept the request.
- **RPO/RTO:** for pre-production, target database RPO ≤24 hours and RTO ≤4 hours after an approved
  backup plan exists. These are unproven targets—not guarantees—and remain launch blockers until the
  ADR-041 restore rehearsal covers Phase 4 tables. Redis has no RPO because counters are disposable.
- **Observability:** structured counts/latency for accepted/failed/throttled provider calls, request IDs,
  unread query latency, service-worker version and subscription churn; no PII in metrics.
- **Health/setup:** one command reports adapters as `ready`, `missing`, `disabled` or `unhealthy`
  without printing credentials.
- **Runbooks:** configure/verify/disable/rotate each provider; bounce/suppression response; Redis outage;
  Telegram outage; push 404/410 cleanup; service-worker rollback; retention/deletion procedure.
- **Rollout:** explicit per-slice feature flag plus validated config; configuration presence alone does
  not imply enabled. Start with founder-controlled fictional accounts.
- **Rollback:** disable the flag/provider, preserve durable rows, revert UI wiring, then use a reviewed
  forward migration if schema removal is ever necessary. Do not drop populated tables as routine
  rollback.

## 9. Verification plan

### Every slice

```text
bun run test:unit
bun run typecheck
bun run lint
bun run verify:client-boundary
bun run build
git diff --check
git status --short
```

Run the independent fixture regression at each slice promotion point. Run connected browser tests at
desktop/tablet/mobile for changed user journeys. Record exact commit, tool versions and redacted evidence
under `docs/evidence/phase-4/<run-id>/`.

### P4-S1

- unknown/known email have the same response;
- malformed/missing/cross-origin requests fail safely;
- only approved recovery redirects survive;
- expired/replayed/malformed recovery links fail; parameters are stripped;
- real staging confirmation and recovery email arrive through Resend after separate remote approval;
- no token/address/provider response is logged or stored in evidence.

### P4-S2

- memory/Redis contract tests use the same policy fixtures;
- concurrent requests cannot exceed the approved allowance through a race;
- TTL/reset/`Retry-After`, fail-closed/fail-open policy and subject hashing pass;
- no raw email/IP/user ID appears in provider keys or logs;
- forced provider outage produces the documented behavior.

### P4-S3

- migration/constraint/grant/default-ACL/RLS allow-deny tests;
- user B sees/updates zero user-A notifications/preferences;
- arbitrary user insert/content/user reassignment fails;
- duplicate event produces one notification; transition + notification is atomic where specified;
- keyset pages have no gaps/duplicates; unread count/read/all-read persistence survives reload;
- `EXPLAIN (ANALYZE, BUFFERS)` after representative data for list/unread/preference queries (after the
  ADR-041 capacity gate is available; until then record non-analyze plans and no capacity claim).

### P4-S4

- length/route validation, injection-safe formatting, anonymous/authenticated limits;
- memory provider unit tests and one founder-controlled Telegram staging message after approval;
- forced provider failure preserves text and offers retry without duplicate success;
- output proves no cookie/token/email/protected content was transmitted.

### P4-S5/S6

- manifest installability and owned icon checks;
- service-worker cache allowlist test proves authenticated/API/server-function/protected responses are
  never cached; update/unregister rollback test;
- supported/unsupported/denied/dismissed/revoked push states;
- workerd production-runtime smoke; invalid subscription cleanup; permission requested only on gesture;
- accessibility and reduced-bandwidth checks.

## 10. Acceptance and handoff

Phase 4 is accepted only when all approved slices—not conditional/deferred slices—meet their gates:

- provider adapters/configuration fail safely and never silently substitute fixtures;
- owner-only data access and cross-account denial are verified;
- no provider secret/implementation leaks into the client bundle;
- connected and fixture browser suites remain independent and green;
- accessibility/mobile/degraded states pass;
- remote actions and costs match explicit approvals;
- runbooks and redacted evidence exist;
- unresolved items, including ADR-041 Wave 5 and any deferred push/R2 slice, are explicit;
- final diff/security review passes.

Phase 4 acceptance does not authorize production deployment or real customer data.

## 11. Provider/account decisions required

| Slice | Proposed provider | Current pre-production posture | Remote action requiring approval | Rollback |
|---|---|---|---|---|
| S1 Auth email | Resend SMTP through Supabase Auth | Free plan; verified business domain required | Create/approve Resend account/key/domain and update THE SCENES Auth SMTP | Restore disabled/custom SMTP config; keep safe no-send/local path |
| S2 rate limiting | Upstash Redis REST | Free plan, pre-production only; no SLA/at-rest encryption | Create business-controlled DB, configure scoped REST credentials | Disable Redis flag; memory limiter remains for local/fixture only |
| S3 notifications | THE SCENES Supabase | Additive migration on pre-production | Apply reviewed migration after dry run | Disable connected feature; preserve rows; forward-fix schema |
| S4 feedback | Telegram Bot API | Replaceable internal alert channel | Create bot/chat and send founder-controlled test | Disable Telegram flag; memory provider/local form remains |
| S5 PWA | Web standards | No provider | None until deployment | Unregister service worker and remove manifest link |
| S6 push | Web Push/VAPID after workerd proof | No paid provider; browser consent | Store VAPID secret and a founder-controlled subscription | Disable push; revoke/delete subscriptions |
| S7 objects | Cloudflare R2 (conditional) | Not approved | Separate object/cost/access request | Disable object feature; delete only explicitly approved test objects |

No secret is pasted in chat or committed. The founder places it in an ignored local environment file or
the approved provider/platform secret store; the agent verifies presence/behavior without printing it.

## 12. Approval record

```text
Planning status: APPROVED (P4-S1 implementing)
Founder approval: APPROVED (ADR-042 code/local; ADR-043 hosted account-email config, 11 November 2026)
Reviewed scope version/date: Phase 4 revision 2 / 11 November 2026
Approved current slice: P4-S1 — Account email and password recovery
Approved remote actions: hosted account-email configuration on THE SCENES (okdzuqgzgnmmbtjxdaci) only (ADR-043)
Approved providers/accounts: Resend as Supabase Auth custom SMTP (account/domain/key still founder-created)
Production actions authorized: NONE
Real customer data authorized: NO
Deployment authorized: NO
Known blockers:
- ADR-041 Wave 5 capacity/recovery evidence is deferred and blocks load/launch/scale claims.
- Resend account, verified sending domain and SMTP credentials still need to be created and applied.
- The Supabase MCP in this environment resolves to VOICE SYSTEM and must not be used until corrected.
- Connected recovery verification requires the dashboard settings plus one founder-controlled inbox test (ADR-043).
- S6 requires a Cloudflare/workerd Web Push compatibility proof.
- S7 has no approved concrete object use case.
Required re-review triggers:
- provider, data model, retention, hosting/runtime or scope change;
- production, deployment, real-customer, payment, native creator-file or paid action;
- a load/scale/restore claim or the ADR-041 Wave 5 gate becoming executable.
```

Founder approval named the approved revision, first slice and remote/provider permissions in ADR-042
(11 November 2026) and the hosted account-email configuration in ADR-043 (11 November 2026). That
decision is copied into `docs/DECISIONS.md`, `docs/PROJECT-STATUS.md`, `docs/PHASES.md` and
`docs/INTEGRATIONS.md`.

## 13. Current authoritative references checked

- Supabase changelog (checked 11 Nov 2026), including CLI v3 local-by-default/remote confirmation,
  public-table Data API opt-in, and Free-plan Auth template customization changes:
  <https://supabase.com/changelog.md>;
- Supabase security/RLS guidance and this repository's Phase 3A authorization patterns:
  <https://supabase.com/docs/guides/database/postgres/row-level-security>;
- Resend Supabase SMTP guide and pricing (checked 11 Nov 2026):
  <https://resend.com/docs/send-with-supabase-smtp>, <https://resend.com/pricing>;
- Upstash Redis pricing/security capabilities (checked 11 Nov 2026):
  <https://upstash.com/docs/redis/overall/pricing>;
- MDN PWA installability guide (updated 6 Oct 2026):
  <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable>.

Re-check official documentation immediately before implementation; this list is evidence of planning,
not permission or a substitute for runtime verification.
