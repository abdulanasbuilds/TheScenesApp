/**
 * Feedback contracts (P4-S4 / ADR-049).
 *
 * Feedback is an internal operational signal for the founder. It is not a durable product database,
 * not an authorization surface and never shown to other users. A submission is validated, rate
 * limited and turned into a GitHub Issue in the private `thescenes-feedback` repository by a
 * server-only adapter. There is no feedback database and no owner dashboard.
 */

export const FEEDBACK_SUBJECT_MIN = 3;
export const FEEDBACK_SUBJECT_MAX = 120;
export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_ROUTE_MAX = 512;

/**
 * Feedback categories. Each maps to one GitHub label and one title prefix. They group issues for the
 * founder and never change authorization or storage.
 */
export const FEEDBACK_CATEGORIES = [
  "general",
  "bug",
  "feature-request",
  "complaint",
  "payment",
  "course",
  "marketplace",
  "events",
  "community",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABELS: Readonly<Record<FeedbackCategory, string>> = Object.freeze({
  general: "General feedback",
  bug: "Bug report",
  "feature-request": "Feature request",
  complaint: "Complaint",
  payment: "Payment problem",
  course: "Course problem",
  marketplace: "Marketplace problem",
  events: "Events problem",
  community: "Community problem",
});

/** The GitHub label applied for each category. Kept in sync with the repository's label set. */
export const FEEDBACK_CATEGORY_GITHUB_LABEL: Readonly<Record<FeedbackCategory, string>> =
  Object.freeze({
    general: "general-feedback",
    bug: "bug",
    "feature-request": "feature-request",
    complaint: "complaint",
    payment: "payment",
    course: "course",
    marketplace: "marketplace",
    events: "events",
    community: "community",
  });

/** Uppercase token used in the issue title, for example `[BUG] Course enrollment problem`. */
export const FEEDBACK_CATEGORY_TITLE_PREFIX: Readonly<Record<FeedbackCategory, string>> =
  Object.freeze({
    general: "FEEDBACK",
    bug: "BUG",
    "feature-request": "FEATURE",
    complaint: "COMPLAINT",
    payment: "PAYMENT",
    course: "COURSE",
    marketplace: "MARKETPLACE",
    events: "EVENTS",
    community: "COMMUNITY",
  });

/** The platform area a submission is about. Helper context only, never authorization. */
export const FEEDBACK_AREAS = [
  "account",
  "learning",
  "community",
  "marketplace",
  "events",
  "payments",
  "creator-tools",
  "notifications",
  "other",
] as const;

export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];

export const FEEDBACK_AREA_LABELS: Readonly<Record<FeedbackArea, string>> = Object.freeze({
  account: "Account and sign-in",
  learning: "Courses and learning",
  community: "Communities and posts",
  marketplace: "Marketplace",
  events: "Events and live sessions",
  payments: "Payments and subscriptions",
  "creator-tools": "Creator workspace",
  notifications: "Notifications",
  other: "Something else",
});

/** Anchor to the single feedback form on the Help page, reused by footer and dashboard entry points. */
export const FEEDBACK_LINK = "/help#feedback";

/**
 * How a submission was handled.
 *
 * - `provider` — a configured server provider accepted it (a GitHub Issue was created);
 * - `local-preview` — the deterministic in-memory provider used by fixture/local mode and tests. It
 *   never claims that a human received the note.
 */
export type FeedbackDelivery = "provider" | "local-preview";

export type FeedbackReceipt = Readonly<{
  accepted: true;
  delivery: FeedbackDelivery;
  /**
   * Internal confirmation reference for logs and tests. It is deliberately never rendered: no
   * repository or issue-management detail reaches the browser.
   */
  reference: string | null;
}>;

export type FeedbackProviderKind = "memory" | "github";

export type FeedbackProviderState =
  | Readonly<{ state: "ready"; provider: FeedbackProviderKind }>
  | Readonly<{ state: "disabled"; provider: "none" }>
  | Readonly<{ state: "misconfigured"; provider: "github"; problems: readonly string[] }>;
