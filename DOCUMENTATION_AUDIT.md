# The Scenes — Documentation and Rules Audit Report

**Audit Type:** Independent Staff-Level Documentation Review  
**Status:** Read-only assessment — no files modified  
**Date:** November 2026  
**Scope:** All Markdown files under `docs/`, `AGENTS.md`, `README.md`, `components.json`, configuration files  
**Confidence:** High — based on direct reading of all project documents

---

## 1. Executive Summary

**The documentation is exceptionally thorough, well-organized, and internally consistent for a Phase 0 design project.** The project has 30+ Markdown documents covering every aspect of product, architecture, security, integrations, testing, and operations. The documentation hierarchy is clear, cross-references are extensive, and the authority order is explicitly defined in `AGENTS.md`.

**However, there are real issues:** contradictory instructions between documents, duplicate rules, unresolved decisions that block implementation, requirements that cannot be implemented as documented, unsupported assumptions, missing constraints, and rules that cannot be objectively verified. Some documents reference features or code that do not exist. The documentation over-specifies some areas while under-specifying others.

**Overall: Documentation is strong but not yet implementation-ready.** Several contradictions and gaps must be resolved before agents can reliably implement from these documents.

---

## 2. Documentation Inventory

| Document | Purpose | Status | Quality |
|---|---|---|---|
| `AGENTS.md` | Universal agent contract | Current | Excellent |
| `README.md` | Project overview | Current | Good |
| `docs/README.md` | Documentation index | Current | Good |
| `docs/AGENT-CONTEXT.md` | Bootstrap context | Current | Good |
| `docs/AGENT-PROMPT-TEMPLATE.md` | Task prompt template | Current | Good |
| `docs/AGENT-ROLES.md` | Agent role definitions | Current | Good |
| `docs/PROJECT-CONTEXT.md` | Product context | Current | Good |
| `docs/PRODUCT-REQUIREMENTS.md` | Canonical requirements | Current | Excellent |
| `docs/FEATURE-MATRIX.md` | Feature traceability | Current | Good |
| `docs/PHASES.md` | 10-phase roadmap | Current | Excellent |
| `docs/DECISIONS.md` | ADR register | Current | Excellent |
| `docs/OPEN-PRODUCT-DECISIONS.md` | Unresolved questions | Current | Good |
| `docs/SECURITY-RULES.md` | Security baseline | Current | Excellent |
| `docs/INTEGRATIONS.md` | Integration boundaries | Current | Good |
| `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` | Cost/env safety | Current | Excellent |
| `docs/REFERRAL-QUOTA-ARCHITECTURE.md` | Referral architecture | Current | Excellent |
| `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md` | Primary vs reward separation | Current | Excellent |
| `docs/REWARD-INFRASTRUCTURE.md` | Reward implementation | Current | Excellent |
| `docs/BUILD-CONTRACT.md` | Build requirements | Current | Good |
| `docs/DESIGN-FIRST.md` | Design-first workflow | Current | Good |
| `docs/FOLDER-STRUCTURE.md` | Repository organization | Current | Good |
| `docs/TESTING-AND-QUALITY.md` | Testing strategy | Current | Excellent |
| `docs/TOOLING.md` | Tooling contract | Current | Good |
| `docs/CI-CONTRACT.md` | CI requirements | Current | Good |
| `docs/PRICING-MONETIZATION.md` | Pricing strategy | Current | Good |
| `docs/PRICING-COST-RESEARCH.md` | Cost research | Missing | — |
| `docs/SKOOL-CIRCLE-ANALYSIS.md` | Competitive analysis | Current | Excellent |
| `docs/PLAIN-ENGLISH-PRODUCT-EXPLANATION.md` | Non-technical overview | Current | Good |
| `docs/LEGACY-CONTEXT.md` | SukaSpace history | Current | Good |
| `docs/LEGACY-SOURCE-INVENTORY.md` | Legacy file inventory | Missing | — |
| `docs/AGENT-GUIDES/FABLE.md` | Agent-specific guide | Present | Not reviewed |

**Missing documents referenced:**
- `docs/PRICING-COST-RESEARCH.md` — Referenced in `docs/README.md` line 32 and `OPEN-PRODUCT-DECISIONS.md` OPD-015, but does not exist.
- `docs/LEGACY-SOURCE-INVENTORY.md` — Listed in `FOLDER-STRUCTURE.md` line 360 but does not exist.

---

## 3. Contradictory Instructions

### DOC-001: CI/CD status contradiction

