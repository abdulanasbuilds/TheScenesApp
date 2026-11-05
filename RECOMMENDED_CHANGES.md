# The Scenes — Recommended Changes Report

**Audit Type:** Independent Principal Software Architect — Remediation Plan  
**Status:** Read-only assessment — no files modified  
**Date:** November 2026  
**Scope:** All findings from ARCHITECTURE_AUDIT.md, SECURITY_AUDIT.md, DOCUMENTATION_AUDIT.md, ARCHITECTURAL_RISKS.md  
**Confidence:** High — based on direct reading of all project documents

---

## 1. Executive Summary

**This is a remediation plan, not a rewrite.** The Scenes architecture is fundamentally sound. The issues are almost entirely about the gap between documentation and implementation, unresolved product decisions, and missing infrastructure (CI/CD, migrations, secret templates).

The plan is divided into four priority tiers:

| Tier | When | What |
|---|---|---|
| **Must fix before implementation** | Before Phase 1 design work | Resolve contradictions, create missing docs, close blocking OPDs |
| **Must fix before production** | Before Phase 3 backend work | Implement auth, RLS, rate limiting, CI/CD, migrations |
| **Should improve** | During Phases 2-4 | Developer experience, observability, caching, deployment docs |
| **Optional future improvements** | Phase 5+ | Multi-tenancy prep, visual regression, advanced monitoring |

**Preserved decisions:** All ADRs are valid and should be preserved. No technology stack changes are recommended. The provider abstraction pattern, phase-gated implementation, referral/reward separation, and zero-cost defaults are all correct and should be maintained.

---

## 2. MUST FIX BEFORE IMPLEMENTATION

These items block Phase 1 design exploration and must be resolved before any agent begins implementation work.

### MC-001: Resolve CI/CD contradiction — TS-OPS-005 marked BUILT but no pipeline exists

**Priority:** Critical  
**Affected files:** `docs/FEATURE-MATRIX.md` line 138, `.github/workflows/` (missing)  
**Change:** Update `FEATURE-MATRIX.md` TS-OPS-005 status from BUILT to NOT STARTED. Create GitHub Actions workflow implementing CI contract checks (install, lint, typecheck, build, contract integrity).  
**Why:** Agents believe CI is already configured and may skip implementing it, allowing unreviewed code to reach main.  
**Dependencies:** None  
**Verification:** CI workflow runs on push/PR; all checks pass.

### MC-002: Create `docs/PRICING-COST-RESEARCH.md` — OPD-015 is BLOCKED

**Priority:** Critical  
**Affected files:** `docs/PRICING-COST-RESEARCH.md` (missing), `docs/OPEN-PRODUCT-DECISIONS.md` OPD-015  
**Change:** Create pricing cost research document with infrastructure cost breakdown, per-user cost estimate, recommended pricing in USD and GHS, and 70% margin validation. Resolve OPD-015.  
**Why:** Phase 7 (payments) cannot be implemented without finalized pricing. Pricing page design (TS-LAND-002) is blocked.  
**Dependencies:** None  
**Verification:** Document exists; all prices finalized; OPD-015 resolved.

### MC-003: Resolve R2 storage contradiction — core vs add-on

**Priority:** Critical  
**Affected files:** `docs/PRICING-MONETIZATION.md` lines 184-196, `docs/INTEGRATIONS.md` lines 21-31, `docs/DECISIONS.md` ADR-009  
**Change:** Resolve whether Cloudflare R2 is part of core architecture or only a native hosting add-on. `PRICING-MONETIZATION.md` says "NO NATIVE HOSTING BY DEFAULT" but `INTEGRATIONS.md` and ADR-009 designate R2 as primary storage. Update all documents to be consistent.  
**Why:** Agents may implement R2 storage when pricing says no native hosting, or skip R2 when architecture requires it.  
**Dependencies:** None  
**Verification:** Single authoritative R2 position across all documents.

### MC-004: Resolve Free plan platform fee — TS-PAY and TS-PAYOUT blocked

**Priority:** Critical  
**Affected files:** `docs/OPEN-PRODUCT-DECISIONS.md` RES-002, `docs/PRICING-MONETIZATION.md` line 176  
**Change:** Decide Free plan platform fee (TBD% currently). RES-002 covers Pro and Pro Plus (3%) but not Free. Update RES-002 or PRICING-MONETIZATION.md with explicit Free plan fee.  
**Why:** Payment architecture cannot be designed without knowing fees for all plans.  
**Dependencies:** MC-002 (pricing cost research)  
**Verification:** Platform fee documented for all three plans.

