# The Scenes — Universal Agent Bootstrap Context

This document is the reusable context block for any serious task prompt.

The agent still starts with the root `AGENTS.md`. This file supplies the reusable project context that can be pasted into a task prompt when a model/session does not automatically load project documentation.

## Bootstrap

Before doing work:

1. Read `AGENTS.md`.
2. Read the relevant `docs/` file(s) for the task.
3. Inspect the current repository implementation.
4. Identify the current phase in `docs/PHASES.md`.
5. Read `docs/PHASE-PLANNING-GATE.md` and the current phase specification; do not implement an
   unreviewed/unapproved plan.
6. Check available tools/skills/CLI/MCP/browser capabilities before claiming they exist.
7. Build only the requested phase slice.
8. Verify under the plan's stated correctness, security, scale and recovery conditions.
9. Review the diff.
10. Update durable documentation if an architecture decision changed.

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
- Supabase: approved for a bounded, local-only Phase 3 proof-of-fit for Auth/Postgres/Realtime and
  learning persistence after the remaining Gate A safety work; not connected or production-approved.
- Cloudflare R2: conditional later use for separately approved platform-managed objects. Launch
  creator resources use external links under ADR-029.
- Resend: important transactional email.
- Redis-compatible service: rate limiting/short-lived coordination.
- Bunny.net: only if a later native video/live decision supersedes ADR-029.
- Telegram: internal feedback/alerts.
- Payments: deferred.
- Search: Postgres first; smarter search later.
- PWA/Web Push: installability and consented notifications.

Provider quotas are not business entitlements. Never promise an individual more provider capacity than the system currently has.

## Referral architecture rule

Referrals reward the user with a **platform entitlement**, not with guaranteed provider capacity.

Current launch-safe examples:

- access to a creator feature;
- additional workflow/course publishing slots;
- creator analytics or customization access.

Storage or live-session allowances are not launch-approved under ADR-029. They require a later
native-provider, cost and quota decision.

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

This section applies only if a later phase explicitly authorizes platform-managed object storage;
it is not part of the external-link-only launch model in ADR-029.

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
SCALE + PERFORMANCE ENVELOPE
SECURITY REQUIREMENTS
RELIABILITY + RECOVERY
INTEGRATION BOUNDARIES
TOOLS/SKILLS TO USE
IMPLEMENTATION TASKS
ACCEPTANCE CRITERIA
VERIFICATION
APPROVAL STATE
HANDOFF NOTES

The agent must never need the chat history to reconstruct the product.

## Canonical document references

- All requirements with stable IDs: `docs/PRODUCT-REQUIREMENTS.md`
- Feature traceability: `docs/FEATURE-MATRIX.md`
- Unresolved business questions: `docs/OPEN-PRODUCT-DECISIONS.md`
- Non-technical product overview: `docs/PLAIN-ENGLISH-PRODUCT-EXPLANATION.md`
- Legacy SukaSpace context: `docs/LEGACY-CONTEXT.md`
