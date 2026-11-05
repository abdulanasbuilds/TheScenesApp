/**
 * Secret redaction for Phase 3 local-stack tooling.
 *
 * The stack wrapper captures Supabase CLI stdout/stderr in memory and must never
 * print, persist, or forward the raw values. Every string that could reach a log,
 * an error message, or the console passes through a redactor built here.
 *
 * Rules (see docs/SECURITY-RULES.md SEC-014/SEC-054/SEC-061):
 * - known secret values (from `supabase status`) are replaced verbatim;
 * - JWT-shaped tokens, Supabase secret/publishable/access keys, and connection
 *   string passwords are replaced by shape;
 * - `NAME=value` / `"name": "value"` assignments for secret-looking names are
 *   collapsed to `NAME=[REDACTED]`.
 */

export type Redactor = (input: string) => string;

export const REDACTED = "[REDACTED]";

/** JWT: three base64url-ish segments. Covers legacy anon/service_role keys. */
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g;

/** Supabase secret key (`sb_secret_...`). Privileged; never printable. */
const SB_SECRET_PATTERN = /\bsb_secret_[A-Za-z0-9_-]{4,}\b/g;

/** Supabase personal access token (`sbp_...`). Grants hosted-account access. */
const SB_ACCESS_TOKEN_PATTERN = /\bsbp_[A-Za-z0-9_-]{8,}\b/g;

/** Password embedded in a postgres/redis/smtp style connection URL. */
const CONNECTION_PASSWORD_PATTERN =
  /\b((?:postgres(?:ql)?|redis|rediss|amqp|smtp):\/\/[^:@/\s]+):[^@/\s]+@/g;

/** `NAME=value`, `NAME: value`, or `"name": "value"` for secret-looking names. */
const SECRET_ASSIGNMENT_PATTERN =
  /\b([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASSWD|TOKEN|SERVICE_ROLE|JWT|PRIVATE_KEY|ACCESS_KEY)[A-Za-z0-9_]*)(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi;

/** Names whose value must never be shown, even if it does not match a shape. */
export const SECRET_FIELD_NAMES = [
  "JWT_SECRET",
  "ANON_KEY",
  "SERVICE_ROLE_KEY",
  "SECRET_KEY",
  "S3_PROTOCOL_ACCESS_KEY_ID",
  "S3_PROTOCOL_ACCESS_KEY_SECRET",
  "DB_PASSWORD",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a redactor that first removes exact known secret values, then applies
 * shape-based patterns. Empty/very short values are ignored so the redactor does
 * not blank out ordinary text.
 */
export function createRedactor(secretValues: Iterable<string> = []): Redactor {
  const literals = [...secretValues]
    .filter((value) => typeof value === "string" && value.trim().length >= 4)
    .sort((a, b) => b.length - a.length)
    .map((value) => new RegExp(escapeRegExp(value), "g"));

  return (input: string): string => {
    if (typeof input !== "string" || input.length === 0) return "";
    let output = input;
    for (const pattern of literals) {
      output = output.replace(pattern, REDACTED);
    }
    output = output
      .replace(JWT_PATTERN, REDACTED)
      .replace(SB_SECRET_PATTERN, REDACTED)
      .replace(SB_ACCESS_TOKEN_PATTERN, REDACTED)
      .replace(CONNECTION_PASSWORD_PATTERN, `$1:${REDACTED}@`)
      .replace(SECRET_ASSIGNMENT_PATTERN, `$1$2${REDACTED}`);
    return output;
  };
}

/** Convenience redactor with no known literal values. */
export function redactSecrets(input: string): string {
  return createRedactor()(input);
}

/** True when the text still contains an obvious unredacted secret shape. */
export function containsSecretShape(input: string): boolean {
  JWT_PATTERN.lastIndex = 0;
  SB_SECRET_PATTERN.lastIndex = 0;
  SB_ACCESS_TOKEN_PATTERN.lastIndex = 0;
  return (
    JWT_PATTERN.test(input) || SB_SECRET_PATTERN.test(input) || SB_ACCESS_TOKEN_PATTERN.test(input)
  );
}
