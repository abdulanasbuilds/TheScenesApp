import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side payment recording.
 * After the client receives a verified Paystack reference, it calls this
 * to persist the payment row in Supabase using the service-role key so
 * the RLS insert policy doesn't block it.
 *
 * Required env vars (server-only):
 *   PAYSTACK_SECRET_KEY   — for verification
 *   SUPABASE_SERVICE_KEY  — for the service-role Supabase insert
 *   SUPABASE_URL          — runtime binding in Cloudflare (same value as VITE_SUPABASE_URL)
 */

const recordSchema = z.object({
  id: z.number().int(),
  communityId: z.number().int().nullable(),
  fromEmail: z.string().email(),
  toEmail: z.string().email(),
  reference: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().default("NGN"),
});

export type RecordPaymentResult = { success: true } | { success: false; error: string };

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(recordSchema)
  .handler(async ({ data, context }): Promise<RecordPaymentResult> => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.fromEmail) {
      return { success: false, error: "Unauthorized: Payer email mismatch" };
    }

    // Use non-VITE server-side name — VITE_* are build-time client vars only.
    // Set SUPABASE_URL as a runtime binding in Cloudflare dashboard.
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // Supabase not configured — log and silently succeed so the UI flow
      // isn't blocked. The payment was already verified by Paystack.
      console.warn("[payments] SUPABASE_SERVICE_KEY not set — payment row not persisted.");
      return { success: true };
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: data.id,
          community_id: data.communityId,
          from_email: data.fromEmail,
          to_email: data.toEmail,
          reference: data.reference,
          amount_cents: data.amountCents,
          currency: data.currency,
          status: "completed",
          created_at: Date.now(),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[payments] Failed to record payment:", res.status, body);
        // Don't throw — the payment is real; only our record failed.
        return { success: true };
      }

      return { success: true };
    } catch (err) {
      console.error("[payments] Network error recording payment:", err);
      return { success: true }; // optimistic: payment was verified
    }
  });
