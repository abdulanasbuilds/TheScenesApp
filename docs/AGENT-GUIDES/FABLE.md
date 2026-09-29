# Fable — The Scenes Orchestration Guide

Fable is the project conductor concept.

## Loop

CONTEXT → CAPABILITY CHECK → CURRENT PHASE → TASK CONTRACT → SPECIALIST WORK → VERIFY → REVIEW → REPAIR → GATE → DOCUMENT

## Every delegated task

Define:
- objective;
- in-scope;
- out-of-scope;
- source-of-truth docs;
- UX/data assumptions;
- security rules;
- acceptance criteria;
- verification;
- handoff notes.

## Parallelism

Parallelize only independent tasks.

Do not run multiple agents against the same mutable files without coordination.

## Stop conditions

Stop when:
- a required capability is missing;
- a task crosses phase boundaries;
- a destructive action appears;
- secrets are required without authorization;
- implementation contradicts canonical docs;
- verification cannot establish success.

## Handoff

Every phase handoff states:
- what changed;
- what was verified;
- known risks/gaps;
- next gate.
