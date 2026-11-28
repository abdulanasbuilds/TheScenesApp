import { FEEDBACK_CATEGORY_LABELS, type FeedbackCategory } from "./contracts";

/**
 * Client-safe WhatsApp feedback helpers (P4-S4 / ADR-048).
 *
 * The direct-chat channel uses the standard `https://wa.me/<number>?text=<encoded>` deep link. It
 * needs no API key, no provider account and no webhook, so it keeps working on mobile (WhatsApp app)
 * and desktop (WhatsApp Web or the install page). Nothing in this module is server-only.
 */

/** E.164-style number with an optional leading `+`, no separators. */
export const WHATSAPP_NUMBER_PATTERN = /^\+?[1-9]\d{7,14}$/;

/** Keep the pre-filled text comfortably inside deep-link length limits. */
export const WHATSAPP_MESSAGE_MAX = 1800;

export const WHATSAPP_DISPLAY_NUMBER_PATTERN = /^[1-9]\d{7,14}$/;

/**
 * Normalize a pasted number: trim, remove spaces, dots, dashes and parentheses, convert a leading
 * `00` to `+`, then validate. Returns digits only (no `+`) because `wa.me` expects digits.
 */
export function normalizeWhatsAppNumber(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  let candidate = value.trim().replace(/[\s().-]/g, "");
  if (candidate.startsWith("00")) candidate = `+${candidate.slice(2)}`;
  if (!WHATSAPP_NUMBER_PATTERN.test(candidate)) return null;
  return candidate.replace(/^\+/, "");
}

export function isValidWhatsAppNumber(value: string | null | undefined): boolean {
  return normalizeWhatsAppNumber(value) !== null;
}

/** Build the `wa.me` deep link. The number must already be normalized (digits only). */
export function buildWhatsAppLink(number: string, text: string): string {
  if (!WHATSAPP_DISPLAY_NUMBER_PATTERN.test(number)) {
    throw new Error("A normalized WhatsApp number is required.");
  }
  const trimmed = text.trim();
  return trimmed.length > 0
    ? `https://wa.me/${number}?text=${encodeURIComponent(trimmed)}`
    : `https://wa.me/${number}`;
}

export type WhatsAppFeedbackContext = Readonly<{
  category: FeedbackCategory;
  message: string;
  route: string;
  /** Absolute page URL when the browser knows it; the internal route is always included. */
  pageUrl?: string | null;
  /** Display name plus email for a signed-in sender, already formatted for the founder. */
  senderLabel?: string | null;
  /** Pseudonymous account ID for a signed-in sender. */
  userId?: string | null;
  signedIn: boolean;
  occurredAt: string;
  requestId?: string | null;
}>;

/**
 * Build the structured, plain-text message the founder receives in WhatsApp.
 *
 * It is deliberately plain text (no Markdown) and bounded. The sender sees and edits this text inside
 * WhatsApp before anything is sent, which is why the direct link may include their own name/email.
 */
export function buildFeedbackWhatsAppText(context: WhatsAppFeedbackContext): string {
  const body =
    context.message.trim().length > WHATSAPP_MESSAGE_MAX
      ? `${context.message.trim().slice(0, WHATSAPP_MESSAGE_MAX)}…`
      : context.message.trim();

  const role = context.signedIn ? "member" : "guest";
  const identity = context.signedIn
    ? [context.senderLabel?.trim() || null, context.userId ? `id ${context.userId}` : null]
        .filter(Boolean)
        .join(" · ")
    : "anonymous";

  const lines = [
    "The Scenes · feedback",
    `Category: ${FEEDBACK_CATEGORY_LABELS[context.category]}`,
    `From: ${identity || "signed-in member"} (${role})`,
    `Route: ${context.route}`,
  ];

  const pageUrl = context.pageUrl?.trim();
  if (pageUrl && pageUrl !== context.route) lines.splice(4, 0, `Page: ${pageUrl}`);
  lines.push(`Time: ${context.occurredAt}`);
  if (context.requestId) lines.push(`Request: ${context.requestId}`);
  lines.push("---", body || "(no message typed)");

  return lines.join("\n");
}

/** Convenience: validate a stored number and return the ready-to-use deep link. */
export function buildFeedbackWhatsAppLink(
  number: string,
  context: WhatsAppFeedbackContext,
): string {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) throw new Error("A valid WhatsApp number is required.");
  return buildWhatsAppLink(normalized, buildFeedbackWhatsAppText(context));
}
