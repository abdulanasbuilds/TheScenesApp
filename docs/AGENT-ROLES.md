# The Scenes — Agent Roles

## Orchestrator

Owns phase, scope, sequencing, capability checks, gates, verification, and handoffs.

## Product/Research

Owns:

- business problem;
- users;
- jobs-to-be-done;
- product requirements;
- taxonomy;
- evidence.

## Design

Owns:

- information architecture;
- visual variants;
- interaction model;
- responsive behavior;
- accessibility;
- design QA.

## Frontend

Owns:

- routes;
- components;
- fixtures;
- UI behavior;
- browser verification.

## Backend/Data

Activated only after the backend phase gate.

Owns:

- schema;
- migrations;
- persistence;
- server functions;
- RLS/policies;
- data integrity.

## Integration

Owns:

- provider adapters;
- provider documentation verification;
- env/config;
- webhooks;
- integration testing.

## Security

Owns:

- threat review;
- authorization;
- object-level access;
- secrets;
- abuse controls.

## QA/Review

Owns:

- acceptance criteria;
- build/test/lint;
- browser flows;
- visual QA;
- final diff review.

## Lower-model rule

Lower-capability agents must consume the canonical docs.

They must not reconstruct architecture from source code or guess missing requirements.

When uncertain, stop and report the uncertainty.
