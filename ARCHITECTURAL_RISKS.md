# The Scenes — Architectural Risks Report

**Audit Type:** Independent Principal Software Architect — Failure Analysis  
**Status:** Read-only assessment — no files modified  
**Date:** November 2026  
**Scope:** All architecture documentation, product requirements, security rules, integration boundaries, cost guardrails  
**Confidence:** High — based on direct reading of all project documents

---

## 1. Executive Summary

**This failure analysis identifies 28 architectural risks across 7 categories.** The project has strong documentation and sound architectural patterns, but is in Phase 0 with zero implementation. The risks below are real, evidence-based failures that could occur if the project proceeds without correction.

Risks are categorized as:
- **Critical:** Will prevent launch or cause significant business/technical failure if not corrected
- **High:** Likely to cause production incidents, data loss, security breaches, or major rework
- **Medium:** Could cause operational issues, developer friction, or suboptimal outcomes
- **Low:** Minor issues with limited impact

For each risk: Finding ID, Severity, Affected Component, Evidence, Why It Matters, Recommended Correction, Verification Method.

---

## 2. Critical Architectural Weaknesses

### RISK-001: No application code exists — project cannot be built or deployed

**Severity:** Critical  
**Affected Component:** Entire application (`src/` directory does not exist)  
**Evidence:** Glob for `src/**/*` returned no files. `tsconfig.json` includes `src/**/*.ts` patterns but the directory is absent. No routes, components, services, or server code exist.  
**Why It Matters:** The project cannot be compiled, tested, or deployed. All architecture decisions are untested in practice. The "design-first" mandate means no code should exist yet, but there is no path from documentation to implementation without creating the `src/` structure.  
**Recommended Correction:** Create `src/` directory structure per `docs/FOLDER-STRUCTURE.md`. Begin Phase 1 design exploration to produce design artifacts, then Phase 2 frontend implementation.  
**Verification:** `bun run build` succeeds; `bun run dev` starts dev server on port 5000.

### RISK-002: Database schema exists only as Markdown, not as executable migrations

**Severity:** Critical  
**Affected Component:** `src/server/db/` (does not exist), `docs/REFERRAL-QUOTA-ARCHITECTURE.md`, `docs/REWARD-INFRASTRUCTURE.md`  
**Evidence:** SQL `CREATE TABLE` statements exist only inside Markdown code blocks. No `src/server/db/schema.ts`, no migration files, no Supabase CLI configuration.  
**Why It Matters:** When Phase 3 begins, someone must manually transcribe SQL from Markdown into migration files. This creates schema drift risk between documentation and implementation. Typographical errors in transcription could cause data integrity failures.  
**Recommended Correction:** Create migration files (Supabase format or Drizzle Kit) matching documented schemas before Phase 3. Establish a process to keep documentation and migrations in sync.  
**Verification:** Migration runs against test database; resulting tables match documented definitions including constraints, indexes, and RLS policies.

### RISK-003: No CI/CD pipeline configured despite being marked as BUILT

**Severity:** Critical  
**Affected Component:** `.github/workflows/` (does not exist), `docs/CI-CONTRACT.md`, `docs/FEATURE-MATRIX.md` (TS-OPS-005 marked BUILT)  
**Evidence:** No `.github/workflows/` directory exists. `FEATURE-MATRIX.md` line 138 marks TS-OPS-005 (CI/CD) as BUILT with note "Already configured". `CI-CONTRACT.md` describes required checks (install, lint, typecheck, build, contract integrity) but no workflow implements them.  
**Why It Matters:** Without CI, unreviewed code can reach main. Lint failures, type errors, and build breaks are not caught automatically. The "BUILT" status misleads agents into believing CI is already functioning.  
**Recommended Correction:** Create GitHub Actions workflow implementing all CI contract checks. Update `FEATURE-MATRIX.md` TS-OPS-005 status from BUILT to NOT STARTED or IN PROGRESS.  
**Verification:** CI workflow runs on push/PR; lint, typecheck, build, and contract integrity checks all pass.

### RISK-004: No authentication, authorization, or RLS implemented — all security is unimplemented

