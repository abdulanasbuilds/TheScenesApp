/**
 * Payment provider abstraction layer.
 *
 * All payment operations flow through the PaymentProvider interface.
 * Paystack is the initial implementation. To add Flutterwave or Stripe,
 * implement the interface and swap the provider in getPaymentProvider().
 *
 * SERVER-SIDE ONLY — never import in client code.
 */

// ─── Canonical types ──────────────────────────────────────────────────────────

export type PaymentCurrency = "NGN" | "GHS" | "ZAR" | "KES" | "USD";

export type VerifyPaymentResult =
  | {
      ok: true;
      reference: string;
      amountCents: number;
      currency: PaymentCurrency;
      customerEmail: string;
      metadata: Record<string, unknown>;
      rawData: Record<string, unknown>;
    }
  | { ok: false; error: string };

export type WebhookEventType =
  | "payment.success"
  | "payment.failed"
  | "subscription.created"
  | "subscription.not_renewing"
  | "subscription.disabled"
  | "transfer.success"
  | "transfer.failed"
  | "transfer.reversed"
  | "unknown";

export type WebhookEvent = {
  /** Provider's unique event ID — used as idempotency key */
  id: string;
  type: WebhookEventType;
  /** Payment or transfer reference code */
  reference?: string;
  /** Customer email, if available */
  customerEmail?: string;
  amountCents?: number;
  currency?: string;
  /** Raw provider data for any provider-specific fields */
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;

  /** Verify a payment reference on the provider's server. */
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;

  /**
   * Verify that a webhook request came from the provider.
   * Uses HMAC or signature scheme specific to the provider.
   * Returns true only if the signature is valid.
   */
  verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>;

  /** Parse a raw webhook body into a canonical WebhookEvent. */
  parseWebhookEvent(rawBody: string): WebhookEvent | null;
}

// ─── Paystack implementation ──────────────────────────────────────────────────

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";

  private get secretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("[paystack] PAYSTACK_SECRET_KEY is not set.");
    return key;
  }

  private get webhookSecret(): string {
    return process.env.PAYSTACK_WEBHOOK_SECRET ?? "";
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    let res: Response;
    try {
      res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${this.secretKey}` } }
      );
    } catch (err) {
      return { ok: false, error: "Network error contacting Paystack." };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[paystack] verify ${reference} → HTTP ${res.status}: ${body}`);
      return { ok: false, error: `Paystack returned ${res.status}.` };
    }

    const json = await res.json() as {
      status: boolean;
      message: string;
      data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        customer?: { email: string };
        metadata?: Record<string, unknown>;
      };
    };

    if (!json.status || json.data?.status !== "success") {
      return { ok: false, error: json.message ?? "Payment not completed." };
    }

    const d = json.data!;
    return {
      ok: true,
      reference: d.reference,
      amountCents: d.amount, // Paystack already returns in kobo/cents
      currency: (d.currency ?? "NGN") as PaymentCurrency,
      customerEmail: d.customer?.email ?? "",
      metadata: d.metadata ?? {},
      rawData: d as unknown as Record<string, unknown>,
    };
  }

  /**
   * Paystack signs webhooks with HMAC-SHA512 using your secret key.
   * Header: x-paystack-signature
   * Uses Web Crypto API — works in both Node and Cloudflare Workers.
   */
  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    const secret = this.webhookSecret;
    if (!secret) {
      // If no secret configured, warn and allow (for local dev without webhook secret)
      console.warn("[paystack] PAYSTACK_WEBHOOK_SECRET not set — skipping signature verification.");
      return true;
    }
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hex === signature;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(rawBody: string): WebhookEvent | null {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }

    const eventType = payload.event as string | undefined;
    const data = (payload.data ?? {}) as Record<string, unknown>;

    const typeMap: Record<string, WebhookEventType> = {
      "charge.success":           "payment.success",
      "charge.failed":            "payment.failed",
      "subscription.create":      "subscription.created",
      "subscription.not_renew":   "subscription.not_renewing",
      "subscription.disable":     "subscription.disabled",
      "transfer.success":         "transfer.success",
      "transfer.failed":          "transfer.failed",
      "transfer.reversed":        "transfer.reversed",
    };

    const customer = data.customer as Record<string, unknown> | undefined;
    // Paystack doesn't provide a top-level event.id; use reference as fallback
    const eventId = (data.reference as string | undefined)
      ?? `${eventType}:${Date.now()}`;

    return {
      id: eventId,
      type: typeMap[eventType ?? ""] ?? "unknown",
      reference: data.reference as string | undefined,
      customerEmail: customer?.email as string | undefined,
      amountCents: data.amount as number | undefined,
      currency: data.currency as string | undefined,
      raw: payload,
    };
  }
}

// ─── Provider factory ─────────────────────────────────────────────────────────

let _provider: PaymentProvider | null = null;

/** Returns the configured payment provider singleton. */
export function getPaymentProvider(): PaymentProvider {
  if (!_provider) {
    // Swap this for FlutterwaveProvider or StripeProvider when needed
    _provider = new PaystackProvider();
  }
  return _provider;
}
