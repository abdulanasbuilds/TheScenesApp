# The Scenes — Architecture Decision Register

Use this file for durable decisions.

## ADR-001 — Project identity

Status: Accepted

The product name is **The Scenes**.

## ADR-002 — Product scope

Status: Accepted

The Scenes is broader than AI. AI is a flagship category, not the boundary of the company.

## ADR-003 — Competitor relationship

Status: Accepted

Use Skool/Circle/Kajabi and similar products as references and benchmarks. Do not build a one-to-one clone.

## ADR-004 — Public landing page

Status: Accepted

The Scenes has a dedicated marketing landing page. Authenticated discovery/home is a separate surface.

## ADR-005 — Frontend first

Status: Accepted

Design and build the frontend with deterministic fixtures before production authentication, database, RLS, payments, and third-party integrations.

## ADR-006 — Provider abstraction

Status: Accepted

External service integrations are isolated behind internal adapters.

## ADR-007 — Payments

Status: Deferred

Payment processor selection and implementation are intentionally held.

## ADR-008 — Mobile first

Status: Accepted

Mobile is a primary design target.

## ADR-009 — Storage

Status: Conditional direction (updated 4 November 2026)

If a later approved feature requires platform-managed objects, Cloudflare R2 is the preferred
object-storage candidate behind an internal adapter. ADR-029 excludes native creator video/file/live
hosting from the launch base plans. R2 must not be treated as authorization for creator storage,
storage referral rewards or early Phase 4/6 implementation.

## ADR-010 — Email

Status: Accepted direction

Resend is for important transactional email.

## ADR-011 — Search

Status: Deferred

Start with PostgreSQL/Supabase full-text capabilities. Add dedicated/AI-assisted search only when evidence justifies the complexity.

## ADR-012 — PWA

Status: Accepted direction

Support installability and user-consented web push where platform/browser capabilities allow.

## ADR-013 — Agent governance

Status: Accepted

`AGENTS.md` is the single universal agent contract. All other project docs are supporting context.

## ADR-014 — Referral rewards

Status: Accepted direction

Referral rewards are platform entitlements, not cash, and not guaranteed provider capacity.

## ADR-015 — Free-tier pooling

Status: Rejected as a blanket strategy

Do not build account-farming or automated free-tier evasion.

Provider account pools may exist only for legitimately controlled/approved accounts and only where provider terms allow the arrangement.

## ADR-016 — Quota model

Status: Accepted

Use separate ledgers for:

- referral eligibility;
- creator entitlements;
- creator usage;
- provider account usage.

Never equate a referral reward with an infrastructure quota.

## ADR-017 — Secret storage

Status: Accepted

Never store raw provider API secrets in ordinary application database rows such as `api_credentials JSONB`. Store secret references in metadata and keep credentials in approved secret storage/environment configuration.

## ADR-018 — Live failover

Status: Accepted direction

Provider failover is session-level. Do not promise transparent mid-session SDK switching between unrelated realtime providers.

## ADR-019 — Product requirements registry

Status: Accepted

`docs/PRODUCT-REQUIREMENTS.md` is the canonical feature source of truth. All requirements receive a stable ID (TS-*) and a classification (CORE NOW, CORE LATER, DEFERRED, NEEDS DECISION, LEGACY IMPL DETAIL, REJECTED).

## ADR-020 — Feature traceability

Status: Accepted

`docs/FEATURE-MATRIX.md` tracks every major feature from requirement through design, implementation, testing, and release. Status changes are recorded in Git commits.

## ADR-021 — Open decisions register

Status: Accepted

Unclear or unresolved product/business questions are recorded in `docs/OPEN-PRODUCT-DECISIONS.md` with historical wording, affected architecture, and current assumptions. Agents must not invent answers.

## ADR-022 — Legacy isolation

Status: Accepted

SukaSpace code in Git history is reference material. It must not be merged, restored, or copy-pasted without adaptation to the current architecture, naming, and security rules. See `docs/LEGACY-CONTEXT.md`.

## ADR-023 — Documentation gate before implementation

Status: Accepted

The complete documentation foundation (product requirements, feature matrix, open decisions, architecture context, security rules, phase boundaries) must be established and reviewed before Phase 1 design work begins.

## ADR-024 — Broad category taxonomy

Status: Accepted

Categories are data-driven and expandable. AI is a flagship launch category, not the only category. The architecture must support adding categories without code changes. Initial categories may include: AI, Design, Web + Product, Business + Freelancing, Content, and others approved at launch.

## ADR-025 — Gamification purpose

Status: Accepted direction

Gamification mechanisms (points, milestones, badges) must be connected to meaningful learning, participation, or contribution outcomes. Decorative or anxiety-inducing gamification is not acceptable. Streaks specifically require product decision (OPD-005).

