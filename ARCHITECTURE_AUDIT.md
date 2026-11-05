# The Scenes — Architecture Audit Report

**Audit Type:** Independent Principal Software Architecture Review  
**Status:** Read-only assessment — no files modified  
**Date:** November 2026  
**Scope:** All documentation under `docs/`, `AGENTS.md`, `package.json`, `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, and repository structure  
**Confidence:** High — based on direct reading of all project documents

---

## 1. Executive Summary

**The Scenes is NOT ready for implementation.**

The project is in Phase 0 — Governance + project foundation — per `docs/PHASES.md`. It has an exceptionally thorough documentation foundation, a clearly defined technology stack, and well-reasoned architecture decision records (ADRs). However, there is **no application source code** under `src/` (the directory does not exist), no database schema, no migrations, no API routes, and no backend implementation. The project is documentation-first, which is consistent with its stated "design-first / frontend-first" mandate.

**Key finding:** The architecture documentation is internally consistent, well-reasoned, and technically sound for a Phase 0 design phase. The critical question is whether the stated design discipline will hold as the project moves to implementation. The documentation contains several contradictions, unresolved decisions, and assumptions that must be closed before Phase 1 design exploration can begin.

---

## 2. Technology Stack Verification

| Layer | Documented Choice | Verified in package.json? | Status |
|---|---|---|---|
| Framework | TanStack Start + React | Yes (`@tanstack/react-start`, `react`) | Verified |
| Router | TanStack Router | Yes (`@tanstack/react-router`) | Verified |
| Styling | Tailwind CSS | Yes (`tailwindcss`, `@tailwindcss/vite`) | Verified |
| Components | Radix/shadcn-style primitives | Yes (`@radix-ui/*`) | Verified |
| Language | TypeScript | Yes (`typescript`, `@types/*`) | Verified |
| Build tool | Vite | Yes (`vite`) | Verified |
| Runtime | Bun (lockfile present) | `bun.lock` present, but `package-lock.json` also present | Mixed signals — see Finding ARCH-005 |
| Auth | Supabase | Not yet implemented (Phase 3+) | Direction only |
| Database | Supabase Postgres | Not yet implemented | Direction only |
| Storage | Cloudflare R2 | Not yet implemented | Direction only |
| Email | Resend | Not yet implemented | Direction only |
| Rate limiting | Redis-compatible | Not yet implemented | Direction only |
| Video/Live | Bunny.net / LiveKit / Daily / Agora | Not yet implemented | Direction only |
| Payments | TBD (HOLD) | Not implemented | Deferred |
| Search | Postgres first | Not implemented | Deferred |
| Testing | Playwright E2E | Yes (`@playwright/test`) | Verified |

**Observation:** The frontend stack is modern, appropriate, and internally consistent. The backend stack choices (Supabase, R2, Resend) are reasonable for the documented scale and cost-conscious posture.

---

## 3. Architecture Evaluation

### 3.1 Separation of Concerns — GOOD

The architecture enforces clear layering:

```
UI / domain → internal service → provider adapter → external provider
```

This is documented in `docs/BUILD-CONTRACT.md` and `docs/FOLDER-STRUCTURE.md`. The `services/` layer isolates vendor SDKs from business logic. The `features/` layer contains domain logic without UI components. The `server/` directory is protected by TanStack Start's import protection (`server-only`).

**Assessment:** This is a sound, maintainable architecture that avoids vendor lock-in and keeps concerns separated.

### 3.2 Modularity and Dependency Boundaries — GOOD

The `FOLDER-STRUCTURE.md` defines explicit import rules:

- `app/` → `components/`, `features/`, `services/`, `lib/`, `types/`, `fixtures/`, `styles/` ✓
- `components/` → `lib/`, `types/`, `ui/` ✓
- `features/` → `services/`, `lib/`, `types/` ✓
- `services/` → `lib/`, `types/` ✓ (services do not import features or components) ✓
- `lib/` → nothing (pure utilities) ✓
- `types/` → nothing ✓
- Client code → `server/` — FORBIDDEN ✓

**Assessment:** These boundaries are well-defined and enforceable. The monorepo-style single-package structure is appropriate for the current scale.

### 3.3 Database Structure and Data Integrity — PARTIAL / NOT YET IMPLEMENTED

**Status:** No database schema exists in the working tree. The documentation describes planned tables in `docs/REFERRAL-QUOTA-ARCHITECTURE.md` and `docs/REWARD-INFRASTRUCTURE.md`, but these are not yet migrations.

**Assessment:** The documented data model shows good relational design:
- UUID primary keys with `gen_random_uuid()`
- Foreign key constraints to `users(id)`
- CHECK constraints on status enums
- UNIQUE constraints where appropriate (e.g., `UNIQUE(referrer_id, referred_user_id)`)
- Idempotency keys via `event_key` UNIQUE constraints
- `period_key` patterns for usage tracking

However, there is **no actual schema file** (no `src/server/db/schema.ts`, no migrations directory). The schema exists only as SQL snippets inside Markdown documentation. This is acceptable for Phase 0 but must be converted to executable migrations before Phase 3.

### 3.4 Authentication and Authorization — NOT YET IMPLEMENTED

**Status:** Deferred to Phase 3. Supabase Auth is the documented direction.

**Assessment:**
- `TS-SEC-001` through `TS-SEC-011` define security requirements clearly.
- Role-based access (learner, creator, admin) is `TS-AUTH-008`, Phase 3.
- Object-level authorization is `TS-SEC-002`, Phase 3.
- RLS/database policies are `TS-SEC-006`, Phase 3.

No auth code exists yet. The security baseline in `docs/SECURITY-RULES.md` is comprehensive but untested in code.

### 3.5 API Design and Contracts — NOT YET IMPLEMENTED

**Status:** No API routes exist. TanStack Start server routes are planned under `src/server/api/` per `FOLDER-STRUCTURE.md`.

**Assessment:** The adapter pattern (provider-agnostic interface → implementation → mock) is sound. API contracts are not yet defined in OpenAPI or similar specification format. This is a gap for Phase 3+.

### 3.6 Error Handling and Resilience — PARTIAL

**Frontend:** `TS-OPS-001` through `TS-OPS-003` define error/loading/empty states as CORE NOW design requirements. These are UI-level concerns for Phase 2.

**Backend:** No server-side error handling exists yet. The documentation mentions:
- Webhook verification and idempotency (SECURITY-RULES.md)
- Rate limiting (ENVIRONMENT-AND-COST-GUARDRAILS.md)
- Graceful failure when reward capacity is exhausted (REFERRAL-QUOTA-ARCHITECTURE.md)

**Assessment:** Error handling is well-documented at the requirements level but not yet implemented. The "fail safely when capacity exhausted" pattern for rewards is particularly good.

### 3.7 Security and Privacy — DOCUMENTED, NOT IMPLEMENTED

**Strengths:**
- `docs/SECURITY-RULES.md` is comprehensive
- No hardcoded secrets rule is explicit
- Server-side authorization mandated before backend work
- Object-level authorization required
- Webhook signature verification required
- Audit logging required
- ADR-017 prohibits storing raw secrets in `api_credentials JSONB`

**Gaps:**
- No actual security implementation exists yet
- No CSP headers configured
- No rate limiting implementation
- No RLS policies written
- No secret scanning in CI (mentioned as future requirement in CI-CONTRACT.md)

### 3.8 Scalability and Performance — REASONABLE ASSUMPTIONS

The architecture is designed for modest scale initially:
- Cloudflare hosting/edge for global CDN
- Supabase for auth/database (scales to Pro tier)
- R2 for object storage (cost-effective, free tier available)
- Postgres full-text search first, dedicated search later

**Assessment:** The "start simple, scale when evidence justifies" approach (ADR-011) is correct for this stage. No overengineering is evident.

### 3.9 Deployment and Infrastructure — PARTIAL

**Configuration:**
- `vite.config.ts` configured for TanStack Start with Nitro Cloudflare module preset
- Server port 5000, host 0.0.0.0
- Playwright configured for desktop + mobile (Pixel 7)
- ESLint and Prettier configured

**Gaps:**
- No CI/CD workflow file visible in `.github/` (referenced in docs but not verified)
- No environment variable templates (`.env.example`)
- No Docker configuration
- No deployment documentation beyond `INTEGRATIONS.md` mentions

### 3.10 Maintainability and Developer Experience — GOOD

- Universal agent contract (`AGENTS.md`) ensures all agents follow the same rules
- Bootstrap context (`AGENT-CONTEXT.md`) provides reusable task context
- Agent roles defined (`AGENT-ROLES.md`)
- Prompt template (`AGENT-PROMPT-TEMPLATE.md`) standardizes task prompts
- Build contract (`BUILD-CONTRACT.md`) defines verification requirements
- CI contract (`CI-CONTRACT.md`) defines pipeline requirements

**Assessment:** Excellent developer experience governance for an AI-assisted project. This is a strength.

### 3.11 Testing and Observability — PARTIAL

**Testing:**
- Playwright E2E configured with desktop + mobile projects
- Testing strategy documented in `TESTING-AND-QUALITY.md`
- Vitest planned for Phase 3+

**Observability:**
- `TS-OPS-006` (observability/monitoring) is Phase 3+, CORE LATER
- `TS-OPS-007` (backup/recovery) is Phase 3+, CORE LATER
- Cost guardrails and alert thresholds documented in `ENVIRONMENT-AND-COST-GUARDRAILS.md`

**Assessment:** Testing strategy is solid for Phase 2. Observability is deferred appropriately.

---

## 4. Architecture Findings

### ARCH-001: No application source code exists

**Severity:** Critical  
**Affected:** `src/` directory (does not exist)  
**Evidence:** Glob for `src/**/*` returned no files. `tsconfig.json` includes `src/**/*.ts` and `src/**/*.tsx` patterns, but the directory is empty/non-existent.  
**Why it matters:** The project cannot build, run, or be tested. All implementation is deferred to future phases.  
**Recommended correction:** This is expected for Phase 0. No correction needed now, but Phase 1 (design) must produce actual design artifacts before Phase 2 can begin.  
**Verification:** Confirm `src/` exists with route files after Phase 2.

### ARCH-002: Database schema exists only as Markdown snippets

**Severity:** High  
**Affected:** `docs/REFERRAL-QUOTA-ARCHITECTURE.md`, `docs/REWARD-INFRASTRUCTURE.md`  
**Evidence:** SQL `CREATE TABLE` statements appear inside Markdown code blocks, not as executable migration files. No `src/server/db/schema.ts` or `src/server/db/migrations/` directory exists.  
**Why it matters:** When Phase 3 begins, someone must manually transcribe these schemas into migration files, risking transcription errors and drift between documentation and implementation.  
**Recommended correction:** Create migration files (e.g., using Supabase CLI or Drizzle Kit) that match the documented schemas. Keep documentation and migrations in sync via the change rule in `docs/README.md` line 128-130.  
**Verification:** Run migration against test Supabase instance; verify tables match documented definitions.

### ARCH-003: Mixed lockfile signals (bun.lock AND package-lock.json)

**Severity:** Medium  
**Affected:** `bun.lock`, `package-lock.json`  
**Evidence:** Both `bun.lock` and `package-lock.json` exist in the root. `playwright.config.ts` references `bun run dev`. `package.json` does not specify a package manager.  
**Why it matters:** Confusion about which lockfile is canonical can lead to dependency drift, inconsistent installs, and CI failures.  
**Recommended correction:** Choose one package manager (bun, per `playwright.config.ts` and `bunfig.toml`). Remove `package-lock.json` or document why both are needed. Update CI contract to specify the install command.  
**Verification:** `bun install` succeeds and produces a consistent `bun.lock`.

### ARCH-004: No OpenAPI or API contract specification exists

**Severity:** Medium  
**Affected:** `docs/`, `src/server/api/` (does not exist)  
**Evidence:** No OpenAPI/Swagger file, no API contract document, no route definitions. API contracts are implied through adapter interfaces only.  
**Why it matters:** Frontend and backend teams (or agents) cannot work in parallel without a shared API contract. Integration testing is harder without explicit request/response schemas.  
**Recommended correction:** Add OpenAPI specs or Zod-based shared schemas for all API routes before Phase 3 implementation.  
**Verification:** API routes validate against shared schemas; frontend and backend use the same type definitions.

### ARCH-005: No CI/CD workflow file visible

**Severity:** Medium  
**Affected:** `.github/workflows/` (referenced in `FOLDER-STRUCTURE.md` line 20, `CI-CONTRACT.md`)  
**Evidence:** No `.github/workflows/` directory found in the repository root. `CI-CONTRACT.md` describes required checks but no workflow implements them.  
**Why it matters:** CI checks (lint, typecheck, build, contract integrity) cannot run automatically. The "CI already configured" status in `FEATURE-MATRIX.md` (TS-OPS-005, marked BUILT) is inaccurate.  
**Recommended correction:** Create GitHub Actions workflow implementing the CI contract checks. Update `FEATURE-MATRIX.md` status for TS-OPS-005 from BUILT to NOT STARTED or IN PROGRESS.  
**Verification:** Workflow runs on push/PR; all checks pass.

### ARCH-006: No environment variable template or secret management setup

**Severity:** Medium  
**Affected:** Root directory (no `.env.example`), `ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Evidence:** No `.env.example` file exists. Secret management is documented but no template shows developers what variables are needed.  
**Why it matters:** New developers cannot easily set up local development. Risk of missing required environment variables.  
**Recommended correction:** Create `.env.example` with all required variables (marked as required/optional). Document which are needed per phase.  
**Verification:** `bun run dev` starts successfully with `.env.local` populated from template.