**Severity:** Critical  
**Affected Component:** `src/features/auth/` (does not exist), `src/server/api/` (does not exist), `TS-SEC-001` through `TS-SEC-011`  
**Evidence:** All 11 TS-SEC security requirements are classified as CORE LATER, Phase 3+. No auth code, no RLS policies, no authorization middleware exists.  
**Why It Matters:** Without authentication and authorization, there is no identity boundary. Without RLS, any user with the Supabase anon key could read or modify any database row. The entire security model is theoretical.  
**Recommended Correction:** Implement Supabase Auth, server-side session validation, role-based access control, object-level authorization, and RLS policies as the first Phase 3 deliverables.  
**Verification:** Authenticated requests succeed; unauthenticated requests to protected routes return 401; cross-user data access is blocked by RLS; role enforcement prevents unauthorized admin access.

### RISK-005: Pricing not finalized — Phase 7 payments blocked indefinitely

**Severity:** Critical  
**Affected Component:** `docs/PRICING-MONETIZATION.md`, `docs/OPEN-PRODUCT-DECISIONS.md` (OPD-015), `TS-PAY-001` through `TS-PAY-016`  
**Evidence:** OPD-015 is BLOCKED pending pricing cost research. `PRICING-MONETIZATION.md` lists monthly cost as "TBD USD/GHS" for all plans. Platform fee for Free plan is "TBD%". `docs/PRICING-COST-RESEARCH.md` does not exist (referenced but missing).  
**Why It Matters:** Without finalized pricing, the payment architecture cannot be designed. Checkout, subscriptions, platform fees, creator payouts, and refund logic all depend on knowing prices, fees, and margins. Phase 7 cannot begin.  
**Recommended Correction:** Complete `docs/PRICING-COST-RESEARCH.md` with infrastructure cost breakdown, per-user cost, recommended pricing in USD and GHS, and 70% margin validation. Resolve OPD-015.  
**Verification:** Pricing research document exists; all prices finalized; OPD-015 resolved.

---

## 3. Security Vulnerabilities and Exposure Risks

### RISK-006: No rate limiting — API vulnerable to brute force, spam, and scraping

**Severity:** High  
**Affected Component:** `src/server/middleware/rate-limit.ts` (does not exist), `TS-SEC-007`  
**Evidence:** Rate limiting is documented (Redis-compatible, Phase 4) but no middleware, no rate limit configuration, no implementation exists.  
**Why It Matters:** Without rate limiting, authentication endpoints are vulnerable to credential stuffing, API endpoints to scraping, and email endpoints to spam abuse. This could lead to account takeover, provider cost overruns, and service degradation.  
**Recommended Correction:** Implement rate limiting middleware for auth (5 attempts/15 min), API (100 requests/hour per user), email sending, and referral link generation. Use Redis or Cloudflare Workers rate limiting.  
**Verification:** Exceed rate limit; verify HTTP 429 response; legitimate requests within limits succeed.

### RISK-007: No webhook verification or idempotency — financial and referral fraud risk

**Severity:** High  
**Affected Component:** `src/server/api/` (does not exist), `TS-SEC-008`, `TS-PAY-008`  
**Evidence:** Webhook verification is required by SECURITY-RULES.md and BUILD-CONTRACT.md but no implementation exists. Payments are Phase 7+, but the pattern must be established early.  
**Why It Matters:** Without webhook signature verification, attackers can forge payment, referral, or other webhook events. Without idempotency, duplicate webhook delivery can cause double-crediting, double-charging, or duplicate state changes.  
**Recommended Correction:** Implement webhook signature verification for all provider webhooks. Use idempotency keys for all webhook-handled events (referral events, payment webhooks, payout events).  
**Verification:** Send forged webhook; verify rejection. Send duplicate webhook; verify idempotent handling (no duplicate side effects).

### RISK-008: No secret scanning in CI — credential leakage risk

**Severity:** High  
**Affected Component:** `.github/workflows/` (does not exist), `CI-CONTRACT.md` (security-stage rule)  
**Evidence:** CI contract mentions secret scanning as a future requirement but no workflow exists. No pre-commit hook for secret scanning.  
**Why It Matters:** Without automated secret scanning, developers could accidentally commit API keys, service tokens, webhook secrets, or database passwords to the repository. Once committed, secrets must be rotated, which is disruptive and costly.  
**Recommended Correction:** Add secret scanning (gitleaks, trufflehog, or GitHub Secret Scanning) to CI pipeline. Add pre-commit hook for local scanning.  
**Verification:** Commit a test secret; verify CI fails. Confirm no secrets in git history.

### RISK-009: No CSP headers — XSS attack surface not mitigated