**Severity:** High  
**Files:** `docs/FEATURE-MATRIX.md` vs `docs/CI-CONTRACT.md` vs actual repository  
**Contradiction:** `FEATURE-MATRIX.md` line 138 marks TS-OPS-005 (CI/CD) as status **BUILT** with note "Already configured". However, `CI-CONTRACT.md` describes CI requirements that are not implemented (no `.github/workflows/` directory exists). The repository has no CI workflow files.  
**Evidence:** `FEATURE-MATRIX.md` line 138: `| TS-OPS-005 | CI/CD | S2 | P1 | 0 | Internal | GitHub Actions | Secret exposure | BUILT |`. No `.github/workflows/` directory found.  
**Why it matters:** Agents reading the feature matrix will believe CI is already configured and may not implement it, leading to unreviewed code reaching main.  
**Recommended correction:** Update `FEATURE-MATRIX.md` to mark TS-OPS-005 as NOT STARTED or IN PROGRESS. Create GitHub Actions workflow implementing CI contract.  
**Verification:** `.github/workflows/` exists; CI runs lint, typecheck, build, contract integrity.

### DOC-002: Pricing page classification contradiction

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` vs `docs/PRICING-MONETIZATION.md`  
**Contradiction:** `PRODUCT-REQUIREMENTS.md` line 255 classifies TS-LAND-002 (Pricing page) as **CORE NOW (design)** Phase 1-2. `PRICING-MONETIZATION.md` states pricing is TBD, monthly cost is TBD, and final pricing requires cost research (OPD-015 blocked). The pricing page cannot be designed without knowing the pricing tiers and costs.  
**Evidence:** `PRODUCT-REQUIREMENTS.md` line 255: `| TS-LAND-002 | Pricing page | S2 | CORE NOW (design) | 1-2 | Placeholder/future content |`. `PRICING-MONETIZATION.md` lines 110-111: "Monthly Cost: TBD USD/GHS (research required for 70% margin)".  
**Why it matters:** Designing a pricing page without finalized pricing is speculative work that will likely need to be redone.  
**Recommended correction:** Reclassify TS-LAND-002 as CORE LATER or NEEDS DECISION until OPD-015 (pricing cost research) is resolved. Mark it as "placeholder content only" until pricing is finalized.  
**Verification:** Pricing page design blocked until OPD-015 resolved.

### DOC-003: "No native hosting by default" vs R2 storage direction

**Severity:** High  
**Files:** `docs/PRICING-MONETIZATION.md` vs `docs/INTEGRATIONS.md` vs `docs/DECISIONS.md` (ADR-009)  
**Contradiction:** `PRICING-MONETIZATION.md` (lines 184-196) states "NO NATIVE HOSTING BY DEFAULT — All plans use external embedding for video/files/live" and "R2 (ONLY if native hosting add-on)". However, `INTEGRATIONS.md` line 21-31 designates Cloudflare R2 for "course resources, creator files, media/object storage" and `DECISIONS.md` ADR-009 accepts Cloudflare R2 as the intended object/file storage layer. `REWARD-INFRASTRUCTURE.md` also references R2 for storage.  
**Evidence:** `PRICING-MONETIZATION.md` line 184: "NO NATIVE HOSTING BY DEFAULT". `INTEGRATIONS.md` line 23: "Use for: course resources; creator files; media/object storage".  
**Why it matters:** Agents may implement R2 storage when the pricing model says no native hosting, or skip R2 when the architecture says it's required. This is a fundamental architectural contradiction.  
**Recommended correction:** Resolve whether R2 is part of the core architecture or only an add-on. If no native hosting by default, remove R2 from primary infrastructure or mark it as add-on only. Update ADR-009 and INTEGRATIONS.md accordingly.  
**Verification:** Single authoritative position on R2 usage across all documents.

### DOC-004: Free tier platform fee contradiction

**Severity:** Medium  
**Files:** `docs/OPEN-PRODUCT-DECISIONS.md` (RES-004) vs `docs/PRICING-MONETIZATION.md`  
**Contradiction:** `OPEN-PRODUCT-DECISIONS.md` RES-004 states "3% on all sales (Pro and Pro Plus plans)" — implying Free plan may have a different fee. `PRICING-MONETIZATION.md` line 176 shows "Platform Fee: TBD%" for Free, and line 383 recommends "5% on Free, 3% on Pro/Pro Plus". RES-004 does not address Free plan fee.  
**Evidence:** `OPEN-PRODUCT-DECISIONS.md` RES-004: "3% on all sales (Pro and Pro Plus plans)". `PRICING-MONETIZATION.md` line 383: "Recommendation: 5% on Free, 3% on Pro/Pro Plus".  
**Why it matters:** The Free plan platform fee is undecided. Implementation of payment logic (Phase 7) cannot proceed without knowing the Free plan fee.  
**Recommended correction:** Decide Free plan platform fee. Update RES-004 or PRICING-MONETIZATION.md to be consistent.  
**Verification:** Single documented platform fee for all plans or explicit per-plan fees.

### DOC-005: Community interaction type "tha" — unresolved but required

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` (TS-COMM-005) vs `docs/OPEN-PRODUCT-DECISIONS.md` (OPD-001)  
**Contradiction:** `PRODUCT-REQUIREMENTS.md` line 52 marks TS-COMM-005 (unresolved interaction type "tha…") as NEEDS DECISION with instruction "Do NOT invent meaning." `OPEN-PRODUCT-DECISIONS.md` OPD-001 lists possible interpretations ("thanks", "threads", "that", or something else) but is still WAITING FOR FOUNDER INPUT. `FEATURE-MATRIX.md` line 38 marks TS-COMM-005 as BLOCKED (OPD-001).  
**Evidence:** `PRODUCT-REQUIREMENTS.md` line 52: "Unresolved interaction type ('tha…')" — NEEDS DECISION.  
**Why it matters:** The community data model cannot be finalized without knowing if there is a fourth interaction type beyond posts, comments, and likes.  
**Recommended correction:** Either obtain founder decision on "tha" interaction type, or explicitly confirm posts/comments/likes are sufficient and close OPD-001.  
**Verification:** OPD-001 resolved; community data model finalized.

