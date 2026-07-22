/**
 * Centralized environment variable access — server-side only.
 *
 * Import this file ONLY inside createServerFn handlers or server-only modules.
 * It reads from process.env which is available in Nitro/Cloudflare Worker runtime.
 * Never import this in client-side React components or pages.
 *
 * All values are read lazily (on first call) so missing vars are caught at
 * runtime with a clear error, not at startup.
 */

// ─── Helper ───────────────────────────────────────────────────────────────────

function getEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined || val === "") {
    throw new Error(
      `[env] Required environment variable "${key}" is not set. ` +
      `Add it to your .env file (local) or Cloudflare dashboard (production).`
    );
  }
  return val;
}

function getEnvOptional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function getEnvInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`[env] Required environment variable "${key}" is not set.`);
  }
  const n = parseFloat(raw);
  if (isNaN(n)) throw new Error(`[env] "${key}" must be a number, got: "${raw}"`);
  return n;
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

export const env = {
  // ── Supabase (public URL is safe to read on the server too)
  get SUPABASE_URL()          { return getEnv("VITE_SUPABASE_URL"); },
  get SUPABASE_ANON_KEY()     { return getEnv("VITE_SUPABASE_ANON_KEY"); },
  /** Service-role key — bypasses RLS. NEVER send to browser. */
  get SUPABASE_SERVICE_KEY()  {
    // Support both naming conventions during transition
    return getEnv("SUPABASE_SERVICE_ROLE_KEY", process.env["SUPABASE_SERVICE_KEY"]);
  },

  // ── Paystack
  get PAYSTACK_SECRET_KEY()     { return getEnv("PAYSTACK_SECRET_KEY"); },
  get PAYSTACK_WEBHOOK_SECRET() { return getEnvOptional("PAYSTACK_WEBHOOK_SECRET"); },

  // ── Redis (Upstash REST API format)
  get REDIS_URL()     { return getEnvOptional("REDIS_URL"); },
  get REDIS_TOKEN()   { return getEnvOptional("REDIS_TOKEN"); },

  // ── Cloudflare R2
  get CF_ACCOUNT_ID()          { return getEnvOptional("CLOUDFLARE_ACCOUNT_ID"); },
  get R2_ACCESS_KEY_ID()       { return getEnvOptional("CLOUDFLARE_R2_ACCESS_KEY_ID"); },
  get R2_SECRET_ACCESS_KEY()   { return getEnvOptional("CLOUDFLARE_R2_SECRET_ACCESS_KEY"); },
  get R2_BUCKET_NAME()         { return getEnvOptional("CLOUDFLARE_R2_BUCKET_NAME"); },

  // ── Bunny.net (video streaming)
  get BUNNY_LIBRARY_ID() { return getEnvOptional("BUNNY_STREAM_LIBRARY_ID"); },
  get BUNNY_API_KEY()    { return getEnvOptional("BUNNY_STREAM_API_KEY"); },

  // ── App
  get APP_URL() { return getEnvOptional("APP_URL", "https://sukaspace.com"); },

  // ── Monetization config (configurable, not hardcoded)
  /** Free plan platform fee in basis points (700 = 7%) */
  get FREE_PLAN_FEE_BPS()        { return getEnvInt("FREE_PLAN_PLATFORM_FEE_BPS", 700); },
  /** Pro plan platform fee in basis points (0 = 0%) */
  get PRO_PLAN_FEE_BPS()         { return getEnvInt("PRO_PLAN_PLATFORM_FEE_BPS", 0); },
  /** Pro plan monthly price in USD cents (4900 = $49) */
  get PRO_PLAN_PRICE_CENTS()     { return getEnvInt("PRO_PLAN_PRICE_CENTS", 4900); },
  /** Pro plan storage quota in bytes (default 100 GB) */
  get PRO_PLAN_STORAGE_BYTES()   { return getEnvInt("PRO_PLAN_STORAGE_BYTES", 100 * 1024 * 1024 * 1024); },
  /** Free plan storage quota in bytes (0 = no hosted storage) */
  get FREE_PLAN_STORAGE_BYTES()  { return getEnvInt("FREE_PLAN_STORAGE_BYTES", 0); },

  // ── Withdrawal config
  /** Standard scheduled payout - no extra fee */
  /** Instant withdrawal fixed fee in smallest currency unit (e.g. 10000 = ₦100) */
  get WITHDRAWAL_FIXED_FEE()     { return getEnvInt("WITHDRAWAL_FIXED_FEE_CENTS", 10000); },
  /** Instant withdrawal percentage fee in basis points (100 = 1%) */
  get WITHDRAWAL_PERCENT_FEE_BPS() { return getEnvInt("WITHDRAWAL_PERCENT_FEE_BPS", 100); },
  /** Minimum withdrawal amount in smallest currency unit */
  get MIN_WITHDRAWAL_CENTS()     { return getEnvInt("MIN_WITHDRAWAL_AMOUNT_CENTS", 500000); },
};