**Severity:** Medium  
**Affected Component:** `vite.config.ts`, `src/app/routes/__root.tsx` (does not exist)  
**Evidence:** `vite.config.ts` does not configure Content Security Policy headers. No security headers middleware is documented.  
**Why It Matters:** The application will render user-generated content (community posts, comments, course content). Without CSP, XSS attacks could steal session tokens, perform unauthorized actions, or deface the site.  
**Recommended Correction:** Configure CSP headers via Cloudflare Pages `_headers` file or middleware. Restrict script sources, style sources, and connect sources to approved domains.  
**Verification:** Check response headers for CSP; verify inline scripts are blocked; verify external resources from unapproved domains are blocked.

### RISK-010: No object-level authorization — IDOR vulnerability risk

**Severity:** High  
**Affected Component:** `src/server/` (does not exist), `TS-SEC-002`, `TS-SEC-005`  
**Evidence:** Object-level authorization is required but no implementation exists. BUILD-CONTRACT.md states "Frontend visibility is never the real authorization boundary."  
**Why It Matters:** Without object-level authorization, authenticated users could access resources they don't own (e.g., another user's profile, another creator's course draft, another user's private messages). This is a classic IDOR (Insecure Direct Object Reference) vulnerability.  
**Recommended Correction:** Implement server-side authorization checks for every resource access. Verify ownership or permission before returning data. Use RLS as a defense-in-depth layer.  
**Verification:** Attempt to access another user's resource; verify 403 or 404 response. Verify owner can access their own resources.

### RISK-011: Private file access control not implemented — link leak risk

**Severity:** High  
**Affected Component:** `src/services/storage/` (does not exist), `TS-SEC-003`, `TS-SEC-004`  
**Evidence:** Signed URL access is documented but no R2 adapter, no signed URL generation, no private object access control exists.  
**Why It Matters:** Without controlled access, private course resources, creator files, and user uploads could be accessed via direct R2 object URLs. Signed URLs that don't expire or aren't validated could be shared publicly.  
**Recommended Correction:** Implement signed URL generation for private objects. Validate ownership server-side before generating signed URLs. Set short expiry times on signed URLs.  
**Verification:** Attempt to access private file without authorization; verify rejection. Verify signed URLs expire after configured time.

### RISK-012: No audit logging — security incidents cannot be investigated

**Severity:** Medium  
**Affected Component:** `src/server/` (does not exist), `TS-SEC-009`  
**Evidence:** Audit logging is required by SECURITY-RULES.md but no implementation exists.  
**Why It Matters:** Without audit logs, security incidents (unauthorized access, referral fraud, payout manipulation, admin actions) cannot be investigated or attributed.  
**Recommended Correction:** Implement audit logging for authentication events, authorization changes, financial transactions, referral state changes, content moderation, and admin operations.  
**Verification:** Perform security-relevant action; verify audit log entry with user, action, timestamp, and result.

### RISK-013: Telegram bot token management undefined

**Severity:** Medium  
**Affected Component:** `docs/INTEGRATIONS.md` (Telegram section), `OPEN-PRODUCT-DECISIONS.md` (RES-001)  
**Evidence:** Telegram is designated for internal feedback/operational alerts. RES-001 resolved that Telegram is for a feedback system. "Never expose bot tokens to the client" is stated but no storage, rotation, or proxy pattern is documented.  
**Why It Matters:** If a Telegram bot token is exposed, attackers could send spam, phishing messages, or impersonate the feedback channel. User feedback data could be intercepted.  
**Recommended Correction:** Store Telegram bot token in approved secret storage only. Use server-side proxy for all Telegram API calls. Never expose token to client. Log all Telegram API usage.  
**Verification:** Confirm bot token is not in any committed file. Verify Telegram API calls are server-side only.

---

## 4. Database Integrity Failures

### RISK-014: No RLS policies — data layer cannot enforce authorization

**Severity:** Critical  
**Affected Component:** `src/server/db/schema.ts` (does not exist), `TS-SEC-006`  
**Evidence:** No database schema or RLS policies exist. RLS is mentioned in SECURITY-RULES.md and TS-SEC-006 but not implemented.  
**Why It Matters:** Without RLS, the database is the last line of defense and it is wide open. Any client with the Supabase anon key could perform any query. Application-layer authorization can be bypassed.  
**Recommended Correction:** Write RLS policies for all tables: users can only access their own profiles, creators own their courses/content, admins have explicit override, public data is readable by all.  
**Verification:** Attempt cross-user data access via Supabase client; verify RLS blocks unauthorized queries.

### RISK-015: No foreign key constraints on core tables — orphaned records risk

