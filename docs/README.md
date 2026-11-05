# The Scenes Project Documentation

This directory is the durable operating memory for the project.

## Start here

1. [Agent Contract](../AGENTS.md)
2. [Agent Context](./AGENT-CONTEXT.md)
3. [Universal Prompt Template](./AGENT-PROMPT-TEMPLATE.md)
4. [Project Context](./PROJECT-CONTEXT.md)
5. [Build Contract](./BUILD-CONTRACT.md)
6. [Design First](./DESIGN-FIRST.md)
7. [Integrations](./INTEGRATIONS.md)
8. [Security Rules](./SECURITY-RULES.md)
9. [Phases](./PHASES.md)
10. [Tooling](./TOOLING.md)
11. [CI Contract](./CI-CONTRACT.md)
12. [Referral & Quota Architecture](./REFERRAL-QUOTA-ARCHITECTURE.md)
13. [**PRIMARY vs REWARD Infrastructure (CRITICAL)**](./PRIMARY-VS-REWARD-INFRASTRUCTURE.md)
14. [Reward Infrastructure](./REWARD-INFRASTRUCTURE.md)
15. [Agent Roles](./AGENT-ROLES.md)
16. [Decisions](./DECISIONS.md)
17. [Legacy Context](./LEGACY-CONTEXT.md)
18. [Legacy Source Inventory](./LEGACY-SOURCE-INVENTORY.md)
19. [Product Requirements](./PRODUCT-REQUIREMENTS.md) ï¿½ canonical feature source of truth
20. [Feature Matrix](./FEATURE-MATRIX.md) ï¿½ traceability from requirement to release
21. [**Skool & Circle Analysis**](./SKOOL-CIRCLE-ANALYSIS.md) ï¿½ competitive intelligence
22. [Open Product Decisions](./OPEN-PRODUCT-DECISIONS.md) ï¿½ unresolved business questions
23. [Plain-English Product Explanation](./PLAIN-ENGLISH-PRODUCT-EXPLANATION.md) ï¿½ non-technical overview
24. [Folder Structure](./FOLDER-STRUCTURE.md) ï¿½ repository organization
25. [Testing and Quality](./TESTING-AND-QUALITY.md) ï¿½ testing strategy
26. [**Pricing Cost Research** (CRITICAL)](./PRICING-COST-RESEARCH.md) — infrastructure costs & pricing analysis
27. [Environment and Cost Guardrails](./ENVIRONMENT-AND-COST-GUARDRAILS.md) ï¿½ cost/security safety
28. [Data Layer and Platform Research](./DATA-LAYER-RESEARCH.md) — current PostgreSQL/provider comparison and proposed data model
29. [Mandatory Phase Planning Gate](./PHASE-PLANNING-GATE.md) — required planning, scale, security and verification contract before every phase
30. [Phase 3 Backend Specification](./PHASE-3-BACKEND-SPEC.md) — local-only Supabase learning-slice plan; implementation not yet approved
31. [Phase 3 Implementation Plan](./PHASE-3-IMPLEMENTATION-PLAN.md) — file-by-file build order, migrations, RLS, server functions and wave gates

## Documentation hierarchy

```
AGENTS.md
  +-- docs/
      +-- AGENT-CONTEXT.md
      +-- AGENT-PROMPT-TEMPLATE.md
      +-- PROJECT-CONTEXT.md
      +-- BUILD-CONTRACT.md
      +-- DESIGN-FIRST.md
      +-- INTEGRATIONS.md
      +-- SECURITY-RULES.md
      +-- PHASES.md
      +-- PHASE-PLANNING-GATE.md
      +-- PHASE-3-BACKEND-SPEC.md
      +-- PHASE-3-IMPLEMENTATION-PLAN.md
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

2. **[FOLDER-STRUCTURE.md](./FOLDER-STRUCTURE.md)**
   - Repository organization
   - Import rules
   - File naming conventions

3. **[BUILD-CONTRACT.md](./BUILD-CONTRACT.md)**
   - Build requirements
   - Verification checklist

4. **[TESTING-AND-QUALITY.md](./TESTING-AND-QUALITY.md)**
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
