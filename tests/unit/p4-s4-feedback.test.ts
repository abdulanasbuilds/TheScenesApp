import { describe, expect, test } from "bun:test";
import { feedbackSubmissionSchema } from "../../src/features/feedback/schemas";
import {
  describeFeedbackProvider,
  readFeedbackConfig,
} from "../../src/server/feedback/feedback-config.server";
import {
  FeedbackProviderError,
  formatFeedbackMessage,
  MemoryFeedbackProvider,
  TelegramFeedbackProvider,
  type FeedbackMessage,
  type FeedbackProvider,
} from "../../src/server/feedback/feedback-provider.server";
import { submitFeedback } from "../../src/server/feedback/feedback.service.server";
import { inspectIntegrations } from "../../src/server/integrations/health.server";
import { PublicAppError } from "../../src/features/shared/safe-handler";

const BOT_TOKEN = ["123456789", "A".repeat(35)].join(":");

const silent = { logger: () => {} } as const;

describe("P4-S4 feedback schema", () => {
  test("accepts an internal route and a bounded message", () => {
    expect(
      feedbackSubmissionSchema.safeParse({
        message: "The lesson player stops after the second module.",
        route: "/c/ai-builders/classroom/prompting/lesson-2?tab=notes",
      }).success,
    ).toBe(true);
  });

  test("rejects a short message and a non-internal route", () => {
    expect(
      feedbackSubmissionSchema.safeParse({ message: "too short", route: "/help" }).success,
    ).toBe(false);
    for (const route of ["https://evil.test/path", "//evil.test/path", "help"]) {
      expect(
        feedbackSubmissionSchema.safeParse({
          message: "A sufficiently long feedback message.",
          route,
        }).success,
      ).toBe(false);
    }
  });

  test("rejects a message over the maximum length", () => {
    expect(
      feedbackSubmissionSchema.safeParse({ message: "a".repeat(2001), route: "/help" }).success,
    ).toBe(false);
  });
});

describe("P4-S4 feedback configuration", () => {
  test("defaults to the local preview provider", () => {
    expect(readFeedbackConfig({})).toEqual({ provider: "memory" });
  });

  test("accepts a complete Telegram configuration without exposing values", () => {
    const config = readFeedbackConfig({
      FEEDBACK_PROVIDER: "telegram",
      TELEGRAM_BOT_TOKEN: BOT_TOKEN,
      TELEGRAM_FEEDBACK_CHAT_ID: "-1001234567890",
    });
    expect(config.provider).toBe("telegram");
    expect(JSON.stringify(describeFeedbackProvider(config, "supabase-staging"))).not.toContain(
      BOT_TOKEN,
    );
  });

  test("reports incomplete Telegram configuration by variable name only", () => {
    const config = readFeedbackConfig({ FEEDBACK_PROVIDER: "telegram" });
    expect(config).toEqual({
      provider: "misconfigured",
      problems: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_FEEDBACK_CHAT_ID"],
    });
  });

  test("accepts only numeric private or group chat IDs", () => {
    expect(
      readFeedbackConfig({
        FEEDBACK_PROVIDER: "telegram",
        TELEGRAM_BOT_TOKEN: BOT_TOKEN,
        TELEGRAM_FEEDBACK_CHAT_ID: "@publicchannel",
      }),
    ).toEqual({ provider: "misconfigured", problems: ["TELEGRAM_FEEDBACK_CHAT_ID"] });
  });

  test("treats the in-memory provider as disabled for a hosted deployment", () => {
    expect(describeFeedbackProvider({ provider: "memory" }, "supabase-staging")).toEqual({
      state: "disabled",
      provider: "none",
    });
  });
});

