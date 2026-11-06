import { describe, expect, test } from "bun:test";
import { csrfSymbol } from "@tanstack/start-client-core";
import { startInstance } from "../../../src/start";
import { createRequestSupabaseClient } from "../../../src/server/supabase/server-client.server";

describe("Wave 2 installed server boundary", () => {
  test("registers request ID before the installed CSRF middleware", async () => {
    const options = await startInstance.getOptions();
    expect(options.requestMiddleware).toHaveLength(2);
    expect(csrfSymbol in (options.requestMiddleware?.[1] ?? {})).toBe(true);
    expect(options.functionMiddleware).toHaveLength(1);
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
