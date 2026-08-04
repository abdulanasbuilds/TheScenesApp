# Sentinel Security Journal

## 2025-08-04 - Timing Attack Risk and Permissive Bypass in Webhook Signature Verification
**Vulnerability:** Webhook signature verification in `src/lib/payment-adapter.ts` compared the computed HMAC-SHA512 hash with the header-provided signature using standard string equality (`===`), exposing the system to potential timing attacks. Additionally, if the webhook secret `PAYSTACK_WEBHOOK_SECRET` was unconfigured, it bypassed verification entirely with a warning, posing a significant risk if misconfigured in production.
**Learning:** Critical webhook endpoints must always fail securely in production even if configuration is missing. Moreover, signature verification should use a constant-time comparison helper to mitigate side-channel timing attacks.
**Prevention:** 1. Implement a robust, runtime-agnostic constant-time string comparison function (`safeCompare`). 2. Explicitly verify that webhook signature validation is never bypassed in production environments by checking `process.env.NODE_ENV === 'production'`.
