import { describe, expect, test } from "bun:test";
import {
  buildEmailConfirmationRedirect,
  normalizeAuthNext,
} from "../../src/features/auth/redirects";
import { handleSchema, signUpSchema, updateProfileSchema } from "../../src/features/auth/schemas";
import { buildProfileUpdate } from "../../src/server/repositories/profile.repository.server";
import { LocalRateLimiter } from "../../src/server/security/local-rate-limit.server";

describe("Wave 3 auth schemas", () => {
  test("normalizes and validates an immutable handle", () => {
    expect(handleSchema.parse("  Ama_Boateng ")).toBe("ama_boateng");
    expect(() => handleSchema.parse("Bad Handle")).toThrow();
  });

  test("normalizes registration email and bounds password", () => {
    expect(
      signUpSchema.parse({
        displayName: "Ama Boateng",
        handle: "amaboateng",
        email: " AMA@EXAMPLE.COM ",
        password: "safe-local-password",
      }).email,
    ).toBe("ama@example.com");
    expect(() =>
      signUpSchema.parse({
        displayName: "Ama",
        handle: "ama",
        email: "a@b.com",
        password: "short",
      }),
    ).toThrow();
  });

  test("profile updates reject immutable and authority fields", () => {
    expect(() => updateProfileSchema.parse({ displayName: "Ama", handle: "changed" })).toThrow();
    expect(() => updateProfileSchema.parse({ displayName: "Ama", status: "active" })).toThrow();
  });

  test("allows only approved internal Auth return paths", () => {
    expect(normalizeAuthNext("/onboarding")).toBe("/onboarding");
    expect(normalizeAuthNext("https://evil.test", "/home")).toBe("/home");
    expect(normalizeAuthNext("//evil.test", "/home")).toBe("/home");
    expect(normalizeAuthNext("/unknown", "/settings")).toBe("/settings");
  });

  test("builds confirmation redirects from approved application origins", () => {
    expect(buildEmailConfirmationRedirect(new URL("http://localhost:5000/register"))).toBe(
      "http://127.0.0.1:5000/auth/confirm?next=%2Fonboarding",
    );
    expect(buildEmailConfirmationRedirect(new URL("https://app.example.test/register"))).toBe(
      "https://app.example.test/auth/confirm?next=%2Fonboarding",
    );
    expect(() =>
      buildEmailConfirmationRedirect(new URL("http://app.example.test/register")),
    ).toThrow("not approved");
  });

  test("omitted profile fields are preserved while explicit null clears", () => {
    expect(buildProfileUpdate({ displayName: "Ama" })).toEqual({ display_name: "Ama" });
    expect(buildProfileUpdate({ displayName: "Ama", headline: null, bio: "Updated" })).toEqual({
      display_name: "Ama",
      headline: null,
      bio: "Updated",
    });
  });

  test("rate limiter expires and bounds buckets", () => {
    const limiter = new LocalRateLimiter(2);
    limiter.check("one", { limit: 1, windowMs: 10 }, 0);
    limiter.check("two", { limit: 1, windowMs: 100 }, 0);
    limiter.check("three", { limit: 1, windowMs: 100 }, 5);
    expect(limiter.size).toBe(2);
    limiter.check("four", { limit: 1, windowMs: 100 }, 11);
    expect(limiter.size).toBe(2);
  });
});
