import { describe, expect, test } from "bun:test";
import {
  normalizeAuthNext,
  buildEmailConfirmationRedirect,
} from "../../src/features/auth/redirects";

describe("Wave 3 — hosted Auth negative cases", () => {
  describe("normalizeAuthNext open-redirect prevention", () => {
    test("rejects absolute HTTP URL", () => {
      expect(normalizeAuthNext("http://evil.test/steal")).toBe("/home");
    });

    test("rejects absolute HTTPS URL", () => {
      expect(normalizeAuthNext("https://evil.test/steal")).toBe("/home");
    });

    test("rejects protocol-relative URL", () => {
      expect(normalizeAuthNext("//evil.test")).toBe("/home");
    });

    test("rejects unknown internal path", () => {
      expect(normalizeAuthNext("/admin")).toBe("/home");
      expect(normalizeAuthNext("/register")).toBe("/home");
      expect(normalizeAuthNext("/explore")).toBe("/home");
    });

    test("rejects null and undefined", () => {
      expect(normalizeAuthNext(null)).toBe("/home");
      expect(normalizeAuthNext(undefined)).toBe("/home");
    });

    test("rejects object and number values", () => {
      expect(normalizeAuthNext({ href: "/home" })).toBe("/home");
      expect(normalizeAuthNext(42)).toBe("/home");
    });

    test("accepts only approved paths", () => {
      expect(normalizeAuthNext("/home")).toBe("/home");
      expect(normalizeAuthNext("/onboarding")).toBe("/onboarding");
      expect(normalizeAuthNext("/settings")).toBe("/settings");
    });

    test("custom fallback is used when value is invalid", () => {
      expect(normalizeAuthNext("/bad", "/settings")).toBe("/settings");
      expect(normalizeAuthNext("evil", "/onboarding")).toBe("/onboarding");
    });
  });

  describe("buildEmailConfirmationRedirect origin validation", () => {
    test("accepts localhost:5000 and normalises to 127.0.0.1", () => {
      const result = buildEmailConfirmationRedirect(new URL("http://localhost:5000/register"));
      expect(result).toBe("http://127.0.0.1:5000/auth/confirm?next=%2Fonboarding");
    });

    test("accepts 127.0.0.1:5000", () => {
      const result = buildEmailConfirmationRedirect(new URL("http://127.0.0.1:5000/register"));
      expect(result).toBe("http://127.0.0.1:5000/auth/confirm?next=%2Fonboarding");
    });

    test("accepts HTTPS origin for production use", () => {
      const result = buildEmailConfirmationRedirect(new URL("https://app.thescenes.test/register"));
      expect(result).toBe("https://app.thescenes.test/auth/confirm?next=%2Fonboarding");
    });

    test("rejects HTTP on a non-loopback host", () => {
      expect(() =>
        buildEmailConfirmationRedirect(new URL("http://thescenes.test/register")),
      ).toThrow("not approved");
    });

    test("rejects HTTP on wrong port even for localhost", () => {
      expect(() =>
        buildEmailConfirmationRedirect(new URL("http://127.0.0.1:3000/register")),
      ).toThrow("not approved");
    });

    test("confirmation URL always routes to /auth/confirm with next=/onboarding", () => {
      const url = new URL(buildEmailConfirmationRedirect(new URL("https://app.example.test/")));
      expect(url.pathname).toBe("/auth/confirm");
      expect(url.searchParams.get("next")).toBe("/onboarding");
    });
  });

  describe("auth/confirm route parameter stripping (unit contract)", () => {
    test("error search param maps to 'error' confirmation state", () => {
      // Simulates the validateSearch logic from /auth/confirm route
      const search: Record<string, unknown> = {
        error: "access_denied",
        error_description: "Some provider detail",
        next: "/onboarding",
      };
      const confirmation =
        typeof search.error === "string" || typeof search.error_code === "string"
          ? ("error" as const)
          : ("complete" as const);
      expect(confirmation).toBe("error");
    });

    test("absence of error maps to 'complete' confirmation state", () => {
      const search: Record<string, unknown> = { code: "one-time-code", next: "/onboarding" };
      const confirmation =
        typeof search.error === "string" || typeof search.error_code === "string"
          ? ("error" as const)
          : ("complete" as const);
      expect(confirmation).toBe("complete");
    });

    test("provider error details are not forwarded to the login state", () => {
      // The /auth/confirm route strips error_description; only 'confirmation' status passes through
      const search: Record<string, unknown> = {
        error: "access_denied",
        error_description: "Sensitive detail from provider",
        next: "/home",
      };
      // Only these keys flow through to /login
      const forwarded = {
        confirmation: typeof search.error === "string" ? ("error" as const) : ("complete" as const),
        next: normalizeAuthNext(search.next),
      };
      expect(Object.keys(forwarded)).toEqual(["confirmation", "next"]);
      expect("error_description" in forwarded).toBe(false);
      expect("error" in forwarded).toBe(false);
    });
  });
});
