---
name: SukaSpace monetization engine
description: Full payment/earnings/withdrawal/storage/access-control layer built in this session. Architecture decisions and integration points.
---

## What was built

Complete monetization engine — all server-side, TypeScript-clean, Cloudflare Worker compatible.

### File map

| File                                  | Role                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/lib/env.ts`                      | Centralized typed env var access — all fees/limits read from env (never hardcoded)             |
| `supabase/monetization.sql`           | 9 new tables + indexes + RLS + `creator_wallet` view (additive, safe to re-run)                |
| `src/lib/plans.ts`                    | Plan definitions, fee calc helpers (`calcPlatformFee`, `calcNetAmount`, `calcWithdrawalFee`)   |
| `src/lib/supabase-admin.ts`           | Admin REST client (service-role, bypasses RLS) — fetch-based, no SDK import risk               |
| `src/lib/rate-limit.ts`               | Redis rate limiting via Upstash REST API — degrades gracefully if Redis not configured         |
| `src/lib/payment-adapter.ts`          | Provider-agnostic interface; `PaystackProvider` implements it; factory: `getPaymentProvider()` |
| `src/lib/monetization/earnings.ts`    | Append-only ledger: `recordPaymentEarnings`, `getEarningsSummary`, `getCreatorBalance`         |
| `src/lib/monetization/withdrawals.ts` | State machine: pending→processing→paid/failed; `createWithdrawalRequest`, balance guard        |
| `src/lib/monetization/storage.ts`     | R2 presigned URLs (SigV4 Web Crypto); quota check; `buildFileKey`, `isValidFileKey`            |
| `src/lib/monetization/access.ts`      | `checkCommunityAccess`, `checkCourseAccess`, `grantCommunityAccess`, `grantCourseAccess`       |
| `src/lib/monetization.functions.ts`   | TanStack `createServerFn` exports: init, verify, withdraw, dashboard, access check, file URLs  |
| `src/routes/api/webhook.ts`           | POST `/api/webhook` — HMAC-SHA512 verified, idempotent, handles 8 event types                  |
| `src/routes/app.billing.tsx`          | Creator billing UI: plan banner, earnings stats, withdrawal form, storage quota, history       |

### Key architectural rules

**Payment flow** (secure):

1. Client calls `initializePayment` → server creates pending `payment_transactions` row, returns reference + amount
2. Client opens Paystack popup with server-set amount (client cannot change price)
3. Client calls `verifyAndRecordPayment` with reference → server verifies with Paystack, credits ledger, grants access

**Why:** Amount is always server-authoritative. Client never sends a price.

**Earnings ledger** (append-only):

- Two entries per payment: `revenue` (positive) + `platform_fee` (negative)
- Withdrawal creates `withdrawal` entry at processing time, not request time
- Balance = SUM(amount_cents) across all entries
- `creator_wallet` view computes this efficiently per creator

**Why:** Immutable audit trail; balance derivable without a separate balance column.

**Webhook idempotency:**

1. Rate limiter rejects duplicate event IDs within 5-minute window
2. `webhook_events` table stores all event IDs; processed=true prevents re-runs
3. Returns 200 always (Paystack retries on non-2xx for 72h)

**Why:** Paystack may deliver the same webhook multiple times.

### New SQL tables (run supabase/monetization.sql)

- `subscription_plans` — seeded with free/pro rows
- `creator_subscriptions` — per-creator current plan
- `payment_transactions` — enhanced payment record with fee tracking
- `earnings_ledger` — append-only financial journal
- `withdrawal_requests` — withdrawal state machine
- `storage_usage` — per-creator R2 quota
- `course_access` — granted access after payment
- `community_access` — granted access after payment
- `webhook_events` — idempotency log

### Environment variables added

Server-only (no VITE_ prefix):

- `SUPABASE_SERVICE_ROLE_KEY` (alias: `SUPABASE_SERVICE_KEY`)
- `PAYSTACK_WEBHOOK_SECRET` — HMAC-SHA512 signing secret from Paystack dashboard
- `REDIS_URL`, `REDIS_TOKEN` — Upstash REST API
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`
- `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`
- Fee config: `FREE_PLAN_PLATFORM_FEE_BPS`, `PRO_PLAN_PLATFORM_FEE_BPS`, `PRO_PLAN_PRICE_CENTS`
- `PRO_PLAN_STORAGE_BYTES`, `FREE_PLAN_STORAGE_BYTES`
- `WITHDRAWAL_FIXED_FEE_CENTS`, `WITHDRAWAL_PERCENT_FEE_BPS`, `MIN_WITHDRAWAL_AMOUNT_CENTS`
- `APP_URL`

### Outstanding integration steps (not code work)

1. Run `supabase/monetization.sql` in Supabase dashboard SQL Editor
2. Set `PAYSTACK_WEBHOOK_SECRET` in Cloudflare dashboard
3. Register webhook URL in Paystack dashboard: `https://yourdomain.com/api/webhook`
4. Set Redis vars (Upstash recommended for Cloudflare edge)
5. Set R2 vars if Pro file hosting is needed (optional for launch)
6. `creator_subscriptions` rows are created lazily on first payment — no seed needed
