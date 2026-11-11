/**
 * Opaque keyset cursor for the connected notifications list (P4-S3).
 *
 * The cursor is `"<createdAt>|<uuid>"` from the last row of the previous page. It is deliberately
 * plain text (no base64) because it never travels in a URL path: it is a JSON field of a server
 * function. Both parts are validated before use so a tampered cursor becomes a safe validation error
 * rather than a malformed query.
 */

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NotificationCursor = Readonly<{ createdAt: string; id: string }>;

export function encodeNotificationCursor(cursor: NotificationCursor): string {
  return `${cursor.createdAt}|${cursor.id}`;
}

export function decodeNotificationCursor(value: string): NotificationCursor | null {
  const separator = value.indexOf("|");
  if (separator <= 0) return null;
  const createdAt = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if (!ISO_TIMESTAMP.test(createdAt) || !UUID.test(id)) return null;
  return { createdAt, id };
}

/**
 * PostgREST `or` filter implementing keyset paging over `(created_at desc, id desc)`. Values are
 * double-quoted so timestamps survive the comma-separated `or` grammar.
 */
export function buildNotificationKeysetFilter(cursor: NotificationCursor): string {
  return `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt."${cursor.id}")`;
}
