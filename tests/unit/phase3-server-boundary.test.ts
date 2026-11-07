import { describe, expect, test } from "bun:test";
import { getCsrfRequestValidationResult, isCsrfRequestAllowed } from "@tanstack/start-client-core";
import { z } from "zod";
import { inspectServerConfiguration } from "../../src/server/env.server";
import { redactLogValue } from "../../src/server/http/logger.server";
import { LocalRateLimiter } from "../../src/server/security/local-rate-limit.server";
import {
  hardenCookieOptions,
  isSecureRequestProtocol,
} from "../../src/server/supabase/server-client.server";
import { resolveRequestId } from "../../src/middleware/request-id";
import { PublicAppError, withSafeHandler } from "../../src/features/shared/safe-handler";

const PUBLISHABLE_KEY = ["sb", "publishable", "a".repeat(24)].join("_");

describe("Wave 2 server boundary", () => {
  test("reports fixture readiness without provider configuration", () => {
    expect(inspectServerConfiguration({ VITE_DATA_MODE: "fixtures" })).toEqual({
      ok: true,
      dataMode: "fixtures",
      missingVariables: [],
      message: "Fixture mode is ready. No provider connection will be created.",
    });
  });

  test("reports missing names without values", () => {
    expect(inspectServerConfiguration({ VITE_DATA_MODE: "supabase-local" })).toMatchObject({
      ok: false,
      missingVariables: ["VITE_SUPABASE_URL"],
    });
    expect(
      inspectServerConfiguration({
        VITE_DATA_MODE: "supabase-local",
        VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      }).missingVariables,
    ).toEqual(["VITE_SUPABASE_PUBLISHABLE_KEY"]);
  });

  test("accepts complete local settings", () => {
    expect(
      inspectServerConfiguration({
        VITE_DATA_MODE: "supabase-local",
        VITE_SUPABASE_URL: "http://127.0.0.1:54321",
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
      }),
    ).toMatchObject({ ok: true, dataMode: "supabase-local" });
  });

  test("accepts hosted staging settings without exposing values", () => {
    expect(
      inspectServerConfiguration({
        VITE_DATA_MODE: "supabase-staging",
        VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
      }),
    ).toMatchObject({ ok: true, dataMode: "supabase-staging" });
  });

  test("keeps valid request IDs and replaces hostile values", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(resolveRequestId(id.toUpperCase())).toBe(id);
    expect(resolveRequestId("not-an-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("redacts nested credentials and identity fields", () => {
    expect(
      redactLogValue({ email: "learner@test.invalid", nested: { password: "pw", count: 1 } }),
    ).toEqual({ email: "[REDACTED]", nested: { password: "[REDACTED]", count: 1 } });
  });

  test("enforces bounded process-local rate limits", () => {
    const limiter = new LocalRateLimiter();
    expect(limiter.check("login:user", { limit: 2, windowMs: 60_000 }, 1).allowed).toBe(true);
    expect(limiter.check("login:user", { limit: 2, windowMs: 60_000 }, 2).allowed).toBe(true);
    expect(limiter.check("login:user", { limit: 2, windowMs: 60_000 }, 3)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(limiter.check("login:user", { limit: 2, windowMs: 60_000 }, 60_002).allowed).toBe(true);
  });

  test("hardens every auth cookie for the local server boundary", () => {
    expect(
      hardenCookieOptions(
        { domain: "example.test", secure: true },
        isSecureRequestProtocol("http"),
      ),
    ).toMatchObject({
      domain: undefined,
      httpOnly: true,
      maxAge: 604_800,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  test("requires secure auth cookies for HTTPS application requests", () => {
    expect(
      hardenCookieOptions(
        { domain: "example.test", secure: false },
        isSecureRequestProtocol("https"),
      ),
    ).toMatchObject({
      domain: undefined,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  test("rejects hostile or origin-less server-function requests", async () => {
    const context = (headers: Headers) =>
      ({
        request: new Request("http://127.0.0.1:5000/_server", { headers }),
        handlerType: "serverFn",
      }) as never;
    expect(
      await getCsrfRequestValidationResult(
        {},
        context(new Headers({ Origin: "http://evil.test" })),
      ),
    ).toBe(false);
    expect(await getCsrfRequestValidationResult({}, context(new Headers()))).toBeUndefined();
    expect(await isCsrfRequestAllowed({}, context(new Headers()))).toBe(false);
    expect(
      await isCsrfRequestAllowed({}, context(new Headers({ "Sec-Fetch-Site": "cross-site" }))),
    ).toBe(false);
    expect(
      await isCsrfRequestAllowed({}, context(new Headers({ Origin: "http://evil.test" }))),
    ).toBe(false);
    expect(
      await getCsrfRequestValidationResult(
        {},
        context(new Headers({ "Sec-Fetch-Site": "same-origin" })),
      ),
    ).toBe(true);
    expect(
      await isCsrfRequestAllowed({}, context(new Headers({ Origin: "http://127.0.0.1:5000" }))),
    ).toBe(true);
  });

  test("returns validation and safe domain envelopes", async () => {
    const handler = withSafeHandler(
      z.object({ name: z.string().min(2) }),
      async ({ data }) => {
        if (data.name === "blocked")
          throw new PublicAppError("FORBIDDEN", "This action is unavailable.");
        return { greeting: `Hello ${data.name}` };
      },
      { applyResponse: false },
    );
    expect(
      await handler({ data: { name: "x" }, context: { requestId: "request-1" } }),
    ).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
    expect(
      await handler({ data: { name: "blocked" }, context: { requestId: "request-2" } }),
    ).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await handler({ data: { name: "Ama" }, context: { requestId: "request-3" } })).toEqual({
      ok: true,
      data: { greeting: "Hello Ama" },
      requestId: "request-3",
    });
  });
});
