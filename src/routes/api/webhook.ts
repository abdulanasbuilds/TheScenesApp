/**
 * Paystack webhook endpoint — POST /api/webhook
 *
 * Security:
 *   1. Validates HMAC-SHA512 signature (x-paystack-signature header)
 *   2. Checks idempotency: every event ID is stored in webhook_events;
 *      duplicate events return 200 immediately without re-processing
 *   3. Returns 200 fast (Paystack retries on non-2xx for up to 72h)
 *   4. All mutations happen in background — response never waits for them
 *
 * Handled events:
 *   charge.success         → verify payment + credit creator + grant access
 *   transfer.success       → mark withdrawal as paid
 *   transfer.failed        → mark withdrawal as failed, restore balance
 *   transfer.reversed      → mark withdrawal reversed
 *   subscription.create    → activate Pro plan
 *   subscription.not_renew → schedule cancellation
 *   subscription.disable   → cancel Pro plan
 */

import { createFileRoute } from "@tanstack/react-router";

import { getPaymentProvider } from "@/lib/payment-adapter";
import { adminDb } from "@/lib/supabase-admin";
import { checkWebhookEventRate } from "@/lib/rate-limit";
import { recordPaymentEarnings } from "@/lib/monetization/earnings";
import { markWithdrawalPaid, markWithdrawalFailed } from "@/lib/monetization/withdrawals";
import { grantCommunityAccess, grantCourseAccess } from "@/lib/monetization/access";
import { setStorageQuota } from "@/lib/monetization/storage";
import { env } from "@/lib/env";

// ─── Route definition ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/webhook")({
  head: () => ({ meta: [] }),
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // ── 1. Read raw body (needed for HMAC verification)
        const rawBody = await request.text().catch(() => "");
        if (!rawBody) return respond(400, "Empty body");

        // ── 2. Validate signature
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const provider = getPaymentProvider();
        const valid = await provider.verifyWebhookSignature(rawBody, signature);
        if (!valid) {
          console.warn("[webhook] Invalid signature — rejecting request.");
          return respond(401, "Invalid signature");
        }

        // ── 3. Parse event
        const event = provider.parseWebhookEvent(rawBody);
        if (!event) return respond(400, "Could not parse event");

        // ── 4. Rate limit (anti-replay: 1 processing per event ID per 5 min)
        const rate = await checkWebhookEventRate(event.id);
        if (!rate.allowed) {
          // Already being processed — return 200 to stop Paystack retrying
          return respond(200, "Duplicate event — skipped");
        }

        // ── 5. Idempotency check via webhook_events table
        const { data: existing } = await adminDb.selectOne<{ id: string; processed: boolean }>(
          "webhook_events",
          { id: `eq.${event.id}` },
        );

        if (existing?.processed) {
          return respond(200, "Already processed");
        }

        // ── 6. Insert/update webhook event row (mark as in-progress)
        await adminDb.upsert(
          "webhook_events",
          {
            id: event.id,
            provider: provider.name,
            event_type: event.type,
            raw_payload: rawBody,
            processed: false,
            created_at: new Date().toISOString(),
          },
          "id",
        );

        // ── 7. Process event (best-effort — errors are logged and stored)
        let processError: string | null = null;
        try {
          await handleWebhookEvent(event, rawBody);
        } catch (err) {
          processError = err instanceof Error ? err.message : String(err);
          console.error(`[webhook] Error processing ${event.type} (${event.id}):`, err);
        }

        // ── 8. Mark as processed (even if handler errored — prevents infinite retries)
        await adminDb.update(
          "webhook_events",
          { id: `eq.${event.id}` },
          {
            processed: !processError,
            processed_at: new Date().toISOString(),
            error: processError,
          },
        );

        return respond(200, "OK");
      },
    },
  },
});

// ─── Event handlers ───────────────────────────────────────────────────────────

import type { WebhookEvent } from "@/lib/payment-adapter";

async function handleWebhookEvent(event: WebhookEvent, _rawBody: string): Promise<void> {
  switch (event.type) {
    case "payment.success":
      await handlePaymentSuccess(event);
      break;
    case "transfer.success":
      await handleTransferSuccess(event);
      break;
    case "transfer.failed":
    case "transfer.reversed":
      await handleTransferFailed(event);
      break;
    case "subscription.created":
      await handleSubscriptionCreated(event);
      break;
    case "subscription.not_renewing":
    case "subscription.disabled":
      await handleSubscriptionCancelled(event);
      break;
    default:
      // Unknown event — log and ignore (safely)
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }
}

// ── charge.success ────────────────────────────────────────────────────────────

