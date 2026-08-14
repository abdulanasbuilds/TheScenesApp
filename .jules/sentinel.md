# Sentinel Security Journal

## 2025-08-04 - Timing Attack Risk and Permissive Bypass in Webhook Signature Verification
**Vulnerability:** Webhook signature verification in `src/lib/payment-adapter.ts` compared the computed HMAC-SHA512 hash with the header-provided signature using standard string equality (`===`), exposing the system to potential timing attacks. Additionally, if the webhook secret `PAYSTACK_WEBHOOK_SECRET` was unconfigured, it bypassed verification entirely with a warning, posing a significant risk if misconfigured in production.
**Learning:** Critical webhook endpoints must always fail securely in production even if configuration is missing. Moreover, signature verification should use a constant-time comparison helper to mitigate side-channel timing attacks.
**Prevention:** 1. Implement a robust, runtime-agnostic constant-time string comparison function (`safeCompare`). 2. Explicitly verify that webhook signature validation is never bypassed in production environments by checking `process.env.NODE_ENV === 'production'`.

## 2026-08-06 - Broken Object-Level Authorization (BOLA) and Cross-Tenant Data Leakage in Private File Downloads
**Vulnerability:** The server function `getFileDownloadUrl` in `src/lib/monetization.functions.ts` verified that the requesting user had access to the specified community or course resource, but did not verify if the requested private file actually belonged to the creator of that specific resource. An attacker who joined any community could download *any* private file belonging to *any* other creator across the platform by specifying that file's key alongside their joined resource's ID.
**Learning:** Checking access to an object (such as a community or course) is not enough to grant access to nested or linked entities (such as private storage files) unless a strong relationship binding is enforced in the logic.
**Prevention:** Always extract and validate owner/tenant identity from the target resource's properties (such as the file's creator email from the file key) and verify it matches the resource owner/tenant identity retrieved from the database before granting access.

## 2026-08-07 - Race Condition and Duplicate Crediting Risk in Creator Earnings Ledger
**Vulnerability:** `recordPaymentEarnings` in `src/lib/monetization/earnings.ts` inserted revenue and fee entries into `earnings_ledger` without checking if earnings had already been credited for the given transaction ID. If a client payment verification call and an asynchronous webhook event processed concurrently for the same reference, `recordPaymentEarnings` could execute twice and double-credit the creator's balance.
**Learning:** Financial ledger recording functions must independently enforce idempotency at the database or logic layer, rather than assuming caller-level idempotency or single-threaded execution.
**Prevention:** Query `earnings_ledger` for an existing entry matching the `transaction_id` and entry type (`revenue`) before inserting new rows, returning early if already recorded.