## ADR-026 — Code syntax highlighting

Status: Accepted

Code syntax highlighting is implemented through a reusable content rendering layer, not duplicated in every screen. It supports courses, lessons, posts, comments, workflows, and resources.

## ADR-027 — Private messaging

Status: Accepted direction

Private messaging (Phase 5) must be permission-aware with moderation, blocking, reporting, notification controls, and abuse prevention. It must not become an unmoderated security/privacy hole.

## ADR-028 — Multi-tenancy preparedness

Status: Accepted direction

The architecture must not block future multi-tenancy (organizations, private academies, creator-owned spaces) even though it is Phase 10. Data models should use patterns that allow tenant isolation to be added without full restructuring.

## ADR-029 — Launch media and file-hosting model

Status: Accepted (4 November 2026)

Free, Pro and Pro Plus use approved external video, file and live-session links at launch. Native
video hosting, native file hosting and native live streaming are not included in the base plans.
This supersedes the 300 GB / 1 TB native-hosting allowances recorded in RES-002.

Native hosting may be reconsidered later, but only through a new cost, quota, security and provider
decision. It must not be assumed to be a launch feature or referral reward.

## ADR-030 — Launch plan prices and sales fees

Status: Accepted (4 November 2026)

- Free: $0 per month.
- Pro: $19 USD / GH₵300 per month.
- Pro Plus: $39 USD / GH₵620 per month.
- Pro and Pro Plus platform fee: 3% on sales (existing RES-004).
- Free-plan platform fee: 7% on sales.

The paid-plan prices assume ADR-029 (external hosting) and remain subject to a current cost-model
check against the project's minimum 70% margin rule before payment implementation.

## ADR-031 — Instant-withdrawal fee direction

Status: Accepted business direction; implementation deferred (4 November 2026)

The platform fee for an instant withdrawal is 1% plus GH₵1. Any payment-provider transfer fee is
passed to the creator rather than absorbed by The Scenes. Provider selection remains on hold, so
the exact fee presentation and calculation must be revalidated against the chosen provider's
current terms before Phase 7 implementation.

## ADR-032 — Infrastructure budget posture

Status: Accepted direction (4 November 2026)

- Cloudflare remains on the free tier during the current stage. Upgrade only when measured runtime,
  traffic or product requirements justify it.
- A free data-platform tier may be used for development only. No production data-platform plan has
  been approved.

Free-tier availability is not a production architecture guarantee. Production limits, backups,
recovery, support and cost must be reviewed before launch.

## ADR-033 — Data-platform evaluation before Phase 3

Status: Accepted for local proof-of-fit; production decision deferred (4 November 2026)

Before selecting the production data platform, perform a current, evidence-based comparison of the
product's data model and candidate tools, including whether Supabase is the best fit. The evaluation
must cover relational integrity, authentication, authorization/RLS, realtime, storage boundaries,
local development, migrations, backups/recovery, portability, regional performance, operational
burden and total cost. Development may use a free tier, but research does not authorize a production
account or integration.

`docs/DATA-LAYER-RESEARCH.md` completed that comparison. The founder approved Supabase for a bounded,
local-only Phase 3 proof-of-fit, with Neon retained as the runner-up. This is not permission to create
a remote project, add hosted credentials or select a production plan. Free tiers remain development-
only; production provider confirmation, region, backup objectives and budget remain approval gates.

## ADR-034 — Payments remain on hold

Status: Deferred (confirmed 4 November 2026)

Payment-provider selection and implementation remain intentionally on hold. Paystack, Stripe,
Flutterwave or any other provider must not be treated as selected. This confirms ADR-007 and the
phase boundary in `AGENTS.md`.

## ADR-035 — Phase 3 first vertical slice

Status: Accepted; implementation waits for remaining Gate A safety work (4 November 2026)

The first Phase 3 proof-of-fit slice is:

sign up/login → profile → community membership → course enrolment → lesson completion → reload and
observe persisted progress.

It is local-only. It does not authorize a remote Supabase project, production data, payments,
provider email, native storage/video/live, deployment or later-phase schemas.

## ADR-036 — Mandatory planning and long-term scale gate

Status: Accepted (4 November 2026)

Every phase must have a documented, reviewed and founder-approved specification before
implementation. The required contents and evidence are defined in `docs/PHASE-PLANNING-GATE.md`.

The long-term architecture direction is millions of registered accounts over time, not millions of
simultaneous users. Designs must avoid known scaling dead ends and define measurable staged capacity,
latency, reliability, cost and recovery targets. No document or agent may guarantee issue-free scale;
claims require representative load, failure and restore evidence under stated conditions.
