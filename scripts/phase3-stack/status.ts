/**
 * Parses `supabase status -o json` and reduces it to approved values.
 *
 * The raw CLI payload contains JWT/secret/service-role material. This module
 * keeps only the values that are safe to forward (loopback API URL, DB URL for
 * an administrative child, and the publishable key) and records the *names* of
 * secret fields that were present — never their values.
 */

import { SECRET_FIELD_NAMES } from "./redact.ts";

export class CliOutputError extends Error {
  override readonly name = "CliOutputError";
}

/** Status keys whose values are safe to forward to a local child process. */
const APPROVED_KEYS = ["API_URL", "DB_URL", "GRAPHQL_URL", "PUBLISHABLE_KEY"] as const;
export type ApprovedKey = (typeof APPROVED_KEYS)[number];

export interface StackStatus {
  apiUrl: string | null;
  dbUrl: string | null;
  graphqlUrl: string | null;
  publishableKey: string | null;
  /** Names of secret-bearing fields seen in the payload (values discarded). */
  secretFieldsPresent: string[];
  /** Safe key/value pairs only. */
  approved: Partial<Record<ApprovedKey, string>>;
}

function normalisePairs(parsed: unknown): Record<string, string> {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
      else if (typeof value === "number" || typeof value === "boolean") out[key] = String(value);
    }
    return out;
  }
  if (Array.isArray(parsed)) {
    const out: Record<string, string> = {};
    for (const entry of parsed) {
      if (entry && typeof entry === "object" && "name" in entry && "value" in entry) {
        const name = String((entry as { name: unknown }).name);
        const value = (entry as { value: unknown }).value;
        out[name] = typeof value === "string" ? value : JSON.stringify(value);
      }
    }
    if (Object.keys(out).length > 0) return out;
  }
  throw new CliOutputError("unexpected Supabase status JSON shape");
}

/** Parses CLI JSON output, throwing a safe error on malformed input. */
export function parseCliJson(raw: string, command: string): Record<string, string> {
  const text = raw.trim();
  if (!text) {
    throw new CliOutputError(`\`supabase ${command}\` produced no JSON output`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Some commands may prefix log lines; fall back to the last JSON object line.
    const lastObjectLine = text
      .split(/\r?\n/)
      .reverse()
      .find((line) => line.trim().startsWith("{") && line.trim().endsWith("}"));
    if (!lastObjectLine) {
      throw new CliOutputError(`\`supabase ${command}\` output was not valid JSON`);
    }
    try {
      parsed = JSON.parse(lastObjectLine);
    } catch {
      throw new CliOutputError(`\`supabase ${command}\` output was not valid JSON`);
    }
  }
  return normalisePairs(parsed);
}

export function extractStatus(pairs: Record<string, string>): StackStatus {
  const approved: Partial<Record<ApprovedKey, string>> = {};
  for (const key of APPROVED_KEYS) {
    const value = pairs[key];
    if (typeof value === "string" && value.length > 0) approved[key] = value;
  }
  const secretNames = new Set<string>(SECRET_FIELD_NAMES);
  const secretFieldsPresent = Object.keys(pairs).filter(
    (key) =>
      secretNames.has(key) ||
      /(?:^|_)(?:SECRET|PASSWORD|TOKEN)(?:_|$)/.test(key) ||
      /SERVICE_ROLE/.test(key),
  );

  return {
    apiUrl: approved.API_URL ?? null,
    dbUrl: approved.DB_URL ?? null,
    graphqlUrl: approved.GRAPHQL_URL ?? null,
    publishableKey: approved.PUBLISHABLE_KEY ?? null,
    secretFieldsPresent: secretFieldsPresent.sort(),
    approved,
  };
}

/** Ports the stack exposes, for host-listener enumeration. */
export function statusPorts(status: StackStatus): number[] {
  const ports = new Set<number>();
  for (const url of [status.apiUrl, status.dbUrl, status.graphqlUrl]) {
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (parsed.port) ports.add(Number(parsed.port));
    } catch {
      // ignore unparseable values; guards validate the API URL separately
    }
  }
  return [...ports].sort((a, b) => a - b);
}
