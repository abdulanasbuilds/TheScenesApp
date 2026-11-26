import { describe, expect, test } from "bun:test";
import {
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "../../src/features/feedback/contracts";
import { feedbackSubmissionSchema } from "../../src/features/feedback/schemas";
import {
  buildFeedbackWhatsAppText,
  buildWhatsAppLink,
  normalizeWhatsAppNumber,
  WHATSAPP_MESSAGE_MAX,
  type WhatsAppFeedbackContext,
} from "../../src/features/feedback/whatsapp";
import {
  describeFeedbackProvider,
  readFeedbackConfig,
} from "../../src/server/feedback/feedback-config.server";
import {
  FeedbackProviderError,
  MemoryFeedbackProvider,
  type FeedbackMessage,
  type FeedbackProvider,
} from "../../src/server/feedback/feedback-provider.server";
import { submitFeedback } from "../../src/server/feedback/feedback.service.server";
import { inspectIntegrations } from "../../src/server/integrations/health.server";
import { PublicAppError } from "../../src/features/shared/safe-handler";

const NUMBER = "233201234567";
const silent = { logger: () => {} } as const;

describe("P4-S4 feedback schema", () => {
  test("accepts an internal route, a bounded message and an optional category", () => {
    expect(
      feedbackSubmissionSchema.safeParse({
        message: "The lesson player stops after the second module.",
        route: "/c/ai-builders/classroom/prompting/lesson-2?tab=notes",
      }).success,
    ).toBe(true);
    expect(
      feedbackSubmissionSchema.safeParse({
        message: "The lesson player stops after the second module.",
        route: "/help",
        category: "bug",
      }).success,
    ).toBe(true);
  });

  test("rejects a short message, a non-internal route and an unknown category", () => {
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
    expect(
      feedbackSubmissionSchema.safeParse({
        message: "A sufficiently long feedback message.",
        route: "/help",
        category: "billing",
      }).success,
    ).toBe(false);
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

  test("normalizes a complete WhatsApp configuration without exposing it as a problem", () => {
    const config = readFeedbackConfig({
      FEEDBACK_PROVIDER: "whatsapp",
      WHATSAPP_FEEDBACK_NUMBER: "+233 20 123 4567",
    });
    expect(config).toEqual({ provider: "whatsapp", number: NUMBER });
    expect(JSON.stringify(describeFeedbackProvider(config, "supabase-staging"))).not.toContain(
      NUMBER,
    );
  });

  test("reports an incomplete WhatsApp configuration by variable name only", () => {
    expect(readFeedbackConfig({ FEEDBACK_PROVIDER: "whatsapp" })).toEqual({
      provider: "misconfigured",
      problems: ["WHATSAPP_FEEDBACK_NUMBER"],
    });
    expect(
      readFeedbackConfig({ FEEDBACK_PROVIDER: "whatsapp", WHATSAPP_FEEDBACK_NUMBER: "0201234567" }),
    ).toEqual({
      provider: "misconfigured",
      problems: ["WHATSAPP_FEEDBACK_NUMBER"],
    });
  });

  test("treats the retired Telegram value as misconfigured instead of switching channels", () => {
    expect(readFeedbackConfig({ FEEDBACK_PROVIDER: "telegram" })).toEqual({
      provider: "misconfigured",
      problems: ["FEEDBACK_PROVIDER"],
    });
  });

  test("treats the in-memory provider as disabled for a hosted deployment", () => {
    expect(describeFeedbackProvider({ provider: "memory" }, "supabase-staging")).toEqual({
      state: "disabled",
      provider: "none",
    });
  });
});

describe("P4-S4 WhatsApp helpers", () => {
  test("normalizes international numbers and rejects local-only numbers", () => {
    expect(normalizeWhatsAppNumber("+233201234567")).toBe(NUMBER);
    expect(normalizeWhatsAppNumber(" +233 20-123-4567 ")).toBe(NUMBER);
    expect(normalizeWhatsAppNumber("(233) 201 234 567")).toBe(NUMBER);
    expect(normalizeWhatsAppNumber("00233201234567")).toBe(NUMBER);
    expect(normalizeWhatsAppNumber("0201234567")).toBeNull();
    expect(normalizeWhatsAppNumber("12345")).toBeNull();
    expect(normalizeWhatsAppNumber("")).toBeNull();
    expect(normalizeWhatsAppNumber(null)).toBeNull();
  });

  test("builds a wa.me link with URL-encoded text", () => {
    const link = buildWhatsAppLink(NUMBER, "hello & goodbye\nsecond line");
    expect(link.startsWith(`https://wa.me/${NUMBER}?text=`)).toBe(true);
    expect(link).toContain(encodeURIComponent("hello & goodbye\nsecond line"));
    expect(link).not.toContain(" ");
    expect(buildWhatsAppLink(NUMBER, "   ")).toBe(`https://wa.me/${NUMBER}`);
  });

  test("formats a structured plain-text message with category, role and timestamps", () => {
    const context: WhatsAppFeedbackContext = {
      category: "bug",
      message: "<b>*bold*</b> stops after save",
      route: "/settings?tab=profile",
      pageUrl: "https://thescenes.test/settings?tab=profile",
      senderLabel: "Ama Boateng (ama@example.com)",
      userId: "11111111-1111-4111-8111-111111111111",
      signedIn: true,
      occurredAt: "2026-11-26T12:00:00.000Z",
      requestId: "r1",
    };
    const text = buildFeedbackWhatsAppText(context);
    expect(text).toContain(`Category: ${FEEDBACK_CATEGORY_LABELS.bug}`);
    expect(text).toContain("From: Ama Boateng (ama@example.com) · id 11111111");
    expect(text).toContain("(member)");
    expect(text).toContain("Route: /settings?tab=profile");
    expect(text).toContain("Page: https://thescenes.test/settings?tab=profile");
    expect(text).toContain("Time: 2026-11-26T12:00:00.000Z");
    expect(text).toContain("Request: r1");
    expect(text).toContain("<b>*bold*</b> stops after save");
  });

  test("labels an anonymous sender as a guest and bounds long text", () => {
    const text = buildFeedbackWhatsAppText({
      category: "general" as FeedbackCategory,
      message: "x".repeat(WHATSAPP_MESSAGE_MAX + 50),
      route: "/help",
      signedIn: false,
      occurredAt: "2026-11-26T12:00:00.000Z",
    });
    expect(text).toContain("From: anonymous (guest)");
    expect(text).toContain("…");
    expect(text.length).toBeLessThan(WHATSAPP_MESSAGE_MAX + 300);
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
        route: "/settings",
        category: "bug",
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
      category: "bug",
      role: "member",
      pseudonymousUserId: "11111111-1111-4111-8111-111111111111",
      occurredAt: "2026-11-11T12:00:00.000Z",
    });
    expect(JSON.stringify(captured)).not.toContain("a@b.test");
  });

  test("returns a WhatsApp handoff link that contains the structured context", async () => {
    const receipt = await submitFeedback(
      {
        message: "The search filter resets when I navigate back.",
        route: "/explore",
        category: "general",
      },
      {
        ...silent,
        config: { provider: "whatsapp", number: NUMBER },
        principal: null,
        clientKey: "203.0.113.9",
        consumeLimit: async () => ({
          allowed: true,
          remaining: 4,
          limit: 5,
          policy: "feedback",
        }),
        now: () => Date.parse("2026-11-11T12:00:00.000Z"),
      },
    );

    expect(receipt.accepted).toBe(true);
    expect(receipt.delivery).toBe("handoff");
    expect(receipt.reference?.startsWith(`https://wa.me/${NUMBER}?text=`)).toBe(true);
    const decoded = decodeURIComponent(receipt.reference?.split("text=")[1] ?? "");
    expect(decoded).toContain("Category: General feedback");
    expect(decoded).toContain("Route: /explore");
    expect(decoded).toContain("From: anonymous (guest)");
    expect(decoded).toContain("The search filter resets when I navigate back.");
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
      kind: "whatsapp",
      async submit() {
        throw new FeedbackProviderError("rejected", "provider detail must not leak");
      },
    };

    await expect(
      submitFeedback(
        { message: "The event RSVP button does nothing on mobile.", route: "/events" },
        {
          ...silent,
          config: { provider: "whatsapp", number: NUMBER },
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
        {
          ...silent,
          config: { provider: "misconfigured", problems: ["WHATSAPP_FEEDBACK_NUMBER"] },
        },
      ),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});

describe("P4-S4 provider", () => {
  test("keeps a bounded local inbox", async () => {
    const provider = new MemoryFeedbackProvider();
    const message: FeedbackMessage = {
      text: "note",
      category: "general",
      route: "/help",
      pseudonymousUserId: null,
      role: "guest",
      occurredAt: "2026-11-11T12:00:00.000Z",
      requestId: "r1",
    };
    await provider.submit(message);
    expect(provider.buffered).toBe(1);
    expect(provider.drain()).toHaveLength(1);
    expect(provider.buffered).toBe(0);
  });
});

describe("integration health", () => {
  test("never echoes a configured value", () => {
    const report = inspectIntegrations({
      VITE_DATA_MODE: "supabase-staging",
      VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${"a".repeat(24)}`,
      FEEDBACK_PROVIDER: "whatsapp",
      WHATSAPP_FEEDBACK_NUMBER: `+${NUMBER}`,
      RATE_LIMIT_DRIVER: "upstash",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "opaque-token-value",
      RATE_LIMIT_HASH_SECRET: "0123456789abcdef",
    });

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain(NUMBER);
    expect(serialized).not.toContain("opaque-token-value");
    expect(serialized).not.toContain("abcdefghijklmnopqrst");
    expect(report.ok).toBe(true);
    expect(report.integrations.find((item) => item.name === "supabase")?.state).toBe("ready");
    expect(report.integrations.find((item) => item.name === "rate-limit")?.state).toBe("ready");
    expect(report.integrations.find((item) => item.name === "feedback")?.state).toBe("ready");
  });

  test("reports the WhatsApp variable name, never its value, when it is missing", () => {
    const report = inspectIntegrations({
      VITE_DATA_MODE: "supabase-staging",
      VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${"a".repeat(24)}`,
      FEEDBACK_PROVIDER: "whatsapp",
    });
    const feedback = report.integrations.find((item) => item.name === "feedback");
    expect(feedback?.state).toBe("misconfigured");
    expect(feedback?.missingVariables).toEqual(["WHATSAPP_FEEDBACK_NUMBER"]);
  });
});
