import "@tanstack/react-start/server-only";
import type { FeedbackCategory, FeedbackDelivery } from "../../features/feedback/contracts";
import {
  buildFeedbackWhatsAppLink,
  type WhatsAppFeedbackContext,
} from "../../features/feedback/whatsapp";

/**
 * P4-S4 feedback providers.
 *
 * A provider only knows how to hand a prepared message to a destination. It never reads cookies,
 * tokens, email addresses, request headers or protected content, and it never logs the message text.
 */

export type FeedbackMessage = Readonly<{
  text: string;
  category: FeedbackCategory;
  route: string;
  pseudonymousUserId: string | null;
  /** Coarse role only: a signed-in member or an anonymous guest. Not an authorization claim. */
  role: "member" | "guest";
  occurredAt: string;
  requestId: string;
}>;

export type FeedbackResult = Readonly<{ delivery: FeedbackDelivery; reference: string | null }>;

export class FeedbackProviderError extends Error {
  constructor(
    readonly cause: "configuration" | "network" | "rejected",
    message: string,
  ) {
    super(message);
    this.name = "FeedbackProviderError";
  }
}

export interface FeedbackProvider {
  readonly kind: "memory" | "whatsapp";
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

/**
 * WhatsApp direct-chat provider (ADR-048).
 *
 * WhatsApp has no free server-to-person API, so this adapter does not pretend to deliver. It prepares
 * a standard `wa.me` deep link containing the structured note and returns a `handoff` receipt. The
 * sender presses Send inside WhatsApp, which reaches the founder's own DM at zero cost and with no
 * business account, webhook or third-party broker.
 *
 * Only the minimized server context is included. The sender's own name/email is added by the browser
 * path, where the sender already knows their identity and reviews the text before sending.
 */
export class WhatsAppFeedbackProvider implements FeedbackProvider {
  readonly kind = "whatsapp" as const;

  constructor(private readonly config: Readonly<{ number: string }>) {}

  async submit(message: FeedbackMessage): Promise<FeedbackResult> {
    let link: string;
    try {
      const context: WhatsAppFeedbackContext = {
        category: message.category,
        message: message.text,
        route: message.route,
        senderLabel: null,
        userId: message.pseudonymousUserId,
        signedIn: message.role === "member",
        occurredAt: message.occurredAt,
        requestId: message.requestId,
      };
      link = buildFeedbackWhatsAppLink(this.config.number, context);
    } catch {
      throw new FeedbackProviderError(
        "configuration",
        "The WhatsApp handoff link could not be prepared.",
      );
    }

    return { delivery: "handoff", reference: link };
  }
}