describe("P4-S4 feedback service", () => {
  test("stores only the minimized field set and reports a local preview", async () => {
    let captured: FeedbackMessage | null = null;
    const provider: FeedbackProvider = {
      kind: "memory",
      async submit(message) {
        captured = message;
        return { delivery: "local-preview", reference: "test:1" };
      },
    };

    const receipt = await submitFeedback(
      {
        message: "The keyboard focus is lost after saving my profile.",
        route: "/settings?email=private%40example.test#security",
      },
      {
        ...silent,
        config: { provider: "memory" },
        provider,
        principal: { userId: "11111111-1111-4111-8111-111111111111", email: "a@b.test" },
        consumeLimit: async () => ({
          allowed: true,
          remaining: 4,
          limit: 5,
          policy: "feedback",
        }),
        now: () => Date.parse("2026-11-11T12:00:00.000Z"),
      },
    );

    expect(receipt).toEqual({ accepted: true, delivery: "local-preview", reference: "test:1" });
    expect(captured).toMatchObject({
      route: "/settings",
      pseudonymousUserId: "11111111-1111-4111-8111-111111111111",
      occurredAt: "2026-11-11T12:00:00.000Z",
    });
    expect(JSON.stringify(captured)).not.toContain("a@b.test");
    expect(JSON.stringify(captured)).not.toContain("private%40example.test");
  });

  test("fails closed when the rate limit rejects the submission", async () => {
    let called = false;
    const provider: FeedbackProvider = {
      kind: "memory",
      async submit() {
        called = true;
        return { delivery: "local-preview", reference: null };
      },
    };

    await expect(
      submitFeedback(
        { message: "The search filter resets when I navigate back.", route: "/explore" },
        {
          ...silent,
          config: { provider: "memory" },
          provider,
          principal: { userId: "11111111-1111-4111-8111-111111111111", email: "a@b.test" },
          consumeLimit: async () => ({
            allowed: false,
            remaining: 0,
            limit: 5,
            policy: "feedback",
            retryAfterSeconds: 600,
            reason: "limit",
          }),
        },
      ),
    ).rejects.toBeInstanceOf(PublicAppError);
    expect(called).toBe(false);
  });

  test("maps a provider failure to the safe unavailable contract", async () => {
    const provider: FeedbackProvider = {
      kind: "telegram",
      async submit() {
        throw new FeedbackProviderError("rejected", "provider detail must not leak");
      },
    };

    await expect(
      submitFeedback(
        { message: "The event RSVP button does nothing on mobile.", route: "/events" },
        {
          ...silent,
          config: { provider: "telegram", botToken: BOT_TOKEN, chatId: "-1001234567890" },
          provider,
          principal: null,
          clientKey: "203.0.113.9",
          consumeLimit: async () => ({
            allowed: true,
            remaining: 4,
            limit: 5,
            policy: "feedback",
          }),
        },
      ),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });

  test("refuses to send when the selected provider is misconfigured", async () => {
    await expect(
      submitFeedback(
        { message: "A valid length message for the disabled channel.", route: "/help" },
        { ...silent, config: { provider: "misconfigured", problems: ["TELEGRAM_BOT_TOKEN"] } },
      ),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});

describe("P4-S4 provider and formatting", () => {
  test("keeps a bounded local inbox", async () => {
    const provider = new MemoryFeedbackProvider();
    await provider.submit({
      text: "note",
      route: "/help",
      pseudonymousUserId: null,
      occurredAt: "2026-11-11T12:00:00.000Z",
      requestId: "r1",
    });
    expect(provider.buffered).toBe(1);
    expect(provider.drain()).toHaveLength(1);
    expect(provider.buffered).toBe(0);
  });

  test("formats plain text with no markdown injection", () => {
    const text = formatFeedbackMessage({
      text: "<b>*bold*</b>",
      route: "/help",
      pseudonymousUserId: null,
      occurredAt: "2026-11-11T12:00:00.000Z",
      requestId: "r1",
    });
    expect(text).toContain("<b>*bold*</b>");
    expect(text).toContain("From: anonymous");
  });

  test("requires Telegram's JSON body to confirm delivery", async () => {
    const message: FeedbackMessage = {
      text: "A valid test message.",
      route: "/help",
      pseudonymousUserId: null,
      occurredAt: "2026-11-11T12:00:00.000Z",
      requestId: "r1",
    };
    const delivered = new TelegramFeedbackProvider(
      { botToken: BOT_TOKEN, chatId: "-1001234567890" },
      async () =>
        new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 }),
    );
    expect(await delivered.submit(message)).toEqual({
      delivery: "provider",
      reference: "telegram:42",
    });

    const rejected = new TelegramFeedbackProvider(
      { botToken: BOT_TOKEN, chatId: "-1001234567890" },
      async () => new Response(JSON.stringify({ ok: false }), { status: 200 }),
    );
    await expect(rejected.submit(message)).rejects.toMatchObject({ cause: "rejected" });

    const malformed = new TelegramFeedbackProvider(
      { botToken: BOT_TOKEN, chatId: "-1001234567890" },
      async () => new Response("not-json", { status: 200 }),
    );
    await expect(malformed.submit(message)).rejects.toMatchObject({ cause: "body" });
  });
});

describe("integration health", () => {
  test("never echoes a configured value", () => {
    const report = inspectIntegrations({
      VITE_DATA_MODE: "supabase-staging",
      VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${"a".repeat(24)}`,
      FEEDBACK_PROVIDER: "telegram",
      TELEGRAM_BOT_TOKEN: BOT_TOKEN,
      TELEGRAM_FEEDBACK_CHAT_ID: "-1001234567890",
      RATE_LIMIT_DRIVER: "upstash",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "opaque-token-value",
      RATE_LIMIT_HASH_SECRET: "0123456789abcdef",
      APP_ORIGIN: "https://app.thescenes.test",
      PWA_MODE: "enabled",
    });

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain(BOT_TOKEN);
    expect(serialized).not.toContain("opaque-token-value");
    expect(serialized).not.toContain("abcdefghijklmnopqrst");
    expect(report.ok).toBe(true);
    expect(report.integrations.find((item) => item.name === "supabase")?.state).toBe(
      "configured-unverified",
    );
    expect(report.integrations.find((item) => item.name === "rate-limit")?.state).toBe(
      "configured-unverified",
    );
    expect(report.integrations.find((item) => item.name === "feedback")?.state).toBe(
      "configured-unverified",
    );
    expect(report.integrations.find((item) => item.name === "notifications")?.state).toBe(
      "configured-unverified",
    );
  });
});