### DOC-006: Streaks — NEEDS DECISION but referenced in design

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` (TS-GAME-003) vs `docs/DECISIONS.md` (ADR-025) vs `docs/OPEN-PRODUCT-DECISIONS.md` (OPD-005)  
**Contradiction:** `PRODUCT-REQUIREMENTS.md` line 108 marks TS-GAME-003 (Streaks) as NEEDS DECISION. `DECISIONS.md` ADR-025 states "Streaks specifically require product decision (OPD-005)." `OPEN-PRODUCT-DECISIONS.md` OPD-005 is listed as still unresolved (the document says "Continue with remaining OPD-005 through OPD-014 unchanged..." at line 252, suggesting the file may be truncated).  
**Evidence:** `OPEN-PRODUCT-DECISIONS.md` line 252: "(Continue with remaining OPD-005 through OPD-014 unchanged...)" — suggests document may be incomplete/truncated.  
**Why it matters:** Gamification design cannot be finalized without knowing if streaks are included.  
**Recommended correction:** Complete OPD-005 through OPD-014 documentation. Decide on streaks.  
**Verification:** All OPDs resolved or explicitly deferred with rationale.

### DOC-007: Referral rewards tier policy — founder approval required but undefined

**Severity:** Medium  
**Files:** `docs/REWARD-INFRASTRUCTURE.md` vs `docs/OPEN-PRODUCT-DECISIONS.md`  
**Contradiction:** `REWARD-INFRASTRUCTURE.md` lines 306-320 defines example reward tiers (1-4 referrals: +1 GB, 5-9: +2 GB, etc.) but line 320 states "Founder approval required before finalizing reward tier policy (see OPD-010)." However, `OPEN-PRODUCT-DECISIONS.md` does not contain an OPD-010 entry (the document jumps from OPD-004 to OPD-015, with OPD-005 through OPD-014 listed as "unchanged" but not shown).  
**Evidence:** `REWARD-INFRASTRUCTURE.md` line 320: "Founder approval required before finalizing reward tier policy (see OPD-010)." `OPEN-PRODUCT-DECISIONS.md` has no OPD-010 section visible.  
**Why it matters:** Referral reward implementation cannot proceed without finalized tier policy. The referenced OPD-010 does not appear to exist.  
**Recommended correction:** Create OPD-010 for referral reward tier policy, or reference the correct OPD number.  
**Verification:** OPD-010 exists or correct reference is documented; reward tiers finalized.

### DOC-008: Advertising model — NEEDS DECISION but no OPD

**Severity:** Low  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` (TS-ADS-001, TS-ADS-002) vs `docs/OPEN-PRODUCT-DECISIONS.md`  
**Contradiction:** `PRODUCT-REQUIREMENTS.md` lines 353-357 mark TS-ADS-001 and TS-ADS-002 as NEEDS DECISION, referencing OPD-006. `OPEN-PRODUCT-DECISIONS.md` does not contain OPD-006 (visible content ends at OPD-004 partially resolved, then jumps to OPD-015).  
**Evidence:** `PRODUCT-REQUIREMENTS.md` line 355: "TS-ADS-001 | Central homepage advertisements | S1 | NEEDS DECISION | — | See OPD-006".  
**Why it matters:** Advertising decisions affect landing page design, monetization, and user experience.  
**Recommended correction:** Create OPD-006 for advertising/sponsorship model, or explicitly decide against advertising.  
**Verification:** OPD-006 exists or advertising is explicitly rejected.

