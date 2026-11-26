/**
 * P4-S4 feedback contracts.
 *
 * Feedback is an internal operational signal for the founder, not a durable product database and not
 * an authorization surface. The browser sends only a message, a category and the current internal
 * route; the server adds a pseudonymous user ID, timestamps and the request ID.
 */

export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_ROUTE_MAX = 512;

/**
 * Feedback categories. They group notes for the founder and are included in the pre-filled WhatsApp
 * text; they never change authorization or storage.
 */
export const FEEDBACK_CATEGORIES = ["general", "bug", "idea", "content", "account"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABELS: Readonly<Record<FeedbackCategory, string>> = Object.freeze({
  general: "General feedback",
  bug: "Bug or broken flow",
  idea: "Idea or request",
  content: "Content or course",
  account: "Account or sign-in",
});

/**
 * How the submission was handled.
 *
 * - `provider` — a configured server provider accepted the message;
 * - `handoff` — the server prepared a `wa.me` link. Nothing has been delivered yet: the sender must
 *   press Send inside WhatsApp. This is the honest state for the direct-chat channel;
 * - `local-preview` — the deterministic in-memory provider used by fixture/local mode and tests. It
 *   never claims that a human received the note.
 */
export type FeedbackDelivery = "provider" | "handoff" | "local-preview";

export type FeedbackReceipt = Readonly<{
  accepted: true;
  delivery: FeedbackDelivery;
  /** Provider message ID, or the prepared `wa.me` link for a `handoff` receipt. */
  reference: string | null;
}>;

export type FeedbackProviderKind = "memory" | "whatsapp";

export type FeedbackProviderState =
  | Readonly<{ state: "ready"; provider: FeedbackProviderKind }>
  | Readonly<{ state: "disabled"; provider: "none" }>
  | Readonly<{ state: "misconfigured"; provider: "whatsapp"; problems: readonly string[] }>;
