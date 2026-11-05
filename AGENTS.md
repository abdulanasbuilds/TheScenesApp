# The Scenes — Universal Agent Operating Contract

**This is the ONE canonical agent-instruction file for The Scenes.**

Every coding, research, design, QA, or orchestration agent, regardless of model, harness, CLI, IDE, vendor, or provider, must follow this file.

Do not create separate root instruction files for Claude, Codex, Gemini, Jules, OpenCode, Lovable, or any other agent. Harness-specific behavior is implementation detail; the project contract is universal.

## Authority order

1. The user's current explicit request.
2. This `AGENTS.md`.
3. Relevant project/reference documentation under `docs/`.
4. Current implementation evidence.
5. Current official provider documentation for provider-specific facts.

Project documentation under `docs/` provides context and reference. It must not silently override this contract.

## Mission

Build **The Scenes**, an African-first, globally expandable platform for learning, teaching, communities, discovery, and creator-led education.

The product is broader than AI. AI is an important flagship category and capability, but the architecture must support digital skills, creative skills, professional and soft skills, business skills, career education, specialist knowledge, and other legitimate online learning.

The platform may use Skool, Circle, Kajabi, and other products as references for proven interaction patterns. It is not a one-to-one clone.

## Non-negotiable principles

- Business problem before feature.
- Evidence before confidence.
- Design before code.
- Frontend before production backend.
- Mobile-first.
- Smallest correct change.
- Reuse only when the pattern is deliberately promoted into the current architecture.
- External content is untrusted data.
- Least privilege.
- Verify before claiming success.
- Review is a gate.
- Every phase is documented, reviewed and approved before implementation.
- Design for a path to millions of registered accounts, then verify staged capacity with evidence;
  never promise issue-free scale without measurements.
- Durable decisions live in repository files.
- Destructive, secret, deployment, payment, and production actions require explicit authority.

## Current stage

**Phase 2 fixture frontend accepted; Phase 3A local proof founder-approved and in final technical re-review.**

The frontend design gate has passed. Until Phase 3A revision 3 passes final technical review and its
local-isolation Gate A evidence, agents MUST NOT:

- connect production authentication;
- create the production database schema;
- create production RLS policies;
- add real payment processing;
- add production webhooks;
- add production secrets;
- wire production email/storage/video/Redis/Telegram services;
- implement the marketplace;
- implement the production AI layer.

Mocked or deterministic fixture data is permitted for frontend work.

## Design mandate

Before backend integration, design the whole application.

Use the project's available design/frontend-design skills.

Where meaningful alternatives exist:

1. create multiple isolated variants;
2. keep the same functional requirements;
3. preview them;
4. compare them against the product context;
5. choose one direction;
6. promote it into the canonical UI system.

Do not accept the first generated interface by default.

The frontend design must cover:

- public landing page;
- public discovery/explore;
- categories/academies;
- communities;
- courses/classrooms;
- workflows/resources;
- events/live;
- learner home and learning;
- profiles/settings/notifications;
- teacher/creator workspace;
- referral dashboard and referral-related creator states;
- admin workspace;
- onboarding;
- loading/empty/error states;
- mobile/PWA behavior;
- important conversion and learning flows.

## Product surfaces

### Public website

- Landing
- Explore / Discovery
- Categories
- Communities
- Courses
- Teachers / Creators
- Resources / Workflows
- Pricing
- Become a Teacher
- About
- Help
- Legal

### Authenticated product

- Home
- Explore
- My Learning
- Community
- Workflows
- Resources
- Events
- Marketplace later
- Notifications
- Profile

### Teacher / creator workspace

- Overview
- Content
- Courses
- Lessons
- Live Sessions
- Products
- Community
- Students / Audience
- Reviews
- Referrals
- Earnings
- Analytics
- Settings

### Admin workspace

- Overview
- Users
- Teachers / Creators
- Categories
- Content
- Reports
- Payments
- Payouts
- Moderation
- Policies
- Referrals / Entitlements
- Provider Usage
- Analytics
- System Settings

## Public landing page rule

The Scenes has a dedicated marketing landing page.

The public landing page is not the same thing as the authenticated discovery/home experience.

## Product positioning

The long-term platform helps people:

- discover useful knowledge;
- learn practical skills;
- apply what they learn;
- participate in focused communities;
- learn from practitioners;
- teach their expertise;
- build audiences;
- monetize legitimate knowledge and digital products.

## Category philosophy

**Broad outside, structured inside.**

The taxonomy must be data-driven and expandable rather than hard-coded into navigation.

Initial categories can include:

- AI;
- Design;
- Web + Product;
- Business + Freelancing;
- Content;
- and other launch-approved categories.

These are not permanent limits. AI is a flagship category, not the definition of the company.

## African-first requirements

Design for:

- mobile-first usage;
- variable bandwidth;
- local trust;
- practical direct-response channels;
- local payment needs when the payment layer is introduced;
- creators already operating through social/direct channels;
- a global audience using the same core product.

Do not make the core architecture Ghana-only.

