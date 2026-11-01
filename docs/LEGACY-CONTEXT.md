# The Scenes — Legacy Context

## Purpose

This document records the historical SukaSpace context that exists in the repository's Git history and explains why it is treated as reference material, not current implementation.

## History

The repository began as **SukaSpace**, an earlier version of the product concept. The SukaSpace codebase included:

- Supabase authentication integration
- Database schema with tables for users, communities, courses, memberships, earnings, withdrawals, and feedback
- Monetization wizard with 3% platform fee
- Earnings ledger with idempotency handling
- Withdrawal balance management with race condition fixes
- Member join flows
- Feedback rate limiting
- Webhook security
- Auto-DM spoofing prevention
- Payment processing (Paystack references)
- Settings consolidation and PWA refresh
- Supabase migrations
- Security sentinel branches

## What was removed

At commit `894d3f4`, the repository was intentionally reset:

> "chore: reset application code and legacy assets for fresh The Scenes start"

All SukaSpace implementation files were removed from the `main` branch. The Git history preserves the old code for reference, but the working tree is clean.

## Why it was reset

The SukaSpace implementation:

1. Was built around assumptions that are no longer current
2. Mixed frontend and backend concerns before the design gate was established
3. Hardcoded provider integrations without adapter abstraction
4. Used naming, branding, and routing from the old product identity
5. Made payment assumptions before the payment architecture was properly designed
6. Included database schemas that do not match the current domain model
7. Had security patterns that need fresh review under the current security rules

## Legacy material classification

| Legacy item                      | Current status     | Action                                                       |
| -------------------------------- | ------------------ | ------------------------------------------------------------ |
| SukaSpace branding/naming        | REJECTED           | Replaced by "The Scenes" (ADR-001)                           |
| Old Supabase Auth integration    | LEGACY IMPL DETAIL | Re-implemented in Phase 3 with current architecture          |
| Old database schema              | LEGACY IMPL DETAIL | New schema designed from current requirements                |
| Old payment/Paystack integration | LEGACY IMPL DETAIL | Payments gated to Phase 7 (ADR-007)                          |
| Monetization wizard (3% fee)     | LEGACY IMPL DETAIL | Revenue split is an open decision (OPD-004)                  |
| Earnings ledger                  | LEGACY IMPL DETAIL | Good patterns; re-implement with current payout architecture |
| Withdrawal race condition fixes  | LEGACY IMPL DETAIL | Useful reference for payout implementation                   |
| Auto-DM spoofing prevention      | LEGACY IMPL DETAIL | Useful security reference for Phase 5                        |
| Webhook security                 | LEGACY IMPL DETAIL | Useful security reference for Phase 7                        |
| Rate limiting patterns           | LEGACY IMPL DETAIL | Useful reference for Phase 4                                 |
| Old route structure              | LEGACY IMPL DETAIL | New routes from current information architecture             |
| Old localStorage state           | LEGACY IMPL DETAIL | Not carried forward                                          |
| Old agent memory/plans           | LEGACY IMPL DETAIL | Replaced by current documentation                            |

## What to preserve from legacy

The following patterns from the SukaSpace implementation are worth studying when the relevant phase arrives:

### Idempotency patterns

The earnings ledger used event-key-based idempotency. This principle carries forward into referral events, payment webhooks, and payout calculations.

### Race condition handling

Withdrawal balance operations had race condition fixes. These patterns are relevant to the payout system in Phase 8.

### Security patterns

Auto-DM spoofing prevention, webhook verification, and feedback rate limiting contain useful security thinking. Review these patterns when building the messaging, webhook, and rate-limiting systems.

### Fee calculation

The 3% platform fee implementation shows the calculation flow. The exact percentage is now an open decision (OPD-004), but the calculation pattern is a useful reference.

## What NOT to carry forward

- SukaSpace naming in code, routes, or UI
- Old database schema as-is (must be redesigned from current requirements)
- Old payment provider assumptions (Paystack may still be selected, but through the proper evaluation process)
- Old localStorage-based state management
- Old agent instruction files
- Old route assumptions
- Direct Supabase SDK usage in UI components (must go through adapter layer)
- Any assumption that old code is automatically correct for The Scenes

## Agent rule

When a future agent encounters SukaSpace references in Git history:

1. Understand the historical context
2. Extract useful patterns if relevant to the current task
3. Re-implement using the current architecture, naming, and security rules
4. Do not copy-paste old code without adaptation
5. Do not restore old schemas, routes, or branding

## Remote branches

The Git remote may contain old branches such as:

- `feature/monetization-wizard-payouts-*`
- `fix-earnings-idempotency-*`
- `fix/ledger-earnings-*`
- `fix/withdrawal-race-conditions-*`
- `sentinel-*`
- `settings-consolidation-*`
- `setup-supabase-migrations-*`
- `v0/*`

These branches are historical. Do not merge them into `main`. They may be consulted as reference when the corresponding feature is being built in the current architecture.
