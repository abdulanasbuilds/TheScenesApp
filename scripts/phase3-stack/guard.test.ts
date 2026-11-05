import { describe, expect, test } from "bun:test";

import {
  GuardError,
  assertAllowedCliArgs,
  assertLocalProjectId,
  assertLoopbackHttpUrl,
  assertNoHostedEnv,
  isHostedSupabaseHost,
} from "./guard.ts";

describe("assertLoopbackHttpUrl", () => {
  test("accepts a plain loopback URL", () => {
    expect(assertLoopbackHttpUrl("http://127.0.0.1:54321", "api").hostname).toBe("127.0.0.1");
  });

  test("rejects a hosted Supabase URL", () => {
    expect(() => assertLoopbackHttpUrl("https://abcd.supabase.co", "api")).toThrow(GuardError);
  });

  test("rejects the unspecified address", () => {
    expect(() => assertLoopbackHttpUrl("http://0.0.0.0:54321", "api")).toThrow(GuardError);
  });

  test("rejects a LAN address", () => {
    expect(() => assertLoopbackHttpUrl("http://192.168.1.10:54321", "api")).toThrow(GuardError);
  });

  test("rejects userinfo, query and fragment", () => {
    expect(() => assertLoopbackHttpUrl("http://u:p@127.0.0.1:54321", "api")).toThrow(GuardError);
    expect(() => assertLoopbackHttpUrl("http://127.0.0.1:54321/?a=1", "api")).toThrow(GuardError);
    expect(() => assertLoopbackHttpUrl("http://127.0.0.1:54321/#f", "api")).toThrow(GuardError);
  });
});

describe("isHostedSupabaseHost", () => {
  test("flags hosted hosts only", () => {
    expect(isHostedSupabaseHost("abcdefg.supabase.co")).toBe(true);
    expect(isHostedSupabaseHost("aws-0-eu.pooler.supabase.com")).toBe(true);
    expect(isHostedSupabaseHost("127.0.0.1")).toBe(false);
    expect(isHostedSupabaseHost("localhost")).toBe(false);
  });
});

describe("assertLocalProjectId", () => {
  test("accepts the local project slug", () => {
    expect(() => assertLocalProjectId("the-scenes-app")).not.toThrow();
  });

  test("rejects a hosted project ref shape", () => {
    expect(() => assertLocalProjectId("abcdefghijklmnopqrst")).toThrow(GuardError);
  });

  test("rejects a different local slug", () => {
    expect(() => assertLocalProjectId("some-other-project")).toThrow(GuardError);
  });
});

describe("assertAllowedCliArgs", () => {
  test("allows the three local commands", () => {
    expect(assertAllowedCliArgs(["start"])).toBe("start");
    expect(assertAllowedCliArgs(["status", "-o", "json"])).toBe("status");
    expect(assertAllowedCliArgs(["stop", "--project-id", "the-scenes-app"])).toBe("stop");
  });

  test("rejects hosted/privileged commands", () => {
    for (const command of ["link", "login", "projects", "secrets", "deploy", "push", "pull"]) {
      expect(() => assertAllowedCliArgs([command])).toThrow(GuardError);
    }
  });

  test("rejects --all", () => {
    expect(() => assertAllowedCliArgs(["stop", "--all"])).toThrow(GuardError);
  });

  test("rejects hosted project refs and hosts", () => {
    expect(() => assertAllowedCliArgs(["start", "--project-ref", "abcdefghijklmnopqrst"])).toThrow(
      GuardError,
    );
    expect(() => assertAllowedCliArgs(["status", "--workdir", "https://x.supabase.co"])).toThrow(
      GuardError,
    );
  });
});

describe("assertNoHostedEnv", () => {
  test("lists hosted credential/target variables present", () => {
    const found = assertNoHostedEnv({
      SUPABASE_ACCESS_TOKEN: "sbp_x",
      SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
      PATH: "/usr/bin",
    });
    expect(found).toContain("SUPABASE_ACCESS_TOKEN");
    expect(found).toContain("SUPABASE_PROJECT_REF");
    expect(found).not.toContain("PATH");
  });
});
