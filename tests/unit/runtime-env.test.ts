import { afterEach, describe, expect, test } from "bun:test";
import { inspectServerConfiguration, getServerEnv } from "../../src/server/env.server";
import { readRuntimeEnv } from "../../src/server/runtime-env.server";

const PUBLISHABLE_KEY = ["sb", "publishable", "a".repeat(24)].join("_");

const globalWithBindings = globalThis as { __env__?: unknown };

afterEach(() => {
  delete globalWithBindings.__env__;
  delete process.env.VITE_DATA_MODE;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.RUNTIME_ENV_PROBE;
});

describe("runtime environment", () => {
  test("merges the process environment with Cloudflare bindings", () => {
    process.env.RUNTIME_ENV_PROBE = "from-process";
    globalWithBindings.__env__ = { RUNTIME_ENV_PROBE: "from-binding" };

    expect(readRuntimeEnv().RUNTIME_ENV_PROBE).toBe("from-binding");
  });

  test("ignores non-string bindings such as the assets binding", () => {
    globalWithBindings.__env__ = { ASSETS: { fetch: () => {} }, RUNTIME_ENV_PROBE: "kept" };

    const env = readRuntimeEnv();
    expect(env.RUNTIME_ENV_PROBE).toBe("kept");
    expect(env.ASSETS).toBeUndefined();
  });

  test("reads a connected configuration from the runtime environment", () => {
    process.env.VITE_DATA_MODE = "supabase-staging";
    process.env.VITE_SUPABASE_URL = "https://abcdefghijklmnopqrst.supabase.co";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    expect(getServerEnv()).toMatchObject({
      dataMode: "supabase-staging",
      supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co",
      supabasePublishableKey: PUBLISHABLE_KEY,
    });
    expect(inspectServerConfiguration()).toMatchObject({ ok: true, dataMode: "supabase-staging" });
  });

  test("reports an invalid connected configuration instead of falling back to fixtures", () => {
    process.env.VITE_DATA_MODE = "supabase-staging";

    expect(inspectServerConfiguration()).toMatchObject({
      ok: false,
      dataMode: "invalid",
      missingVariables: ["VITE_SUPABASE_URL"],
    });
  });
});