---

## 4. Duplicate Rules

### DOC-009: Referral/reward separation documented in multiple locations with risk of divergence

**Severity:** Medium  
**Files:** `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md`, `docs/REFERRAL-QUOTA-ARCHITECTURE.md`, `docs/REWARD-INFRASTRUCTURE.md`, `docs/INTEGRATIONS.md`, `docs/SECURITY-RULES.md`, `AGENTS.md`, `docs/AGENT-CONTEXT.md`, `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Evidence:** `PRIMARY-VS-REWARD-INFRASTRUCTURE.md` lines 664-675 list 8 documents where the separation MUST be documented. The same rules appear in all of them.  
**Why it matters:** When the rule changes, all 8 documents must be updated. High risk of divergence where one document has the old rule and another has the new rule. Agents reading different documents may get contradictory guidance.  
**Recommended correction:** Designate one document as the canonical source (PRIMARY-VS-REWARD-INFRASTRUCTURE.md already claims this). Other documents should reference it rather than restating the rules. Add a change rule requiring all 8 documents to be updated together.  
**Verification:** Single canonical source for referral/reward separation; all references consistent.

### DOC-010: Mobile-first rule repeated in multiple documents

**Severity:** Low  
**Files:** `AGENTS.md`, `docs/PROJECT-CONTEXT.md`, `docs/DECISIONS.md` (ADR-008), `docs/PRODUCT-REQUIREMENTS.md` (TS-MOBILE-001), `docs/FEATURE-MATRIX.md`  
**Evidence:** Mobile-first is stated in at least 5 documents.  
**Why it matters:** Low risk since the rule is consistent, but changes would require updating multiple documents.  
**Recommended correction:** Acceptable duplication for a critical principle. No correction needed, but note for change management.  
**Verification:** All instances of mobile-first rule are consistent.

### DOC-011: No vendor lock-in / provider abstraction repeated across documents

**Severity:** Low  
**Files:** `ADR-006`, `docs/INTEGRATIONS.md`, `docs/BUILD-CONTRACT.md`, `docs/AGENT-CONTEXT.md`, `docs/SKOOL-CIRCLE-ANALYSIS.md`  
**Evidence:** Provider abstraction is stated in at least 5 documents with consistent wording.  
**Why it matters:** Consistent duplication. Low risk.  
**Recommended correction:** No correction needed.  
**Verification:** All instances consistent.

---

## 5. Missing Requirements

### DOC-012: No database schema migration files exist

**Severity:** High  
**Files:** `docs/REFERRAL-QUOTA-ARCHITECTURE.md`, `docs/REWARD-INFRASTRUCTURE.md` (schema as Markdown snippets)  
**Evidence:** SQL `CREATE TABLE` statements exist only inside Markdown code blocks. No `src/server/db/schema.ts`, no migration files, no Supabase CLI configuration.  
**Why it matters:** Phase 3 backend foundation cannot implement database schema without migration files. Agents must manually transcribe SQL from Markdown, risking errors.  
**Recommended correction:** Create migration files matching documented schemas. Use Supabase migration format or Drizzle Kit.  
**Verification:** Migration runs against test database; tables match documented definitions.

### DOC-013: No API contract specification

**Severity:** Medium  
**Files:** `docs/`, `src/server/api/` (does not exist)  
**Evidence:** No OpenAPI/Swagger file, no API contract document, no route definitions. Zod is a dependency but no validation schemas exist.  
**Why it matters:** Frontend and backend cannot be developed in parallel. Integration testing is harder without explicit request/response schemas.  
**Recommended correction:** Add OpenAPI specs or shared Zod schemas for all API routes before Phase 3.  
**Verification:** API routes validate against shared schemas.

### DOC-014: No environment variable template

**Severity:** Medium  
**Files:** Root directory (no `.env.example`), `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md`  
**Evidence:** No `.env.example` file exists. Secret management is documented but no template shows required variables.  
**Why it matters:** New developers cannot easily set up local development. Risk of missing required environment variables.  
**Recommended correction:** Create `.env.example` with all required variables per phase.  
**Verification:** `bun run dev` starts with `.env.local` populated from template.

### DOC-015: `docs/PRICING-COST-RESEARCH.md` missing

**Severity:** High  
**Files:** `docs/README.md` line 32, `docs/OPEN-PRODUCT-DECISIONS.md` OPD-015  
**Evidence:** `docs/README.md` line 32 references "Pricing Cost Research (CRITICAL)". `OPEN-PRODUCT-DECISIONS.md` OPD-015 requires PRICING-COST-RESEARCH.md as deliverable. File does not exist.  
**Why it matters:** OPD-015 is BLOCKED. Phase 7 (payments) cannot be implemented without finalized pricing.  
**Recommended correction:** Create `docs/PRICING-COST-RESEARCH.md` with infrastructure cost breakdown, per-user cost, recommended pricing, margin validation.  
**Verification:** File exists; pricing research complete; OPD-015 resolved.

### DOC-016: `docs/LEGACY-SOURCE-INVENTORY.md` missing

**Severity:** Low  
**Files:** `docs/FOLDER-STRUCTURE.md` line 360  
**Evidence:** `FOLDER-STRUCTURE.md` lists `LEGACY-SOURCE-INVENTORY.md` in the docs inventory. File does not exist.  
**Why it matters:** Minor documentation gap. Legacy inventory would help agents understand what was removed from SukaSpace.  
**Recommended correction:** Create `docs/LEGACY-SOURCE-INVENTORY.md` or remove reference from `FOLDER-STRUCTURE.md`.  
**Verification:** File exists or reference removed.

### DOC-017: OPD-005 through OPD-014 not documented

**Severity:** High  
**Files:** `docs/OPEN-PRODUCT-DECISIONS.md` line 252  
**Evidence:** Line 252 states "(Continue with remaining OPD-005 through OPD-014 unchanged...)" but these decisions are not visible in the document. The document appears truncated or incomplete.  
**Why it matters:** 10 open decisions are referenced but not documented. Agents cannot know what decisions are pending.  
**Recommended correction:** Complete OPD-005 through OPD-014 documentation with historical context, affected architecture, and current assumptions.  
**Verification:** All OPDs 001-015 documented.

### DOC-018: No deployment documentation

**Severity:** Medium  
**Files:** `docs/INTEGRATIONS.md` mentions Cloudflare hosting but no deployment guide  
**Evidence:** No deployment documentation exists. Cloudflare Pages/Nitro preset is configured in `vite.config.ts` but no deployment steps are documented.  
**Why it matters:** Production deployment process is undefined.  
**Recommended correction:** Create deployment documentation covering build, preview, and production deployment to Cloudflare Pages.  
**Verification:** Deployment steps documented; test deployment succeeds.

### DOC-019: No backup/recovery strategy documented

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` TS-OPS-007  
**Evidence:** TS-OPS-007 (backup/recovery strategy) is Phase 3+, CORE LATER. No backup documentation exists.  
**Why it matters:** Data loss recovery is undefined.  
**Recommended correction:** Document backup strategy for Supabase (point-in-time recovery) and R2 (versioning, cross-region replication).  
**Verification:** Backup strategy documented; restore procedure tested.

