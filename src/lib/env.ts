/**
 * Pure environment contract for the two Phase 3A data modes.
 *
 * This module deliberately performs no I/O and contacts no provider. Wave 0
 * tests it in isolation; the request-lazy server wiring is added in Wave 2.
 *
 * Rules (from the revision-3 spec, section 10):
 * - `VITE_DATA_MODE` is exactly `fixtures` or `supabase-local`.
 * - In `fixtures` mode the Supabase URL/key are optional and unparsed, but
 *   secret-looking `VITE_` names or values still fail.
 * - In `supabase-local` mode the URL must be loopback HTTP on the approved API
 *   port with no userinfo, query, fragment, or extra path, and the key must be
 *   a bounded `sb_publishable_...` value.
 * - Errors never echo the rejected value.
 */

export const DATA_MODES = ["fixtures", "supabase-local"] as const;

export type DataMode = (typeof DATA_MODES)[number];

/** The local Supabase CLI API port pinned by `supabase/config.toml`. */
export const LOCAL_API_PORT = 54321;

export type FixtureEnv = Readonly<{
  dataMode: "fixtures";
}>;

export type SupabaseLocalEnv = Readonly<{
  dataMode: "supabase-local";
  supabaseUrl: string;
  supabasePublishableKey: string;
}>;

export type AppEnv = FixtureEnv | SupabaseLocalEnv;

export type EnvErrorCode =
  | "MODE_MISSING"
  | "MODE_UNKNOWN"
  | "SECRET_VITE_NAME"
  | "SECRET_VITE_VALUE"
  | "SUPABASE_URL_REQUIRED"
  | "SUPABASE_URL_INVALID"
  | "SUPABASE_KEY_REQUIRED"
  | "SUPABASE_KEY_INVALID";

export class EnvValidationError extends Error {
  readonly code: EnvErrorCode;

  constructor(code: EnvErrorCode, message: string) {
    super(message);
    this.name = "EnvValidationError";
    this.code = code;
  }
}

/**
 * Names that must never be exposed through Vite. They are rejected even in
 * fixture mode, before any provider code can run.
 */
const SECRET_VITE_NAME =
  /(?:^|_)(?:SECRET|SERVICE_?ROLE|PRIVATE|PASSWD|PASSWORD|DB_?URL|DATABASE_?URL|TOKEN|JWT|API_?KEY)(?:_|$)/i;

const JWT_VALUE = /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SECRET_KEY_PREFIX = /^(?:sb_secret_|sbp_)/i;
const SERVICE_ROLE_VALUE = /service_role/i;
const PUBLISHABLE_KEY = /^sb_publishable_[A-Za-z0-9_-]{8,512}$/;

function isViteKey(key: string): boolean {
  return key.startsWith("VITE_");
}

function assertNoSecretViteValues(raw: Readonly<Record<string, string | undefined>>): void {
  for (const [key, value] of Object.entries(raw)) {
    if (!isViteKey(key)) continue;

    if (SECRET_VITE_NAME.test(key)) {
      // The variable name is safe to report; its value never is.
      throw new EnvValidationError(
        "SECRET_VITE_NAME",
        `VITE_ variable "${key}" looks like secret or service material and is not allowed.`,
      );
    }

    if (typeof value !== "string" || value.length === 0) continue;
    const trimmed = value.trim();

    if (
      JWT_VALUE.test(trimmed) ||
      SECRET_KEY_PREFIX.test(trimmed) ||
      SERVICE_ROLE_VALUE.test(trimmed)
    ) {
      throw new EnvValidationError(
        "SECRET_VITE_VALUE",
        `VITE_ variable "${key}" contains secret or service-role material and is not allowed.`,
      );
    }
  }
}

function parseLocalUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new EnvValidationError("SUPABASE_URL_INVALID", "VITE_SUPABASE_URL is not a valid URL.");
  }

  if (url.protocol !== "http:") {
    throw new EnvValidationError(
      "SUPABASE_URL_INVALID",
      "VITE_SUPABASE_URL must use plain http for the local proof.",
    );
  }

  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new EnvValidationError(
      "SUPABASE_URL_INVALID",
      "VITE_SUPABASE_URL must target loopback (127.0.0.1 or localhost).",
    );
  }

  if (url.port !== String(LOCAL_API_PORT)) {
    throw new EnvValidationError(
      "SUPABASE_URL_INVALID",
      `VITE_SUPABASE_URL must use the approved local API port ${LOCAL_API_PORT}.`,
    );
  }

  if (url.username !== "" || url.password !== "") {
    throw new EnvValidationError(
      "SUPABASE_URL_INVALID",
      "VITE_SUPABASE_URL must not contain userinfo.",
    );
  }

  if (url.search !== "" || url.hash !== "") {
    throw new EnvValidationError(
      "SUPABASE_URL_INVALID",
      "VITE_SUPABASE_URL must not contain a query or fragment.",
    );
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new EnvValidationError(
      "SUPABASE_URL_INVALID",
      "VITE_SUPABASE_URL must not contain an extra path.",
    );
  }

  return `${url.protocol}//${url.host}`;
}

function parsePublishableKey(value: string): string {
  if (!PUBLISHABLE_KEY.test(value)) {
    throw new EnvValidationError(
      "SUPABASE_KEY_INVALID",
      "VITE_SUPABASE_PUBLISHABLE_KEY must be a bounded sb_publishable_... value.",
    );
  }
  return value;
}

/**
 * Validate raw Vite environment values. The input is normally the result of
 * `loadEnv(mode, cwd, "VITE_")` or an equivalent string record in tests.
 */
export function parseAppEnv(raw: Readonly<Record<string, string | undefined>>): AppEnv {
  assertNoSecretViteValues(raw);

  const mode = raw.VITE_DATA_MODE?.trim();
  if (!mode) {
    throw new EnvValidationError(
      "MODE_MISSING",
      "VITE_DATA_MODE is required. Use fixtures or supabase-local.",
    );
  }

  if (mode !== "fixtures" && mode !== "supabase-local") {
    throw new EnvValidationError(
      "MODE_UNKNOWN",
      "VITE_DATA_MODE must be exactly fixtures or supabase-local.",
    );
  }

  if (mode === "fixtures") {
    return Object.freeze({ dataMode: "fixtures" });
  }

  const urlValue = raw.VITE_SUPABASE_URL?.trim();
  if (!urlValue) {
    throw new EnvValidationError(
      "SUPABASE_URL_REQUIRED",
      "VITE_SUPABASE_URL is required in supabase-local mode.",
    );
  }

  const keyValue = raw.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!keyValue) {
    throw new EnvValidationError(
      "SUPABASE_KEY_REQUIRED",
      "VITE_SUPABASE_PUBLISHABLE_KEY is required in supabase-local mode.",
    );
  }

  return Object.freeze({
    dataMode: "supabase-local",
    supabaseUrl: parseLocalUrl(urlValue),
    supabasePublishableKey: parsePublishableKey(keyValue),
  });
}