### MC-005: Resolve community interaction type "tha" — TS-COMM-005 blocked

**Priority:** Critical  
**Affected files:** `docs/PRODUCT-REQUIREMENTS.md` line 52, `docs/OPEN-PRODUCT-DECISIONS.md` OPD-001  
**Change:** Obtain founder decision on the "tha" interaction type, or explicitly confirm posts/comments/likes are sufficient for launch. Close OPD-001.  
**Why:** Community data model cannot be finalized without knowing if there is a fourth interaction type.  
**Dependencies:** None  
**Verification:** OPD-001 resolved; community data model finalized.

### MC-006: Resolve Instant Payouts undefined — TS-PAY-013 blocked

**Priority:** Critical  
**Affected files:** `docs/PRODUCT-REQUIREMENTS.md` line 132, `docs/OPEN-PRODUCT-DECISIONS.md` OPD-002  
**Change:** Obtain founder clarification on "Instant Payouts (SMS + 1%, GH 1)". Document exact fee structure, minimum amounts, supported methods, and regional rules.  
**Why:** Creator payout system cannot be implemented without knowing the exact payout model.  
**Dependencies:** None  
**Verification:** OPD-002 resolved with exact payout model documented.

### MC-007: Complete OPD-005 through OPD-014 — 10 undocumented decisions

**Priority:** Critical  
**Affected files:** `docs/OPEN-PRODUCT-DECISIONS.md` line 252  
**Change:** Complete documentation for OPD-005 through OPD-014 with historical context, affected architecture, current assumptions, and decision status.  
**Why:** Agents cannot know what decisions are pending. Implementation may proceed with incorrect assumptions.  
**Dependencies:** None  
**Verification:** All OPDs 001-015 documented.

### MC-008: Resolve OPD-010 reference — reward tier policy blocked

**Priority:** Critical  
**Affected files:** `docs/REWARD-INFRASTRUCTURE.md` line 320, `docs/OPEN-PRODUCT-DECISIONS.md`  
**Change:** Create OPD-010 for referral reward tier policy, or correct the reference if OPD-010 exists elsewhere.  
**Why:** Referral reward implementation cannot proceed without finalized tier policy. Referenced OPD does not exist.  
**Dependencies:** None  
**Verification:** OPD-010 exists or correct reference documented.

### MC-009: Resolve OPD-006 reference — advertising model blocked

**Priority:** Critical  
**Affected files:** `docs/PRODUCT-REQUIREMENTS.md` lines 353-357, `docs/OPEN-PRODUCT-DECISIONS.md`  
**Change:** Create OPD-006 for advertising/sponsorship model, or explicitly decide against advertising.  
**Why:** Advertising decisions affect landing page design and monetization.  
**Dependencies:** None  
**Verification:** OPD-006 exists or advertising explicitly rejected.

### MC-010: Reclassify TS-LAND-002 pricing page — blocked until pricing finalized

**Priority:** High  
**Affected files:** `docs/PRODUCT-REQUIREMENTS.md` line 255  
**Change:** Reclassify TS-LAND-002 from CORE NOW (design) to CORE LATER or NEEDS DECISION until MC-002 (pricing research) is complete.  
**Why:** Designing a pricing page without finalized pricing is speculative work that will need to be redone.  
**Dependencies:** MC-002  
**Verification:** TS-LAND-002 status updated; pricing page design deferred until pricing finalized.

### MC-011: Create missing documents — PRICING-COST-RESEARCH.md and LEGACY-SOURCE-INVENTORY.md

**Priority:** High  
**Affected files:** `docs/README.md` references both; both missing  
**Change:** Create `docs/PRICING-COST-RESEARCH.md` (see MC-002). Create `docs/LEGACY-SOURCE-INVENTORY.md` or remove reference from `FOLDER-STRUCTURE.md` line 360.  
**Why:** Referenced documents don't exist, causing broken documentation links and confusion.  
**Dependencies:** MC-002  
**Verification:** Both documents exist or references removed.

### MC-012: Fix TS-OPS-005 CI/CD status in feature matrix

**Priority:** High  
**Affected files:** `docs/FEATURE-MATRIX.md` line 138  
**Change:** Update status from BUILT to NOT STARTED.  
**Why:** False status misleads agents about CI readiness.  
**Dependencies:** MC-001  
**Verification:** Feature matrix accurately reflects CI status.