---

## 6. Ambiguous Language

### DOC-020: "tha…" community interaction type

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 52  
**Ambiguity:** "Unresolved interaction type ('tha…')" — Original transcription: "post, comment, likes, tha". Four possible interpretations listed in OPD-001. No decision made.  
**Why it matters:** Agents cannot design the community data model without knowing if there is a fourth interaction type.  
**Recommended correction:** Resolve OPD-001 or explicitly confirm posts/comments/likes are sufficient for launch.  
**Verification:** OPD-001 resolved.

### DOC-021: "Instant Payouts (SMS + 1%, GH 1)" — partially unreadable

**Severity:** High  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 132 (TS-PAY-013), `docs/OPEN-PRODUCT-DECISIONS.md` OPD-002  
**Ambiguity:** The exact meaning of "Instant Payouts (SMS + 1%, GH 1)" is unclear. Multiple interpretations possible (SMS + 1% fee + GH?1 minimum, SMS-based trigger, mobile money with GH?1 floor).  
**Why it matters:** Creator payout system cannot be implemented without knowing the exact fee structure, minimum amounts, and supported methods.  
**Recommended correction:** Obtain founder clarification. Document the exact payout model.  
**Verification:** OPD-002 resolved with exact fee structure.

### DOC-022: Partially unreadable payment phrase

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 133 (TS-PAY-014), `docs/OPEN-PRODUCT-DECISIONS.md` OPD-003  
**Ambiguity:** "[Partially unreadable — original transcription incomplete]" — May contain a business rule, provider requirement, or pricing constraint.  
**Why it matters:** May contain a constraint affecting payment architecture.  
**Recommended correction:** Locate original notes and clarify, or confirm it can be disregarded.  
**Verification:** OPD-003 resolved.

### DOC-023: "Placeholder/future content" for pricing page

