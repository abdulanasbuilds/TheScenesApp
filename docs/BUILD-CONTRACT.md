# The Scenes — Build Contract

## Phase discipline

Every task belongs to one current phase.

Do not silently build future phases.

## Design-first

Design and validate the full frontend system before production backend integration.

Use deterministic fixtures and clear adapters/stubs where needed.

## Provider boundaries

External services must sit behind internal interfaces.

```
UI / domain
  ↓
internal service
  ↓
provider adapter
  ↓
external provider
```

Do not spread vendor SDK calls throughout UI files.

## Security

Frontend visibility is never the real authorization boundary.

When backend work begins, enforce authorization on the server/data layer and consider:

- RLS/database policies;
- object-level authorization;
- rate limiting;
- webhook verification;
- audit logging;
- private file access.

## Data integrity

Use relational constraints, explicit statuses, server-side checks, and idempotent provider events.

Never trust client-provided:

- role;
- owner;
- price;
- payout amount;
- access entitlement.

## Mobile and performance

Every screen must have a deliberate mobile composition.

Minimize:

- huge assets;
- unnecessary third-party scripts;
- blocking network work;
- repeated requests;
- unoptimized media.

## Accessibility

At minimum:

- keyboard/focus;
- semantic headings;
- labels;
- readable contrast;
- alt text where applicable;
- clear errors;
- reduced-motion consideration.

## Verification

For every meaningful change:

- run the relevant build/test/lint;
- inspect the diff;
- verify the critical user flow;
- record known gaps.

## Stop conditions

Stop and surface the issue when:

- required capability is unavailable;
- a decision is destructive;
- a secret is required but unauthorized;
- provider behavior is uncertain;
- current task conflicts with canonical docs.
