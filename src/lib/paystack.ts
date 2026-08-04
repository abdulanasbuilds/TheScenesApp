/**
 * Paystack client-side integration.
 * The public key is read from VITE_PAYSTACK_PUBLIC_KEY (client-safe).
 * The secret key never leaves the server (see paystack.functions.ts).
 */

export type PaystackCurrency = "NGN" | "GHS" | "ZAR" | "KES" | "USD";

export interface PaystackPaymentConfig {
  email: string;
  /** Amount in the smallest currency unit (kobo for NGN, cents for USD, etc.) */
  amount: number;
  currency?: PaystackCurrency;
  reference?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  channels?: string[];
}

declare global {
  interface Window {
    PaystackPop?: {
      setup(config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose(): void;
        callback(response: { reference: string }): void;
        channels?: string[];
      }): { openIframe(): void };
    };
  }
}

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not a browser"));
      return;
    }
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="paystack"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Paystack SDK. Check your internet connection."));
    document.head.appendChild(script);
  });
}

export function isPaystackConfigured(): boolean {
  return Boolean(PUBLIC_KEY && PUBLIC_KEY.trim().length > 10);
}

export function generateReference(prefix = "suka"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Parses a price string like "$19/mo" or "₦29,900" and returns the amount
 * in the smallest unit for the given currency.
 */
export function priceStringToAmount(price: string, currency: PaystackCurrency = "NGN"): number {
  const numMatch = price.replace(/,/g, "").match(/[\d.]+/);
  if (!numMatch) return 0;
  const displayValue = parseFloat(numMatch[0]);
  // If the original string contains a non-USD symbol, treat as face value
  const hasNgn = /₦/.test(price);
  const hasGhs = /₵/.test(price);
  if (hasNgn || hasGhs) return Math.round(displayValue * 100);
  // Otherwise treat as USD and do rough conversion
  const ratesPerDollar: Record<PaystackCurrency, number> = {
    NGN: 1600,
    GHS: 13,
    ZAR: 19,
    KES: 133,
    USD: 1,
  };
  return Math.round(displayValue * (ratesPerDollar[currency] ?? 1) * 100);
}

export async function initiatePaystackPayment(config: PaystackPaymentConfig): Promise<void> {
  if (!PUBLIC_KEY) {
    throw new Error("Paystack is not configured. Set VITE_PAYSTACK_PUBLIC_KEY in your .env file.");
  }
  await loadPaystackScript();
  if (!window.PaystackPop) {
    throw new Error("Paystack SDK failed to load.");
  }
  const ref = config.reference ?? generateReference();
  const handler = window.PaystackPop.setup({
    key: PUBLIC_KEY,
    email: config.email,
    amount: config.amount,
    currency: config.currency ?? "NGN",
    ref,
    metadata: config.metadata,
    onClose: config.onClose,
    callback: (res) => config.onSuccess(res.reference),
    channels: config.channels,
  });
  handler.openIframe();
}