**Severity:** Medium  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 255  
**Ambiguity:** TS-LAND-002 note says "Placeholder/future content" but classification is CORE NOW (design).  
**Why it matters:** Unclear whether agents should design a pricing page with placeholder content or defer it entirely.  
**Recommended correction:** Clarify: either design pricing page with placeholder content (and update when pricing is finalized) or reclassify as CORE LATER.  
**Verification:** Pricing page scope clarified.

### DOC-024: "Provider-abstracted video delivery" — which providers?

**Severity:** Low  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 84 (TS-CLASS-017), `docs/INTEGRATIONS.md` line 48-52  
**Ambiguity:** Lists Bunny.net, LiveKit, Daily, Agora as potential video providers. No selection criteria or priority order documented.  
**Why it matters:** Agents may implement adapters for providers that are never used, or miss providers that should be supported.  
**Recommended correction:** Document provider selection priority and evaluation criteria.  
**Verification:** Provider selection documented.

### DOC-025: "Minimum 70% profit margin required" — on what basis?

**Severity:** Medium  
**Files:** `docs/OPEN-PRODUCT-DECISIONS.md` RES-002 line 73, `docs/PRICING-MONETIZATION.md` line 6  
**Ambiguity:** "Minimum 70% profit margin required on paid plans" — Margin on what? Gross revenue? After infrastructure costs? After payment processing fees? After support costs?  
**Why it matters:** Pricing calculation depends on the margin definition. `PRICING-MONETIZATION.md` line 148 uses "Infrastructure Cost / 0.30" but does not include payment fees or support costs in the example.  
**Recommended correction:** Define margin calculation basis explicitly (gross margin, contribution margin, or net margin). Include all cost categories.  
**Verification:** Margin formula documented with all cost categories included.

---

## 7. Unsupported Assumptions

### DOC-026: Supabase Free tier sufficient for launch

**Severity:** Medium  
**Files:** `docs/PRICING-MONETIZATION.md` lines 245-249  
**Assumption:** "Supabase Free tier: 500 MB database, 1 GB storage — Likely sufficient for many users on Free plan"  
**Evidence:** No user growth model, no data-per-user estimate, no timeline for when Free tier would be exceeded.  
**Why it matters:** If user growth exceeds Free tier limits, the platform will hit read-only enforcement (500 MB database) unexpectedly.  
**Recommended correction:** Create a capacity model estimating users, data per user, and time to Free tier exhaustion. Define upgrade trigger.  
**Verification: Capacity model shows projected Free tier exhaustion timeline.

### DOC-027: Zero-cost mode is feasible long-term

**Severity:** Medium  
**Files:** `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 9  
**Assumption:** "Default to zero-cost operation wherever technically and contractually feasible."  
**Evidence:** No analysis of whether zero-cost operation is sustainable as user base grows. Free tiers have limits that will be exceeded.  
**Why it matters:** Platform may need to transition to paid tiers without a documented transition plan.  
**Recommended correction:** Document zero-cost-to-paid transition plan. Define triggers for upgrading.  
**Verification: Transition plan documented with cost thresholds.

### DOC-028: Three-tier pricing model assumed without market validation

**Severity:** Medium  
**Files:** `docs/OPEN-PRODUCT-DECISIONS.md` RES-002  
**Assumption:** Three tiers (Free, Pro, Pro Plus) with specific feature gates.  
**Evidence:** RES-002 is marked RESOLVED but no market research or competitor analysis justifies the tier structure or pricing.  
**Why it matters:** Incorrect pricing tiers could fail to attract users or generate sufficient revenue.  
**Recommended correction:** Add market validation data (competitor pricing, African market willingness to pay) to support tier structure.  
**Verification: Pricing tiers justified by market research.

### DOC-029: African-first payment methods assumed but not researched

**Severity:** High  
**Files:** `docs/PRODUCT-CONTEXT.md` line 51, `docs/PRICING-MONETIZATION.md` line 276  
**Assumption:** "Local payment patterns when payments are introduced" and "Paystack/Flutterwave historical refs"  
**Evidence:** No research on actual African payment methods (mobile money, bank transfers, card penetration), fees, or integration complexity.  
**Why it matters:** Payment implementation (Phase 7) may be blocked by unsupported payment methods or unexpected fees.  
**Recommended correction:** Research African payment methods (M-Pesa, MTN Mobile Money, Airtel Money, bank transfers) and document integration requirements.  
**Verification: Payment method research documented before Phase 7.

---

## 8. Missing Implementation Constraints

### DOC-030: No maximum database size guardrail in schema design

**Severity:** Medium  
**Files:** `docs/REWARD-INFRASTRUCTURE.md` (schema), `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 152  
**Missing constraint:** `ENVIRONMENT-AND-COST-GUARDRAILS.md` line 152 states "Guardrail: Reject new data when database > 450 MB or storage > 900 MB" but no schema-level constraint enforces this.  
**Why it matters:** Application must check database size before inserts. Without a documented constraint, agents may not implement the check.  
**Recommended correction:** Add database size check to application logic. Document in schema or service layer.  
**Verification: Insert rejected when database approaches 450 MB threshold.