### ARCH-007: No Docker or containerization configuration

**Severity:** Low  
**Affected:** Root directory (no `Dockerfile`, `docker-compose.yml`)  
**Evidence:** No containerization files exist.  
**Why it matters:** Local development environment consistency is harder to guarantee. Production deployment options are limited to Cloudflare Pages/Nitro.  
**Recommended correction:** Optional — add Dockerfile for local development consistency if team requires it. Not blocking for Phase 0-2.  
**Verification:** `docker build` succeeds if Dockerfile added.

### ARCH-008: Multi-tenancy preparedness is aspirational, not architected

**Severity:** Low  
**Affected:** `ADR-028`, `docs/DECISIONS.md`  
**Evidence:** ADR-028 states "The architecture must not block future multi-tenancy" but no tenant_id columns, row-level security patterns, or tenant-aware authorization are designed yet.  
**Why it matters:** Adding multi-tenancy later may require schema migrations and authorization refactor if not considered early.  
**Recommended correction:** Add `tenant_id` or `organization_id` to core tables where it makes sense (communities, courses) even if not enforced yet. Document the migration path.  
**Verification:** Schema design includes tenant-aware patterns without enforcing them.

---

## 5. Strengths of the Architecture

1. **Provider abstraction pattern** — External services behind internal adapters prevents vendor lock-in (ADR-006).
2. **Phase-gated implementation** — Clear boundaries between phases prevent premature backend complexity (ADR-005, PHASES.md).
3. **Referral/reward infrastructure separation** — Primary vs reward infrastructure is a strong financial safety boundary (PRIMARY-VS-REWARD-INFRASTRUCTURE.md).
4. **Documentation-driven governance** — Universal agent contract, bootstrap context, agent roles, and prompt templates create consistency across AI-assisted development.
5. **Cost-conscious design** — Zero-cost mode default, guardrails, and separate primary/reward tracking (ENVIRONMENT-AND-COST-GUARDRAILS.md).
6. **Mobile-first** — Explicitly stated as a primary design target with Playwright mobile project configured.
7. **Frontend-first** — Design validated before backend integration reduces rework risk.

