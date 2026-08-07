/**
 * Monetization server functions.
 *
 * All handlers run on the server — secrets never reach the browser.
 * Every payment path is verified server-side before access is granted.
 * Every operation that mutates state is rate-limited and idempotent.
 *
 * Import these in client components; the `createServerFn` boundary ensures
 * the implementations never bundle into the client.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { getPaymentProvider } from "@/lib/payment-adapter";
import { adminDb } from "@/lib/supabase-admin";
import { env } from "@/lib/env";
import { checkPaymentVerifyRate, checkWithdrawalRate, checkFileAccessRate } from "@/lib/rate-limit";
import { calcPlatformFee, calcNetAmount } from "@/lib/plans";
import {
  recordPaymentEarnings,
  getEarningsSummary,
  getEarningsHistory,
} from "@/lib/monetization/earnings";
import { createWithdrawalRequest, getWithdrawalHistory } from "@/lib/monetization/withdrawals";
import {
  checkCommunityAccess,
  checkCourseAccess,
  grantCommunityAccess,
  grantCourseAccess,
} from "@/lib/monetization/access";
import { getPayoutAccount } from "@/lib/monetization/payout-accounts";

import {
  getStorageUsage,
  checkUploadAllowed,
  generatePresignedUrl,
  buildFileKey,
  isValidFileKey,
  setStorageQuota,
} from "@/lib/monetization/storage";
import { sendStorageQuotaWarningEmail } from "@/lib/email.functions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getCreatorPlanFeeBps(creatorEmail: string): Promise<number> {
  const { data } = await adminDb.selectOne<{ plan_id: string }>("creator_subscriptions", {
    creator_email: `eq.${creatorEmail}`,
  });
  const planId = data?.plan_id ?? "free";
  return planId === "pro" ? env.PRO_PLAN_FEE_BPS : env.FREE_PLAN_FEE_BPS;
}

// ─── 1. Initialize payment ────────────────────────────────────────────────────
// Creates a pending transaction row and returns the reference + amount
// for the client to use in the Paystack popup. The amount is set server-side
// and cannot be manipulated by the client.

const initPaymentSchema = z.object({
  payerEmail: z.string().email(),
  paymentType: z.enum(["community_access", "course_access", "pro_subscription"]),
  resourceId: z.number().int().positive().optional(),
  currency: z.string().default("NGN"),
});

export type InitPaymentResult =
  | { ok: true; reference: string; amountCents: number; currency: string; transactionId: string }
  | { ok: false; error: string };

export const initializePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(initPaymentSchema)
  .handler(async ({ data, context }): Promise<InitPaymentResult> => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.payerEmail) {
      return { ok: false, error: "Unauthorized: Payer email mismatch." };
    }

    // Rate limit: prevent initialization spam
    const rate = await checkPaymentVerifyRate(data.payerEmail);
    if (!rate.allowed) {
      return { ok: false, error: "Too many payment attempts. Please wait a moment." };
    }

    let amountCents: number;
    let toEmail: string | null = null;
    let resourceType: "community" | "course" | "subscription" | null = null;

    if (data.paymentType === "pro_subscription") {
      amountCents = env.PRO_PLAN_PRICE_CENTS;
      resourceType = "subscription";
    } else if (data.paymentType === "community_access") {
      if (!data.resourceId)
        return { ok: false, error: "resourceId is required for community_access." };
      const { data: comm } = await adminDb.selectOne<{
        price: string | null;
        creator_email: string;
        tag: string;
      }>("communities", { id: `eq.${data.resourceId}` });
      if (!comm) return { ok: false, error: "Community not found." };
      if (comm.tag !== "PAID")
        return { ok: false, error: "This community is free — no payment needed." };
      // Check if already has access
      const existing = await checkCommunityAccess(data.payerEmail, data.resourceId);
      if (existing.hasAccess)
        return { ok: false, error: "You already have access to this community." };
      // Parse price string ("₦5,000/mo" → amount in kobo)
      const raw = (comm.price ?? "0").replace(/[^0-9.]/g, "");
      amountCents = Math.round(parseFloat(raw || "0") * 100);
      toEmail = comm.creator_email;
      resourceType = "community";
    } else if (data.paymentType === "course_access") {
      if (!data.resourceId)
        return { ok: false, error: "resourceId is required for course_access." };
      const { data: course } = await adminDb.selectOne<{ creator_email: string }>("courses", {
        id: `eq.${data.resourceId}`,
      });
      if (!course) return { ok: false, error: "Course not found." };
      const existing = await checkCourseAccess(data.payerEmail, data.resourceId);
      if (existing.hasAccess)
        return { ok: false, error: "You already have access to this course." };
      // TODO: when courses have explicit prices, read from there
      amountCents = 0; // placeholder
      toEmail = course.creator_email;
      resourceType = "course";
    } else {
      return { ok: false, error: "Unknown payment type." };
    }

    if (amountCents <= 0) return { ok: false, error: "Invalid payment amount." };

    // Generate idempotent reference and transaction ID
    const reference = `suka_${newId("pay")}`;
    const transactionId = newId("txn");

    // Record pending transaction
    const feeBps = toEmail ? await getCreatorPlanFeeBps(toEmail) : 0;
    const feeCents = calcPlatformFee(amountCents, feeBps);
    const netCents = calcNetAmount(amountCents, feeBps);

    const { error } = await adminDb.insert("payment_transactions", {
      id: transactionId,
      paystack_reference: reference,
      payment_type: data.paymentType,
      from_email: data.payerEmail,
      to_email: toEmail,
      resource_id: data.resourceId ?? null,
      resource_type: resourceType,
      gross_amount_cents: amountCents,
      platform_fee_cents: feeCents,
      net_amount_cents: netCents,
      currency: data.currency,
      status: "pending",
      provider: "paystack",
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[monetization] Failed to create pending transaction:", error.message);
      return { ok: false, error: "Could not initialize payment. Please try again." };
    }

    return { ok: true, reference, amountCents, currency: data.currency, transactionId };
  });

// ─── 2. Verify and record payment ─────────────────────────────────────────────
// Called by the client after the Paystack popup fires onSuccess.
// Verifies with Paystack, records earnings, grants access. Idempotent.

const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
  transactionId: z.string().min(1),
  userEmail: z.string().email(),
});

export type VerifyPaymentResult =
  { ok: true; accessGranted: boolean; message: string } | { ok: false; error: string };

export const verifyAndRecordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(verifyPaymentSchema)
  .handler(async ({ data, context }): Promise<VerifyPaymentResult> => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.userEmail) {
      return { ok: false, error: "Unauthorized: User email mismatch." };
    }

    // Rate limit
    const rate = await checkPaymentVerifyRate(data.userEmail);
    if (!rate.allowed) {
      return { ok: false, error: "Too many verification attempts. Please wait." };
    }

    // Fetch the pending transaction
    const { data: txn } = await adminDb.selectOne<{
      id: string;
      status: string;
      payment_type: string;
      from_email: string;
      to_email: string | null;
      resource_id: number | null;
      resource_type: string | null;
      gross_amount_cents: number;
      platform_fee_cents: number;
      currency: string;
    }>("payment_transactions", {
      id: `eq.${data.transactionId}`,
      paystack_reference: `eq.${data.reference}`,
    });

    if (!txn) return { ok: false, error: "Transaction not found. Please contact support." };

    // Idempotency: already processed
    if (txn.status === "completed") {
      return {
        ok: true,
        accessGranted: true,
        message: "Payment already processed. Access granted.",
      };
    }
    if (txn.status === "failed") {
      return { ok: false, error: "This payment has already failed. Please start a new payment." };
    }

    // Verify with provider
    const provider = getPaymentProvider();
    const verified = await provider.verifyPayment(data.reference);

    if (!verified.ok) {
      await adminDb.update(
        "payment_transactions",
        { id: `eq.${data.transactionId}` },
        { status: "failed", updated_at: new Date().toISOString() },
      );
      return { ok: false, error: verified.error };
    }

    // Confirm amounts match (within 1 unit — avoid floating point issues)
    if (Math.abs(verified.amountCents - txn.gross_amount_cents) > 1) {
      console.error(
        `[monetization] Amount mismatch: expected ${txn.gross_amount_cents}, got ${verified.amountCents}`,
      );
      return { ok: false, error: "Payment amount mismatch. Please contact support." };
    }

    // Mark transaction completed
    await adminDb.update(
      "payment_transactions",
      { id: `eq.${data.transactionId}` },
      { status: "completed", updated_at: new Date().toISOString() },
    );

    // Record earnings in ledger (only if payment goes to a creator)
    if (txn.to_email && txn.payment_type !== "pro_subscription") {
      const feeBps = await getCreatorPlanFeeBps(txn.to_email);
      await recordPaymentEarnings({
        creatorEmail: txn.to_email,
        transactionId: txn.id,
        grossAmountCents: txn.gross_amount_cents,
        platformFeeBps: feeBps,
        currency: txn.currency,
        description: `Payment from ${data.userEmail}`,
      });
    }

    // Grant access
    let accessGranted = false;
    if (txn.payment_type === "community_access" && txn.resource_id) {
      const result = await grantCommunityAccess({
        userEmail: data.userEmail,
        communityId: txn.resource_id,
        transactionId: txn.id,
        accessType: "paid",
      });
      accessGranted = result.ok;
    } else if (txn.payment_type === "course_access" && txn.resource_id) {
      const result = await grantCourseAccess({
        userEmail: data.userEmail,
        courseId: txn.resource_id,
        transactionId: txn.id,
        accessType: "paid",
      });
      accessGranted = result.ok;
    } else if (txn.payment_type === "pro_subscription") {
      // Activate Pro plan
      const proStorageBytes = env.PRO_PLAN_STORAGE_BYTES;
      await Promise.all([
        adminDb.upsert(
          "creator_subscriptions",
          {
            creator_email: data.userEmail,
            plan_id: "pro",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          "creator_email",
        ),
        setStorageQuota(data.userEmail, proStorageBytes),
      ]);
      accessGranted = true;
    }

    return {
      ok: true,
      accessGranted,
      message: "Payment verified and access granted.",
    };
  });

// ─── 3. Request withdrawal ────────────────────────────────────────────────────

const withdrawalSchema = z.object({
  creatorEmail: z.string().email(),
  amountCents: z.number().int().positive(),
  currency: z.string().default("NGN"),
  withdrawalType: z.enum(["standard", "instant"]).default("standard"),
  // Bank details are optional — when omitted, the creator's saved payout
  // account is used. The client never needs to hold account details.
  bankCode: z.string().min(1).optional(),
  bankAccountNumber: z.string().min(1).optional(),
  bankAccountName: z.string().min(1).optional(),
});

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(withdrawalSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      return { ok: false, error: "Unauthorized: Creator email mismatch." };
    }

    // Rate limit: max 3 withdrawal requests per creator per hour
    const rate = await checkWithdrawalRate(data.creatorEmail);
    if (!rate.allowed) {
      return {
        ok: false,
        error: `Too many withdrawal requests. Please wait ${rate.retryAfterSeconds} seconds.`,
      };
    }

    // Check plan allows instant withdrawal
    if (data.withdrawalType === "instant") {
      const { data: sub } = await adminDb.selectOne<{ plan_id: string }>("creator_subscriptions", {
        creator_email: `eq.${data.creatorEmail}`,
      });
      if ((sub?.plan_id ?? "free") !== "pro") {
        return { ok: false, error: "Instant withdrawal requires a Pro plan." };
      }
    }

    // Resolve destination from the saved payout account (server-authoritative).
    const account = await getPayoutAccount(data.creatorEmail);
    const bankCode = data.bankCode ?? account?.bankCode ?? account?.mobileMoneyNetwork;
    const accNumber =
      data.bankAccountNumber ?? account?.accountNumber ?? account?.mobileMoneyNumber;
    const accName = data.bankAccountName ?? account?.accountName;

    if (!bankCode || !accNumber || !accName) {
      return { ok: false, error: "Add a payout account before requesting a withdrawal." };
    }

    return createWithdrawalRequest({
      creatorEmail: data.creatorEmail,
      amountCents: data.amountCents,
      currency: data.currency,
      withdrawalType: data.withdrawalType,
      bankCode,
      bankAccountNumber: accNumber,
      bankAccountName: accName,
    });
  });

// ─── 4. Creator dashboard data ────────────────────────────────────────────────

const dashboardSchema = z.object({ creatorEmail: z.string().email() });

export const getCreatorDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(dashboardSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      throw new Error("Unauthorized: Creator email mismatch.");
    }

    const [summary, withdrawals, history, storage, subscription] = await Promise.all([
      getEarningsSummary(data.creatorEmail),
      getWithdrawalHistory(data.creatorEmail, 10),
      getEarningsHistory(data.creatorEmail, 20),
      getStorageUsage(data.creatorEmail),
      adminDb.selectOne<{ plan_id: string; status: string; current_period_end: string | null }>(
        "creator_subscriptions",
        { creator_email: `eq.${data.creatorEmail}` },
      ),
    ]);

    return {
      earnings: summary,
      recentWithdrawals: withdrawals,
      recentEarnings: history,
      storage,
      plan: subscription.data?.plan_id ?? "free",
      subscriptionStatus: subscription.data?.status ?? "active",
      subscriptionEndsAt: subscription.data?.current_period_end ?? null,
    };
  });

// ─── 5. Check content access (server gate) ───────────────────────────────────

const accessCheckSchema = z.object({
  userEmail: z.string().email(),
  resourceType: z.enum(["community", "course"]),
  resourceId: z.number().int().positive(),
});

export const checkContentAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(accessCheckSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.userEmail) {
      throw new Error("Unauthorized: User email mismatch.");
    }

    if (data.resourceType === "community") {
      return checkCommunityAccess(data.userEmail, data.resourceId);
    }
    return checkCourseAccess(data.userEmail, data.resourceId);
  });

// ─── 6. File upload presigned URL ────────────────────────────────────────────

const fileUploadSchema = z.object({
  creatorEmail: z.string().email(),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

export const getFileUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(fileUploadSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      return { ok: false as const, error: "Unauthorized: Creator email mismatch." };
    }

    // Rate limit
    const rate = await checkFileAccessRate(data.creatorEmail);
    if (!rate.allowed) return { ok: false as const, error: "Rate limit exceeded." };

    // Check plan allows file uploads
    const { data: sub } = await adminDb.selectOne<{ plan_id: string }>("creator_subscriptions", {
      creator_email: `eq.${data.creatorEmail}`,
    });
    if ((sub?.plan_id ?? "free") !== "pro") {
      return { ok: false as const, error: "File uploads require a Pro plan." };
    }

    // Check quota
    const allowed = await checkUploadAllowed(data.creatorEmail, data.fileSizeBytes);
    if (!allowed.allowed) return { ok: false as const, error: allowed.reason! };

    // Proactive quota warnings (triggered at 80% capacity)
    const storageUsage = await getStorageUsage(data.creatorEmail);
    const projectedUsed = storageUsage.usedBytes + data.fileSizeBytes;
    const projectedPercent = storageUsage.quotaBytes > 0 ? Math.round((projectedUsed / storageUsage.quotaBytes) * 100) : 0;
    if (projectedPercent >= 80) {
      const id = Date.now() + Math.floor(Math.random() * 999);
      // In-app warning
      await adminDb.insert("notifications", {
        id,
        user_email: data.creatorEmail,
        text: `⚠️ Storage Warning: Your creator media storage is currently at ${projectedPercent}% of quota.`,
        type: "system",
        link: "/app/settings",
        read: false,
        created_at: new Date().toISOString(),
        dedup_key: `storage-quota-warning-80-${data.creatorEmail}`
      });

      // Email warning via Resend
      await sendStorageQuotaWarningEmail({
        data: {
          email: data.creatorEmail,
          usedPercent: projectedPercent,
          usedDisplay: `${Math.round(projectedUsed / (1024 * 1024))} MB`,
          quotaDisplay: `${Math.round(storageUsage.quotaBytes / (1024 * 1024))} MB`
        }
      }).catch(err => console.error("[monetization] Storage quota warning email failure:", err));
    }

    const key = buildFileKey(data.creatorEmail, data.filename);
    const url = await generatePresignedUrl({
      key,
      method: "PUT",
      expiresInSeconds: 3600,
      contentType: data.contentType,
    });
    if (!url) return { ok: false as const, error: "Storage not configured." };

    return { ok: true as const, uploadUrl: url, fileKey: key };
  });

// ─── 7. File download presigned URL ──────────────────────────────────────────

const fileDownloadSchema = z.object({
  userEmail: z.string().email(),
  fileKey: z.string().min(1),
  resourceType: z.enum(["community", "course"]),
  resourceId: z.number().int().positive(),
});

export const getFileDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(fileDownloadSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.userEmail) {
      return { ok: false as const, error: "Unauthorized: User email mismatch." };
    }

    // Rate limit
    const rate = await checkFileAccessRate(data.userEmail);
    if (!rate.allowed) return { ok: false as const, error: "Rate limit exceeded." };

    // Extract creator from key and validate path
    const parts = data.fileKey.split("/");
    if (parts.length < 3 || parts[0] !== "creators") {
      return { ok: false as const, error: "Invalid file key." };
    }
    const fileCreatorEmail = parts[1];

    if (!isValidFileKey(data.fileKey, fileCreatorEmail)) {
      return { ok: false as const, error: "Invalid file key format." };
    }

    // Verify that the file belongs to the creator of the resource to prevent cross-tenant/BOLA bypass
    if (data.resourceType === "community") {
      const { data: comm } = await adminDb.selectOne<{ creator_email: string }>("communities", {
        id: `eq.${data.resourceId}`,
      });
      if (!comm || comm.creator_email !== fileCreatorEmail) {
        return { ok: false as const, error: "File key mismatch for the specified community." };
      }
    } else if (data.resourceType === "course") {
      const { data: course } = await adminDb.selectOne<{ creator_email: string }>("courses", {
        id: `eq.${data.resourceId}`,
      });
      if (!course || course.creator_email !== fileCreatorEmail) {
        return { ok: false as const, error: "File key mismatch for the specified course." };
      }
    } else {
      return { ok: false as const, error: "Invalid resource type." };
    }

    // Verify user has access to the resource
    let hasAccess = false;
    if (data.resourceType === "community") {
      const result = await checkCommunityAccess(data.userEmail, data.resourceId);
      hasAccess = result.hasAccess;
    } else {
      const result = await checkCourseAccess(data.userEmail, data.resourceId);
      hasAccess = result.hasAccess;
    }

    if (!hasAccess) {
      return { ok: false as const, error: "You do not have access to this file." };
    }

    const url = await generatePresignedUrl({
      key: data.fileKey,
      method: "GET",
      expiresInSeconds: 900,
    });
    if (!url) return { ok: false as const, error: "Storage not configured." };

    return { ok: true as const, downloadUrl: url };
  });
