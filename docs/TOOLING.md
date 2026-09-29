# The Scenes — Tooling Contract

## Tools are capabilities, not authority

An MCP, CLI, browser, GitHub connector, or provider SDK can perform actions. It does not decide whether those actions are permitted in the current phase.

## Repository/Git

Agents should be able to:
- inspect status/history/diff;
- create branches;
- read/write files;
- run verification;
- review changes.

## CLI

Use CLI for:
- dependency inspection;
- lint;
- format;
- build;
- tests;
- local dev.

Never use destructive commands without authority.

## Browser/UI verification

Use browser-capable tooling for:
- route checks;
- responsive checks;
- form/error states;
- visual comparisons;
- key user journeys.

## MCP

Use only approved integrations with known provenance and acceptable permissions/data handling.

## Documentation

Provider-specific behavior must be checked against current official documentation before implementation.

## Model hierarchy

Higher-capability models should strengthen the canonical docs.

Lower-capability models should consume those docs.

No model is allowed to weaken:
- security;
- phase gates;
- product scope;
- provider boundaries;
- design-first rules.

## Capability rule

Never claim a capability exists merely because a document names it.

Detect actual capability first.