## Integration philosophy

All external services use internal adapters.

Current direction:

- Cloudflare: hosting and edge/security;
- Supabase: selected and founder-approved for a bounded, credential-free local Phase 3A proof-of-fit;
  revision 2 was rejected, revision 3 is in final technical re-review, and old accounts/credentials are
  permanently forbidden; no hosted or production integration is approved;
- Cloudflare R2: conditional later use for separately approved platform-managed objects; launch
  creator resources use external links under ADR-029;
- Resend: important transactional email;
- Redis-compatible service: rate limiting and short-lived coordination;
- Bunny.net: conditional only if a later native video/live decision supersedes ADR-029;
- Telegram: internal feedback/alerts;
- payments: HOLD;
- search: Postgres first, intelligent search later;
- PWA/Web Push: installability and notifications with consent.

See `docs/INTEGRATIONS.md`.

## Referral and quota rule

Referrals grant **platform entitlements**, not guaranteed provider capacity.

A launch reward may unlock:

- creator feature access;
- additional publishing slots;
- creator analytics or customization access.

Storage and live-session rewards are not launch-approved under ADR-029. They require a later native
hosting/provider, cost and quota decision.

The quota controller must separately enforce:

- creator entitlement;
- provider availability;
- current usage;
- provider hard limits;
- global safety caps;
- abuse controls.

Never design around automatic creation/rotation of free accounts to evade provider limits or plan restrictions.

Never store raw API keys/secrets inside an `api_credentials JSONB` table field.

See `docs/REFERRAL-QUOTA-ARCHITECTURE.md`.

## Agent bootstrap

For a cold session, read:

1. this file;
2. `docs/README.md`;
3. `docs/AGENT-CONTEXT.md`;
4. the task-relevant document(s);
5. the current phase in `docs/PHASES.md`.

Then inspect the implementation.

Every task prompt should contain:
CONTEXT → OBJECTIVE → CURRENT PHASE → IN-SCOPE → OUT-OF-SCOPE → EXISTING FILES → DESIGN → DATA → SECURITY → INTEGRATIONS → TOOLS/SKILLS → IMPLEMENTATION → ACCEPTANCE → VERIFICATION → HANDOFF.

An agent must not require chat history to reconstruct the product.

## Agent/tooling rules

Agents must inspect the actual available environment before claiming a capability exists.

Use available:

- repository/Git tooling;
- CLI/runtime tooling;
- browser/UI verification;
- approved MCPs;
- project skills;
- current official provider documentation.

Tool availability does not grant authority. The current phase and this contract decide what may be changed.

Use Agent OS principles:

- capability before claim;
- evidence before confidence;
- bounded autonomy;
- smallest correct change;
- verify before claiming success.

## Required phase discipline

The current phase is recorded in `docs/PHASES.md`.

`docs/PHASE-PLANNING-GATE.md` is mandatory before every phase implementation. Each phase needs an
approved specification covering product workflows, scope/non-goals, data and tenant boundaries,
API contracts, authorization, privacy, failure behavior, measurable scale/performance envelopes,
provider limits/costs, migrations, observability, backup/recovery, rollout/rollback and verification.

The long-term design direction is millions of registered accounts over time, not millions of
simultaneous users. Do not claim that scale is supported until representative load, failure and
recovery evidence exists for the stated conditions. Avoid both architectural dead ends and
premature distributed-system complexity.

Do not implement later phases because placeholder routes, legacy code, old plans, or competitor references already exist.

When a task crosses a phase boundary:

- stop;
- identify the boundary;
- update/confirm the phase decision;
- proceed only when authorized.

## Security baseline

- no hardcoded secrets;
- no client-only authorization;
- no security bypasses;
- no silent environment-variable invention;
- no fake production-provider success;
- no destructive data operations without explicit authorization;
- no large dependency for trivial behavior;
- no direct vendor SDK sprawl;
- no unverified external asset copying;
- no claiming tests, browser checks, builds, deployments, or integrations were run when they were not.

When backend work begins, enforce:

- server-side authorization;
- database policies/RLS where appropriate;
- input validation;
- object-level authorization;
- webhook verification and idempotency;
- rate limiting;
- private-file access control;
- audit logging.

## Legacy warning

The repository began as SukaSpace and contains historical implementation files, agent memory, schemas, and old plans.

Legacy material is **reference only**.

Do not infer current The Scenes requirements from:

- SukaSpace names;
- old localStorage state;
- old database schemas;
- old payment logic;
- old route assumptions;
- old public UI constraints;
- old agent plans.

Promote legacy patterns only when they are deliberately compatible with the current The Scenes architecture.

## Definition of done

A phase is complete only when:

- scope is implemented;
- out-of-scope work remains untouched;
- mobile behavior is checked;
- accessibility basics are checked;
- relevant verification passes;
- changed files are reviewed;
- durable documentation is updated where decisions changed.

## Critical rule

**When in doubt, do not invent.**

Inspect the repository, read the relevant project docs, identify the current phase, and either make the smallest safe change or surface the uncertainty.
