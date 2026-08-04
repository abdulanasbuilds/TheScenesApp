/**
 * Payout account & withdrawal preference server functions.
 *
 * Thin wrappers only — all logic lives in `@/lib/monetization/payout-accounts`.
 * Account numbers are masked before they ever leave the server.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  getPayoutAccount,
  savePayoutAccount,
  savePayoutPreferences,
  removePayoutAccount,
  toPublicPayoutAccount,
} from "@/lib/monetization/payout-accounts";

const emailSchema = z.object({ creatorEmail: z.string().email() });

export const getPayoutSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(emailSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      throw new Error("Unauthorized: Creator email mismatch.");
    }
    const account = await getPayoutAccount(data.creatorEmail);
    return { account: account ? toPublicPayoutAccount(account) : null };
  });

const saveAccountSchema = z.object({
  creatorEmail: z.string().email(),
  method: z.enum(["bank", "mobile_money"]).default("bank"),
  country: z.string().min(2).max(2).default("NG"),
  currency: z.string().min(3).max(3).default("NGN"),
  bankCode: z.string().max(20).optional(),
  bankName: z.string().max(120).optional(),
  accountNumber: z.string().max(30).optional(),
  accountName: z.string().max(120).optional(),
  mobileMoneyNetwork: z.string().max(60).optional(),
  mobileMoneyNumber: z.string().max(30).optional(),
});

export const savePayoutAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(saveAccountSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      throw new Error("Unauthorized: Creator email mismatch.");
    }
    return savePayoutAccount(data);
  });

const prefsSchema = z.object({
  creatorEmail: z.string().email(),
  defaultWithdrawalType: z.enum(["standard", "instant"]).optional(),
  payoutNotifications: z.boolean().optional(),
});

export const savePayoutPreferencesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(prefsSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      throw new Error("Unauthorized: Creator email mismatch.");
    }
    return savePayoutPreferences(data);
  });

export const removePayoutAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(emailSchema)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      throw new Error("Unauthorized: Creator email mismatch.");
    }
    return removePayoutAccount(data.creatorEmail);
  });