**Severity:** High  
**Affected Component:** `docs/REWARD-INFRASTRUCTURE.md` (schema snippets)  
**Evidence:** The documented schema shows foreign keys (e.g., `referrer_id UUID NOT NULL REFERENCES users(id)`) but no actual migration files exist to enforce them.  
**Why It Matters:** Without foreign key constraints, orphaned records could exist (referrals without users, usage records without creators, events without referrals). Data integrity would rely entirely on application code, which can have bugs.  
**Recommended Correction: Ensure all migration files include appropriate foreign key constraints with ON DELETE CASCADE or RESTRICT as appropriate.  
**Verification:** Attempt to delete a referenced record; verify foreign key constraint prevents orphaned records or cascades appropriately.

### RISK-016: No idempotency at database level — duplicate processing risk

**Severity:** High  
**Affected Component:** `docs/REFERRAL-QUOTA-ARCHITECTURE.md` (referral_events table), `docs/REWARD-INFRASTRUCTURE.md`  
**Evidence:** The documented schema includes `event_key TEXT NOT NULL UNIQUE` for idempotency, but no actual table exists. No code-level idempotency checks are implemented.  
**Why It Matters:** Without idempotency, duplicate events (retryed webhooks, duplicate form submissions, network retries) could cause double-crediting of referral rewards, duplicate payouts, or duplicate state changes.  
**Recommended Correction:** Implement UNIQUE constraints on event keys at the database level. Add application-level idempotency checks before processing any event.  
**Verification:** Send duplicate event with same event_key; verify no duplicate side effects.

### RISK-017: Creator entitlement vs usage could go negative — no database-level constraint

**Severity:** Medium  
**Affected Component:** `docs/REWARD-INFRASTRUCTURE.md` (creator_entitlements, creator_usage tables)  
**Evidence:** The documented schema tracks `storage_bytes_granted`, `storage_bytes_used`, `live_minutes_granted`, `live_minutes_used` but no CHECK constraint prevents used > granted.  
**Why It Matters:** Without constraints, application bugs could allow usage to exceed entitlement, causing the platform to promise more capacity than the creator has earned.  
**Recommended Correction:** Add CHECK constraints: `storage_bytes_used <= storage_bytes_granted`, `live_minutes_used <= live_minutes_granted`.  
**Verification:** Attempt to record usage exceeding entitlement; verify database rejects it.

### RISK-018: Referral state machine has no database-level enforcement

**Severity:** Medium  
**Affected Component:** `docs/REWARD-INFRASTRUCTURE.md` (referrals table status field)  
**Evidence:** The documented schema has `status TEXT NOT NULL CHECK (status IN ('pending', 'qualified', 'rejected', 'reversed'))` but no actual table exists. No state transition enforcement.  
**Why It Matters:** Without state transition enforcement, a referral could jump from "pending" to "reversed" without ever being "qualified" or "credited", breaking the audit trail.  
**Recommended Correction:** Implement state transition validation in application logic (or database triggers). Only allow pending→qualified→credited, pending→rejected, credited→reversed.  
**Verification:** Attempt invalid state transition; verify rejection.

### RISK-019: No backup/recovery strategy documented

**Severity:** Medium  
**Affected Component:** `docs/PRODUCT-REQUIREMENTS.md` (TS-OPS-007)  
**Evidence:** TS-OPS-007 (backup/recovery strategy) is Phase 3+, CORE LATER. No backup documentation exists.  
**Why It Matters:** Without a backup strategy, data loss from accidental deletion, corruption, or provider failure could be unrecoverable.  
**Recommended Correction:** Document Supabase point-in-time recovery, R2 versioning, and cross-region backup strategy. Test restore procedure.  
**Verification:** Backup exists; restore procedure tested and documented.

---

## 5. Performance Bottlenecks

### RISK-020: Supabase Free tier database limit (500 MB) could cause read-only enforcement

