/**
 * P4-S4 feedback contracts.
 *
 * Feedback is an internal operational signal for the founder, not a durable product database and not
 * an authorization surface. The browser sends only a message and the current internal route; the
 * server adds a pseudonymous user ID, timestamps and the request ID.
 */

export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_ROUTE_MAX = 512;

/**
 * How the submission was handled. `local-preview` is the deterministic in-memory provider used by
 * fixture/local mode and tests: it never claims that a human received the note.
 */
export type FeedbackDelivery = "provider" | "local-preview";

export type FeedbackReceipt = Readonly<{
  accepted: true;
  delivery: FeedbackDelivery;
  reference: string | null;
}>;

export type FeedbackProviderKind = "memory" | "telegram";

export type FeedbackProviderState =
  | Readonly<{ state: "ready"; provider: FeedbackProviderKind }>
  | Readonly<{ state: "disabled"; provider: "none" }>
  | Readonly<{ state: "misconfigured"; provider: "telegram"; problems: readonly string[] }>;