---

## 3. MUST FIX BEFORE PRODUCTION

These items must be complete before Phase 3 backend foundation or production deployment.

### MP-001: Create database migration files from documented schemas

**Priority:** Critical  
**Affected files:** `src/server/db/schema.ts` (missing), `src/server/db/migrations/` (missing), `docs/REFERRAL-QUOTA-ARCHITECTURE.md`, `docs/REWARD-INFRASTRUCTURE.md`  
**Change:** Create Supabase migration files (or Drizzle Kit schema) matching all documented tables: `users`, `referrals`, `referral_events`, `creator_entitlements`, `creator_usage`, `provider_accounts`, `provider_usage`, `communities`, `courses`, `modules`, `lessons`, `enrollments`, `progress`, `posts`, `comments`, `events`, `files`. Include foreign key constraints, CHECK constraints, UNIQUE constraints, and RLS policies.  
**Why:** Schema exists only as Markdown snippets. Transcription errors during manual implementation could cause data integrity failures.  
**Dependencies:** MC-005 (community interaction type resolved)  
**Verification:** Migration runs against test database; tables match documented definitions including all constraints.

### MP-002: Implement authentication and authorization (Phase 3)

**Priority:** Critical  
**Affected files:** `src/features/auth/` (missing), `src/server/api/auth.ts` (missing), `TS-AUTH-001` through `TS-AUTH-010`, `TS-SEC-001` through `TS-SEC-006`  
**Change:** Implement Supabase Auth integration with server-side session validation, role-based access control (learner, creator, admin), object-level authorization, and RLS policies. Do not use client-only authorization.  
**Why:** All 11 TS-SEC requirements are unimplemented. Without auth, there is no identity boundary or authorization.  
**Dependencies:** MP-001 (schema)  
**Verification:** Authenticated requests succeed; unauthenticated requests return 401; role enforcement prevents unauthorized access; RLS blocks cross-user data access.

### MP-003: Implement rate limiting (Phase 3-4)

**Priority:** Critical  
**Affected files:** `src/server/middleware/rate-limit.ts` (missing), `TS-SEC-007`  
**Change:** Implement rate limiting middleware for auth endpoints (5 attempts/15 min), API endpoints (100 requests/hour per user), email sending, and referral link generation. Use Redis-compatible service.  
**Why:** Without rate limiting, API is vulnerable to brute force, scraping, and spam.  
**Dependencies:** MP-002 (auth)  
**Verification:** Exceed rate limit returns HTTP 429; legitimate requests within limits succeed.

### MP-004: Implement CI/CD pipeline with secret scanning

**Priority:** Critical  
**Affected files:** `.github/workflows/` (missing), `CI-CONTRACT.md`  
**Change:** Create GitHub Actions workflow implementing: dependency install from lockfile, lint, TypeScript typecheck, production build, documentation/contract integrity checks, secret scanning (gitleaks or trufflehog).  
**Why:** No CI exists. Code can reach main unreviewed. Secrets could be committed accidentally.  
**Dependencies:** MC-001  
**Verification:** CI runs on push/PR; all checks pass; secret scanning blocks committed secrets.

### MP-005: Implement webhook verification and idempotency (Phase 7+)

**Priority:** High  
**Affected files:** `src/server/api/` (missing), `TS-SEC-008`, `TS-PAY-008`  
**Change:** Implement webhook signature verification for all provider webhooks (Resend, payment processor, video provider). Use idempotency keys for all webhook-handled events.  
**Why:** Without verification, attackers can forge webhook events. Without idempotency, duplicate delivery causes double-crediting or double-charging.  
**Dependencies:** MP-002 (auth), MP-004 (CI)  
**Verification:** Forged webhook rejected; duplicate webhook handled idempotently.

### MP-006: Create `.env.example` template