**Severity:** High  
**Affected Component:** `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 152, `docs/PRICING-MONETIZATION.md` lines 245-249  
**Evidence:** Supabase Free tier has 500 MB database size limit before read-only enforcement. Guardrail at 450 MB is documented but no capacity model exists to predict when this limit will be reached.  
**Why It Matters:** If user growth exceeds expectations, the database could hit read-only enforcement unexpectedly, making the platform unusable. No upgrade path is documented.  
**Recommended Correction:** Create a capacity model estimating users, data per user, and time to Free tier exhaustion. Define upgrade trigger at 75% usage. Document the upgrade process to Supabase Pro.  
**Verification:** Capacity model shows projected exhaustion timeline; upgrade trigger documented.

### RISK-021: Resend Free tier email limit (100/day, 3,000/month) could block critical notifications

**Severity:** Medium  
**Affected Component:** `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 158  
**Evidence:** Resend Free tier: 100 emails/day, 3,000/month. Guardrail: "Queue emails when approaching daily limit, fail if monthly limit hit." No implementation exists.  
**Why It Matters:** If email volume exceeds the free tier, transactional emails (password reset, email verification, notifications) could fail, blocking user onboarding and critical workflows.  
**Recommended Correction:** Implement email queue with rate limiting. Monitor email usage. Define upgrade trigger.  
**Verification:** Email sending stops at daily limit; queue prevents message loss; upgrade path documented.

### RISK-022: Cloudflare R2 Free tier storage (10 GB) guardrail at 90% — no upgrade path documented

**Severity:** Medium  
**Affected Component:** `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 146  
**Evidence:** R2 Free tier: 10 GB/month storage. Guardrail: "Reject uploads when approaching 9 GB." No upgrade path or alternative storage documented.  
**Why It Matters:** If storage exceeds 9 GB, new uploads are rejected. Creators cannot upload course resources or files. No documented path to increase storage.  
**Recommended Correction:** Document upgrade path to R2 paid tier or alternative storage provider. Define process for founder approval to upgrade.  
**Verification:** Upload rejected at 9 GB threshold; upgrade path documented.

### RISK-023: No caching strategy documented — repeated database queries could degrade performance

**Severity:** Low  
**Affected Component:** `docs/INTEGRATIONS.md` (Redis for caching), `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Evidence:** Redis is mentioned for rate limiting and "carefully scoped cache" but no caching strategy, TTL values, or cache invalidation patterns are documented.  
**Why It Matters:** Without a caching strategy, frequently accessed data (course catalogs, community feeds, user profiles) will hit the database on every request, increasing Supabase costs and latency.  
**Recommended Correction:** Document caching strategy: what to cache, TTL values, invalidation triggers, and cache-aside pattern.  
**Verification: Caching strategy documented; cache hit rates monitored.

### RISK-024: No image optimization or CDN strategy for static assets

**Severity:** Low  
**Affected Component:** `vite.config.ts`, `docs/FOLDER-STRUCTURE.md` (public/ directory)  
**Evidence:** No image optimization configuration. Static assets served from `public/`. Cloudflare Pages provides CDN but no asset optimization strategy is documented.  
**Why It Matters:** Unoptimized images increase page load times, especially on mobile and variable bandwidth (African-first requirement).  
**Recommended Correction:** Document image optimization strategy (compression, WebP/AVIF formats, responsive images). Use Cloudflare image optimization if available.  
**Verification: Page load performance meets targets on mobile; images optimized.

---

## 6. Integration and Deployment Failure Points

### RISK-025: No deployment documentation — production deployment process undefined

**Severity:** High  
**Affected Component:** `docs/INTEGRATIONS.md` (mentions Cloudflare hosting), `vite.config.ts` (Nitro Cloudflare module)  
**Evidence:** No deployment documentation exists. `vite.config.ts` is configured for Nitro Cloudflare module preset but no deployment steps, environment variables, or deployment pipeline are documented.  
**Why It Matters:** Without deployment documentation, production deployment is ad-hoc and error-prone. Environment variables, build commands, and deployment triggers are undefined.  
**Recommended Correction:** Create deployment documentation covering build, preview, and production deployment to Cloudflare Pages. Document required environment variables per environment.  
**Verification:** Test deployment to staging succeeds; production deployment process documented.

### RISK-026: No environment variable template — onboarding friction and missing config risk

