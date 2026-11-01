# The Scenes — Security Rules

## Current stage

No production secrets, production auth, production database, production RLS, production payments, or production webhooks before the frontend/design gate.

## Backend baseline

When activated:

- server-side authorization;
- database/RLS controls;
- input validation;
- object-level authorization;
- secure sessions;
- rate limiting;
- webhook signature verification;
- idempotent event handling;
- audit logging.

## Files

For private uploads:

- validate type and size;
- validate ownership;
- control access URLs;
- never trust client ownership claims;
- record resource/object relationships.

## Secrets

Never commit or hardcode:

- service keys;
- webhook secrets;
- bot tokens;
- provider credentials.

Never send privileged credentials to the browser.

## AI privacy

Minimize personal data sent to AI providers.

Do not use private learner/payment data for model training without an approved legal basis and explicit product policy.

Consequential automated decisions require human review.

## Abuse

The platform will need:

- reports;
- blocking;
- moderation;
- rate controls;
- audit trails;
- appeals where appropriate.

## Minors and safeguarding

Features involving minors require specific legal and operational review before public enablement, particularly direct messaging, public profiles, instructor interaction, live sessions, and payments.
