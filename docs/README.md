# The Scenes Project Documentation

This directory is the durable operating memory for the project.

## Start here

1. [Agent Contract](../AGENTS.md)
2. [Current Project Status](./PROJECT-STATUS.md)
3. [Agent Context](./AGENT-CONTEXT.md)
4. [Universal Prompt Template](./AGENT-PROMPT-TEMPLATE.md)
5. [Project Context](./PROJECT-CONTEXT.md)
6. [Build Contract](./BUILD-CONTRACT.md)
7. [Design First](./DESIGN-FIRST.md)
8. [Integrations](./INTEGRATIONS.md)
9. [Security Rules](./SECURITY-RULES.md)
10. [Phases](./PHASES.md)
11. [Tooling](./TOOLING.md)
12. [CI Contract](./CI-CONTRACT.md)
13. [Referral & Quota Architecture](./REFERRAL-QUOTA-ARCHITECTURE.md)
14. [**PRIMARY vs REWARD Infrastructure (CRITICAL)**](./PRIMARY-VS-REWARD-INFRASTRUCTURE.md)
15. [Reward Infrastructure](./REWARD-INFRASTRUCTURE.md)
16. [Agent Roles](./AGENT-ROLES.md)
17. [Decisions](./DECISIONS.md)
18. [Legacy Context](./LEGACY-CONTEXT.md)
19. [Legacy Source Inventory](./LEGACY-SOURCE-INVENTORY.md)
20. [Product Requirements](./PRODUCT-REQUIREMENTS.md) ï¿½ canonical feature source of truth
21. [Feature Matrix](./FEATURE-MATRIX.md) ï¿½ traceability from requirement to release
22. [**Skool & Circle Analysis**](./SKOOL-CIRCLE-ANALYSIS.md) ï¿½ competitive intelligence
23. [Open Product Decisions](./OPEN-PRODUCT-DECISIONS.md) ï¿½ unresolved business questions
24. [Plain-English Product Explanation](./PLAIN-ENGLISH-PRODUCT-EXPLANATION.md) ï¿½ non-technical overview
25. [Folder Structure](./FOLDER-STRUCTURE.md) ï¿½ repository organization
26. [Testing and Quality](./TESTING-AND-QUALITY.md) ï¿½ testing strategy
27. [**Pricing Cost Research** (CRITICAL)](./PRICING-COST-RESEARCH.md) — infrastructure costs & pricing analysis
28. [Environment and Cost Guardrails](./ENVIRONMENT-AND-COST-GUARDRAILS.md) ï¿½ cost/security safety
29. [Data Layer and Platform Research](./DATA-LAYER-RESEARCH.md) — current PostgreSQL/provider comparison and proposed data model
30. [Mandatory Phase Planning Gate](./PHASE-PLANNING-GATE.md) — required planning, scale, security and verification contract before every phase
31. [Phase 3A Revision 3 Specification](./PHASE-3-REVISION-3-SPEC.md) — founder-approved learning slice; executable local gates remain
32. [Phase 3A Data and Authorization Contract](./PHASE-3-DATA-AUTHORIZATION-CONTRACT.md) — exact schema, lifecycle, grants and RLS decisions
33. [Phase 3A Revision 3 Implementation Plan](./PHASE-3-IMPLEMENTATION-PLAN-R3.md) — active build order under lean build + staging mode
34. [Phase 3A Verification Runbook](./PHASE-3-VERIFICATION-RUNBOOK.md) — executable CI, security, load and recovery gates
35. [Phase 3 Revision 3 Review](./PHASE-3-REVISION-3-REVIEW.md) — historical findings; executable gates now decide promotion
36. [Phase 3 Revision 2 Specification (historical)](./PHASE-3-BACKEND-SPEC.md)
37. [Phase 3 Revision 2 Implementation Plan (historical)](./PHASE-3-IMPLEMENTATION-PLAN.md)
38. [Phase 3 Revision 2 Plan Review (historical)](./PHASE-3-PLAN-REVIEW.md)
39. [Security Scan Results](./SECURITY-SCAN-RESULTS.md) — redacted scan evidence and required historical credential response
40. [Phase 4 Plan](./PHASE-4-PLAN.md) — revision-2; approved for P4-S1 and code/local P4-S2 ... P4-S5 (ADR-042/043/044)
41. [Phase 4 Plan Review](./PHASE-4-PLAN-REVIEW.md) — planning-gate findings and founder decisions
42. [Phase 4 Implementation Prompt](./PHASE-4-IMPLEMENTATION-PROMPT.md) — reusable gated execution prompt
43. [Account Email Setup](./ACCOUNT-EMAIL-SETUP.md) — P4-S1 recovery setup, verification and rollback
44. [Rate Limiting](./RATE-LIMITING.md) — P4-S2 policies, providers, failure modes and rollback
45. [Notifications](./NOTIFICATIONS.md) — P4-S3 notification/preference schema, event matrix, allowlist and rollback
46. [Cloudflare Deployment](./CLOUDFLARE-DEPLOYMENT.md) — runtime configuration contract, variables, verification and rollback (ADR-045)

## Documentation hierarchy

