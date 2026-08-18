/**
 * Withdrawal state machine — server-side only.
 *
 * State transitions:
 *   pending → processing → paid
 *   pending → failed
 *   processing → failed
 *   paid → reversed (chargeback/refund)
 *
 * Rules:
 *   - Minimum withdrawal enforced from env
 *   - Instant withdrawal fee applied per env config
 *   - Balance checked before creating a request
 *   - Ledger deduction happens at processing time (not request time)
 *   - Duplicate requests within the same minute are blocked via rate limiter
 */

import { adminDb } from "@/lib/supabase-admin";
import { calcWithdrawalFee } from "@/lib/plans";
import { getCreatorBalance, recordWithdrawalDeduction } from "./earnings";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WithdrawalStatus = "pending" | "processing" | "paid" | "failed" | "reversed";
export type WithdrawalType = "standard" | "instant";

export type WithdrawalRequest = {
  id: string;
  creatorEmail: string;
  amountCents: number;
  currency: string;
  withdrawalType: WithdrawalType;
  feeCents: number;
  netAmountCents: number;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  status: WithdrawalStatus;
  paystackTransferCode: string | null;
  failureReason: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type CreateWithdrawalInput = {
  creatorEmail: string;
  amountCents: number;
  currency?: string;
  withdrawalType?: WithdrawalType;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

type CreateWithdrawalResult =
  { ok: true; withdrawal: WithdrawalRequest } | { ok: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `wd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function dbRowToWithdrawal(r: Record<string, unknown>): WithdrawalRequest {
  return {
    id: r.id as string,
    creatorEmail: r.creator_email as string,
    amountCents: r.amount_cents as number,
    currency: r.currency as string,
    withdrawalType: r.withdrawal_type as WithdrawalType,
    feeCents: r.fee_cents as number,
    netAmountCents: r.net_amount_cents as number,
    bankCode: r.bank_code as string | null,
    bankAccountNumber: r.bank_account_number as string | null,
    bankAccountName: r.bank_account_name as string | null,
    status: r.status as WithdrawalStatus,
    paystackTransferCode: r.paystack_transfer_code as string | null,
    failureReason: r.failure_reason as string | null,
    requestedAt: r.requested_at as string,
    processedAt: r.processed_at as string | null,
  };
}

// ─── Create withdrawal request ────────────────────────────────────────────────

export async function createWithdrawalRequest(
  input: CreateWithdrawalInput,
): Promise<CreateWithdrawalResult> {
  const currency = input.currency ?? "NGN";
  const withdrawalType = input.withdrawalType ?? "standard";

  // Read fee config from env
  const fixedFeeCents = parseInt(process.env.WITHDRAWAL_FIXED_FEE_CENTS ?? "10000", 10);
  const percentFeeBps = parseInt(process.env.WITHDRAWAL_PERCENT_FEE_BPS ?? "100", 10);
  const minCents = parseInt(process.env.MIN_WITHDRAWAL_AMOUNT_CENTS ?? "500000", 10);

  // Validate minimum
  if (input.amountCents < minCents) {
    return {
      ok: false,
      error: `Minimum withdrawal is ${(minCents / 100).toLocaleString()} ${currency}.`,
    };
  }

  // Check available balance
  const balance = await getCreatorBalance(input.creatorEmail, currency);
  if (balance < input.amountCents) {
    return {
      ok: false,
      error: `Insufficient balance. Available: ${(balance / 100).toLocaleString()} ${currency}.`,
    };
  }

  // Calculate fee
  const { feeCents, netCents } = calcWithdrawalFee({
    amountCents: input.amountCents,
    isInstant: withdrawalType === "instant",
    fixedFeeCents,
    percentFeeBps,
  });

  if (netCents <= 0) {
    return { ok: false, error: "Withdrawal amount is less than the fee." };
  }

  const withdrawal: Record<string, unknown> = {
    id: generateId(),
    creator_email: input.creatorEmail,
    amount_cents: input.amountCents,
    currency,
    withdrawal_type: withdrawalType,
    fee_cents: feeCents,
    net_amount_cents: netCents,
    bank_code: input.bankCode,
    bank_account_number: input.bankAccountNumber,
    bank_account_name: input.bankAccountName,
    status: "pending",
    paystack_transfer_code: null,
    failure_reason: null,
    requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await adminDb.insert<Record<string, unknown>>(
    "withdrawal_requests",
    withdrawal,
  );

  if (error || !data) {
    console.error("[withdrawals] Failed to create withdrawal:", error?.message);
    return { ok: false, error: "Could not create withdrawal request. Please try again." };
  }

  return { ok: true, withdrawal: dbRowToWithdrawal(data as Record<string, unknown>) };
}

// ─── State transitions ────────────────────────────────────────────────────────

/** Transition a withdrawal to 'processing' and deduct from ledger. */
export async function processWithdrawal(
  withdrawalId: string,
): Promise<{ ok: boolean; error?: string }> {
  // Atomically update status to processing only if currently pending
  const { data, error } = await adminDb.update<Record<string, unknown>>(
    "withdrawal_requests",
    { id: `eq.${withdrawalId}`, status: "eq.pending" },
    { status: "processing", updated_at: new Date().toISOString() },
  );

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return { ok: false, error: "Withdrawal not found or not in 'pending' status." };
  }

  const wd = data[0];

  // Deduct from earnings ledger
  const deducted = await recordWithdrawalDeduction({
    creatorEmail: wd.creator_email as string,
    withdrawalId,
    amountCents: wd.amount_cents as number,
    currency: wd.currency as string,
  });

  if (!deducted.ok) {
    // Revert status back to pending if deduction failed
    await adminDb.update(
      "withdrawal_requests",
      { id: `eq.${withdrawalId}`, status: "eq.processing" },
      { status: "pending", updated_at: new Date().toISOString() },
    );
    return { ok: false, error: "Insufficient balance to process withdrawal." };
  }

  return { ok: true };
}

/** Mark a withdrawal as paid (after Paystack transfer confirms). */
export async function markWithdrawalPaid(
  withdrawalId: string,
  paystackTransferCode?: string,
): Promise<void> {
  await adminDb.update(
    "withdrawal_requests",
    { id: `eq.${withdrawalId}`, status: "in.(pending,processing)" },
    {
      status: "paid",
      paystack_transfer_code: paystackTransferCode ?? null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  );
}

/** Mark a withdrawal as failed (with optional reason). */
export async function markWithdrawalFailed(withdrawalId: string, reason?: string): Promise<void> {
  // Atomically update status from processing to failed
  const { data, error } = await adminDb.update<Record<string, unknown>>(
    "withdrawal_requests",
    { id: `eq.${withdrawalId}`, status: "eq.processing" },
    {
      status: "failed",
      failure_reason: reason ?? "Unknown error",
      updated_at: new Date().toISOString(),
    },
  );

  // If atomic transition succeeded from processing -> failed, re-credit balance
  if (!error && data && Array.isArray(data) && data.length > 0) {
    const wd = data[0];
    const { getCreatorBalance: getBalance } = await import("./earnings");
    const balance = await getBalance(wd.creator_email as string, wd.currency as string);
    await adminDb.insert("earnings_ledger", {
      id: `earn_rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      creator_email: wd.creator_email,
      transaction_id: null,
      entry_type: "reversal",
      amount_cents: wd.amount_cents,
      currency: wd.currency,
      balance_after_cents: balance + (wd.amount_cents as number),
      description: `Withdrawal ${withdrawalId} failed — balance restored`,
      created_at: new Date().toISOString(),
    });
    return;
  }

  // If request wasn't in processing status (e.g. was pending), set failed if pending
  await adminDb.update(
    "withdrawal_requests",
    { id: `eq.${withdrawalId}`, status: "eq.pending" },
    {
      status: "failed",
      failure_reason: reason ?? "Unknown error",
      updated_at: new Date().toISOString(),
    },
  );
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getWithdrawalHistory(
  creatorEmail: string,
  limit = 20,
): Promise<WithdrawalRequest[]> {
  const { data, error } = await adminDb.select<Record<string, unknown>>("withdrawal_requests", {
    creator_email: `eq.${creatorEmail}`,
    order: "requested_at.desc",
    limit: String(limit),
  });
  if (error || !data) return [];
  return data.map(dbRowToWithdrawal);
}
