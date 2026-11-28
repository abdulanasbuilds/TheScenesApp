import "@tanstack/react-start/server-only";
import type {
  FeedbackArea,
  FeedbackCategory,
  FeedbackDelivery,
} from "../../features/feedback/contracts";

/**
 * P4-S4 feedback providers (ADR-049).
 *
 * A provider only knows how to hand a prepared message to a destination. It never reads cookies,
 * tokens, email addresses, request headers or protected content, and it never logs the message text.
 *
 * Two implementations exist:
 * - `MemoryFeedbackProvider` — a deterministic, bounded in-process inbox for fixture/local mode and
 *   unit tests. It never claims a human received the note.
 * - `GitHubIssuesFeedbackProvider` (see `github-issues.server.ts`) — creates a GitHub Issue through
 *   the official REST API. It is the only path that reports a message as delivered.
 */

export type FeedbackMessage = Readonly<{
  category: FeedbackCategory;
  /** Short, one-line summary used as the issue title after the category prefix. */
  subject: string;
  text: string;
  area: FeedbackArea | null;
  route: string;
  pseudonymousUserId: string | null;
  /** Coarse role only: a signed-in member or an anonymous guest. Not an authorization claim. */
  role: "member" | "guest";
  occurredAt: string;
  requestId: string;
  /** Stable identifier reused across retries so a lost response never creates a duplicate issue. */
  submissionId: string;
}>;

export type FeedbackResult = Readonly<{ delivery: FeedbackDelivery; reference: string | null }>;

export class FeedbackProviderError extends Error {
  constructor(
    readonly cause: "configuration" | "network" | "rejected" | "rate-limited" | "unavailable",
    message: string,
  ) {
    super(message);
    this.name = "FeedbackProviderError";
  }
}

export interface FeedbackProvider {
  readonly kind: "memory" | "github";
  submit(message: FeedbackMessage): Promise<FeedbackResult>;
}

const MAX_BUFFERED_MESSAGES = 100;

/** Deterministic, bounded in-process inbox for fixture/local mode and unit tests. */
export class MemoryFeedbackProvider implements FeedbackProvider {
  readonly kind = "memory" as const;
  private readonly inbox: FeedbackMessage[] = [];
  private counter = 0;

  async submit(message: FeedbackMessage): Promise<FeedbackResult> {
    this.counter += 1;
    this.inbox.push(message);
    if (this.inbox.length > MAX_BUFFERED_MESSAGES) this.inbox.shift();
    return { delivery: "local-preview", reference: `memory:${this.counter}` };
  }

  get buffered(): number {
    return this.inbox.length;
  }

  drain(): readonly FeedbackMessage[] {
    const items = [...this.inbox];
    this.inbox.length = 0;
    return items;
  }
}