**Severity:** Medium  
**Affected Component:** Root directory (no `.env.example`), `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Evidence:** No `.env.example` file exists. Secret management is documented but no template shows required variables per phase.  
**Why It Matters:** New developers cannot easily set up local development. Missing environment variables cause runtime failures that are hard to diagnose.  
**Recommended Correction:** Create `.env.example` with all required variables marked as required/optional per phase. Document which variables are needed for local development vs production.  
**Verification:** `bun run dev` starts successfully with `.env.local` populated from template.

### RISK-027: Multiple payment providers referenced without selection criteria

**Severity:** Medium  
**Affected Component:** `docs/PRODUCT-REQUIREMENTS.md` (TS-PAY-001 notes "Paystack/Flutterwave historical refs"), `docs/PRICING-MONETIZATION.md` line 276  
**Evidence:** Paystack and Flutterwave are mentioned as historical references for African payments. No provider selection criteria, no evaluation process, no decision documented.  
**Why It Matters:** Without a selected payment provider, Phase 7 cannot begin. Different providers have different APIs, fees, and integration complexity. Switching providers later would require significant rework.  
**Recommended Correction:** Document payment provider evaluation criteria (African payment methods support, fees, API quality, documentation, settlement times). Select a provider or define the evaluation process.  
**Verification:** Payment provider selected or evaluation criteria documented.

### RISK-028: Video/live provider not selected — multiple options without criteria

**Severity:** Medium  
**Affected Component:** `docs/INTEGRATIONS.md` line 48-52 (Bunny.net, LiveKit, Daily, Agora), `docs/PHASES.md` line 118-124  
**Evidence:** Four video/live providers are listed as "potential providers" with no selection criteria, priority order, or evaluation process.  
**Why It Matters:** Without a selected provider, Phase 6 (live/media) cannot be implemented. Each provider has different SDKs, pricing, and capabilities. Implementing adapters for all four is wasteful; implementing one without evaluation risks choosing poorly.  
**Recommended Correction:** Document video provider evaluation criteria (cost per minute, free tier limits, SDK quality, regional performance, HLS support). Select a primary provider with fallback options.  
**Verification:** Video provider selected or evaluation criteria documented.

### RISK-029: Redis-compatible service not specified — rate limiting provider undefined

**Severity:** Medium  
**Affected Component:** `docs/INTEGRATIONS.md` line 38-46, `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 264  
**Evidence:** Redis-compatible service is mentioned for rate limiting but no specific provider (Upstash, Redis Cloud, self-hosted, Cloudflare KV) is selected.  
**Why It Matters:** Without a selected provider, rate limiting cannot be implemented. Different providers have different APIs, pricing, and operational complexity.  
**Recommended Correction:** Select a Redis-compatible provider or document the evaluation criteria. Upstash free tier (10,000 commands/day) is mentioned in cost research but not confirmed as the choice.  
**Verification:** Redis provider selected or evaluation criteria documented.

---

## 7. Requirements That Cannot Be Implemented as Documented

### RISK-030: "tha…" community interaction type undefined — TS-COMM-005 blocked

**Severity:** High  
**Affected Component:** `docs/PRODUCT-REQUIREMENTS.md` line 52 (TS-COMM-005), `docs/OPEN-PRODUCT-DECISIONS.md` (OPD-001)  
**Evidence:** TS-COMM-005 is NEEDS DECISION with instruction "Do NOT invent meaning." OPD-001 lists four possible interpretations ("thanks", "threads", "that", or something else) but is WAITING FOR FOUNDER INPUT.  
**Why It Matters:** The community data model cannot be finalized without knowing if there is a fourth interaction type beyond posts, comments, and likes. The community feed, notification system, and data model are all affected.  
**Recommended Correction:** Obtain founder decision on the "tha" interaction type, or explicitly confirm posts/comments/likes are sufficient for launch and close OPD-001.  
**Verification:** OPD-001 resolved; community data model finalized.

### RISK-031: "Instant Payouts (SMS + 1%, GH 1)" undefined — TS-PAY-013 blocked

**Severity:** High  
**Affected Component:** `docs/PRODUCT-REQUIREMENTS.md` line 132 (TS-PAY-013), `docs/OPEN-PRODUCT-DECISIONS.md` (OPD-002)  
**Evidence:** The exact meaning is unclear. Multiple interpretations possible. OPD-002 is WAITING FOR FOUNDER INPUT.  
**Why It Matters:** Creator payout system cannot be implemented without knowing the exact fee structure, minimum amounts, supported methods, and regional rules.  
**Recommended Correction:** Obtain founder clarification on the exact payout model. Document the exact fee structure, minimum withdrawal amounts, and supported methods.  
**Verification:** OPD-002 resolved with exact fee structure documented.

### RISK-032: Partially unreadable payment phrase — TS-PAY-014 blocked

**Severity:** Medium  
**Affected Component:** `docs/PRODUCT-REQUIREMENTS.md` line 133 (TS-PAY-014), `docs/OPEN-PRODUCT-DECISIONS.md` (OPD-003)  
**Evidence:** "[Partially unreadable — original transcription incomplete]" — May contain a business rule, provider requirement, or pricing constraint.  
**Why It Matters:** May contain a constraint affecting payment architecture that is currently unknown.  
**Recommended Correction:** Locate original notes and clarify, or confirm it can be disregarded.  
**Verification:** OPD-003 resolved.