---

## 6. Weaknesses of the Architecture

1. **No implementation yet** — Everything is documentation; no code to review for actual architectural correctness.
2. **Schema drift risk** — Database design exists only in Markdown, not as executable migrations.
3. **No API contracts** — Frontend and backend cannot be developed in parallel without shared specifications.
4. **Missing CI/CD** — Contract described but not implemented.
5. **No secret template** — Developer onboarding friction and risk of missing env vars.
6. **Unresolved product decisions** — OPD-001 through OPD-015 remain open, blocking some requirements from being implemented.
7. **Pricing not finalized** — OPD-015 blocks Phase 7; margin formula is documented but costs are not researched.

---

## 7. Conclusion

The architecture documentation is **high quality, internally consistent, and technically sound** for a Phase 0 design phase. The project is not overengineered. The technology choices are appropriate for the stated goals (African-first, mobile-first, cost-conscious, provider-flexible).

**However, the project is NOT ready for implementation.** There is zero application code. The database schema exists only as Markdown snippets. CI/CD is described but not configured. Several critical product decisions remain unresolved.

The architecture is ready to move to Phase 1 (design exploration) once the open product decisions are addressed or explicitly deferred. The foundation is solid; the implementation has not begun.

---

**Audited by:** Independent Principal Software Architect  
**Method:** Document review, configuration inspection, dependency verification  
**Files modified:** None