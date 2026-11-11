# The Scenes — Phase 4 Plan Review

**Review date:** 11 November 2026  
**Reviewed document:** `docs/PHASE-4-PLAN.md` revision 2  
**Comparison standard:** `docs/PHASE-PLANNING-GATE.md`, `AGENTS.md`, ADR-006/009/010/012/017/029/040/041,
`docs/PRODUCT-REQUIREMENTS.md`, `docs/SECURITY-RULES.md`  
**Verdict:** READY FOR FOUNDER REVIEW; NOT APPROVED FOR IMPLEMENTATION

## Repository/readiness findings

- Active project root and Git root both resolve to `TheScenesApp`; `.agent-os/project-scope.yml` is
  present and limits writes to this project.
- Working baseline before this review was clean at `7e97d37`, with Wave 4 committed at `fdc5c8f`.
- Phase 3A Waves 1–4 have recorded verification. Wave 5 remains explicitly deferred under ADR-041 and
  is not represented as passed.
- Current application already has a fixture notification center/settings UI, a server-only bounded
  memory limiter, safe `RATE_LIMITED`/`UNAVAILABLE` contracts, request IDs, CSRF/origin protection,
  redacted errors, a Supabase repository/service boundary and a client/server bundle scan.
- Phase 4 requires new code/migrations/provider configuration; no provider account or remote action is
  authorized by the current repository.

## Material findings corrected in revision 2

1. **Missing approved requirement — Telegram feedback (High).** Revision 1 omitted `TS-FEED-001/002`
   and RES-001. Revision 2 adds a replaceable, minimized, rate-limited feedback slice and retention
   procedure.
2. **Wrong/ambiguous Auth email boundary (High).** Revision 1 implied the application email adapter
   would send Supabase confirmation/recovery links. Revision 2 keeps Supabase Auth as token authority and
   uses Resend as custom SMTP; no application-built token/admin-link system is authorized.
3. **Push subscription exposure (High).** Revision 1 proposed public owner-readable endpoint/key rows.
   Revision 2 moves sensitive subscription material to `private`, removes Data API exposure and requires
   narrow caller-bound commands and at-rest protection before S6.
4. **Unsafe PWA cache scope (High).** Revision 1 said "offline shell" without a privacy boundary.
   Revision 2 explicitly forbids caching authenticated HTML, API/server-function/Supabase responses,
   notification data and protected lesson content.
5. **Incomplete notification invariants (Medium).** Revision 1 lacked a dedupe column, value bounds,
   safe `href`, exact grants, trigger ownership and event sources. Revision 2 specifies these plus
   keyset pagination and atomic/idempotent creation.
6. **Provider/cost ambiguity (Medium).** Revision 1 said "Redis-compatible (e.g. Upstash)" and
   "free/low tier". Revision 2 proposes fetch-compatible Upstash Redis REST for pre-production,
   documents current limits/cost/security gaps, and keeps provider creation unapproved.
7. **Missing retention/recovery targets (Medium).** Revision 2 adds row/provider retention, provisional
   RPO/RTO, explicit unproven status and the ADR-041 launch blocker.
8. **Status contradiction (Low).** Revision 1 was `PLANNING` at the top and `REVIEWED` at the bottom.
   Revision 2 is consistently `REVIEW`, founder approval `NOT APPROVED`.

## Planning-gate coverage

| Gate section | Result | Evidence |
|---|---|---|
| outcome/business context | covered | plan §1 |
| scope/non-goals/dependencies | covered | §2 |
| product states/mobile/accessibility | covered | §3 |
| domain/data/lifecycle/idempotency/migration | covered | §4 |
| API/provider contracts/errors/rate limits | covered | §5 |
| security/privacy/threats/secrets | covered | §6 |
| scale/latency/cost/overload | covered with deferred measurement | §7, ADR-041 |
| reliability/RPO/RTO/observability/rollback | covered with launch blocker | §8 |
| verification | covered | §9 |
| acceptance/handoff | covered | §10–12 |

## Open founder decisions

The plan cannot move to `Approved` until the founder:

1. approves Phase 4 revision 2;
2. selects the first slice (recommended P4-S1);
3. approves or rejects each proposed provider account and names the allowed remote actions;
4. confirms that no production/deployment/real-customer action is included.

## Residual risks

- ADR-041 Wave 5 remains deferred and blocks public launch/load/scale claims.
- Free-tier Resend/Upstash are pre-production choices without production SLA guarantees.
- Web Push library/runtime compatibility is unproven and must be tested under workerd before adoption.
- Telegram feedback creates an external privacy/retention obligation; S4 stays disabled until the
  operational deletion process is feasible.
- R2 has no approved Phase 4 object and remains conditional.

This review authorizes no implementation, hosted migration, provider creation, message, push, object or
deployment.

## Current-tree verification

Run after the revision-2 documentation alignment on 11 November 2026:

- ESLint: passed;
- TypeScript checks (application + scripts): passed;
- unit/contract suite: 177 passed, 0 failed;
- client/server boundary scan: passed;
- Cloudflare-module production build: passed;
- fixture browser regression: 26 passed, 16 expected skips, 0 failed (12 hosted-only connected checks
  and 4 duplicate viewport route checks were skipped in fixture mode);
- dependency audit: no reported vulnerabilities across 505 packages after the repository's one explicit
  `GHSA-g3hv-75wg-m249` exception;
- `git diff --check`: passed (line-ending conversion warnings only).

The hosted connected browser suite and Supabase advisor/RLS evidence were not rerun because this review
changes documentation only; the latest code remains commit `fdc5c8f`, whose recorded hosted checks are
in `docs/evidence/phase-3/2026-11-07-phase3a-wave4-hosted/`.
