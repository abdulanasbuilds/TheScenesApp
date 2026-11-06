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

## ADR-037 — Phase 3 revision-2 implementation boundary

Status: Superseded by ADR-038 after independent review (5 November 2026)

The Phase 3 specification and file-by-file plan were reviewed against the current frontend and current
official TanStack Start/Supabase guidance. Revision 2 corrects the session, CSRF, cache/cookie, RLS,
grants, private-community, atomic command, audit, seed, serialization, testing and numeric proof gaps
recorded in `docs/PHASE-3-PLAN-REVIEW.md`.

The founder's 5 November instruction approves implementation only after the review fixes and Gate A
evidence. The authorized target is a local Supabase proof with no hosted project, hosted credentials,
production data, deployment, payment, email, file/video/live, referral, marketplace or AI action.

The authorized history scan then found legacy hosted Supabase/JWT material, including a historical
service-key variable. Therefore Wave 1 remains blocked until the account owner confirms revocation or
rotation. The current working tree scan is clean. This credential response does not authorize a Git
history rewrite or any remote provider/GitHub settings mutation.

## ADR-038 — Phase 3A revision-3 re-planning boundary

Status: Proposed; re-review and founder approval required (5 November 2026)

Five independent read-only reviews found that revision 2 left material behavior to be invented during
implementation: identity/onboarding coherence, field-level curriculum access, cross-workspace
constraints, exact DDL/lifecycle, deterministic catalogue actors, Auth-trigger privilege, fixture/local
mode separation, local network isolation, cookie/logout behavior, error containment, affected files,
test/CI/load harnesses and recovery semantics.

Revision 3 is now the proposed implementation contract:

- `docs/PHASE-3-REVISION-3-SPEC.md`;
- `docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md`;
- `docs/PHASE-3-IMPLEMENTATION-PLAN-R3.md`;
- `docs/PHASE-3-VERIFICATION-RUNBOOK.md`;
- `docs/PHASE-3-REVISION-3-REVIEW.md`.

The founder subsequently approved the six revision-3 product rules and isolated local implementation;
see ADR-039. Final technical re-review and local isolation evidence still gate implementation. No
hosted action, deployment or production use is approved.

## ADR-039 — Fresh-provider accounts, local-first testing, and legacy retirement

Status: Accepted (5 November 2026)

The founder approved these environment/provider rules:

1. Old Supabase/provider accounts, projects and credentials are retired and must never be copied,
   tested, reused or migrated into new work.
2. Phase 3A uses a completely isolated local Supabase stack and fictional data for implementation and
   verification. No hosted account is needed for this proof.
3. When a later approved phase genuinely needs hosted/staging/production integration, it uses a new
   business-controlled account and newly generated credentials for that environment.
4. Local testing, security checks, recovery rehearsal and controlled staging evidence happen before
   production approval. A provider direction is not permission to create a production resource.
5. If a retired legacy hosted project still exists, its revocation/deletion and log review remain an
   urgent parallel incident action. By explicit founder decision this does not block credential-free,
   loopback-isolated local work, but it blocks reuse and every hosted/production promotion.
6. The founder approved the revision-3 product rules: listed/public/open self-join; membership loss
   locks included content while preserving progress; allowed rejoin restores access; Phase 3A courses
   are community-scoped; creator selection is intent/preview only; later-phase surfaces remain clearly
   fixture-labelled.

## ADR-040 — Lean integration-ready build and staged activation

Status: Accepted (6 November 2026)

The founder selected a credit-efficient build mode for every remaining phase:

1. Build the smallest useful end-to-end vertical slice. Reuse accepted specifications and evidence;
   do not repeat broad planning or independent review without new material evidence or a scope change.
2. Keep the minimum local tests needed to prove data, authorization, secret and failure boundaries.
   Run an unchanged expensive gate once per promotion point rather than once per agent/session.
3. Make each external integration plug-ready before requesting access: environment contract, adapter,
   safe missing-config behavior, setup/health check, tests, verification and rollback instructions.
4. At the point of need, inspect authorized skills, CLIs, MCPs, browser/runtime and provider tools.
   Use available capabilities automatically. Ask once for any missing required capability, explaining
   its purpose, cost, permissions and which work can continue without it.
5. Never request or accept secrets in chat, source control or documentation. Name variables and direct
   the founder to an ignored local environment file or approved secret store; verify only presence and
   behavior, never print values.
6. After the relevant local gate passes and the integration is ready, the agent may request explicit
   approval to create or connect a **new business-controlled staging** resource. The request must state
   the remote mutations, cost, verification and rollback. Retired accounts and credentials remain
   permanently forbidden.
7. Staging authorization never implies production, deployment, payments, live customer data or other
   irreversible/high-impact actions. Those retain their separate phase and approval gates.

This ADR changes execution sequence and credit discipline, not the security baseline. It supersedes
older wording that required another speculative Phase 3A review before implementation. Executable
local and staging evidence now decides promotion. It narrows ADR-039's blanket hosted hold only enough
to permit a later explicitly approved fresh staging resource; production remains unapproved.
