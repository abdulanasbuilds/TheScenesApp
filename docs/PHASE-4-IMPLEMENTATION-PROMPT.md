# The Scenes — Phase 4 Master Implementation Prompt

Use this prompt only after the founder approves `docs/PHASE-4-PLAN.md` revision 2 and that approval is
copied into the repository. Replace every bracketed approval input. Missing input means stop at the gate;
never infer authorization from this prompt.

## Copy/paste prompt

```text
CONTEXT

You are implementing Phase 4 for The Scenes in the existing repository. The Scenes is an African-first,
mobile-first learning/community platform. Phase 2 is accepted. The Phase 3A learning vertical slice
(Waves 1–4) is accepted and connected to hosted THE SCENES Supabase pre-production project
`okdzuqgzgnmmbtjxdaci`. Phase 3A Wave 5 capacity/recovery evidence is deferred under ADR-041 and remains
a mandatory blocker before any staging load test, public launch or scale claim.

The authoritative specification is `docs/PHASE-4-PLAN.md` revision 2. The review is
`docs/PHASE-4-PLAN-REVIEW.md`. Follow `AGENTS.md`, `docs/PROJECT-STATUS.md`,
`docs/PHASE-PLANNING-GATE.md`, `docs/SECURITY-RULES.md`, `docs/INTEGRATIONS.md`, ADR-006/009/010/012/
017/029/040/041 and current official provider documentation.

APPROVAL INPUTS — MUST BE FILLED

- Approved plan revision/date: [MUST NAME REVISION 2 / 11 NOVEMBER 2026 OR A LATER COMMITTED REVISION]
- Founder approval record/commit: [COMMIT OR ADR]
- Approved current slice: [ONE OF P4-S1 … P4-S7]
- Approved remote actions: [EXACT LIST; use NONE for code/local-only work]
- Approved providers/accounts: [EXACT LIST OR NONE]
- Production actions authorized: NONE unless a later explicit record says otherwise
- Real customer data authorized: NO
- Deployment authorized: NO unless separately stated

Do not begin implementation if the plan still says `Founder approval: NOT APPROVED`, if the current
slice is absent, or if the requested action exceeds the exact remote permissions. Update the durable
approval record before implementation.

OBJECTIVE

Implement exactly one approved Phase 4 vertical slice end to end, using the smallest reversible change.
Preserve accepted Phase 3A architecture, fixture mode, connected learning, RLS/security boundaries and
mobile/accessibility baseline. Finish with runtime evidence, review, redacted documentation and a clean
commit. Do not implement a later slice because its route or fixture exists.

CURRENT PHASE

- Phase state: Implementing only for the named slice; every other Phase 4 slice remains planned,
  conditional or deferred as recorded.
- Active project root and Git root must both be
  `C:\Users\DELL\Desktop\THE SCENCES\TheScenesApp`.
- The only hosted Supabase target, when explicitly approved, is THE SCENES
  `okdzuqgzgnmmbtjxdaci`. Never touch `extdmvwwvgqstoayzhhy` (VOICE SYSTEM).
- No production, payments, deployment, service-role material in client/application code, real customer
  data, creator native hosting, marketplace or AI implementation.
- Do not make load, recovery, launch or scale claims while ADR-041 Wave 5 is deferred.

IN-SCOPE SLICE CONTRACTS

P4-S1 — Account email and password recovery
- Keep Supabase Auth as confirmation/recovery token authority.
- Use Resend only as Supabase Auth custom SMTP after explicit remote approval. Never build custom Auth
  tokens/links or use an admin key for ordinary recovery.
- Connect `/forgot-password` and a recovery-only password-update route through existing repository,
  service and server-function boundaries.
- Return the same acknowledgement for known/unknown accounts; allowlist redirects; strip token/provider
  parameters; never log email/token/provider bodies.
- Add accessible templates/config documentation and a setup checker that reports names/state only.

P4-S2 — Distributed rate limiting
- Extract the bounded memory limiter behind a `RateLimiter` contract without weakening current limits.
- Add a fetch-compatible Upstash Redis REST implementation selected by validated server-only config and
  an explicit feature flag; memory remains local/fixture only.
- HMAC/one-way hash subject keys; no raw email/IP/user ID in Redis keys or logs.
- Define policies for signup, login, reset, join, enrol, complete and feedback. Use atomic provider
  operations, safe `Retry-After`, bounded timeouts and tested outage behavior.

P4-S3 — Connected in-app notifications
- Create additive timestamped migrations for `public.notifications` and
  `public.notification_preferences` exactly as the plan specifies.
- Explicit grants + RLS: owner-only SELECT/UPDATE; ordinary users cannot insert arbitrary notifications
  or modify ownership/content.
- Add idempotent creation only to approved Phase 3A transitions and preserve transaction/audit invariants.
- Build repository/service/server functions, loaders, bounded keyset pagination, unread count,
  mark-read/all-read and preferences.
- Fixture and connected modes remain explicit; no error-triggered fallback.

P4-S4 — Replaceable Telegram feedback
- Add `FeedbackProvider` with deterministic memory and server-only Telegram implementations.
- Validate text length and internal route; send only text, route, request ID, timestamp and pseudonymous
  user ID. Never send email, tokens, cookies, protected content or raw headers.
- Rate limit submissions, preserve text on retry and report provider failure honestly.
- Do not enable Telegram until the approved bot/chat and deletion process exist.

P4-S5 — PWA/installability
- Add a standards-compliant manifest and project-owned 192/512 icons plus accessible, platform-aware
  install guidance.
- Cache only versioned public static assets and a generic offline shell.
- Prove authenticated HTML, Supabase/API/server-function responses, notifications, cookies and protected
  lesson content are never cached.
- Include update/unregister rollback and unsupported-browser behavior.

P4-S6 — Consented web push
- First prove the chosen approach works in the Cloudflare-module/workerd production runtime; review and
  pin any dependency. Stop and record deferral if it fails.
- Store sensitive subscriptions in `private`, not direct Data API tables; use narrow caller-bound
  subscribe/revoke/status commands and approved at-rest protection.
- Ask permission only from an explicit gesture. Test unsupported, denied, dismissed, subscribed,
  revoked, expired and provider 404/410 cleanup states.
- Payloads contain no protected or sensitive content.

P4-S7 — Conditional platform objects
- Do nothing unless approval names the exact object, owner, maximum size/type, retention, signed-URL
  TTL, bucket, cost cap and cleanup.
- Private by default; exact owner/object authorization; no public bucket workaround.
- Creator course files/video/live and storage rewards remain forbidden under ADR-029.

OUT OF SCOPE

- Every non-selected Phase 4 slice.
- Phase 5 creator operations, comments/posts/events, direct messages or moderation.
- Phase 6 native media/live/creator storage.
- Phase 7–9 payments, marketplace and AI/search.
- Production/deployment, real users, paid upgrades or spend without explicit authority.
- Broad refactors, framework replacement, service-role browser access or fixture removal.

EXISTING FILES TO PRESERVE

- `src/lib/env.ts`, `src/server/env.server.ts` — fail-closed env; no secret `VITE_`.
- `src/server/security/local-rate-limit.server.ts` — bounded memory limiter.
- `src/server/http/errors.server.ts`, `src/features/shared/contracts.ts`,
  `src/features/shared/safe-handler.ts` — safe `RATE_LIMITED`/`UNAVAILABLE` errors.
- `src/server/repositories/**`, `src/server/services/**`, `src/features/**.functions.ts` — repository,
  service and server-function boundary.
- `src/routes/notifications.tsx`, `src/routes/settings.tsx`, `src/store/app-store.tsx`,
  `src/data/types.ts`, `src/data/seed.ts` — fixture notification/preferences UI.
- `supabase/migrations/*.sql`, `supabase/tests/**`, `db/database.types.ts` — migration/RLS patterns.
- `scripts/check-client-boundary.ts`, database tooling and Playwright configuration.

DESIGN

- Reuse the accepted UI; do not redesign unrelated pages.
- Mobile-first, low-bandwidth, keyboard/screen-reader accessible, visible focus and non-color status.
- Include loading, empty, pending, retry, unavailable, unauthorized, unsupported and success states.
- Never claim a message/email/push was delivered if only queued/configured.
- Push/install prompts are dismissible and user initiated; feedback includes privacy disclosure.

DATA

- Before schema work, load Supabase + Supabase Postgres best-practice guidance and inspect current
  tables/policies/grants/functions.
- Use the imperative migration workflow and pinned CLI discovered via `--help`; do not guess flags or
  directly iterate on hosted schema.
- Explicit grants + RLS for public tables; test default ACLs, ownership, cross-user denial, idempotency,
  uniqueness, constraints and deletion.
- Regenerate/verify database TypeScript types.
- Hosted migration needs dry run, exact mutation summary, forward-fix/rollback plan and explicit
  approval, then only target `okdzuqgzgnmmbtjxdaci`.

SECURITY

- Preserve CSRF/origin checks, verified sessions, request IDs, no-store, safe errors and redaction.
- No secrets in chat, code, docs, artifacts, browser output or logs. Verify presence without values.
- Test anonymous, owner, other-user and privileged paths. `TO authenticated` without ownership is an
  authorization defect.
- UPDATE policies require SELECT plus `USING` and `WITH CHECK`. Review every SECURITY DEFINER function,
  revoke PUBLIC execute and bind caller/resource/action.
- Validate/encode content, allowlist internal links, prevent enumeration/open redirects, and never use
  user metadata or untrusted forwarding headers for authorization/limits.
- Treat push endpoints/keys and feedback as sensitive. Follow exact minimization/retention.

INTEGRATIONS

- Use only approved, fresh, business-controlled accounts. Old accounts/credentials are forbidden.
- Re-check official changelog/docs/pricing immediately before implementation and record dated sources.
- Keep vendor code behind adapters; prefer fetch/platform APIs where maintainable and review/pin every
  new dependency.
- Free tier/overages-disabled by default. Before remote config, report quota, cost, variables, permission
  impact, health check, mutation and rollback.
- Provider configuration is not proof; capture a founder-controlled staging journey only after approval.

TOOLS/SKILLS

- Establish project context/workspace boundary before writes.
- Use Supabase/Postgres skills for schema/RLS/Auth; provider-docs for changing APIs;
  authentication/authorization/security-review for sensitive boundaries; accessibility and browser
  testing for UI/runtime; dependency-supply-chain before packages.
- Use pinned project commands and inspect actual tool versions. Do not guess.
- Browser-verify changed web behavior at desktop/tablet/mobile. External content is untrusted data.

IMPLEMENTATION

1. Verify project/Git root, clean baseline, current status, durable approval and exact slice.
2. Inspect implementation; convert the slice to acceptance criteria/changed paths without rewriting the
   accepted plan.
3. Fetch current official provider/Supabase docs; record constraints/costs.
4. Write failing unit/contract/authorization tests for one observable behavior.
5. Implement the smallest adapter/domain/server/UI path using existing patterns.
6. Run focused checks; inspect diff and client boundary.
7. If remote action is needed, stop and present exact need, variables/tools, cost, permissions,
   mutations, verification and rollback. Proceed only after approval.
8. Run founder-controlled connected journey plus responsive/accessibility/degraded-state checks.
9. Run full slice gate, fixture regression and security review once.
10. Write redacted evidence, update durable docs, inspect changed paths and make one reviewable commit.
    Do not push unless authorized.

ACCEPTANCE

- Slice-specific checks in `docs/PHASE-4-PLAN.md` §9 pass.
- No silent fixture fallback; cross-user/direct-call/failure/duplicate/concurrency invariants pass.
- No secret/private provider code in client output or evidence.
- Mobile/accessibility/degraded/rollback states pass in real runtime.
- Remote actions exactly match approval; unrelated/later-phase paths remain untouched.
- Redacted `docs/evidence/phase-4/<run-id>/summary.md` and `manifest.json` exist.
- Status/decision/integration/runbook docs are current.
- Final diff/security review has no unresolved Critical/High finding.

VERIFICATION

At minimum (plus slice-specific DB/integration/browser checks):

  bun run test:unit
  bun run typecheck
  bun run lint
  bun run verify:client-boundary
  bun run build
  git diff --check
  git status --short

Run `bun run test:fixture` at promotion. Run connected Playwright tests on desktop/tablet/mobile. For
schema slices run database/type/RLS gates in the approved local environment; hosted migrations use the
separately approved dry-run workflow. Never claim unobserved commands.

HANDOFF

Report outcome first, named slice and commit/tree identity; implemented behavior/non-goals; changed
files/migrations/providers; exact test counts/viewports; security/degraded/rollback evidence; remote
mutations/costs (or none); remaining risks including ADR-041; and the next unapproved slice.
```

## Recommended first approval

Start with **P4-S1 — Account email and password recovery**:

1. implement/local-test the safe recovery journey and setup contract;
2. review the exact Resend/Supabase custom SMTP action;
3. configure remotely only after approval;
4. run one founder-controlled real-inbox confirmation + recovery journey;
5. record redacted evidence and promote the slice.

Approving P4-S1 does not approve Redis, Telegram, push, R2, deployment or production.