```
AGENTS.md
  +-- docs/
      +-- PROJECT-STATUS.md
      +-- AGENT-CONTEXT.md
      +-- AGENT-PROMPT-TEMPLATE.md
      +-- PROJECT-CONTEXT.md
      +-- BUILD-CONTRACT.md
      +-- DESIGN-FIRST.md
      +-- INTEGRATIONS.md
      +-- SECURITY-RULES.md
      +-- PHASES.md
      +-- PHASE-PLANNING-GATE.md
      +-- PHASE-3-REVISION-3-SPEC.md
      +-- PHASE-3-DATA-AUTHORIZATION-CONTRACT.md
      +-- PHASE-3-IMPLEMENTATION-PLAN-R3.md
      +-- PHASE-3-VERIFICATION-RUNBOOK.md
      +-- PHASE-3-REVISION-3-REVIEW.md
      +-- PHASE-4-PLAN.md                        (approved for P4-S1 and code/local P4-S2...S5)
      +-- PHASE-4-PLAN-REVIEW.md
      +-- PHASE-4-IMPLEMENTATION-PROMPT.md
      +-- ACCOUNT-EMAIL-SETUP.md                 (P4-S1 setup, verify, rollback)
      +-- RATE-LIMITING.md                       (P4-S2 policies, failure modes, rollback)
      +-- NOTIFICATIONS.md                       (P4-S3 schema, event matrix, allowlist, rollback)
      +-- CLOUDFLARE-DEPLOYMENT.md               (runtime config, variables, verify, rollback)
      +-- PHASE-3-BACKEND-SPEC.md              (revision 2 historical)
      +-- PHASE-3-IMPLEMENTATION-PLAN.md        (revision 2 historical)
      +-- PHASE-3-PLAN-REVIEW.md                (revision 2 historical)
      +-- SECURITY-SCAN-RESULTS.md
      +-- DATA-LAYER-RESEARCH.md
      +-- TOOLING.md
      +-- CI-CONTRACT.md
      +-- REFERRAL-QUOTA-ARCHITECTURE.md
      +-- PRIMARY-VS-REWARD-INFRASTRUCTURE.md ?? CRITICAL
      +-- REWARD-INFRASTRUCTURE.md
      +-- AGENT-ROLES.md
      +-- DECISIONS.md
      +-- LEGACY-CONTEXT.md
      +-- LEGACY-SOURCE-INVENTORY.md
      +-- PRODUCT-REQUIREMENTS.md
      +-- FEATURE-MATRIX.md
      +-- SKOOL-CIRCLE-ANALYSIS.md
      +-- OPEN-PRODUCT-DECISIONS.md
      +-- PLAIN-ENGLISH-PRODUCT-EXPLANATION.md
      +-- FOLDER-STRUCTURE.md
      +-- TESTING-AND-QUALITY.md
      +-- ENVIRONMENT-AND-COST-GUARDRAILS.md
      +-- AGENT-GUIDES/
          +-- FABLE.md
```

## Critical Documents (Read First)

### For ANY Agent Working on Referrals/Rewards

1. **[PRIMARY-VS-REWARD-INFRASTRUCTURE.md](./PRIMARY-VS-REWARD-INFRASTRUCTURE.md)** ?? MANDATORY
   - Absolute separation between primary and reward infrastructure
   - Financial safety boundary
   - Zero-cost mode enforcement
   - **Violation = Critical Failure**

2. **[REFERRAL-QUOTA-ARCHITECTURE.md](./REFERRAL-QUOTA-ARCHITECTURE.md)**
   - Entitlement vs capacity separation
   - Referral qualification state machine
   - Provider routing logic

3. **[REWARD-INFRASTRUCTURE.md](./REWARD-INFRASTRUCTURE.md)**
   - Implementation details
   - Database schema
   - Code examples

### For Product/UX Agents

1. **[SKOOL-CIRCLE-ANALYSIS.md](./SKOOL-CIRCLE-ANALYSIS.md)**
   - Competitive intelligence
   - Feature synthesis strategy
   - What to adopt, what to reject

2. **[PRODUCT-REQUIREMENTS.md](./PRODUCT-REQUIREMENTS.md)**
   - Canonical requirements with stable IDs
   - 200+ requirements classified by phase

3. **[PLAIN-ENGLISH-PRODUCT-EXPLANATION.md](./PLAIN-ENGLISH-PRODUCT-EXPLANATION.md)**
   - Non-technical product overview
   - For founder review

### For Implementation Agents

1. **[PHASE-PLANNING-GATE.md](./PHASE-PLANNING-GATE.md)**
   - Mandatory specification and approval gate before implementation
   - Scale, security, reliability, cost and verification requirements

2. **[PHASE-3-REVISION-3-SPEC.md](./PHASE-3-REVISION-3-SPEC.md)** and child contracts
   - Approved Phase 3A identity, access, data-mode and learning-slice contract
   - Implement under ADR-040 and its executable local/staging gates; revision 2 is historical only

3. **[FOLDER-STRUCTURE.md](./FOLDER-STRUCTURE.md)**
   - Repository organization
   - Import rules
   - File naming conventions

4. **[BUILD-CONTRACT.md](./BUILD-CONTRACT.md)**
   - Build requirements
   - Verification checklist

5. **[TESTING-AND-QUALITY.md](./TESTING-AND-QUALITY.md)**
   - Testing strategy
   - E2E with Playwright
   - Quality gates

## Authority

`AGENTS.md` is the single universal agent contract.

The documents in this directory provide durable product, architecture, design, security, integration, testing, and operating context.

Provider-specific behavior must be checked against current official documentation before implementation.

## Change rule

When architecture, integrations, product positioning, security posture, provider policy, or phase boundaries change, update the relevant documentation in the same change set whenever practical.

## Competitive Intelligence

The Scenes incorporates insights from:

- **Skool** ï¿½ clarity, gamification, onboarding
- **Circle** ï¿½ structure, flexibility, advanced features

While remaining a distinct product with:

- African-first design
- Provider flexibility
- Referral/reward architecture
- Broader category support
- Self-hosting capability

See [SKOOL-CIRCLE-ANALYSIS.md](./SKOOL-CIRCLE-ANALYSIS.md) for full analysis.
