# Sentinel Security Journal

## 2025-08-04 - Timing Attack Risk and Permissive Bypass in Webhook Signature Verification
**Vulnerability:** Webhook signature verification in `src/lib/payment-adapter.ts` compared the computed HMAC-SHA512 hash with the header-provided signature using standard string equality (`===`), exposing the system to potential timing attacks. Additionally, if the webhook secret `PAYSTACK_WEBHOOK_SECRET` was unconfigured, it bypassed verification entirely with a warning, posing a significant risk if misconfigured in production.
**Learning:** Critical webhook endpoints must always fail securely in production even if configuration is missing. Moreover, signature verification should use a constant-time comparison helper to mitigate side-channel timing attacks.
**Prevention:** 1. Implement a robust, runtime-agnostic constant-time string comparison function (`safeCompare`). 2. Explicitly verify that webhook signature validation is never bypassed in production environments by checking `process.env.NODE_ENV === 'production'`.

## 2026-08-06 - Broken Object-Level Authorization (BOLA) and Cross-Tenant Data Leakage in Private File Downloads
**Vulnerability:** The server function `getFileDownloadUrl` in `src/lib/monetization.functions.ts` verified that the requesting user had access to the specified community or course resource, but did not verify if the requested private file actually belonged to the creator of that specific resource. An attacker who joined any community could download *any* private file belonging to *any* other creator across the platform by specifying that file's key alongside their joined resource's ID.
**Learning:** Checking access to an object (such as a community or course) is not enough to grant access to nested or linked entities (such as private storage files) unless a strong relationship binding is enforced in the logic.
**Prevention:** Always extract and validate owner/tenant identity from the target resource's properties (such as the file's creator email from the file key) and verify it matches the resource owner/tenant identity retrieved from the database before granting access.

## 2026-08-07 - Message and Notification Spoofing via Untrusted Server Function Payload
**Vulnerability:** The client-callable server function `onMemberJoin` in `src/lib/autodm.functions.ts` trusted all client-supplied parameters (`creatorEmail`, `creatorName`, `communityTitle`) blindly. This allowed authenticated users to trigger direct messages and in-app notifications on behalf of any community creator to any user simply by crafting custom API payloads.
**Learning:** Client-callable server functions must treat all input parameters as untrusted. Any parameter asserting membership, ownership, or metadata details must be verified directly against the database using a secure server-side admin client.
**Prevention:** Fetch verified community metadata from the database using `adminDb` and enforce a strict membership verification check (`joined_communities` table) prior to granting access to communication actions like automated DMs or notifications.