**Priority:** High  
**Affected files:** Root directory (no `.env.example`), `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Change:** Create `.env.example` with all required environment variables per phase, marked as required/optional. Document which variables are needed for local development vs production.  
**Why:** New developers cannot easily set up local development. Missing env vars cause runtime failures.  
**Dependencies:** None  
**Verification:** `bun run dev` starts successfully with `.env.local` populated from template.

### MP-007: Implement Content Security Policy headers

**Priority:** Medium  
**Affected files:** `vite.config.ts`, deployment configuration  
**Change:** Configure CSP headers via Cloudflare Pages `_headers` file or middleware. Restrict script sources, style sources, and connect sources.  
**Why:** Application will render user-generated content. Without CSP, XSS attack surface is not mitigated.  
**Dependencies:** MP-002 (auth, for session token protection)  
**Verification:** Response headers include CSP; inline scripts blocked; unapproved external resources blocked.

### MP-008: Implement input validation schemas (Zod)

**Priority:** High  
**Affected files:** `src/lib/validation/schemas.ts` (missing), `TS-SEC-010`  
**Change:** Define Zod schemas for all API request bodies, query parameters, and form submissions. Validate on server, not just client.  
**Why:** Zod is a dependency (`^4.4.3`) but no validation schemas exist. Without server-side validation, API is vulnerable to injection and malformed data.  
**Dependencies:** MP-002 (auth, for protected endpoints)  
**Verification:** Invalid data rejected with 400; SQL injection payloads blocked by parameterized queries.

### MP-009: Implement private file access control with signed URLs

**Priority:** High  
**Affected files:** `src/services/storage/` (missing), `TS-SEC-003`, `TS-SEC-004`  
**Change:** Implement R2 adapter with signed URL generation for private objects. Validate ownership server-side before generating signed URLs. Set short expiry times.  
**Why:** Without controlled access, private files could be accessed via direct R2 object URLs.  
**Dependencies:** MC-003 (R2 position resolved), MP-002 (auth)  
**Verification:** Unauthorized file access rejected; signed URLs expire after configured time.

### MP-010: Implement audit logging

**Priority:** Medium  
**Affected files:** `src/server/` (missing), `TS-SEC-009`  
**Change:** Implement audit logging for authentication events, authorization changes, financial transactions, referral state changes, content moderation, and admin operations.  
**Why:** Without audit logs, security incidents cannot be investigated or attributed.  
**Dependencies:** MP-002 (auth)  
**Verification:** Security-relevant action creates audit log entry with user, action, timestamp, result.

---

## 4. SHOULD IMPROVE (Phases 2-4)

### SI-001: Create API contract specification (OpenAPI or shared Zod schemas)

**Priority:** Medium  
**Affected files:** `src/server/api/` (missing), `docs/`  
**Change:** Create OpenAPI specification or shared Zod schemas for all API routes. Enable frontend and backend parallel development.  
**Why:** Without API contracts, frontend and backend cannot be developed in parallel. Integration testing is harder.  
**Dependencies:** MP-002 (auth endpoints defined)  
**Verification:** API routes validate against shared schemas.

### SI-002: Create deployment documentation

**Priority:** Medium  
**Affected files:** `docs/` (missing deployment guide), `vite.config.ts` (Nitro Cloudflare preset)  
**Change:** Document build, preview, and production deployment to Cloudflare Pages. Document required environment variables per environment.  
**Why:** Production deployment process is undefined. Ad-hoc deployment is error-prone.  
**Dependencies:** MP-006 (`.env.example`)  
**Verification:** Test deployment to staging succeeds.

### SI-003: Implement database capacity monitoring and upgrade triggers

**Priority:** Medium  
**Affected files:** `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 152  
**Change:** Create capacity model estimating users, data per user, and time to Free tier exhaustion (500 MB Supabase database). Define upgrade trigger at 75% usage. Document upgrade process to Supabase Pro.  
**Why:** Without capacity planning, database could hit read-only enforcement unexpectedly.  
**Dependencies:** MP-001 (schema)  
**Verification:** Capacity model shows projected exhaustion timeline; upgrade trigger documented.

### SI-004: Implement email rate limiting with queue

**Priority:** Medium  
**Affected files:** `src/server/` (missing), `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 158  
**Change:** Implement email send rate limiting with queue and fail-safe. Resend Free tier: 100 emails/day, 3,000/month.  
**Why:** Without rate limiting, email volume could exceed free tier, blocking transactional emails.  
**Dependencies:** MP-002 (auth, for email triggers)  
**Verification:** Email sending stops at daily limit; queue prevents message loss.

### SI-005: Select video/live provider

**Priority:** Medium  
**Affected files:** `docs/INTEGRATIONS.md` lines 48-52, `docs/PHASES.md` lines 118-124  
**Change:** Document video provider evaluation criteria (cost per minute, free tier, SDK quality, regional performance). Select primary provider with fallback options.  
**Why:** Four providers listed without selection criteria. Phase 6 cannot proceed without a decision.  
**Dependencies:** None  
**Verification:** Video provider selected or evaluation criteria documented.

### SI-006: Select payment provider

**Priority:** Medium  
**Affected files:** `docs/PRODUCT-REQUIREMENTS.md` (TS-PAY notes "Paystack/Flutterwave historical refs")  
**Change:** Document payment provider evaluation criteria (African payment methods, fees, API quality, documentation, settlement times). Select provider.  
**Why:** Without selected provider, Phase 7 cannot proceed.  
**Dependencies:** MC-004 (platform fee), MC-002 (pricing research)  
**Verification:** Payment provider selected or evaluation criteria documented.

### SI-007: Select Redis-compatible provider for rate limiting

**Priority:** Medium  
**Affected files:** `docs/INTEGRATIONS.md` lines 38-46, `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 264  
**Change:** Select Redis-compatible provider (Upstash free tier mentioned at 10,000 commands/day). Document selection.  
**Why:** Without provider selection, rate limiting cannot be implemented.  
**Dependencies:** MP-003  
**Verification:** Redis provider selected.