### RISK-033: Referral reward tiers require founder approval but OPD-010 doesn't exist

**Severity:** Medium  
**Affected Component:** `docs/REWARD-INFRASTRUCTURE.md` line 320, `docs/OPEN-PRODUCT-DECISIONS.md`  
**Evidence:** Line 320 states "Founder approval required before finalizing reward tier policy (see OPD-010)." `OPEN-PRODUCT-DECISIONS.md` does not contain OPD-010 (document jumps from OPD-004 to OPD-015, with OPD-005 through OPD-014 listed as "unchanged" but not shown).  
**Why It Matters:** Referral reward implementation cannot proceed without finalized tier policy. The referenced OPD-010 does not appear to exist.  
**Recommended Correction:** Create OPD-010 for referral reward tier policy, or reference the correct OPD number.  
**Verification:** OPD-010 exists or correct reference documented; reward tiers finalized.

### RISK-034: Advertising model undefined — TS-ADS-001 and TS-ADS-002 blocked

**Severity:** Medium  
**Affected Component:** `docs/PRODUCT-REQUIREMENTS.md` lines 353-357 (TS-ADS-001, TS-ADS-002), `docs/OPEN-PRODUCT-DECISIONS.md`  
**Evidence:** TS-ADS-001 and TS-ADS-002 are NEEDS DECISION referencing OPD-006. `OPEN-PRODUCT-DECISIONS.md` does not contain OPD-006.  
**Why It Matters:** Advertising decisions affect landing page design, monetization, and user experience. Cannot implement ads or decide against them without a decision.  
**Recommended Correction:** Create OPD-006 for advertising/sponsorship model, or explicitly decide against advertising.  
**Verification:** OPD-006 exists or advertising explicitly rejected.

### RISK-035: OPD-005 through OPD-014 not documented — 10 decisions unknown

**Severity:** High  
**Affected Component:** `docs/OPEN-PRODUCT-DECISIONS.md` line 252  
**Evidence:** Line 252 states "(Continue with remaining OPD-005 through OPD-014 unchanged...)" but these decisions are not visible in the document.  
**Why It Matters:** Agents cannot know what decisions are pending. Implementation may proceed with incorrect assumptions about unresolved business questions.  
**Recommended Correction:** Complete OPD-005 through OPD-014 documentation with historical context, affected architecture, current assumptions, and decision status.  
**Verification:** All OPDs 001-015 documented.

---

## 8. Long-Term Maintenance Risks

### RISK-036: Referral/reward separation documented in 8 locations — divergence risk

**Severity:** Medium  
**Affected Component:** `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md` lines 664-675  
**Evidence:** The separation between primary and reward infrastructure is documented in 8 documents: PRIMARY-VS-REWARD-INFRASTRUCTURE.md, REFERRAL-QUOTA-ARCHITECTURE.md, REWARD-INFRASTRUCTURE.md, INTEGRATIONS.md, SECURITY-RULES.md, AGENTS.md, AGENT-CONTEXT.md, ENVIRONMENT-AND-COST-GUARDRAILS.md.  
**Why It Matters:** When the rule changes, all 8 documents must be updated. High risk of divergence where one document has the old rule and another has the new rule. Agents reading different documents could get contradictory guidance.  
**Recommended Correction:** Designate PRIMARY-VS-REWARD-INFRASTRUCTURE.md as canonical source. Other documents should reference it rather than restating rules. Add change rule requiring all documents to be updated together.  
**Verification:** Single canonical source for referral/reward separation; all references consistent.

### RISK-037: Multi-tenancy preparedness is aspirational, not architected

**Severity:** Low  
**Affected Component:** `docs/DECISIONS.md` (ADR-028)  
**Evidence:** ADR-028 states "The architecture must not block future multi-tenancy" but no tenant_id columns, row-level security patterns, or tenant-aware authorization are designed.  
**Why It Matters:** Adding multi-tenancy later (Phase 10) may require schema migrations and authorization refactor if tenant patterns are not considered early.  
**Recommended Correction:** Add `tenant_id` or `organization_id` to core tables (communities, courses) even if not enforced yet. Document the migration path to multi-tenancy.  
**Verification:** Schema design includes tenant-aware patterns without enforcing them.

### RISK-038: No design variant repository — design mandate cannot be verified

