/**
 * Payout account store — server-side only.
 *
 * One payout destination per creator (bank transfer or mobile money).
 * Account numbers are stored raw for the payment provider, but every read
 * that reaches the browser goes through `toPublicPayoutAccount()`, which
 * masks the account/phone number.
 */

import { adminDb } from "@/lib/supabase-admin";

export type PayoutMethod = "bank" | "mobile_money";
export type VerificationStatus = "unverified" | "pending" | "verified" | "failed";
export type WithdrawalSpeed = "standard" | "instant";

export type PayoutAccount = {
  creatorEmail: string;
  method: PayoutMethod;
  provider: string;
  country: string;
  currency: string;
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  mobileMoneyNetwork: string | null;
  mobileMoneyNumber: string | null;
  verificationStatus: VerificationStatus;
  isPayoutReady: boolean;
  defaultWithdrawalType: WithdrawalSpeed;
  payoutNotifications: boolean;
  updatedAt: string | null;
};

/** Same shape, but with sensitive digits masked — safe to return to the client. */
export type PublicPayoutAccount = Omit<PayoutAccount, "accountNumber" | "mobileMoneyNumber"> & {
  accountNumberMasked: string | null;
  mobileMoneyNumberMasked: string | null;
};

export type SavePayoutAccountInput = {
  creatorEmail: string;
  method: PayoutMethod;
  country?: string;
  currency?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  mobileMoneyNetwork?: string;
  mobileMoneyNumber?: string;
};

// ─── Mapping ──────────────────────────────────────────────────────────────────

function rowToAccount(r: Record<string, unknown>): PayoutAccount {
  return {
    creatorEmail: r.creator_email as string,
    method: (r.method as PayoutMethod) ?? "bank",
    provider: (r.provider as string) ?? "paystack",
    country: (r.country as string) ?? "NG",
    currency: (r.currency as string) ?? "NGN",
    bankCode: (r.bank_code as string | null) ?? null,
    bankName: (r.bank_name as string | null) ?? null,
    accountNumber: (r.account_number as string | null) ?? null,
    accountName: (r.account_name as string | null) ?? null,
    mobileMoneyNetwork: (r.mobile_money_network as string | null) ?? null,
    mobileMoneyNumber: (r.mobile_money_number as string | null) ?? null,
    verificationStatus: (r.verification_status as VerificationStatus) ?? "unverified",
    isPayoutReady: Boolean(r.is_payout_ready),
    defaultWithdrawalType: (r.default_withdrawal_type as WithdrawalSpeed) ?? "standard",
    payoutNotifications: r.payout_notifications !== false,
    updatedAt: (r.updated_at as string | null) ?? null,
  };
}

export function maskNumber(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\s+/g, "");
  if (digits.length <= 4) return `••••${digits}`;
  return `••••${digits.slice(-4)}`;
}

export function toPublicPayoutAccount(a: PayoutAccount): PublicPayoutAccount {
  const { accountNumber, mobileMoneyNumber, ...rest } = a;
  return {
    ...rest,
    accountNumberMasked: maskNumber(accountNumber),
    mobileMoneyNumberMasked: maskNumber(mobileMoneyNumber),
  };
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getPayoutAccount(creatorEmail: string): Promise<PayoutAccount | null> {
  const { data, error } = await adminDb.select<Record<string, unknown>>("payout_accounts", {
    creator_email: `eq.${creatorEmail}`,
    limit: "1",
  });
  if (error || !data || data.length === 0) return null;
  return rowToAccount(data[0]);
}

// ─── Writes ───────────────────────────────────────────────────────────────────

function validate(input: SavePayoutAccountInput): string | null {
  if (input.method === "bank") {
    if (!input.bankCode) return "Select your bank.";
    if (!input.accountNumber || !/^\d{6,20}$/.test(input.accountNumber.replace(/\s+/g, "")))
      return "Enter a valid account number.";
    if (!input.accountName || input.accountName.trim().length < 2)
      return "Enter the account holder name.";
    return null;
  }
  if (!input.mobileMoneyNetwork) return "Select your mobile money network.";
  if (!input.mobileMoneyNumber || !/^[\d+\s-]{7,20}$/.test(input.mobileMoneyNumber))
    return "Enter a valid mobile money number.";
  if (!input.accountName || input.accountName.trim().length < 2)
    return "Enter the account holder name.";
  return null;
}

export async function savePayoutAccount(
  input: SavePayoutAccountInput,
): Promise<{ ok: true; account: PublicPayoutAccount } | { ok: false; error: string }> {
  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const existing = await getPayoutAccount(input.creatorEmail);

  const row: Record<string, unknown> = {
    creator_email: input.creatorEmail,
    method: input.method,
    provider: "paystack",
    country: input.country ?? existing?.country ?? "NG",
    currency: input.currency ?? existing?.currency ?? "NGN",
    bank_code: input.method === "bank" ? (input.bankCode ?? null) : null,
    bank_name: input.method === "bank" ? (input.bankName ?? null) : null,
    account_number:
      input.method === "bank" ? (input.accountNumber ?? "").replace(/\s+/g, "") : null,
    account_name: input.accountName?.trim() ?? null,
    mobile_money_network:
      input.method === "mobile_money" ? (input.mobileMoneyNetwork ?? null) : null,
    mobile_money_number:
      input.method === "mobile_money" ? (input.mobileMoneyNumber ?? "").replace(/\s+/g, "") : null,
    // Details are self-declared; a provider-side name check can flip this to
    // "verified" later without changing the payout flow.
    verification_status: "unverified",
    is_payout_ready: true,
    default_withdrawal_type: existing?.defaultWithdrawalType ?? "standard",
    payout_notifications: existing?.payoutNotifications ?? true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminDb.upsert("payout_accounts", row, "creator_email");
  if (error) {
    console.error("[payout-accounts] save failed:", error.message);
    return { ok: false, error: "Could not save your payout account. Please try again." };
  }

  const saved = await getPayoutAccount(input.creatorEmail);
  if (!saved) return { ok: false, error: "Could not read back the saved payout account." };
  return { ok: true, account: toPublicPayoutAccount(saved) };
}

export async function savePayoutPreferences(input: {
  creatorEmail: string;
  defaultWithdrawalType?: WithdrawalSpeed;
  payoutNotifications?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const existing = await getPayoutAccount(input.creatorEmail);
  if (!existing) return { ok: false, error: "Add a payout account first." };

  const { error } = await adminDb.update(
    "payout_accounts",
    { creator_email: `eq.${input.creatorEmail}` },
    {
      default_withdrawal_type: input.defaultWithdrawalType ?? existing.defaultWithdrawalType,
      payout_notifications: input.payoutNotifications ?? existing.payoutNotifications,
      updated_at: new Date().toISOString(),
    },
  );
  if (error) return { ok: false, error: "Could not save your withdrawal preferences." };
  return { ok: true };
}

export async function removePayoutAccount(creatorEmail: string): Promise<{ ok: boolean }> {
  const { error } = await adminDb.delete("payout_accounts", {
    creator_email: `eq.${creatorEmail}`,
  });
  return { ok: !error };
}
