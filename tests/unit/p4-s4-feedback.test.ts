import { describe, expect, test } from "bun:test";
import {
  FEEDBACK_CATEGORY_GITHUB_LABEL,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "../../src/features/feedback/contracts";
import { feedbackSubmissionSchema } from "../../src/features/feedback/schemas";
import type { FeedbackSubmissionInput } from "../../src/features/feedback/schemas";
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
import {
  feedbackSubmissionMarker,
  GitHubIssuesFeedbackProvider,
} from "../../src/server/feedback/github-issues.server";
import { submitFeedback } from "../../src/server/feedback/feedback.service.server";
import { inspectIntegrations } from "../../src/server/integrations/health.server";
import { PublicAppError } from "../../src/features/shared/safe-handler";

const SUBMISSION_ID = "11111111-1111-4111-8111-111111111111";
const OWNER = "thescenes-owner";
const REPO = "thescenes-feedback";
const TOKEN = `ghp_${"a".repeat(32)}`;
const silent = { logger: () => {} } as const;

const allowLimit = async () => ({
  allowed: true as const,
  remaining: 4,
  limit: 5,
  policy: "feedback" as const,
});

function validInput(overrides: Partial<FeedbackSubmissionInput> = {}): FeedbackSubmissionInput {
  return {
    category: "bug",
    subject: "Course enrollment problem",
    message: "The lesson player stops after the second module.",
    area: "learning",
    route: "/help",
    submissionId: SUBMISSION_ID,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** Records calls and returns canned responses. */
function mockFetch(handler: (url: string, init: RequestInit) => Response) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const resolved = init ?? {};
    calls.push({ url, init: resolved });
    return handler(url, resolved);
  }) as typeof fetch;
  return { impl, calls };
}

function githubProvider(handler: (url: string, init: RequestInit) => Response) {
  const mock = mockFetch(handler);
  const provider = new GitHubIssuesFeedbackProvider({
    owner: OWNER,
    repo: REPO,
    token: TOKEN,
    fetchImpl: mock.impl,
  });
  return { provider, ...mock };
}

function githubMessage(overrides: Partial<FeedbackMessage> = {}): FeedbackMessage {
  return {
    category: "bug",
    subject: "Course enrollment problem",
    text: "The lesson player stops after the second module.",
    area: "learning",
    route: "/help",
    pseudonymousUserId: null,
    role: "guest",
    occurredAt: "2026-11-26T12:00:00.000Z",
    requestId: "r1",
    submissionId: SUBMISSION_ID,
    ...overrides,
  };
}

describe("P4-S4 feedback schema", () => {
  test("accepts a valid submission with a category, subject, area and submission id", () => {
    expect(feedbackSubmissionSchema.safeParse(validInput()).success).toBe(true);
    expect(
      feedbackSubmissionSchema.safeParse(
        validInput({ area: undefined, category: "general" as FeedbackCategory }),
      ).success,
    ).toBe(true);
  });

  test("rejects a short subject or message, a bad route and an unknown category", () => {
    expect(feedbackSubmissionSchema.safeParse(validInput({ subject: "hi" })).success).toBe(false);
    expect(feedbackSubmissionSchema.safeParse(validInput({ message: "too short" })).success).toBe(
      false,
    );
    for (const route of ["https://evil.test/path", "//evil.test/path", "help"]) {
      expect(feedbackSubmissionSchema.safeParse(validInput({ route })).success).toBe(false);
    }
    expect(
      feedbackSubmissionSchema.safeParse(validInput({ category: "billing" as FeedbackCategory }))
        .success,
    ).toBe(false);
  });

  test("rejects a missing submission id and a filled honeypot", () => {
    expect(feedbackSubmissionSchema.safeParse(validInput({ submissionId: "nope" })).success).toBe(
      false,
    );
    expect(feedbackSubmissionSchema.safeParse(validInput({ company: "bot" })).success).toBe(false);
    expect(feedbackSubmissionSchema.safeParse(validInput({ company: "" })).success).toBe(true);
  });

  test("rejects subject and message over the maximum length", () => {
    expect(
      feedbackSubmissionSchema.safeParse(validInput({ subject: "a".repeat(121) })).success,
    ).toBe(false);
    expect(
      feedbackSubmissionSchema.safeParse(validInput({ message: "a".repeat(2001) })).success,
    ).toBe(false);
  });
});

