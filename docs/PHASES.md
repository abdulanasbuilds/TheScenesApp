# The Scenes — Build Phases

## Current implementation checkpoint — 11 November 2026

The founder accepted the complete fixture-backed frontend on 4 November 2026. **Phase 2 is accepted.**
All 30 requested primary route types are implemented; the current baseline passes 26 Playwright checks
with 4 intentional duplicate viewport skips.

Phase 3A Waves 1–4 subsequently passed their recorded migration, database, Auth/security, RLS,
connected-application and browser gates. The learning vertical slice is accepted. Wave 5's capacity,
recovery and portability rehearsal is deferred under ADR-041 and remains mandatory before any staging
load test, public launch or scale claim. See `docs/PROJECT-STATUS.md` and Phase 3 evidence records.

On 6 November 2026 the founder selected **lean build + staging** mode under ADR-040. The project will
finish each essential local safety gate once, build the already-approved learning journey as a useful
vertical slice, and ask for fresh staging capability only when the integration is ready to verify.
This does not authorize production, payments, deployment, live customer data or reuse of any old
account or credential.

On 9 November 2026 the founder accepted the **Phase 3A learning vertical slice** (Waves 1–4) and
formally deferred the Wave 5 capacity/recovery rehearsal under **ADR-041**. Phase 3A is therefore
**accepted with deferred capacity evidence**; the rehearsal remains a mandatory precondition before any
staging load test, public launch, or scale claim. **Phase 4 (email, files, notifications) is now in the
Review state only** and is defined by `docs/PHASE-4-PLAN.md` revision 2 plus
`docs/PHASE-4-PLAN-REVIEW.md`. The plan has passed an internal completeness review but requires founder
approval before implementation or provider action. See `docs/PROJECT-STATUS.md`.

## Mandatory planning gate — every phase

Before implementation, every phase must pass `docs/PHASE-PLANNING-GATE.md` and have a reviewed,
approved specification. The plan must cover product behavior, scope, data, APIs, authorization,
privacy, failure modes, migration/rollback, observability, backup/recovery, provider limits/cost and
measurable performance/load targets.

The long-term architecture target is millions of registered accounts over time. This is not a claim
of millions of simultaneous users or issue-free operation. Capacity claims require staged evidence.

Phase 3A revision 3 is defined by `docs/PHASE-3-REVISION-3-SPEC.md`,
`docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md`, `docs/PHASE-3-IMPLEMENTATION-PLAN-R3.md`, and
`docs/PHASE-3-VERIFICATION-RUNBOOK.md`. Revision 2 is historical evidence, not implementation
authority. Revision 3 has founder approval. ADR-040 closes further speculative pre-build review unless
new evidence exposes a material ambiguity; executable gates now decide promotion.
`docs/SECURITY-SCAN-RESULTS.md` remains the separate legacy incident record. It blocks reuse and
production promotion, not credential-free local work or a later explicitly approved fresh staging
resource.

## Next work — ordered (6 November 2026)

1. Run the Wave 1 live local gate in supported WSL2: isolated stack start, migrations/seed, generated
   types, two-reset fingerprint, pgTAP, database lint, type drift and real integration tests.
2. If it fails, fix only the evidenced failure and rerun the affected check. If it passes, record
   redacted evidence and accept Wave 1.
3. Build Waves 2–4 as the approved sign up/login → profile → community membership → course enrolment
   → lesson completion → reload/persisted-progress vertical slice. Use focused checks during the build
   and one complete regression at its promotion gate.
4. Add a plain setup checker that reports missing variable names and provider settings without reading
   or printing secret values. Keep fixture and connected modes explicit.
5. When the slice is locally integration-ready, present one exact request for the fresh staging
   account/tool, variable names, secure configuration location, cost/permission impact, verification
   and rollback. Do not ask for secrets in chat.
6. After explicit action approval, connect only a new business-controlled staging resource, apply the
   reviewed migrations and run the same user journey/security checks. This is not production approval.
7. ~~Complete capacity/recovery evidence and final Phase 3 acceptance.~~ Phase 3A was accepted on
   9 November 2026 with Wave 5 capacity/recovery evidence deferred (ADR-041). That evidence remains a
   mandatory precondition before any staging load test, public launch, or scale claim. Phase 4 is now
   open for **planning** under `docs/PHASE-4-PLAN.md`.

