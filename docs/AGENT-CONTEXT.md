# The Scenes — Universal Agent Bootstrap Context

This document is the reusable context block for any serious task prompt.

The agent still starts with the root `AGENTS.md`. This file supplies the reusable project context that can be pasted into a task prompt when a model/session does not automatically load project documentation.

## Bootstrap

Before doing work:

1. Read `AGENTS.md`.
2. Read the relevant `docs/` file(s) for the task.
3. Inspect the current repository implementation.
4. Identify the current phase in `docs/PHASES.md`.
5. Check available tools/skills/CLI/MCP/browser capabilities before claiming they exist.
6. Build only the requested phase slice.
7. Verify.
8. Review the diff.
9. Update durable documentation if an architecture decision changed.

## Product context

The Scenes is an African-first, globally expandable platform for learning, teaching, communities, discovery, and creator-led education.

It is not AI-only and not a one-to-one Skool/Circle clone.

AI is a flagship category and major capability. The platform also supports digital skills, creative skills, professional and soft skills, business/freelancing, career development, education, and future specialist knowledge.

The public marketing site has a real landing page. The authenticated product has a separate Home/Explore/Community/Learning experience.

The platform is broad outside and structured inside.

## Core product loops

### Learner loop

Discover → Join → Learn → Apply → Showcase → Get feedback → Improve → Return

### Community loop

Publish → Discover → Discuss → Apply → Showcase → Feedback → Save/Share

### Creator loop

Teach → Build audience → Publish useful knowledge/products → Earn → Retain audience

### Referral loop

Invite → Qualify → Verify → Credit → Unlock entitlement → Measure usage → Re-evaluate monthly
the platform is responsible for only the creators rewards not normal users/learners,the is responsible for any rewards/affiliate for learners

## Design rule

Design and frontend come before production backend.

When a meaningful UI choice exists, create multiple variants with the same functional requirements, compare them, then select and promote one direction.

## Provider architecture

External providers sit behind internal adapters.

Current direction:

- Cloudflare: hosting/edge/security.
- Supabase: Auth/Postgres/Realtime and learning persistence.
- Cloudflare R2: file/object storage.
- Resend: important transactional email.
- Redis-compatible service: rate limiting/short-lived coordination.
- Bunny.net: video delivery/live capabilities where selected.
- Telegram: internal feedback/alerts.
- Payments: deferred.
- Search: Postgres first; smarter search later.
- PWA/Web Push: installability and consented notifications.

Provider quotas are not business entitlements. Never promise an individual more provider capacity than the system currently has.

## Referral architecture rule

Referrals reward the user with a **platform entitlement**, not with guaranteed provider capacity.

Examples:

- extra storage allowance;
- extra live-session allowance;
- access to a creator feature;
- additional workflow publishing slots.

The quota controller determines actual availability.

A referral event must not directly mutate a provider's global quota. Provider usage remains a shared infrastructure budget.

## Referral qualification

A referral is not credited merely because somebody opens a link.

Use a state machine:
PENDING → QUALIFIED → CREDITED

A qualification rule must be defined before implementation, for example:

- unique account;
- verified email/identity as appropriate;
- no self-referral;
- no duplicate referral relationship;
- minimum meaningful activation event;
- fraud/rate checks passed.

All reward grants must be idempotent.

## Provider-account rules

Do not create account farms or automate quota evasion.

Additional provider accounts may only be used when the provider permits the arrangement and the accounts are intentionally operated as legitimate infrastructure. A lower model must never assume that "free account" means "additional free quota."

Never put raw API secrets in a database `api_credentials JSONB` column.

Store only:

- non-secret account metadata;
- a provider account identifier;
- an environment-secret reference;
- usage metadata.

Actual credentials belong in approved secret storage/environment configuration.

## Live routing rule

Provider failover is a session-level capability.

Do not promise seamless mid-session switching between incompatible realtime SDKs. A provider outage/quota transition may require:

- retry;
- reconnect;
- starting a replacement session;
- provider selection for the next session.

The internal live interface should hide provider-specific details from UI code.

## Storage routing rule

A file gets a durable storage location at upload time.

Persist:

- storage provider;
- account/bucket identifier;
- object key;
- owner/resource relationship;
- size;
- checksum/metadata where useful.

When one approved pool approaches its guardrail, new uploads may route to another approved pool. Existing objects do not move automatically unless a migration task is explicitly designed.

## Prompt contract

A reusable task prompt should contain:

CONTEXT
OBJECTIVE
CURRENT PHASE
IN-SCOPE
OUT-OF-SCOPE
EXISTING FILES
DESIGN REQUIREMENTS
DATA ASSUMPTIONS
SECURITY REQUIREMENTS
INTEGRATION BOUNDARIES
TOOLS/SKILLS TO USE
IMPLEMENTATION TASKS
ACCEPTANCE CRITERIA
VERIFICATION
HANDOFF NOTES

The agent must never need the chat history to reconstruct the product.

## Canonical document references

- All requirements with stable IDs: `docs/PRODUCT-REQUIREMENTS.md`
- Feature traceability: `docs/FEATURE-MATRIX.md`
- Unresolved business questions: `docs/OPEN-PRODUCT-DECISIONS.md`
- Non-technical product overview: `docs/PLAIN-ENGLISH-PRODUCT-EXPLANATION.md`
- Legacy SukaSpace context: `docs/LEGACY-CONTEXT.md`