describe("P4-S4 feedback configuration", () => {
  test("defaults to the local preview provider", () => {
    expect(readFeedbackConfig({})).toEqual({ provider: "memory" });
  });

  test("parses a complete GitHub configuration without exposing the token", () => {
    const config = readFeedbackConfig({
      FEEDBACK_PROVIDER: "github",
      GITHUB_FEEDBACK_REPO: `${OWNER}/${REPO}`,
      GITHUB_FEEDBACK_TOKEN: TOKEN,
    });
    expect(config).toEqual({
      provider: "github",
      owner: OWNER,
      repo: REPO,
      token: TOKEN,
      apiBase: "https://api.github.com",
    });
    expect(describeFeedbackProvider(config, "supabase-staging")).toEqual({
      state: "ready",
      provider: "github",
    });
    expect(JSON.stringify(describeFeedbackProvider(config, "supabase-staging"))).not.toContain(
      TOKEN,
    );
  });

  test("reports an incomplete GitHub configuration by variable name only", () => {
    expect(readFeedbackConfig({ FEEDBACK_PROVIDER: "github" })).toEqual({
      provider: "misconfigured",
      problems: ["GITHUB_FEEDBACK_REPO", "GITHUB_FEEDBACK_TOKEN"],
    });
    expect(
      readFeedbackConfig({
        FEEDBACK_PROVIDER: "github",
        GITHUB_FEEDBACK_REPO: "not-a-repo",
        GITHUB_FEEDBACK_TOKEN: "short",
      }),
    ).toEqual({
      provider: "misconfigured",
      problems: ["GITHUB_FEEDBACK_REPO", "GITHUB_FEEDBACK_TOKEN"],
    });
    expect(
      JSON.stringify(
        describeFeedbackProvider(
          { provider: "misconfigured", problems: ["GITHUB_FEEDBACK_TOKEN"] },
          "supabase-staging",
        ),
      ),
    ).not.toContain(TOKEN);
  });

  test("fails closed on the retired WhatsApp/Telegram values", () => {
    for (const provider of ["whatsapp", "telegram", "github-issues"]) {
      expect(readFeedbackConfig({ FEEDBACK_PROVIDER: provider })).toEqual({
        provider: "misconfigured",
        problems: ["FEEDBACK_PROVIDER"],
      });
    }
  });

  test("treats the in-memory provider as disabled for a hosted deployment", () => {
    expect(describeFeedbackProvider({ provider: "memory" }, "supabase-staging")).toEqual({
      state: "disabled",
      provider: "none",
    });
  });
});

