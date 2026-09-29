# The Scenes — Agent Operating Contract

This file is the first project instruction every coding agent must read.

## Mission

Build **The Scenes**, an African-first, globally expandable platform for learning, teaching, communities, discovery, and creator-led education.

The product is broader than AI. AI is an important flagship category and capability, but the architecture must support digital skills, creative skills, professional and soft skills, business skills, career education, specialist knowledge, and other legitimate online learning.

The platform may use Skool, Circle, Kajabi, and other products as references for proven interaction patterns. It is not a one-to-one clone.

## Authority order

1. User's current explicit request.
2. `AGENTS.md`.
3. Current files in `docs/`.
4. Current implementation evidence.
5. External provider documentation for provider-specific behavior.

Chat history is context, not an implementation contract.

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
- Durable decisions live in repository files.
- Destructive, secret, deployment, payment, and production actions require explicit authority.

## Current stage

**Design-first / frontend-first foundation.**

Before the frontend design gate is passed, agents MUST NOT:
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

Use the project's design/frontend-design skills.

Where meaningful alternatives exist:
1. create multiple isolated variants;
2. keep the same functional requirements;
3. preview them;
4. compare them against the product context;
5. choose one direction;
6. promote it into the canonical UI system.

Do not accept the first generated interface by default.

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

Broad outside, structured inside.

The taxonomy must be data-driven and expandable rather than hard-coded into the navigation.

Initial categories can be AI, Design, Web + Product, Business + Freelancing, Content, and other launch-approved categories. The product architecture must not make these permanent limits.

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
- Supabase: auth, database, realtime, learning persistence;
- Cloudflare R2: object/file storage;
- Resend: important transactional email;
- Redis-compatible service: rate limiting and short-lived coordination;
- Bunny.net: video delivery/live capabilities;
- Telegram: internal feedback/alerts;
- payments: HOLD;
- search: Postgres first, intelligent search later;
- PWA/Web Push: installability and notifications with consent.

See `docs/INTEGRATIONS.md`.

## Forbidden shortcuts

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

## Definition of done

A phase is complete only when:
- scope is implemented;
- out-of-scope work remains untouched;
- mobile behavior is checked;
- accessibility basics are checked;
- relevant verification passes;
- changed files are reviewed;
- durable documentation is updated where decisions changed.
