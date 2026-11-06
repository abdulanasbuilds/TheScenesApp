import "@tanstack/react-start/server-only";

const SENSITIVE_KEY = /(?:password|cookie|authorization|token|secret|session|email|key)/i;

export function redactLogValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactLogValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactLogValue(nested),
      ]),
    );
  }
  if (
    typeof value === "string" &&
    /(?:sb_(?:secret|publishable)_|eyJ[A-Za-z0-9_-]*\.)/.test(value)
  ) {
    return "[REDACTED]";
  }
  return value;
}

export function logServerEvent(
  level: "info" | "warn" | "error",
  event: string,
  detail: Readonly<Record<string, unknown>>,
): void {
  const redacted = redactLogValue(detail) as Record<string, unknown>;
  const payload = JSON.stringify({ level, event, ...redacted });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}
