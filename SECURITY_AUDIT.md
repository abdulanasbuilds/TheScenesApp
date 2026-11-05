# The Scenes — Security Audit Report

**Audit Type:** Independent Senior Security Engineer Review  
**Status:** Read-only assessment — no files modified  
**Date:** November 2026  
**Scope:** `docs/SECURITY-RULES.md`, `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md`, `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md`, `docs/REFERRAL-QUOTA-ARCHITECTURE.md`, `docs/REWARD-INFRASTRUCTURE.md`, `docs/INTEGRATIONS.md`, `AGENTS.md`, `PRODUCT-REQUIREMENTS.md` (TS-SEC section), `DECISIONS.md` (ADR-017), `package.json`, `vite.config.ts`  
**Confidence:** High — based on direct reading of all security-related documents

---

## 1. Executive Summary

**The Scenes has strong security documentation but zero security implementation.**

The security posture is well-documented at the policy and requirements level. `docs/SECURITY-RULES.md` establishes a comprehensive baseline. `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` defines secret management, cost guardrails, and abuse prevention. `ADR-017` explicitly prohibits storing raw secrets in database JSON columns. The `PRIMARY-VS-REWARD-INFRASTRUCTURE.md` document establishes a critical financial safety boundary.

**However:** No authentication code exists, no RLS policies are written, no rate limiting is implemented, no webhook verification exists, no secret scanning is configured, and no security testing has been performed. The project is in Phase 0 — security implementation begins in Phase 3.

**Overall security readiness: NOT READY for production.** The documentation provides a solid foundation, but implementation gaps are significant.

---

## 2. Security Requirements Coverage (TS-SEC)

| ID | Requirement | Classification | Phase | Documented? | Implemented? |
|---|---|---|---|---|---|
| TS-SEC-001 | Authenticated access | CORE LATER | 3 | Yes (Supabase Auth direction) | No |
| TS-SEC-002 | Object-level authorization | CORE LATER | 3 | Yes | No |
| TS-SEC-003 | Protected private files | CORE LATER | 4 | Yes (signed URLs) | No |
| TS-SEC-004 | Signed/controlled access URLs | CORE LATER | 4 | Yes | No |
| TS-SEC-005 | Creator/member permissions | CORE LATER | 3 | Yes | No |
| TS-SEC-006 | RLS/database policies | CORE LATER | 3 | Yes | No |
| TS-SEC-007 | Rate limiting | CORE LATER | 4 | Yes (Redis) | No |
| TS-SEC-008 | Webhook verification | CORE LATER | 7 | Yes | No |
| TS-SEC-009 | Audit logging | CORE LATER | 3 | Yes | No |
| TS-SEC-010 | Input validation | CORE LATER | 3 | Yes (Zod in deps) | No |
| TS-SEC-011 | Secure secret management | CORE LATER | 3 | Yes (ADR-017) | No |

**Assessment:** All 11 security requirements are documented but none are implemented. Zod (`^4.4.3`) is in `package.json` for input validation, which is good.

---

## 3. Security Findings

### SEC-001: No production authentication implemented

**Severity:** Critical  
**Affected:** `src/features/auth/` (does not exist), `src/server/api/auth.ts` (does not exist)  
**Evidence:** Phase 0 has no auth code. `TS-AUTH-001` through `TS-AUTH-010` are all CORE LATER, Phase 3.  
**Why it matters:** Without authentication, there is no identity boundary, no session management, no role-based access, and no object-level authorization. The entire security model is unimplemented.  
**Recommended correction:** Implement Supabase Auth in Phase 3 with server-side session validation, role-based access control, and object-level authorization. Do not use client-only authorization.  
**Verification:** Auth routes return 401 for unauthenticated requests; protected routes require valid session; role enforcement prevents unauthorized access.

### SEC-002: No Row-Level Security (RLS) policies defined

**Severity:** Critical  
**Affected:** `docs/SECURITY-RULES.md` (Section: Backend baseline), `TS-SEC-006`  
**Evidence:** Security rules mention RLS but no actual SQL policies exist. No `src/server/db/schema.ts` with RLS definitions.  
**Why it matters:** Without RLS, any authenticated user with the Supabase anon key could potentially read or modify any row in the database. Object-level authorization cannot be enforced at the data layer.  
**Recommended correction:** Write RLS policies for all tables before Phase 3 backend integration. Policies must enforce: users can only access their own profiles, creators own their courses/content, admins have explicit override, public data is readable by all.  
**Verification:** Attempt cross-user data access via Supabase client; verify RLS blocks unauthorized queries.

### SEC-003: No rate limiting implemented

