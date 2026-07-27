---
name: SukaSpace payout accounts & settings
description: payout_accounts table, payouts.functions.ts server fns, tabbed settings UI, withdrawal uses saved account
type: feature
---

- `payout_accounts` table (PK creator_email): bank or mobile_money, country/currency, verification_status, is_payout_ready, default_withdrawal_type, payout_notifications. RLS read-own; writes via service role only.
- `src/lib/monetization/payout-accounts.ts` — server-only CRUD; account numbers always masked via `toPublicPayoutAccount()` before reaching the client.
- `src/lib/payouts.functions.ts` — getPayoutSetup, savePayoutAccountFn, savePayoutPreferencesFn, removePayoutAccountFn.
- `requestWithdrawal` bank fields are now optional; destination resolves server-side from the saved payout account. Client never sends account details.
- `src/routes/app.settings.tsx` is a 7-tab system: Profile, Account, Payouts, Billing, Notifications, Security, Integrations.
- `src/lib/banks.ts` — NG/GH/KE/ZA bank + mobile money catalog for payout setup.
