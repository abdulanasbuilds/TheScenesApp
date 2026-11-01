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

Status: Accepted direction

Cloudflare R2 is the intended object/file storage layer.

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