**Severity:** High  
**Affected:** `src/server/middleware/rate-limit.ts` (does not exist), `TS-SEC-007`, `ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Evidence:** Rate limiting is documented (Redis-compatible, Phase 4) but no middleware, no rate limit configuration, no implementation exists.  
**Why it matters:** Without rate limiting, the API is vulnerable to brute-force attacks, spam, scraping, and abuse. Auth endpoints are especially vulnerable to credential stuffing.  
**Recommended correction:** Implement rate limiting middleware for auth endpoints (5 attempts/15 min), API endpoints (100 requests/hour per user), email send limits, and referral link generation limits. Use Redis or Cloudflare Workers rate limiting.  
**Verification:** Exceed rate limit; verify HTTP 429 response; verify legitimate requests still succeed within limits.

### SEC-004: No webhook verification or idempotency

**Severity:** High  
**Affected:** `src/server/api/` (does not exist), `TS-SEC-008`, `TS-PAY-008`  
**Evidence:** Webhook verification is documented as required (SECURITY-RULES.md, BUILD-CONTRACT.md) but no implementation exists. Payments are Phase 7+, so this is not yet blocking.  
**Why it matters:** Without webhook signature verification, attackers can forge payment, referral, or other webhook events. Without idempotency, duplicate webhook delivery can cause double-crediting, double-charging, or duplicate state changes.  
**Recommended correction:** Implement webhook signature verification for all provider webhooks (Resend, payment processor, video provider). Use idempotency keys for all webhook-handled events.  
**Verification:** Send forged webhook; verify rejection. Send duplicate webhook; verify idempotent handling (no duplicate side effects).

### SEC-005: No secret scanning in CI

**Severity:** High  
**Affected:** `.github/workflows/` (does not exist), `CI-CONTRACT.md` (Section: Security-stage rule)  
**Evidence:** CI contract mentions secret scanning as a future requirement once backend integrations begin, but no workflow exists at all.  
**Why it matters:** Without automated secret scanning, developers could accidentally commit API keys, service tokens, or webhook secrets to the repository.  
**Recommended correction:** Add secret scanning (e.g., GitHub Secret Scanning, gitleaks, or trufflehog) to CI pipeline. Add pre-commit hook for local secret scanning.  
**Verification:** Commit a test secret; verify CI fails. Confirm no secrets in git history.

### SEC-006: No Content Security Policy (CSP) headers configured

**Severity:** Medium  
**Affected:** `vite.config.ts`, `src/app/routes/__root.tsx` (does not exist)  
**Evidence:** `vite.config.ts` does not configure CSP headers. No security headers middleware is documented.  
**Why it matters:** Without CSP, the application is more vulnerable to XSS attacks, especially since it will render user-generated content (community posts, comments, course content).  
**Recommended correction:** Configure CSP headers via Cloudflare Pages `_headers` file or middleware. Restrict script sources, style sources, and connect sources.  
**Verification:** Check response headers for CSP; verify inline scripts are blocked; verify external resources are from approved domains only.

### SEC-007: No input validation schemas defined

**Severity:** Medium  
**Affected:** `src/lib/validation/` (does not exist), `TS-SEC-010`  
**Evidence:** Zod is a dependency (`^4.4.3`) but no validation schemas exist. `src/lib/validation/schemas.ts` is listed in `FOLDER-STRUCTURE.md` but not created.  
**Why it matters:** Without server-side input validation, the API is vulnerable to injection attacks, malformed data, and bypass of client-side validation.  
**Recommended correction:** Define Zod schemas for all API request bodies, query parameters, and form submissions. Validate on the server, not just the client.  
**Verification:** Submit invalid data; verify server rejects with 400. Submit SQL injection payloads; verify parameterized queries prevent injection.

### SEC-008: Private file access control not implemented

**Severity:** Medium  
**Affected:** `src/services/storage/` (does not exist), `TS-SEC-003`, `TS-SEC-004`  
**Evidence:** Signed URL access is documented but no R2 adapter, no signed URL generation, no private object access control exists.  
**Why it matters:** Without controlled access, private course resources, creator files, and user uploads could be accessed by unauthorized users via direct object URLs.  
**Recommended correction:** Implement signed URL generation for private objects. Validate ownership server-side before generating signed URLs. Never trust client ownership claims.  
**Verification:** Attempt to access private file without authorization; verify rejection. Verify signed URLs expire after configured time.

### SEC-009: No audit logging implemented

**Severity:** Medium  
**Affected:** `src/server/` (does not exist), `TS-SEC-009`  
**Evidence:** Audit logging is required by SECURITY-RULES.md but no implementation exists.  
**Why it matters:** Without audit logs, security incidents cannot be investigated. Referral reward reversals, payout changes, and admin actions are not traceable.  
**Recommended correction:** Implement audit logging for: authentication events, authorization changes, financial transactions, referral state changes, content moderation actions, admin operations.  
**Verification:** Perform security-relevant action; verify audit log entry created with user, action, timestamp, and result.

### SEC-010: Telegram bot token exposure risk

**Severity:** Medium  
**Affected:** `docs/INTEGRATIONS.md` (Section: Telegram), `OPEN-PRODUCT-DECISIONS.md` (RES-001)  
**Evidence:** Telegram is designated for internal feedback/operational alerts. RES-001 resolved that Telegram is for a feedback system with a dedicated bot. No bot token management is documented beyond "Never expose bot tokens to the client."  
**Why it matters:** If a Telegram bot token is exposed, attackers could send spam, phishing messages, or impersonate the feedback channel. User feedback data could be intercepted.  
**Recommended correction:** Store Telegram bot token in approved secret storage only. Use server-side proxy for all Telegram API calls. Never expose token to client. Log all Telegram API usage.  
**Verification:** Confirm bot token is not in any committed file. Verify Telegram API calls are server-side only.

### SEC-011: Reward infrastructure separation is documented but unverified

**Severity:** Medium  
**Affected:** `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md`, `docs/REFERRAL-QUOTA-ARCHITECTURE.md`  
**Evidence:** The separation between primary and reward infrastructure is thoroughly documented with SQL schemas and TypeScript code examples. No implementation exists to verify.  
**Why it matters:** If the separation is not correctly implemented, referral rewards could fall back to paid primary infrastructure, causing unexpected bills.  
**Recommended correction:** Implement the reward infrastructure with separate provider registries, separate secrets, separate usage tracking, and the ZERO_COST_MODE enforcement. Add billing safety checks before any reward operation.  
**Verification:** Confirm reward provider registry has `cost_model='ZERO_COST'` constraint. Confirm `allow_primary_fallback=false`. Confirm no code path falls back from reward to primary.

### SEC-012: No CORS configuration documented

**Severity:** Low  
**Affected:** `vite.config.ts`, `docs/INTEGRATIONS.md`  
**Evidence:** No CORS configuration is documented. TanStack Start with Nitro handles CORS but no explicit policy is defined.  
**Why it matters:** Overly permissive CORS could allow malicious sites to make authenticated requests. Overly restrictive CORS could break legitimate integrations.  
**Recommended correction:** Define CORS policy for allowed origins. Restrict to application domains only.  
**Verification:** Test CORS preflight from unauthorized origin; verify rejection.

### SEC-013: Minors and safeguarding review not completed

**Severity:** Low  
**Affected:** `docs/SECURITY-RULES.md` (Section: Minors and safeguarding), `docs/OPEN-PRODUCT-DECISIONS.md`  
**Evidence:** Security rules state that features involving minors require specific legal and operational review before public enablement, particularly direct messaging, public profiles, instructor interaction, live sessions, and payments. No review has been documented.  
**Why it matters:** If the platform is used by minors, direct messaging and public profiles could create safeguarding risks. Legal compliance (COPPA, GDPR-K, local African laws) may be required.  
**Recommended correction:** Complete legal review before enabling DM, public profiles, or live sessions. Implement age verification or parental consent where required.  
**Verification:** Documented legal review exists before Phase 5 (DM) and Phase 6 (live sessions).

---

## 4. Security Strengths

1. **Clear security baseline** — `SECURITY-RULES.md` is comprehensive and actionable.
2. **No hardcoded secrets** — Explicitly prohibited in AGENTS.md and SECURITY-RULES.md.
3. **Secret storage prohibition** — ADR-017 prohibits `api_credentials JSONB` — a common anti-pattern.
4. **Server-side authorization mandated** — BUILD-CONTRACT.md explicitly states frontend visibility is never the real authorization boundary.
5. **Referral/reward financial boundary** — PRIMARY-vs-REWARD separation prevents runaway costs from reward exhaustion.
6. **Zero-cost default** — ENVIRONMENT-AND-COST-GUARDRAILS.md defaults to zero-cost operation.
7. **Webhook verification required** — Documented as a security requirement for Phase 7.
8. **Input validation dependency** — Zod is included in package.json.

---

## 5. Security Weaknesses

1. **Zero security implementation** — No auth, RLS, rate limiting, webhook verification, or audit logging exists.
2. **No CI/CD or secret scanning** — Pipeline not configured; accidental secret commits possible.
3. **No CSP headers** — XSS attack surface not mitigated at the header level.
4. **No API contracts** — Input validation schemas not yet defined despite Zod dependency.
5. **No CORS policy** — Cross-origin request policy undefined.
6. **No safeguarding review** — Minors protection not yet addressed despite DM and live sessions in roadmap.
7. **Telegram token management undefined** — No documented process for bot token rotation or storage.

---

## 6. Conclusion

The security documentation is **excellent** — thorough, specific, and actionable. The security requirements are clearly defined with phase assignments. The security culture (no hardcoded secrets, server-side authorization, zero-cost defaults, reward/primary separation) is well-established.

**However, the project has zero security implementation.** All 11 TS-SEC requirements are unimplemented. CI/CD is not configured. No secret scanning exists. No RLS policies are written.

The project is **NOT ready for production** from a security perspective. It is also not ready for Phase 3 (backend foundation) until the security requirements are translated into implementation tasks.

**Recommendation:** Before Phase 3, create a security implementation checklist derived from SECURITY-RULES.md and TS-SEC requirements. Implement auth, RLS, rate limiting, and input validation as the first backend deliverables.

---

**Audited by:** Independent Senior Security Engineer  
**Method:** Document review, dependency inspection, configuration analysis  
**Files modified:** None