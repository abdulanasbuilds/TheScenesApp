import "@tanstack/react-start/server-only";
import type { FeedbackDelivery } from "../../features/feedback/contracts";

/**
 * P4-S4 feedback providers.
 *
 * A provider only knows how to hand a prepared message to a destination. It never reads cookies,
 * tokens, email addresses, request headers or protected content, and it never logs the message text.
 */

export type FeedbackMessage = Readonly<{
  text: string;
  route: string;
  pseudonymousUserId: string | null;
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
  readonly kind: "memory" | "telegram";
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

export const TELEGRAM_TIMEOUT_MS = 3000;

type TelegramResponse = { result?: { message_id?: unknown } };

/** Format the operator message as plain text so no Markdown/HTML injection is possible. */
export function formatFeedbackMessage(message: FeedbackMessage): string {
  const identity =
    message.pseudonymousUserId === null
      ? "anonymous"
      : `signed-in user ${message.pseudonymousUserId}`;
  const body = message.text.length > 3500 ? `${message.text.slice(0, 3500)}…` : message.text;
  return [
    "New feedback · The Scenes",
    `Route: ${message.route}`,
    `From: ${identity}`,
    `Time: ${message.occurredAt}`,
    `Request: ${message.requestId}`,
    "---",
    body,
  ].join("\n");
}

export class TelegramFeedbackProvider implements FeedbackProvider {
  readonly kind = "telegram" as const;

  constructor(
    private readonly config: Readonly<{ botToken: string; chatId: string }>,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async submit(message: FeedbackMessage): Promise<FeedbackResult> {
    const text = formatFeedbackMessage(message);

    let response: Response;
    try {
      response = await this.fetchImpl(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: this.config.chatId,
            text,
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        },
      );
    } catch {
      throw new FeedbackProviderError("network", "The feedback provider did not respond.");
    }

    if (!response.ok) {
      throw new FeedbackProviderError("rejected", `The feedback provider rejected the message.`);
    }

    let reference: string | null = null;
    try {
      const body = (await response.json()) as TelegramResponse;
      const messageId = body?.result?.message_id;
      if (typeof messageId === "number") reference = `telegram:${messageId}`;
    } catch {
      // A missing/unreadable body is not a delivery failure; the 2xx status already confirms it.
      reference = null;
    }

    return { delivery: "provider", reference };
  }
}