### SI-008: Implement caching strategy

**Priority:** Low  
**Affected files:** `docs/INTEGRATIONS.md` (Redis for caching)  
**Change:** Document caching strategy: what to cache, TTL values, invalidation triggers, cache-aside pattern.  
**Why:** Without caching, frequently accessed data hits database on every request, increasing costs and latency.  
**Dependencies:** SI-007 (Redis provider)  
**Verification:** Caching strategy documented; cache hit rates monitored.

### SI-009: Add tenant_id columns for multi-tenancy preparedness (ADR-028)

**Priority:** Low  
**Affected files:** `src/server/db/schema.ts` (to be created), ADR-028  
**Change:** Add `tenant_id` or `organization_id` to core tables (communities, courses) even if not enforced yet. Document migration path to multi-tenancy.  
**Why:** Adding multi-tenancy later (Phase 10) may require schema refactor if not considered early.  
**Dependencies:** MP-001 (schema)  
**Verification:** Schema includes tenant-aware patterns.

### SI-010: Create design variant repository

**Priority:** Low  
**Affected files:** `AGENTS.md` (Design mandate), `docs/DESIGN-FIRST.md` line 26  
**Change:** Define design artifacts directory (e.g., `docs/designs/`). Require variant comparison documentation before selecting direction.  
**Why:** Design mandate requires multiple variants but no location is defined. Cannot verify compliance.  
**Dependencies:** None  
**Verification:** Design variants exist in designated location; comparison document exists.

---

## 5. OPTIONAL FUTURE IMPROVEMENTS (Phase 5+)

### OI-001: Add visual regression testing

**Priority:** Low  
**Affected files:** `docs/TESTING-AND-QUALITY.md` lines 171-179  
**Change:** Add visual regression testing (Percy, Chromatic, or Playwright screenshots) for key pages.  
**Why:** Optional but recommended for catching UI regressions during design iterations.  
**Dependencies:** Phase 2 frontend  
**Verification:** Visual regression tests configured and running.

### OI-002: Add Real User Monitoring (Core Web Vitals)

**Priority:** Low  
**Affected files:** `docs/TESTING-AND-QUALITY.md` lines 189-194  
**Change:** Add Core Web Vitals tracking (LCP, FID, CLS) for production monitoring.  
**Why:** Performance monitoring helps identify regressions and optimization opportunities.  
**Dependencies:** Production deployment  
**Verification:** RUM data collected; performance budgets defined.

### OI-003: Add Docker configuration for local development consistency

**Priority:** Low  
**Affected files:** Root directory (no Dockerfile)  
**Change:** Add Dockerfile and docker-compose.yml for local development environment consistency.  
**Why:** Optional for team onboarding consistency. Not required for Cloudflare deployment.  
**Dependencies:** None  
**Verification:** `docker build` succeeds; local environment matches production.

### OI-004: Add code ownership (CODEOWNERS file)

**Priority:** Low  
**Affected files:** Root directory (no CODEOWNERS)  
**Change:** Create CODEOWNERS file defining review responsibilities. Configure required reviewers in GitHub.  
**Why:** Clarifies PR review process and ensures appropriate expertise reviews changes.  
**Dependencies:** MP-004 (CI/CD)  
**Verification:** CODEOWNERS exists; PRs require appropriate reviewer approval.

### OI-005: Add chaos engineering for provider failover

