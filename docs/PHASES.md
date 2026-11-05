# The Scenes — Build Phases

## Current implementation checkpoint — 4 November 2026

The user explicitly accepted the complete fixture-backed frontend on 4 November 2026. **Phase 2 is
accepted**, while Phase 3 implementation waits for the remaining Gate A safety work. All 30 requested
primary route types are implemented and browser-verified; see
`docs/FRONTEND-IMPLEMENTATION-AUDIT.md`.

This checkpoint authorizes Phase 3 planning and, after its remaining gates pass, a local-only
Supabase proof. It does not authorize hosted/production authentication, payments, payouts, provider
credentials or deployment.

## Mandatory planning gate — every phase

Before implementation, every phase must pass `docs/PHASE-PLANNING-GATE.md` and have a reviewed,
approved specification. The plan must cover product behavior, scope, data, APIs, authorization,
privacy, failure modes, migration/rollback, observability, backup/recovery, provider limits/cost and
measurable performance/load targets.

The long-term architecture target is millions of registered accounts over time. This is not a claim
of millions of simultaneous users or issue-free operation. Capacity claims require staged evidence.

Phase 3's planning artifacts are `docs/PHASE-3-BACKEND-SPEC.md` (what and why) and
`docs/PHASE-3-IMPLEMENTATION-PLAN.md` (file-by-file build order, migrations, RLS, server functions,
per-wave gates). They remain in PLANNING until their blockers and approval records are complete.

## Next work — ordered (4 November 2026)

Frontend (Phase 2) is accepted. The next actionable items are listed in order.
Items marked **[FOUNDER]** need a business decision first; see `docs/FOUNDER-DECISIONS-REQUIRED.md`.

**Gate A — close pre-Phase-3 blockers (documentation, setup and policy only; no production service).**

1. **BUSINESS DECISIONS RESOLVED:** external embedding, a 7% Free sales fee, Pro at $19 / GH₵300 and
   Pro Plus at $39 / GH₵620 are approved. Create one authoritative current cost model and reconcile
   the older pricing documents before Phase 7. (ADR-029–030; REVIEW-ACTION-PLAN 4.2)
2. **AWAITING AUTHORITY:** run a local secret scan over the full Git history; separately authorize any
   GitHub setting changes such as secret scanning and push protection. (4.1)
3. **COMPLETED:** Bun is the sole package manager, `packageManager` is pinned, and the redundant npm
   lockfile is removed. A fresh-install verification still belongs in the final Gate A check. (4.4)
4. **AWAITING AUTHORITY:** expand `SECURITY-RULES.md`: permission table, embed policy,
   XSS/sanitization, privacy/retention and admin 2FA. (4.10)
5. **LOCAL PROOF APPROVED:** `docs/DATA-LAYER-RESEARCH.md` recommends Supabase and the founder approved
   it for the bounded local-only Phase 3 proof, with Neon as runner-up. Production provider, region,
   backup/recovery target and budget remain open. Keep development on free tiers and upgrade
   Cloudflare only when measured need justifies it. (ADR-032–033; REVIEW-ACTION-PLAN 4.5, 4.6)
6. Redesign referral rewards as an append-only ledger with atomic crediting; depends on item 1. (4.7)

**Gate B — Phase 3 backend foundation (only after Gate A and explicit approval; still no payments).**

Approved first slice (ADR-035): sign up/login → profile → community membership → course enrolment →
lesson completion → reload and observe persisted progress.

- Supabase Auth (signup/login/session) with server-side authorization;
- PostgreSQL core schema with RLS/policies;
- learning-progress persistence and realtime where justified;
- validated external resource/link metadata and a server-only provider adapter boundary;
- connect the already-built fixture routes to real data behind internal adapters.

**Gate C — Phase 4 onward:** email/files/notifications → creator operations → live/media providers →
payments → marketplace → search/AI → scale, as detailed in the phase sections below.

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

Introduce:

- R2 only for separately approved, narrow platform-managed objects; not native creator hosting;
- Resend;
- PWA/web push where appropriate;
- Redis rate limiting.

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