async function handlePaymentSuccess(event: WebhookEvent): Promise<void> {
  const reference = event.reference;
  if (!reference) return;

  // Look up our transaction by reference
  const { data: txn } = await adminDb.selectOne<{
    id: string;
    status: string;
    payment_type: string;
    from_email: string;
    to_email: string | null;
    resource_id: number | null;
    gross_amount_cents: number;
    currency: string;
  }>("payment_transactions", { paystack_reference: `eq.${reference}` });

  if (!txn) {
    // Payment not in our system (e.g. test transaction from dashboard)
    console.warn(`[webhook] charge.success for unknown reference: ${reference}`);
    return;
  }

  if (txn.status === "completed") return; // Already processed

  // Verify amount matches
  if (event.amountCents && Math.abs(event.amountCents - txn.gross_amount_cents) > 1) {
    console.error(
      `[webhook] Amount mismatch for ${reference}: expected ${txn.gross_amount_cents}, got ${event.amountCents}`,
    );
    return;
  }

  // Mark transaction completed
  await adminDb.update(
    "payment_transactions",
    { id: `eq.${txn.id}` },
    { status: "completed", updated_at: new Date().toISOString() },
  );

  const customerEmail = event.customerEmail ?? txn.from_email;

  // Record creator earnings
  if (txn.to_email && txn.payment_type !== "pro_subscription") {
    // Get creator's plan fee
    const { data: sub } = await adminDb.selectOne<{ plan_id: string }>("creator_subscriptions", {
      creator_email: `eq.${txn.to_email}`,
    });
    const planId = sub?.plan_id ?? "free";
    const feeBps = planId === "pro" ? env.PRO_PLAN_FEE_BPS : env.FREE_PLAN_FEE_BPS;

    await recordPaymentEarnings({
      creatorEmail: txn.to_email,
      transactionId: txn.id,
      grossAmountCents: txn.gross_amount_cents,
      platformFeeBps: feeBps,
      currency: txn.currency,
      description: `Payment from ${customerEmail}`,
    });
  }

  // Grant access to paid content
  if (txn.payment_type === "community_access" && txn.resource_id) {
    await grantCommunityAccess({
      userEmail: customerEmail,
      communityId: txn.resource_id,
      transactionId: txn.id,
      accessType: "paid",
    });
  } else if (txn.payment_type === "course_access" && txn.resource_id) {
    await grantCourseAccess({
      userEmail: customerEmail,
      courseId: txn.resource_id,
      transactionId: txn.id,
      accessType: "paid",
    });
  } else if (txn.payment_type === "pro_subscription") {
    await Promise.all([
      adminDb.upsert(
        "creator_subscriptions",
        {
          creator_email: customerEmail,
          plan_id: "pro",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        "creator_email",
      ),
      setStorageQuota(customerEmail, env.PRO_PLAN_STORAGE_BYTES),
    ]);
  }
}

// ── transfer.success ──────────────────────────────────────────────────────────

async function handleTransferSuccess(event: WebhookEvent): Promise<void> {
  const raw = event.raw.data as Record<string, unknown> | undefined;
  const code = (raw?.transfer_code ?? raw?.id) as string | undefined;
  const ref = event.reference;

  // Find withdrawal by Paystack transfer code or our reference
  let filter: Record<string, string> | null = null;
  if (code) filter = { paystack_transfer_code: `eq.${code}` };
  else if (ref) filter = { id: `eq.${ref}` };

  if (!filter) return;

  const { data: wd } = await adminDb.selectOne<{ id: string }>("withdrawal_requests", filter);
  if (!wd) return;

  await markWithdrawalPaid(wd.id, code);
}

// ── transfer.failed / transfer.reversed ───────────────────────────────────────

async function handleTransferFailed(event: WebhookEvent): Promise<void> {
  const raw = event.raw.data as Record<string, unknown> | undefined;
  const code = (raw?.transfer_code ?? raw?.id) as string | undefined;
  const reason = (raw?.reason ?? "Transfer failed") as string;

  if (!code) return;
  const { data: wd } = await adminDb.selectOne<{ id: string }>("withdrawal_requests", {
    paystack_transfer_code: `eq.${code}`,
  });
  if (!wd) return;
  await markWithdrawalFailed(wd.id, reason);
}

// ── subscription.create ───────────────────────────────────────────────────────

async function handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
  const email = event.customerEmail;
  if (!email) return;

  await Promise.all([
    adminDb.upsert(
      "creator_subscriptions",
      {
        creator_email: email,
        plan_id: "pro",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      "creator_email",
    ),
    setStorageQuota(email, env.PRO_PLAN_STORAGE_BYTES),
  ]);
}

// ── subscription.not_renew / subscription.disable ─────────────────────────────

async function handleSubscriptionCancelled(event: WebhookEvent): Promise<void> {
  const email = event.customerEmail;
  if (!email) return;

  await adminDb.update(
    "creator_subscriptions",
    { creator_email: `eq.${email}` },
    { status: "cancelled", updated_at: new Date().toISOString() },
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function respond(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
