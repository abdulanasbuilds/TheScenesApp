/**
 * Payout account & withdrawal preference server functions.
 *
 * Thin wrappers only — all logic lives in `@/lib/monetization/payout-accounts`.
 * Account numbers are masked before they ever leave the server.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getPayoutAccount,
  savePayoutAccount,
  savePayoutPreferences,
  removePayoutAccount,
  toPublicPayoutAccount,
} from "@/lib/monetization/payout-accounts";

const emailSchema = z.object({ creatorEmail: z.string().email() });

export const getPayoutSetup = createServerFn({ method: "POST" })
  .validator(emailSchema)
  .handler(async ({ data }) => {
    const account = await getPayoutAccount(data.creatorEmail);
    return { account: account ? toPublicPayoutAccount(account) : null };
  });

const saveAccountSchema = z.object({
  creatorEmail:       z.string().email(),
  method:             z.enum(["bank", "mobile_money"]).default("bank"),
  country:            z.string().min(2).max(2).default("NG"),
  currency:           z.string().min(3).max(3).default("NGN"),
  bankCode:           z.string().max(20).optional(),
  bankName:           z.string().max(120).optional(),
  accountNumber:      z.string().max(30).optional(),
  accountName:        z.string().max(120).optional(),
  mobileMoneyNetwork: z.string().max(60).optional(),
  mobileMoneyNumber:  z.string().max(30).optional(),
});

export const savePayoutAccountFn = createServerFn({ method: "POST" })
  .validator(saveAccountSchema)
  .handler(async ({ data }) => savePayoutAccount(data));

const prefsSchema = z.object({
  creatorEmail:          z.string().email(),
  defaultWithdrawalType: z.enum(["standard", "instant"]).optional(),
  payoutNotifications:   z.boolean().optional(),
});

export const savePayoutPreferencesFn = createServerFn({ method: "POST" })
  .validator(prefsSchema)
  .handler(async ({ data }) => savePayoutPreferences(data));

export const removePayoutAccountFn = createServerFn({ method: "POST" })
  .validator(emailSchema)
  .handler(async ({ data }) => removePayoutAccount(data.creatorEmail));