**Severity:** Low  
**Affected Component:** `AGENTS.md` (Design mandate), `docs/DESIGN-FIRST.md` line 26  
**Evidence:** Design mandate requires "multiple isolated variants" but no location for design artifacts is defined. No `docs/designs/` or similar directory exists.  
**Why It Matters:** Agents cannot demonstrate that multiple design variants were created and compared. The "do not accept the first generated interface" rule cannot be verified.  
**Recommended Correction:** Define a design artifacts directory (e.g., `docs/designs/` or `src/designs/`). Require variant comparison documentation before selecting a direction.  
**Verification:** Design variants exist in designated location; comparison document exists.

### RISK-039: Bun.lock and package-lock.json both present — package manager ambiguity

**Severity:** Medium  
**Affected Component:** `bun.lock`, `package-lock.json`, `playwright.config.ts`  
**Evidence:** Both lockfiles exist. `playwright.config.ts` references `bun run dev`. `package.json` does not specify a package manager.  
**Why It Matters:** Confusion about which lockfile is canonical can lead to dependency drift, inconsistent installs, and CI failures.  
**Recommended Correction:** Choose one package manager (bun, per playwright.config.ts and bunfig.toml). Remove package-lock.json or document why both are needed. Update CI contract to specify install command.  
**Verification:** `bun install` succeeds and produces consistent `bun.lock`. `package-lock.json` removed or documented.

### RISK-040: No code ownership or CODEOWNERS file — review process undefined

**Severity:** Low  
**Affected Component:** Root directory (no CODEOWNERS, no `.github/` directory)  
**Evidence:** No CODEOWNERS file exists. No GitHub configuration for pull request reviews.  
**Why It Matters:** Without code ownership definitions, it's unclear who should review which changes. PR review process is undefined.  
**Recommended Correction:** Create CODEOWNERS file defining review responsibilities for different areas (frontend, backend, docs, security). Configure required reviewers in GitHub.  
**Verification:** CODEOWNERS exists; PRs require appropriate reviewer approval.

---

## 9. Risk Heatmap

| Severity | Count | Finding IDs |
|---|---|---|
| Critical | 5 | RISK-001, RISK-002, RISK-003, RISK-004, RISK-005 |
| High | 11 | RISK-006, RISK-007, RISK-008, RISK-009, RISK-010, RISK-011, RISK-014, RISK-015, RISK-016, RISK-020, RISK-025, RISK-030, RISK-031, RISK-035 |
| Medium | 10 | RISK-012, RISK-013, RISK-017, RISK-018, RISK-019, RISK-021, RISK-022, RISK-026, RISK-027, RISK-028, RISK-029, RISK-033, RISK-034, RISK-036, RISK-039 |
| Low | 6 | RISK-023, RISK-024, RISK-032, RISK-037, RISK-038, RISK-040 |

**Total: 32 risks identified**

---

## 10. Risk Priority Order

1. **RISK-004** — No authentication/authorization/security implemented (blocks all backend work)
2. **RISK-005** — Pricing not finalized (blocks Phase 7 payments)
3. **RISK-001** — No application code exists (blocks everything)
4. **RISK-002** — Schema only in Markdown (blocks Phase 3 database work)
5. **RISK-003** — No CI/CD pipeline (blocks safe code integration)
6. **RISK-030** — Community interaction type undefined (blocks community data model)
7. **RISK-031** — Instant payouts undefined (blocks payment architecture)
8. **RISK-006** — No rate limiting (security exposure from day one)
9. **RISK-007** — No webhook verification (financial fraud risk)
10. **RISK-010** — No object-level authorization (IDOR vulnerability)

---

## 11. Conclusion

**The project has 32 identified architectural risks, 5 of which are Critical.** The documentation is excellent but implementation has not begun. The most significant risks are:

1. **No code exists** — the project is entirely documentation
2. **No security implementation** — auth, RLS, rate limiting, webhook verification all unimplemented
3. **No CI/CD** — despite being marked as BUILT in the feature matrix
4. **Pricing unresolved** — Phase 7 payments cannot proceed
5. **Schema drift risk** — database design exists only as Markdown snippets

The project is **not ready for implementation** without addressing these critical risks. The foundation is solid; the risks are largely about the gap between documentation and implementation, not about fundamental architectural flaws.

**Most risks are correctable** with focused effort on creating implementation artifacts, resolving open decisions, and establishing CI/CD and security baselines.

---

**Audited by:** Independent Principal Software Architect  
**Method:** Document analysis, requirements traceability, security pattern review, infrastructure risk assessment  
**Files modified:** None