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
