/**
 * Listener classification and the loopback-only isolation gate.
 *
 * SEC-077 requires every local service (Supabase API/Postgres/Auth, Vite) to be
 * unreachable from another machine. A `0.0.0.0`/`::` (unspecified) bind or any
 * non-loopback address fails the gate, which then stops the stack.
 */

export type AddressKind = "loopback" | "unspecified" | "non-loopback" | "unknown";

export interface Listener {
  /** Service or container the listener belongs to. */
  service: string;
  /** Host bind address exactly as reported (may be `0.0.0.0`, `::`, `127.0.0.1`). */
  host: string;
  port: number;
  /** Where the evidence came from. */
  source: "docker" | "host";
}

export interface IsolationGate {
  ok: boolean;
  loopback: Listener[];
  offenders: Listener[];
  unknown: Listener[];
}

function stripBrackets(host: string): string {
  return host.trim().replace(/^\[|\]$/g, "");
}

/** Classifies a single bind address. */
export function classifyHost(host: string): AddressKind {
  const value = stripBrackets(host).toLowerCase();
  if (value === "" || value === "*" || value === "any") return "unknown";
  if (value === "0.0.0.0" || value === "::") return "unspecified";
  if (value === "::1" || value === "localhost") return "loopback";
  if (/^127(?:\.\d{1,3}){3}$/.test(value)) return "loopback";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return "non-loopback";
  if (value.includes(":")) {
    // Any other IPv6 address is not the loopback address.
    return "non-loopback";
  }
  return "non-loopback";
}

/** Parses `host:port` (IPv6 allowed as `[::1]:54321`). */
export function parseHostPort(spec: string): { host: string; port: number } | null {
  const trimmed = spec.trim();
  if (!trimmed) return null;
  const bracketMatch = /^\[([^\]]+)\]:(\d{1,5})$/.exec(trimmed);
  if (bracketMatch) {
    return { host: bracketMatch[1], port: Number(bracketMatch[2]) };
  }
  const idx = trimmed.lastIndexOf(":");
  if (idx <= 0) return null;
  const host = trimmed.slice(0, idx);
  const port = Number(trimmed.slice(idx + 1));
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
  return { host: stripBrackets(host), port };
}

/** Gate: every known listener must be loopback, and at least one must be seen. */
export function evaluateIsolation(listeners: readonly Listener[]): IsolationGate {
  const loopback: Listener[] = [];
  const offenders: Listener[] = [];
  const unknown: Listener[] = [];
  for (const listener of listeners) {
    switch (classifyHost(listener.host)) {
      case "loopback":
        loopback.push(listener);
        break;
      case "unspecified":
      case "non-loopback":
        offenders.push(listener);
        break;
      default:
        unknown.push(listener);
    }
  }
  return {
    ok: offenders.length === 0 && unknown.length === 0 && listeners.length > 0,
    loopback,
    offenders,
    unknown,
  };
}

export function describeListener(listener: Listener): string {
  const kind = classifyHost(listener.host);
  return `${listener.service} ${listener.host}:${listener.port} (${kind}, ${listener.source})`;
}
