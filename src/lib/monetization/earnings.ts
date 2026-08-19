/**
 * Creator earnings ledger — server-side only.
 *
 * The ledger is append-only (no updates, no deletes). Every financial event
 * creates a new row with a running balance. This makes audit trails trivial
 * and prevents silent data corruption.
 *
 * Entry types:
 *   revenue       — creator received payment (positive)
 *   platform_fee  — platform took its cut (negative)
 *   withdrawal    — creator withdrew funds (negative)
 *   reversal      — refund or chargeback (negative adjustment)
 *   adjustment    — manual correction (rarely used)
 */

import { adminDb } from "@/lib/supabase-admin";
import { calcPlatformFee, calcNetAmount } from "@/lib/plans";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EarningsEntry = {
  id: string;
  creatorEmail: string;
  transactionId: string | null;
  entryType: "revenue" | "platform_fee" | "withdrawal" | "reversal" | "adjustment";
  amountCents: number;
  currency: string;
  balanceAfterCents: number;
  description: string | null;
  createdAt: string;
};

export type EarningsSummary = {
  creatorEmail: string;
  currency: string;
  grossEarnedCents: number; // total revenue credits
  totalFeesCents: number; // total platform fees charged (absolute value)
  totalWithdrawnCents: number; // total withdrawn (absolute value)
  availableBalanceCents: number; // current net withdrawable balance
  pendingCents: number; // in pending withdrawal requests
  lastTransactionAt: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `earn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Current balance ──────────────────────────────────────────────────────────

/** Get the creator's current available balance (sum of all ledger entries). */
export async function getCreatorBalance(creatorEmail: string, currency = "NGN"): Promise<number> {
  // Use the creator_wallet view we created in the SQL schema
  const { data, error } = await adminDb.selectOne<{ balance_cents: number }>("creator_wallet", {
    creator_email: `eq.${creatorEmail}`,
    currency: `eq.${currency}`,
  });
  if (error || !data) return 0;
  return data.balance_cents ?? 0;
}

/** Get full earnings summary for a creator. */
export async function getEarningsSummary(
  creatorEmail: string,
  currency = "NGN",
): Promise<EarningsSummary> {
  const { data, error } = await adminDb.selectOne<{
    gross_earned_cents: number;
    total_fees_cents: number;
    total_withdrawn_cents: number;
    balance_cents: number;
    last_transaction_at: string | null;
  }>("creator_wallet", { creator_email: `eq.${creatorEmail}`, currency: `eq.${currency}` });

  if (error || !data) {
    return {
      creatorEmail,
      currency,
      grossEarnedCents: 0,
      totalFeesCents: 0,
      totalWithdrawnCents: 0,
      availableBalanceCents: 0,
      pendingCents: 0,
      lastTransactionAt: null,
    };
  }

  // Get pending withdrawal total
  const { data: pending } = await adminDb.select<{ net_amount_cents: number }>(
    "withdrawal_requests",
    { creator_email: `eq.${creatorEmail}`, status: `eq.pending`, currency: `eq.${currency}` },
  );
  const pendingCents = (pending ?? []).reduce((sum, w) => sum + w.net_amount_cents, 0);

  return {
    creatorEmail,
    currency,
    grossEarnedCents: data.gross_earned_cents ?? 0,
    totalFeesCents: Math.abs(data.total_fees_cents ?? 0),
    totalWithdrawnCents: Math.abs(data.total_withdrawn_cents ?? 0),
    availableBalanceCents: Math.max(0, (data.balance_cents ?? 0) - pendingCents),
    pendingCents,
    lastTransactionAt: data.last_transaction_at,
  };
}

/** Recent ledger entries for a creator. */
export async function getEarningsHistory(
  creatorEmail: string,
  limit = 50,
): Promise<EarningsEntry[]> {
  const { data, error } = await adminDb.select<{
    id: string;
    creator_email: string;
    transaction_id: string | null;
    entry_type: string;
    amount_cents: number;
    currency: string;
    balance_after_cents: number;
    description: string | null;
    created_at: string;
  }>("earnings_ledger", {
    creator_email: `eq.${creatorEmail}`,
    order: "created_at.desc",
    limit: String(limit),
  });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    creatorEmail: r.creator_email,
    transactionId: r.transaction_id,
    entryType: r.entry_type as EarningsEntry["entryType"],
    amountCents: r.amount_cents,
    currency: r.currency,
    balanceAfterCents: r.balance_after_cents,
    description: r.description,
    createdAt: r.created_at,
  }));
}

// ─── Record earnings ──────────────────────────────────────────────────────────

/**
 * Record a revenue event in the ledger.
 * Creates TWO entries: one positive (revenue) and one negative (platform_fee).
 * This keeps the ledger transparent — creators can see exactly what was taken.
 *
 * Must be called AFTER the payment has been verified on the server.
 * Idempotency: caller should check transaction_id uniqueness before calling.
 */
export async function recordPaymentEarnings(opts: {
  creatorEmail: string;
  transactionId: string;
  grossAmountCents: number;
  platformFeeBps: number;
  currency?: string;
  description?: string;
}): Promise<{ ok: boolean; netAmountCents: number }> {
  const currency = opts.currency ?? "NGN";
  const feeCents = calcPlatformFee(opts.grossAmountCents, opts.platformFeeBps);
  const netCents = opts.grossAmountCents - feeCents;

  // Idempotency: Check if revenue for this transaction_id has already been recorded
  if (opts.transactionId) {
    const { data: existing } = await adminDb.select<{ id: string }>("earnings_ledger", {
      transaction_id: `eq.${opts.transactionId}`,
      entry_type: "eq.revenue",
    });
    if (existing && existing.length > 0) {
      console.warn(`[earnings] Duplicate revenue entry ignored for transaction: ${opts.transactionId}`);
      return { ok: true, netAmountCents: netCents };
    }
  }

  // Get current balance to compute running balance
  const currentBalance = await getCreatorBalance(opts.creatorEmail, currency);

  // 1. Revenue entry (credit)
  const revenueEntry = {
    id: generateId(),
    creator_email: opts.creatorEmail,
    transaction_id: opts.transactionId,
    entry_type: "revenue",
    amount_cents: opts.grossAmountCents,
    currency,
    balance_after_cents: currentBalance + opts.grossAmountCents,
    description: opts.description ?? "Payment received",
    created_at: new Date().toISOString(),
  };

  const { error: e1 } = await adminDb.insert("earnings_ledger", revenueEntry);
  if (e1) {
    console.error("[earnings] Failed to record revenue entry:", e1.message);
    return { ok: false, netAmountCents: netCents };
  }

  // 2. Platform fee entry (debit) — only if fee > 0
  if (feeCents > 0) {
    const feeEntry = {
      id: generateId(),
      creator_email: opts.creatorEmail,
      transaction_id: opts.transactionId,
      entry_type: "platform_fee",
      amount_cents: -feeCents,
      currency,
      balance_after_cents: currentBalance + opts.grossAmountCents - feeCents,
      description: `Platform fee (${(opts.platformFeeBps / 100).toFixed(1)}%)`,
      created_at: new Date().toISOString(),
    };
    await adminDb.insert("earnings_ledger", feeEntry);
    // If fee entry fails, log but don't block — revenue entry is more important
  }

  return { ok: true, netAmountCents: netCents };
}

/**
 * Deduct a withdrawal from the ledger (negative entry).
 * Called after a withdrawal is approved, not when it's just requested.
 */
export async function recordWithdrawalDeduction(opts: {
  creatorEmail: string;
  withdrawalId: string;
  amountCents: number;
  currency?: string;
}): Promise<{ ok: boolean }> {
  const currency = opts.currency ?? "NGN";
  const currentBalance = await getCreatorBalance(opts.creatorEmail, currency);

  if (currentBalance < opts.amountCents) {
    return { ok: false };
  }

  const { error } = await adminDb.insert("earnings_ledger", {
    id: generateId(),
    creator_email: opts.creatorEmail,
    transaction_id: null,
    entry_type: "withdrawal",
    amount_cents: -opts.amountCents,
    currency,
    balance_after_cents: currentBalance - opts.amountCents,
    description: `Withdrawal ${opts.withdrawalId}`,
    created_at: new Date().toISOString(),
  });

  return { ok: !error };
}
