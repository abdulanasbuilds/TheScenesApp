/**
 * Plan definitions — single source of truth for feature gating and fee logic.
 *
 * All numeric thresholds come from env vars (via env.ts) when this module is
 * used on the server. For the client-side UI we import the static plan shapes
 * only (no env reads), which keeps the bundle safe.
 */

// ─── Plan types ───────────────────────────────────────────────────────────────

export type PlanId = "free" | "pro";

export type PlanFeatures = {
  hostedVideo: boolean; // Bunny.net streaming
  hostedFiles: boolean; // Cloudflare R2 uploads
  externalEmbeds: boolean; // YouTube, Vimeo, Loom, Drive, Notion…
  customDomain: boolean;
  analyticsLevel: "basic" | "advanced";
  affiliateProgram: boolean;
  instantWithdrawal: boolean;
  maxCommunities: number; // -1 = unlimited
  maxCourses: number; // -1 = unlimited
};

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in USD cents (0 = free) */
  priceUsdCents: number;
  /** Platform fee taken from creator revenue, in basis points (700 = 7%) */
  platformFeeBps: number;
  /** Hosted storage quota in bytes (0 = no hosted storage) */
  storageBytes: number;
  features: PlanFeatures;
};

// ─── Static plan catalog (no env reads — safe on client) ─────────────────────
// These are the UI-facing defaults. Server-side fee calculations always use
// env vars so operators can tweak without a redeploy.

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsdCents: 0,
    platformFeeBps: 700, // 7% — overridden by env.FREE_PLAN_FEE_BPS server-side
    storageBytes: 0,
    features: {
      hostedVideo: false,
      hostedFiles: false,
      externalEmbeds: true,
      customDomain: false,
      analyticsLevel: "basic",
      affiliateProgram: true,
      instantWithdrawal: false,
      maxCommunities: -1,
      maxCourses: -1,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsdCents: 4900, // $49 — overridden by env.PRO_PLAN_PRICE_CENTS server-side
    platformFeeBps: 0, // 0% — overridden by env.PRO_PLAN_FEE_BPS server-side
    storageBytes: 107_374_182_400, // 100 GB — env.PRO_PLAN_STORAGE_BYTES server-side
    features: {
      hostedVideo: true,
      hostedFiles: true,
      externalEmbeds: true,
      customDomain: true,
      analyticsLevel: "advanced",
      affiliateProgram: true,
      instantWithdrawal: true,
      maxCommunities: -1,
      maxCourses: -1,
    },
  },
};

// ─── Fee calculation helpers ──────────────────────────────────────────────────

/**
 * Calculate the platform fee for a given gross amount and plan.
 * All amounts in smallest currency unit (kobo, cents).
 */
export function calcPlatformFee(grossCents: number, feeBps: number): number {
  return Math.floor((grossCents * feeBps) / 10_000);
}

/** Net amount a creator receives after platform fee. */
export function calcNetAmount(grossCents: number, feeBps: number): number {
  return grossCents - calcPlatformFee(grossCents, feeBps);
}

/**
 * Calculate instant withdrawal fee.
 * Returns { feeCents, netCents }.
 */
export function calcWithdrawalFee(opts: {
  amountCents: number;
  isInstant: boolean;
  fixedFeeCents: number;
  percentFeeBps: number;
}): { feeCents: number; netCents: number } {
  if (!opts.isInstant) {
    return { feeCents: 0, netCents: opts.amountCents };
  }
  const percentFee = Math.floor((opts.amountCents * opts.percentFeeBps) / 10_000);
  const feeCents = opts.fixedFeeCents + percentFee;
  return {
    feeCents,
    netCents: Math.max(0, opts.amountCents - feeCents),
  };
}

// ─── Feature gate helpers ─────────────────────────────────────────────────────

/** Check if a plan allows hosted video (Bunny.net streaming). */
export function canHostVideo(planId: PlanId): boolean {
  return PLANS[planId].features.hostedVideo;
}

/** Check if a plan allows file uploads to R2. */
export function canHostFiles(planId: PlanId): boolean {
  return PLANS[planId].features.hostedFiles;
}

/** Check if a plan allows instant withdrawals. */
export function canInstantWithdraw(planId: PlanId): boolean {
  return PLANS[planId].features.instantWithdrawal;
}

/** Human-readable storage quota string (e.g. "100 GB", "No hosted storage"). */
export function formatStorageQuota(bytes: number): string {
  if (bytes === 0) return "No hosted storage";
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${Math.round(gb)} GB` : `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Format basis points as percentage string ("7%", "0%"). */
export function formatFeeBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

/** Format cents as currency string (₦1,234.56). */
export function formatCurrency(cents: number, currency = "NGN"): string {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", GHS: "₵", KES: "KSh", ZAR: "R" };
  const symbol = symbols[currency] ?? currency + " ";
  return `${symbol}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
