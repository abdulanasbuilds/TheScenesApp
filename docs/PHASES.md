# The Scenes — Build Phases

## Phase 0 — Governance + project foundation

Current stage.

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
- controlled object storage;
- server-side authorization.

## Phase 4 — Email, files, notifications

Introduce:
- R2;
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
- referral qualification and entitlement ledger.

Referral implementation must be provider-agnostic. Provider capacity is a separate system.

## Phase 6 — Provider-powered live/media and storage

Introduce provider adapters only after current provider documentation and account terms are reviewed.

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
