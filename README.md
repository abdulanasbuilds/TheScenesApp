# The Scenes

The Scenes is an African-first, globally expandable platform for learning, teaching, community, discovery, and creator-led education.

## Start here

Read `AGENTS.md` before doing any work.

Then read:

- `docs/README.md`
- `docs/PROJECT-STATUS.md`
- `docs/PROJECT-CONTEXT.md`
- `docs/BUILD-CONTRACT.md`
- `docs/DESIGN-FIRST.md`
- `docs/PHASES.md`
- `docs/INTEGRATIONS.md`
- `docs/SECURITY-RULES.md`

## Current state

Phase 2's complete fixture-backed frontend is accepted. Phase 3A Wave 0 is complete. Wave 1's local
database implementation and tests are committed and pass static checks, but the live local database
gate has not run, so Wave 1 is not yet accepted.

The founder selected lean build + staging mode on 6 November 2026: complete the minimum local safety
gate once, build approved vertical slices, and ask for fresh staging access only when an integration is
ready. Old accounts/credentials are forbidden. No production backend, payment or deployment is
approved. See `docs/PROJECT-STATUS.md`.

## Core stack direction

- TanStack Start
- React
- TypeScript
- TanStack Router
- Tailwind CSS
- Radix/shadcn-style primitives

Provider choices are documented but deliberately gated by phase.

## Rule

Do not infer product requirements from Git history or generated artifacts. Use the canonical project documents.