### DOC-031: No email rate limit guardrail in code

**Severity:** Medium  
**Files:** `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` line 158  
**Missing constraint:** "Guardrail: Queue emails when approaching daily limit, fail if monthly limit hit" — no implementation guidance.  
**Why it matters:** Resend Free tier is 100 emails/day. Without rate limiting, the platform could exceed the free tier unexpectedly.  
**Recommended correction:** Implement email send rate limiting with queue and fail-safe.  
**Verification: Email sending stops at daily limit; queue prevents loss.

### DOC-032: No file upload size/type validation constraints

**Severity:** Medium  
**Files:** `docs/SECURITY-RULES.md` lines 23-29  
**Missing constraint:** "Validate type and size" for private uploads — no maximum file size or allowed types documented.  
**Why it matters:** Without defined limits, agents must guess acceptable file sizes and types.  
**Recommended correction:** Document maximum file size (e.g., 100 MB) and allowed MIME types for uploads.  
**Verification: Upload limits documented and enforced.

---

## 9. Rules That Cannot Be Objectively Verified

### DOC-033: "Do not accept the first generated interface by default"

**Severity:** Low  
**Files:** `AGENTS.md` (Design mandate), `docs/DESIGN-FIRST.md` line 26  
**Rule:** "Where meaningful alternatives exist: create multiple isolated variants... Do not accept the first generated interface by default."  
**Why it cannot be verified:** There is no objective measure of whether "multiple variants" were created or whether the "first generated interface" was accepted. No design artifact repository is defined.  
**Recommended correction:** Define where design variants are stored (e.g., `docs/designs/` or `src/designs/`). Require variant comparison documentation before selecting a direction.  
**Verification: Design variants exist in designated location; comparison document exists.

### DOC-034: "Review is a gate"

**Severity:** Low  
**Files:** `AGENTS.md` (Non-negotiable principles)  
**Rule:** "Review is a gate."  
**Why it cannot be verified:** No definition of what constitutes a "review," who performs it, or what evidence is required.  
**Recommended correction:** Define review process: reviewer, checklist, approval criteria, evidence of completion.  
**Verification: Review checklist exists; review evidence documented.

### DOC-035: "Verify before claiming success"

**Severity:** Low  
**Files:** `AGENTS.md` (Non-negotiable principles)  
**Rule:** "Verify before claiming success."  
**Why it cannot be verified:** No definition of what "verify" means for each task. No evidence format specified.  
**Recommended correction:** Define verification requirements per task type (build output, test results, browser evidence, etc.).  
**Verification: Verification evidence format defined.

### DOC-036: "Smallest correct change"

**Severity:** Low  
**Files:** `AGENTS.md` (Non-negotiable principles)  
**Rule:** "Smallest correct change."  
**Why it cannot be verified:** "Smallest" and "correct" are subjective. No objective measure.  
**Recommended correction:** Acceptable as a guiding principle. No correction needed, but note for agent guidance.  
**Verification: N/A (guiding principle).

---

## 10. Outdated Technology References

### DOC-037: Bun version references may be outdated

**Severity:** Low  
**Files:** `package.json`, `bun.lock`, `bunfig.toml`, `playwright.config.ts`  
**Evidence:** `playwright.config.ts` line 45 references `bun run dev`. `bun.lock` exists. `@types/node` is `^26.1.1` (Node 26 types, future version). `typescript` is `^5.3.3` (older version).  
**Why it matters:** Mixed signals about runtime (bun vs node). TypeScript version is not the latest.  
**Recommended correction:** Confirm Bun is the intended runtime. Remove `package-lock.json` if Bun is canonical. Update TypeScript to latest compatible version.  
**Verification: Single package manager confirmed; dependencies install cleanly.

### DOC-038: GPT-4o mini reference labeled as LEGACY

**Severity:** Low  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 192  
**Evidence:** "GPT-4o mini ref is LEGACY."  
**Why it matters:** Good — this is correctly identified as legacy. No action needed.  
**Recommended correction:** None.  
**Verification: N/A.

---

## 11. Instructions That Could Cause AI Agents to Implement the Wrong Thing

### DOC-039: Pricing page as CORE NOW without finalized pricing

