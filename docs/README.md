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
13. [Agent Roles](./AGENT-ROLES.md)
14. [Decisions](./DECISIONS.md)
15. [Legacy Context](./LEGACY-CONTEXT.md)

## Documentation hierarchy

```
AGENTS.md
  └── docs/
      ├── AGENT-CONTEXT.md
      ├── AGENT-PROMPT-TEMPLATE.md
      ├── PROJECT-CONTEXT.md
      ├── BUILD-CONTRACT.md
      ├── DESIGN-FIRST.md
      ├── INTEGRATIONS.md
      ├── SECURITY-RULES.md
      ├── PHASES.md
      ├── TOOLING.md
      ├── CI-CONTRACT.md
      ├── REFERRAL-QUOTA-ARCHITECTURE.md
      ├── AGENT-ROLES.md
      ├── DECISIONS.md
      └── LEGACY-CONTEXT.md
```

## Authority

`AGENTS.md` is the single universal agent contract.

The documents in this directory provide durable product, architecture, design, security, integration, testing, and operating context.

Provider-specific behavior must be checked against current official documentation before implementation.

## Change rule

When architecture, integrations, product positioning, security posture, provider policy, or phase boundaries change, update the relevant documentation in the same change set whenever practical.
