/**
 * Storage quota and file access logic — server-side only.
 *
 * Free plan: 0 bytes hosted storage (external links only)
 * Pro plan:  100 GB (configurable via PRO_PLAN_STORAGE_BYTES)
 *
 * Files are stored in Cloudflare R2 using the S3-compatible API.
 * Presigned URLs give time-limited access without exposing bucket credentials.
 *
 * Env vars required:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET_NAME
 */

import { adminDb } from "@/lib/supabase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorageUsage = {
  creatorEmail: string;
  usedBytes: number;
  quotaBytes: number;
  usedPercent: number;
  availableBytes: number;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

function getR2Config(): R2Config | null {
  const accountId        = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId      = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey  = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName       = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;
  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

// ─── Storage usage ────────────────────────────────────────────────────────────

export async function getStorageUsage(creatorEmail: string): Promise<StorageUsage> {
  const { data } = await adminDb.selectOne<{ used_bytes: number; quota_bytes: number }>(
    "storage_usage",
    { "creator_email": `eq.${creatorEmail}` }
  );

  const usedBytes  = data?.used_bytes  ?? 0;
  const quotaBytes = data?.quota_bytes ?? 0;

  return {
    creatorEmail,
    usedBytes,
    quotaBytes,
    usedPercent: quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 100) : 0,
    availableBytes: Math.max(0, quotaBytes - usedBytes),
  };
}

/** Check if a creator is allowed to upload a file of the given size. */
export async function checkUploadAllowed(
  creatorEmail: string,
  fileSizeBytes: number
): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await getStorageUsage(creatorEmail);

  if (usage.quotaBytes === 0) {
    return { allowed: false, reason: "Your plan does not include hosted storage. Upgrade to Pro to upload files." };
  }

  if (usage.usedBytes + fileSizeBytes > usage.quotaBytes) {
    const availableMb = Math.floor(usage.availableBytes / (1024 * 1024));
    return { allowed: false, reason: `Not enough storage. You have ${availableMb} MB available.` };
  }

  return { allowed: true };
}

/** Record bytes added to a creator's storage usage. */
export async function recordFileUpload(creatorEmail: string, bytes: number): Promise<void> {
  await adminDb.rpc("increment_storage_usage", {
    p_creator_email: creatorEmail,
    p_bytes: bytes,
  });
}

/** Record bytes freed from a creator's storage usage. */
export async function recordFileDeletion(creatorEmail: string, bytes: number): Promise<void> {
  await adminDb.rpc("decrement_storage_usage", {
    p_creator_email: creatorEmail,
    p_bytes: bytes,
  });
}

/**
 * Set a creator's storage quota (called when they upgrade/downgrade).
 * Upserts the storage_usage row.
 */
export async function setStorageQuota(creatorEmail: string, quotaBytes: number): Promise<void> {
  await adminDb.upsert(
    "storage_usage",
    {
      creator_email: creatorEmail,
      quota_bytes:   quotaBytes,
      updated_at:    new Date().toISOString(),
    },
    "creator_email"
  );
}

// ─── AWS SigV4 helper (Cloudflare Worker / Web Crypto compatible) ─────────────

async function hmacSha256(key: CryptoKey | BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = key instanceof CryptoKey
    ? key
    : await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate an AWS SigV4 presigned URL for Cloudflare R2 (S3-compatible API).
 * Works in Cloudflare Workers (Web Crypto) and Node.js.
 */
export async function generatePresignedUrl(opts: {
  key: string;           // object key in R2, e.g. "creators/foo@bar.com/file.pdf"
  method: "GET" | "PUT";
  expiresInSeconds?: number;
  contentType?: string;
}): Promise<string | null> {
  const cfg = getR2Config();
  if (!cfg) {
    console.warn("[storage] R2 not configured — cannot generate presigned URL.");
    return null;
  }

  const expiresIn = opts.expiresInSeconds ?? 3600;
  const now       = new Date();
  const region    = "auto";
  const service   = "s3";
  const host      = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const dateStr   = now.toISOString().replace(/[:-]/g, "").slice(0, 8);
  const timeStr   = now.toISOString().replace(/[:-]/g, "").slice(0, 15) + "Z";

  const credScope = `${dateStr}/${region}/${service}/aws4_request`;
  const credential = `${cfg.accessKeyId}/${credScope}`;

  const signedHeaders = "host";
  const queryParams = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", timeStr],
    ["X-Amz-Expires", String(expiresIn)],
    ["X-Amz-SignedHeaders", signedHeaders],
  ];

  const canonicalQueryString = queryParams
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalRequest = [
    opts.method,
    `/${encodeURIComponent(opts.key).replace(/%2F/g, "/")}`,
    canonicalQueryString,
    `host:${host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const payloadHash = await sha256Hex(canonicalRequest);
  const stringToSign = `AWS4-HMAC-SHA256\n${timeStr}\n${credScope}\n${payloadHash}`;

  // Derive signing key
  const enc = new TextEncoder();
  const kDate    = await hmacSha256(enc.encode(`AWS4${cfg.secretAccessKey}`), dateStr);
  const kRegion  = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");

  const sigKey = await crypto.subtle.importKey(
    "raw", kSigning, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = toHex(await crypto.subtle.sign("HMAC", sigKey, enc.encode(stringToSign)));

  const url = `https://${host}/${opts.key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  return url;
}

/** Validate a file key belongs to the requesting creator (prevents cross-tenant access). */
export function isValidFileKey(key: string, creatorEmail: string): boolean {
  // Keys must be prefixed with "creators/{email}/" to prevent path traversal
  const prefix = `creators/${creatorEmail}/`;
  return key.startsWith(prefix) && !key.includes("..");
}

/** Build a safe R2 key for a creator file. */
export function buildFileKey(creatorEmail: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  return `creators/${creatorEmail}/${Date.now()}_${safe}`;
}