> Note: parts of `docs/REVIEW-ACTION-PLAN.md` and the historical analysis retained in
> `docs/FOUNDER-DECISIONS-REQUIRED.md` predate the 4 November frontend authorization. Their updated
> status blocks and ADR-029 onward are authoritative; older analysis remains evidence, not the current
> build position.

## Phase 0 — Governance + project foundation

Foundation established; governance remains ongoing.

Deliver:

- universal agent contract;
- product context;
- design system brief;
- integration boundaries;
- architecture decisions;
- phase gates;
- fixture strategy;
- CI contract;
- referral/quota architecture;
- legacy isolation.

No production integrations.

## Phase 1 — Design exploration

Deliver:

- full information architecture;
- landing page variants;
- authenticated home variants;
- explore/discovery;
- category pages;
- community;
- learning/classroom;
- workflow/resource library;
- events/live;
- creator workspace;
- referral dashboard and referral milestone states;
- admin/provider-usage concepts;
- mobile/PWA interaction patterns.

Exit gate:

- design direction selected;
- core flows documented;
- no unresolved navigation contradictions.

## Phase 2 — Frontend application build with fixtures

Build a fully navigable frontend using deterministic mock data.

Required:

- routes;
- app shell;
- mobile navigation;
- cards/lists/detail views;
- course/classroom flows;
- community flows;
- teacher flows;
- referral UI flows with fixture entitlements;
- empty/loading/error states;
- onboarding;
- public landing page.

Exit gate:

- internally usable end-to-end without a backend;
- no dead critical routes;
- responsive and accessible baseline passes.

## Phase 3 — Backend foundation

**Status:** Waves 1–4 implemented and verified; learning vertical slice accepted 9 November 2026
(ADR-041). Wave 5 capacity/recovery evidence deferred; see `docs/PROJECT-STATUS.md`.

Only after Phase 2 is accepted.

Introduce:

- Supabase Auth;
- PostgreSQL;
- core schema;
- RLS/policies;
- progress persistence;
- realtime where justified;
- validated external resource/link metadata (no launch native creator hosting under ADR-029);
- server-side authorization.

## Phase 4 — Email, files, notifications

**Status:** Review only (revision 2 reviewed 11 November 2026; not founder-approved). Specification:
`docs/PHASE-4-PLAN.md`; review: `docs/PHASE-4-PLAN-REVIEW.md`. No implementation until the founder
approves the revision, first slice and exact provider/remote permissions.

Introduce:

- R2 only for separately approved, narrow platform-managed objects; not native creator hosting;
- Resend;
- PWA/web push where appropriate;
- Redis rate limiting;
- replaceable Telegram feedback channel.

## Phase 5 — Teacher/creator operations

Introduce:

- teacher applications;
- approval;
- course publishing;
- workflow publishing;
- live events;
- teacher analytics;
- referral qualification and entitlement ledger;
- private messaging (TS-DM);
- guest access links (TS-GUEST);
- community moderation and content reporting (TS-COMM-008, TS-COMM-009);
- practical assignments/projects (TS-CLASS-009);
- reviews management (TS-TEACH-008);
- creator community management (TS-TEACH-006).

Referral implementation must be provider-agnostic. Provider capacity is a separate system.

## Phase 6 — Provider-powered live/media and storage (conditional)

ADR-029 excludes native creator video/file/live hosting from launch base plans. Reopen this phase only
through a new founder decision and after current provider documentation, account terms, cost,
security and quota design are reviewed.

Potential providers:

- LiveKit;
- Daily;
- Agora;
- Bunny.net;
- Cloudflare R2.

The platform must enforce provider/global quotas, not assume referrals create provider capacity.

## Phase 7 — Payments

Payment architecture is enabled only after:

- Ghana/international payment model is documented;
- provider capabilities are current;
- refunds/chargebacks are modeled;
- creator payout rules are defined.

## Phase 8 — Marketplace and creator economy

Introduce:

- digital products;
- workflow/template sales;
- creator revenue share;
- orders/downloads;
- reviews;
- disputes.

## Phase 9 — Search + AI layer

Introduce progressively:

- better search;
- recommendations;
- course assistant;
- workflow generation;
- semantic retrieval.

## Phase 10 — Scale

Later:

- organizations;
- private academies;
- enterprise controls;
- advanced analytics;
- additional categories/industries;
- richer creator economy;
- formal API/integrations.

## Phase gate rule

Never implement a later phase merely because placeholder routes, legacy code, or competitor references already exist.
