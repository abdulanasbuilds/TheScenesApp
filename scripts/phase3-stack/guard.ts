/**
 * Fail-closed guards for the Phase 3 local-stack wrapper.
 *
 * Phase 3A is a credential-free, loopback-only local proof (docs/DECISIONS.md
 * ADR-039; docs/SECURITY-RULES.md SEC-056/SEC-077). These guards make the
 * wrapper refuse, before spawning anything, to:
 * - contact a hosted/non-loopback Supabase target;
 * - run a command outside the reviewed local allowlist (no `link`, `login`,
 *   `projects`, deploy/push/pull, secrets, etc.);
 * - stop every project on the machine (`stop --all`);
 * - operate on a hosted project ref instead of the local project id.
 */

export const LOCAL_PROJECT_ID = "the-scenes-app";

/** Only these top-level commands may ever be spawned. */
export const ALLOWED_COMMANDS = ["start", "status", "stop"] as const;
export type AllowedCommand = (typeof ALLOWED_COMMANDS)[number];

/** Exact argument tokens that indicate a hosted/privileged command. */
export const FORBIDDEN_ARG_TOKENS = [
  "link",
  "unlink",
  "login",
  "logout",
  "projects",
  "organizations",
  "secrets",
  "deploy",
  "branches",
  "domains",
  "sso",
  "vanity-subdomains",
  "storage",
  "functions",
  "gen",
  "push",
  "pull",
  "migration",
  "inspect",
] as const;

export class GuardError extends Error {
  override readonly name = "GuardError";
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost", "[::1]"]);

/**
 * Parses a URL and requires it to be a plain loopback HTTP(S) URL with no
 * userinfo, query, fragment, or non-local host. Rejects hosted Supabase hosts
 * explicitly so their presence produces a clear message rather than a generic
 * loopback error.
 */
export function assertLoopbackHttpUrl(raw: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new GuardError(`${label} is not a valid URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GuardError(`${label} must be an http(s) loopback URL`);
  }
  if (url.username || url.password) {
    throw new GuardError(`${label} must not contain credentials`);
  }
  if (url.search || url.hash) {
    throw new GuardError(`${label} must not contain a query or fragment`);
  }
  assertLoopbackHost(url.hostname, label);
  return url;
}

export function assertLoopbackHost(hostname: string, label: string): void {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isHostedSupabaseHost(host)) {
    throw new GuardError(`${label} must not point at a hosted Supabase host`);
  }
  if (!LOOPBACK_HOSTS.has(hostname.toLowerCase()) && !isIpv4Loopback(host)) {
    throw new GuardError(`${label} must be a loopback host (127.0.0.1 or ::1)`);
  }
}

function isIpv4Loopback(host: string): boolean {
  return /^127(?:\.\d{1,3}){3}$/.test(host);
}

export function isHostedSupabaseHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "supabase.com" ||
    host === "supabase.co" ||
    host.endsWith(".supabase.com") ||
    host.endsWith(".supabase.co") ||
    host.endsWith(".supabase.in") ||
    host.endsWith(".pooler.supabase.com")
  );
}

/**
 * A hosted project ref is a 20-character lowercase base32-ish id; a local
 * project id is a plain slug. Rejects both a mismatched/local-invalid id and any
 * value shaped like a hosted ref.
 */
export function assertLocalProjectId(projectId: string, expected: string = LOCAL_PROJECT_ID): void {
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(projectId)) {
    throw new GuardError(`project id "${projectId}" is not a valid local slug`);
  }
  if (/^[a-z0-9]{20}$/.test(projectId)) {
    throw new GuardError("hosted project refs are not allowed in Phase 3A");
  }
  if (projectId !== expected) {
    throw new GuardError(
      `refusing to operate on project "${projectId}"; expected local project "${expected}"`,
    );
  }
}

/**
 * Validates the argv the wrapper is about to pass to the Supabase CLI: exactly
 * one allowlisted command, no forbidden hosted/privileged token, no hosted
 * project ref/url, and never `stop --all`.
 */
export function assertAllowedCliArgs(argv: readonly string[]): AllowedCommand {
  const [command, ...rest] = argv;
  if (!command) {
    throw new GuardError("a Supabase subcommand is required");
  }
  if (!(ALLOWED_COMMANDS as readonly string[]).includes(command)) {
    throw new GuardError(
      `"${command}" is not an allowlisted local command (${ALLOWED_COMMANDS.join(", ")})`,
    );
  }
  for (const arg of argv) {
    const token = arg.toLowerCase();
    if ((FORBIDDEN_ARG_TOKENS as readonly string[]).includes(token)) {
      throw new GuardError(`forbidden hosted/privileged argument "${arg}"`);
    }
    if (token === "--all") {
      throw new GuardError("`--all` is forbidden; the wrapper stops only its own project");
    }
    if (token === "--project-ref" || token.startsWith("--project-ref=")) {
      throw new GuardError("hosted project refs are not allowed in Phase 3A");
    }
    if (/supabase\.(co|com|in)\b/.test(token)) {
      throw new GuardError("hosted Supabase hosts are not allowed in Phase 3A");
    }
  }
  void rest;
  return command as AllowedCommand;
}

/** Rejects any attempt to reach a hosted project ref/url via environment. */
export function assertNoHostedEnv(env: Record<string, string | undefined>): string[] {
  const present: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    if (/^SUPABASE_(ACCESS_TOKEN|DB_PASSWORD|PROJECT_REF|PROJECT_ID)$/.test(key)) {
      present.push(key);
      continue;
    }
    if (
      /^(SUPABASE_URL|SUPABASE_API_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)$/.test(key)
    ) {
      try {
        const url = new URL(value);
        if (isHostedSupabaseHost(url.hostname)) present.push(key);
      } catch {
        // Not a URL (e.g. a bare key); only flag keys that are credential-shaped.
        if (/SECRET|SERVICE_ROLE|ACCESS_TOKEN/.test(key)) present.push(key);
      }
    }
  }
  return present;
}
