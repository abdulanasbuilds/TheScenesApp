import { describe, expect, test } from "bun:test";
import { csrfSymbol } from "@tanstack/start-client-core";
import { startInstance } from "../../../src/start";
import { safeErrorMiddleware } from "../../../src/middleware/safe-errors";
import { createRequestSupabaseClient } from "../../../src/server/supabase/server-client.server";

describe("Wave 2 installed server boundary", () => {
  test("registers request ID before the installed CSRF middleware", async () => {
    const options = await startInstance.getOptions();
    expect(options.requestMiddleware).toHaveLength(2);
    expect(csrfSymbol in (options.requestMiddleware?.[1] ?? {})).toBe(true);
    expect(options.functionMiddleware).toHaveLength(1);
  });

  test("installed fallback logs safely and throws only the generic 500 envelope", async () => {
    const sensitive = "password=do-not-log learner@test.invalid token=secret";
    const captured: string[] = [];
    const originalError = console.error;
    console.error = (...values: unknown[]) => captured.push(values.map(String).join(" "));
    try {
      const server = safeErrorMiddleware.options.server;
      expect(server).toBeFunction();
      let response: Response | null = null;
      try {
        await server?.({
          context: { requestId: "11111111-1111-4111-8111-111111111111" },
          next: async () => {
            throw new TypeError(sensitive);
          },
        } as never);
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        response = error as Response;
      }
      expect(response).not.toBeNull();
      expect(response?.status).toBe(500);
      expect(response?.headers.get("cache-control")).toBe("private, no-store");
      expect(response?.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response?.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
      const body = await response?.text();
      expect(JSON.parse(body ?? "{}")).toEqual({
        ok: false,
        error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
        requestId: "11111111-1111-4111-8111-111111111111",
      });
      expect(body).not.toContain(sensitive);
      expect(body).not.toContain("stack");
      expect(captured).toHaveLength(1);
      expect(captured[0]).toContain('"event":"server_function_failed"');
      expect(captured[0]).toContain('"errorName":"TypeError"');
      expect(captured[0]).not.toContain(sensitive);
      expect(captured[0]).not.toContain("learner@test.invalid");
    } finally {
      console.error = originalError;
    }
  });

  test("fixture mode refuses provider creation before any request or network access", () => {
    let contacted = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      contacted = true;
      throw new Error("network must not be used");
    }) as unknown as typeof fetch;
    try {
      expect(() => createRequestSupabaseClient({ VITE_DATA_MODE: "fixtures" })).toThrow(
        "unavailable in fixture mode",
      );
      expect(contacted).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
