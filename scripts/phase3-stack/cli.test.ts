import { describe, expect, test } from "bun:test";

import { buildChildEnv } from "./cli.ts";

describe("buildChildEnv", () => {
  test("always disables Supabase telemetry", () => {
    const { env } = buildChildEnv({ PATH: "/usr/bin" });
    expect(env.SUPABASE_TELEMETRY_DISABLED).toBe("1");
    expect(env.DO_NOT_TRACK).toBe("1");
    expect(env.PATH).toBe("/usr/bin");
  });

  test("strips hosted credentials/targets and reports their names", () => {
    const { env, stripped } = buildChildEnv({
      SUPABASE_ACCESS_TOKEN: "sbp_secret",
      SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
      SUPABASE_DB_PASSWORD: "hunter2",
      SUPABASE_URL: "https://abcd.supabase.co",
      PATH: "/usr/bin",
    });
    expect(env.SUPABASE_ACCESS_TOKEN).toBeUndefined();
    expect(env.SUPABASE_PROJECT_REF).toBeUndefined();
    expect(env.SUPABASE_DB_PASSWORD).toBeUndefined();
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(stripped).toContain("SUPABASE_ACCESS_TOKEN");
    expect(stripped).toContain("SUPABASE_PROJECT_REF");
    expect(env.PATH).toBe("/usr/bin");
  });

  test("does not mutate the caller's environment object", () => {
    const base = { SUPABASE_ACCESS_TOKEN: "sbp_secret" } as NodeJS.ProcessEnv;
    buildChildEnv(base);
    expect(base.SUPABASE_ACCESS_TOKEN).toBe("sbp_secret");
  });
});
