# The Scenes — CI Contract

## Purpose

The repository should reject common architectural and documentation regressions before they reach review.

## Required checks

Every pull request and push to protected branches should run:

1. dependency install from the lockfile;
2. lint;
3. TypeScript typecheck;
4. production build;
5. documentation/contract integrity checks.

## Contract integrity checks

CI should fail if:
- `AGENTS.md` is missing;
- any duplicate root agent-contract files are introduced;
- provider-specific instruction folders such as `.lovable/` are introduced;
- forbidden branding strings appear in tracked project files;
- production secrets are committed;
- generated route trees are manually modified when project rules forbid it.

## Frontend-stage rule

During the frontend-first phase, CI does not require real provider credentials.

Provider integrations must be represented by interfaces/mocks until the relevant phase gate opens.

## Security-stage rule

Once backend integrations begin, CI should additionally include:
- dependency audit;
- secret scanning;
- migration checks;
- policy/RLS tests;
- API/integration tests;
- browser smoke tests for critical flows.

## Release gate

Do not call a phase complete solely because CI is green.

A phase also requires:
- scope review;
- visual/mobile QA;
- security review where relevant;
- documentation update;
- acceptance criteria evidence.
