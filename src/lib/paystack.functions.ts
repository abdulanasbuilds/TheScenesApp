import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side Paystack payment verification.
 * PAYSTACK_SECRET_KEY is read from process.env — never shipped to the browser.
 * Call this after a successful Paystack popup callback to confirm the transaction.
 */

const verifySchema = z.object({
  reference: z.string().min(1, "Transaction reference is required"),
  communityId: z.number().int().positive().optional(),
  expectedEmail: z.string().email().optional(),
});

export type VerifyPaystackResult =
  | { success: true; reference: string; amount: number; status: "success" }
  | { success: false; error: string };

export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(verifySchema)
  .handler(async ({ data, context }): Promise<VerifyPaystackResult> => {
    const userEmail = context.claims?.email;
    if (!userEmail) {
      throw new Error("Unauthorized");
    }
    if (data.expectedEmail && userEmail !== data.expectedEmail) {
      throw new Error("Unauthorized: Email mismatch");
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("[paystack] PAYSTACK_SECRET_KEY not configured.");
      throw new Error("Payment verification is not configured. Please contact support.");
    }

    let response: Response;
    try {
      response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      console.error("[paystack] Network error contacting Paystack:", err);
      throw new Error("Could not reach payment service. Please try again.");
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[paystack] Verification HTTP error:", response.status, body);
      throw new Error("Payment verification failed. Please contact support with your reference.");
    }

    const result = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        status: string;
        amount: number;
        reference: string;
        customer?: { email: string };
      };
    };

    if (!result.status || result.data?.status !== "success") {
      throw new Error(
        result.message ?? "Payment was not completed. Please try again or contact support.",
      );
    }

    return {
      success: true,
      reference: result.data.reference,
      amount: result.data.amount,
      status: "success",
    };
  });