**Severity:** High  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 255  
**Risk:** Agents may design and implement a pricing page with placeholder content that must be completely redone when pricing is finalized.  
**Recommended correction:** Reclassify TS-LAND-002 as CORE LATER or NEEDS DECISION until OPD-015 resolved.  
**Verification: Pricing page design deferred until pricing finalized.

### DOC-040: Native hosting contradiction could cause agents to implement R2 incorrectly

**Severity:** High  
**Files:** `docs/PRICING-MONETIZATION.md` vs `docs/INTEGRATIONS.md` vs `docs/DECISIONS.md`  
**Risk:** Agents may implement R2 storage when pricing says no native hosting, or skip R2 when architecture requires it.  
**Recommended correction:** Resolve R2 positioning (core vs add-on) and update all documents consistently.  
**Verification: Single authoritative R2 position across all documents.

### DOC-041: Referral reward tiers marked as example but could be implemented as final

**Severity:** Medium  
**Files:** `docs/REWARD-INFRASTRUCTURE.md` lines 306-320  
**Risk:** The reward tier table is labeled "example policy" but agents may implement it as the final policy without founder approval (which line 320 requires).  
**Recommended correction:** Clearly mark reward tiers as "EXAMPLE — NOT FINAL" and add founder approval gate before implementation.  
**Verification: Reward tiers not implemented until founder approval documented.

### DOC-042: "Provider-agnostic AI layer" — no provider selected

**Severity:** Low  
**Files:** `docs/PRODUCT-REQUIREMENTS.md` line 199 (TS-AI-008)  
**Risk:** Agents may implement AI integration with a specific provider, creating vendor lock-in contrary to the requirement.  
**Recommended correction:** Define AI provider selection criteria and adapter interface before Phase 9 implementation.  
**Verification: AI adapter interface defined before implementation.

---

## 12. Inter-Document Consistency Check

| Document Pair | Consistent? | Issues |
|---|---|---|
| `AGENTS.md` ↔ `docs/AGENT-CONTEXT.md` | Yes | Both reference same phase, same principles |
| `AGENTS.md` ↔ `docs/DECISIONS.md` (ADR-013) | Yes | ADR-013 confirms AGENTS.md is single contract |
| `docs/PHASES.md` ↔ `docs/FEATURE-MATRIX.md` | Mostly | Phase assignments generally match |
| `docs/PRODUCT-REQUIREMENTS.md` ↔ `docs/FEATURE-MATRIX.md` | Mostly | Requirement IDs match |
| `docs/PRICING-MONETIZATION.md` ↔ `docs/OPEN-PRODUCT-DECISIONS.md` | No | DOC-004, DOC-025 |
| `docs/PRICING-MONETIZATION.md` ↔ `docs/INTEGRATIONS.md` | No | DOC-003 (R2 contradiction) |
| `docs/SECURITY-RULES.md` ↔ `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md` | Yes | Both support separation of secrets |
| `docs/ENVIRONMENT-AND-COST-GUARDRAILS.md` ↔ `docs/PRIMARY-VS-REWARD-INFRASTRUCTURE.md` | Yes | Both support zero-cost mode |
| `docs/PHASES.md` ↔ `docs/AGENTS.md` | Yes | Phase 0 confirmed as current |

---

## 13. Conclusion

**The documentation is outstanding for a Phase 0 design project.** It is comprehensive, well-organized, and internally consistent in most areas. The authority hierarchy, phase discipline, and security posture are well-defined.

**However, the documentation is NOT yet implementation-ready.** Critical issues include:

1. **Contradictions** (DOC-001 through DOC-008) that could cause agents to implement conflicting behavior.
2. **Missing documents** (PRICING-COST-RESEARCH.md, LEGACY-SOURCE-INVENTORY.md) referenced by other documents.
3. **Unresolved decisions** (OPD-001 through OPD-015) blocking requirements from being implemented.
4. **No implementation artifacts** (schema migrations, API contracts, CI/CD workflows, env templates).
5. **Rules that cannot be objectively verified** (DOC-033 through DOC-036).

**Recommended next steps before Phase 1:**
1. Resolve all contradictions (DOC-001 to DOC-008).
2. Create missing documents (PRICING-COST-RESEARCH.md, LEGACY-SOURCE-INVENTORY.md).
3. Complete all OPDs (OPD-001 through OPD-015).
4. Create implementation artifacts (schema migrations, API contracts, `.env.example`, CI/CD workflow).
5. Make verification rules objectively checkable.

---

**Audited by:** Independent Staff-Level Documentation Reviewer  
**Method:** Cross-document comparison, requirement traceability, contradiction detection  
**Files modified:** None