describe("P4-S4 GitHub Issues adapter", () => {
  test("creates a labelled issue with a sanitized title and a retry marker", async () => {
    const { provider, calls } = githubProvider((_url, init) =>
      init.method === "POST"
        ? jsonResponse({ number: 42, html_url: "https://github.com/private" }, 201)
        : jsonResponse([]),
    );

    const result = await provider.submit(githubMessage());

    expect(result).toEqual({ delivery: "provider", reference: "github:42" });
    const post = calls.find((call) => call.init.method === "POST");
    expect(post).toBeDefined();
    const payload = JSON.parse(String(post?.init.body)) as {
      title: string;
      body: string;
      labels: string[];
    };
    expect(payload.title).toBe("[BUG] Course enrollment problem");
    expect(payload.labels).toEqual([FEEDBACK_CATEGORY_GITHUB_LABEL.bug]);
    expect(payload.body).toContain(feedbackSubmissionMarker(SUBMISSION_ID));
    expect(payload.body).toContain("The lesson player stops after the second module.");
    expect(payload.body).toContain("`/help`");
    expect(JSON.stringify(payload)).not.toContain(TOKEN);

    // The token is sent only as an Authorization header, never in the URL or body.
    const headers = post?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(calls.every((call) => !call.url.includes(TOKEN))).toBe(true);
  });

  test("reuses an existing issue for the same submission id instead of creating a duplicate", async () => {
    let created = false;
    const { provider } = githubProvider((_url, init) => {
      if (init.method === "POST") {
        created = true;
        return jsonResponse({ number: 99 }, 201);
      }
      return jsonResponse([
        { number: 7, body: `older note\n${feedbackSubmissionMarker(SUBMISSION_ID)}` },
      ]);
    });

    const result = await provider.submit(githubMessage());

    expect(result).toEqual({ delivery: "provider", reference: "github:7" });
    expect(created).toBe(false);
  });

  test("classifies GitHub failures without leaking a status code or detail", async () => {
    const cases: Array<{ status: number; headers?: Record<string, string>; cause: string }> = [
      { status: 401, cause: "rejected" },
      { status: 403, cause: "rejected" },
      { status: 403, headers: { "x-ratelimit-remaining": "0" }, cause: "rate-limited" },
      { status: 404, cause: "configuration" },
      { status: 429, cause: "rate-limited" },
      { status: 500, cause: "unavailable" },
    ];

    for (const scenario of cases) {
      const { provider } = githubProvider((_url, init) =>
        init.method === "POST"
          ? jsonResponse({ message: "detail" }, scenario.status, scenario.headers)
          : jsonResponse([]),
      );
      await expect(provider.submit(githubMessage())).rejects.toMatchObject({
        name: "FeedbackProviderError",
        cause: scenario.cause,
      });
    }
  });

  test("treats a network failure and an unconfirmed response as unavailable", async () => {
    const failing = mockFetch(() => {
      throw new Error("socket hang up");
    });
    const provider = new GitHubIssuesFeedbackProvider({
      owner: OWNER,
      repo: REPO,
      token: TOKEN,
      fetchImpl: failing.impl,
    });
    await expect(provider.submit(githubMessage())).rejects.toMatchObject({ cause: "network" });

    const { provider: noNumber } = githubProvider((_url, init) =>
      init.method === "POST" ? jsonResponse({}, 201) : jsonResponse([]),
    );
    await expect(noNumber.submit(githubMessage())).rejects.toMatchObject({ cause: "unavailable" });
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
        category: "bug",
        subject: "Keyboard focus is lost",
        message: "The keyboard focus is lost after saving my profile.",
        area: "account",
        route: "/settings",
        submissionId: SUBMISSION_ID,
      },
      {
        ...silent,
        config: { provider: "memory" },
        provider,
        principal: { userId: "11111111-1111-4111-8111-111111111111", email: "a@b.test" },
        consumeLimit: allowLimit,
        now: () => Date.parse("2026-11-11T12:00:00.000Z"),
      },
    );

    expect(receipt).toEqual({ accepted: true, delivery: "local-preview", reference: "test:1" });
    expect(captured).toMatchObject({
      route: "/settings",
      category: "bug",
      subject: "Keyboard focus is lost",
      area: "account",
      submissionId: SUBMISSION_ID,
      role: "member",
      pseudonymousUserId: "11111111-1111-4111-8111-111111111111",
      occurredAt: "2026-11-11T12:00:00.000Z",
    });
    expect(JSON.stringify(captured)).not.toContain("a@b.test");
  });

  test("reports a GitHub delivery only after the provider confirms it", async () => {
    const provider: FeedbackProvider = {
      kind: "github",
      async submit() {
        return { delivery: "provider", reference: "github:42" };
      },
    };

    const receipt = await submitFeedback(validInput(), {
      ...silent,
      config: {
        provider: "github",
        owner: OWNER,
        repo: REPO,
        token: TOKEN,
        apiBase: "https://api.github.com",
      },
      provider,
      principal: null,
      clientKey: "203.0.113.9",
      consumeLimit: allowLimit,
    });

    expect(receipt).toEqual({ accepted: true, delivery: "provider", reference: "github:42" });
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
      submitFeedback(validInput(), {
        ...silent,
        config: { provider: "memory" },
        provider,
        principal: { userId: "11111111-1111-4111-8111-111111111111", email: "a@b.test" },
        consumeLimit: async () => ({
          allowed: false as const,
          remaining: 0,
          limit: 5,
          policy: "feedback",
          retryAfterSeconds: 600,
          reason: "limit" as const,
        }),
      }),
    ).rejects.toBeInstanceOf(PublicAppError);
    expect(called).toBe(false);
  });

  test("maps a provider failure to the safe unavailable contract", async () => {
    const provider: FeedbackProvider = {
      kind: "github",
      async submit() {
        throw new FeedbackProviderError("rejected", "provider detail must not leak");
      },
    };

    await expect(
      submitFeedback(validInput({ category: "events" }), {
        ...silent,
        config: {
          provider: "github",
          owner: OWNER,
          repo: REPO,
          token: TOKEN,
          apiBase: "https://api.github.com",
        },
        provider,
        principal: null,
        clientKey: "203.0.113.9",
        consumeLimit: allowLimit,
      }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });

  test("refuses to send when the selected provider is misconfigured", async () => {
    await expect(
      submitFeedback(validInput(), {
        ...silent,
        config: { provider: "misconfigured", problems: ["GITHUB_FEEDBACK_TOKEN"] },
      }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});

describe("P4-S4 provider", () => {
  test("keeps a bounded local inbox", async () => {
    const provider = new MemoryFeedbackProvider();
    const message = githubMessage({ category: "general", subject: "General note" });
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
      FEEDBACK_PROVIDER: "github",
      GITHUB_FEEDBACK_REPO: `${OWNER}/${REPO}`,
      GITHUB_FEEDBACK_TOKEN: TOKEN,
      RATE_LIMIT_DRIVER: "upstash",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "opaque-token-value",
      RATE_LIMIT_HASH_SECRET: "0123456789abcdef",
    });

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain(TOKEN);
    expect(serialized).not.toContain(REPO);
    expect(serialized).not.toContain("opaque-token-value");
    expect(serialized).not.toContain("abcdefghijklmnopqrst");
    expect(report.ok).toBe(true);
    expect(report.integrations.find((item) => item.name === "supabase")?.state).toBe("ready");
    expect(report.integrations.find((item) => item.name === "rate-limit")?.state).toBe("ready");
    expect(report.integrations.find((item) => item.name === "feedback")?.state).toBe("ready");
  });

  test("reports the missing GitHub variable names, never their values", () => {
    const report = inspectIntegrations({
      VITE_DATA_MODE: "supabase-staging",
      VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${"a".repeat(24)}`,
      FEEDBACK_PROVIDER: "github",
    });
    const feedback = report.integrations.find((item) => item.name === "feedback");
    expect(feedback?.state).toBe("misconfigured");
    expect(feedback?.missingVariables).toEqual(["GITHUB_FEEDBACK_REPO", "GITHUB_FEEDBACK_TOKEN"]);
  });
});

describe("P4-S4 category labels", () => {
  test("covers the nine requested categories with a distinct label each", () => {
    const categories = Object.keys(FEEDBACK_CATEGORY_LABELS) as FeedbackCategory[];
    expect(categories).toHaveLength(9);
    const labels = categories.map((category) => FEEDBACK_CATEGORY_GITHUB_LABEL[category]);
    expect(new Set(labels).size).toBe(9);
    expect(labels).toContain("general-feedback");
    expect(labels).toContain("feature-request");
  });
});