**Priority:** Low  
**Affected files:** `docs/TESTING-AND-QUALITY.md` lines 320-322  
**Change:** Add chaos engineering tests for provider failover (LiveKit/Daily/Agora switching).  
**Why:** Validates provider-abstracted architecture under failure conditions.  
**Dependencies:** Phase 6 (video providers)  
**Verification:** Failover tests pass; sessions recover gracefully.

---

## 6. Preserved Architectural Decisions

The following decisions are **sound and should be preserved**. No changes recommended:

| Decision | Rationale |
|---|---|
| ADR-001 (Project identity: The Scenes) | Clear branding, no conflict |
| ADR-002 (Broader than AI) | Correct product positioning |
| ADR-003 (Competitor reference, not clone) | Avoids derivative design |
| ADR-004 (Separate landing page) | Correct separation of marketing vs product |
| ADR-005 (Frontend first) | Reduces rework risk |
| ADR-006 (Provider abstraction) | Prevents vendor lock-in |
| ADR-007 (Payments deferred) | Correct gating |
| ADR-008 (Mobile first) | Matches African-first requirement |
| ADR-009 (R2 storage) | Cost-effective, appropriate |
| ADR-010 (Resend email) | Appropriate for transactional email |
| ADR-011 (Postgres search first) | Start simple, scale when justified |
| ADR-012 (PWA) | Appropriate for mobile-first |
| ADR-013 (AGENTS.md as contract) | Strong governance |
| ADR-014 (Referral rewards = entitlements) | Correct financial boundary |
| ADR-015 (No account farming) | Prevents terms-of-service violations |
| ADR-016 (Separate quota ledgers) | Correct entitlement vs capacity separation |
| ADR-017 (No secrets in JSONB) | Prevents credential leakage |
| ADR-018 (Session-level failover) | Realistic about SDK incompatibility |
| ADR-019 (Requirements registry) | Good traceability |
| ADR-020 (Feature matrix) | Good tracking |
| ADR-021 (Open decisions register) | Correct practice |
| ADR-022 (Legacy isolation) | Prevents technical debt |
| ADR-023 (Documentation gate) | Correct sequencing |
| ADR-024 (Broad category taxonomy) | Supports expansion |
| ADR-025 (Gamification purpose) | Prevents decorative gamification |
| ADR-026 (Code syntax highlighting layer) | Good reuse pattern |
| ADR-027 (Private messaging security) | Correct security posture |
| ADR-028 (Multi-tenancy preparedness) | Forward-looking without overengineering |

---

## 7. Changes That Require Coordination

| Change | Affected Areas | Coordination Needed |
|---|---|---|
| MC-003 (R2 position) | Pricing, Integrations, Decisions, Reward infra | Founder + architect |
| MC-004 (Free plan fee) | Pricing, Payments, Payouts | Founder |
| MC-005 (Community interaction) | Community data model, UI, notifications | Founder |
| MC-006 (Instant payouts) | Payments, Payouts | Founder |
| MC-007 (OPD-005 to 014) | All features | Founder |
| MP-001 (Schema migrations) | Database, all backend features | Backend lead |
| MP-002 (Auth + RLS) | All authenticated features | Security + backend |
| MP-004 (CI/CD) | All code changes | DevOps |
| SI-005 (Video provider) | Live sessions, events, creator workspace | Integration lead |
| SI-006 (Payment provider) | Payments, payouts, marketplace | Founder + integration |

---

## 8. Estimated Effort

| Tier | Item Count | Estimated Effort |
|---|---|---|
| Must fix before implementation | 12 items | 1-2 weeks |
| Must fix before production | 10 items | 4-6 weeks |
| Should improve | 10 items | 2-3 weeks |
| Optional future | 5 items | 1-2 weeks |

**Total:** ~8-13 weeks of work before production readiness, spread across Phases 0-4.

---

## 9. Conclusion

**The Scenes does not need a rewrite.** The architecture is sound, the documentation is thorough, and the technology choices are appropriate. The required changes are primarily about:

1. **Closing the documentation-to-implementation gap** (migrations, API contracts, CI/CD, env templates)
2. **Resolving open product decisions** (pricing, community interaction, payouts, advertising)
3. **Implementing security basics** (auth, RLS, rate limiting, webhook verification)
4. **Fixing contradictions** (R2 position, CI status, pricing page classification)

All changes are reversible and incremental. No existing architectural decisions should be overturned. The project is ready to proceed once the "Must fix before implementation" items are completed.

---

**Prepared by:** Independent Principal Software Architect  
**Method:** Synthesis of all audit findings into prioritized remediation plan  
**Files modified:** None