import { describe, expect, test } from "bun:test";
import {
  buildPasswordRecoveryRedirect,
  resolveApprovedAccountEmailOrigin,
} from "../../src/features/auth/redirects";
import {
  classifyRecoveryRequestError,
  isRecoveryCodeWellFormed,
  readRecoveryLink,
  RECOVERY_ACKNOWLEDGEMENT,
} from "../../src/features/auth/recovery";
import {
  passwordRecoveryRequestSchema,
  recoveredPasswordSchema,
  recoveryExchangeSchema,
} from "../../src/features/auth/schemas";
import { inspectAuthEmailSetup } from "../../src/server/auth-email-setup.server";
import {
  AuthRecoveryRepository,
  type AuthRecoveryRepositoryLike,
} from "../../src/server/repositories/auth-recovery.repository.server";
import {
  completePasswordRecovery,
  requestPasswordRecovery,
  updateRecoveredPassword,
  type PasswordRecoveryDeps,
} from "../../src/server/services/password-recovery.service.server";

const PUBLISHABLE_KEY = ["sb", "publishable", "a".repeat(24)].join("_");
const VALID_CODE = "pkce-recovery-code-1234567890";

type RepoHandlers = Readonly<{
  requestReset?: (email: string, redirectTo: string) => Promise<unknown>;
  exchangeRecoveryCode?: (code: string) => Promise<unknown>;
  updatePassword?: (password: string) => Promise<unknown>;
  signOutEverywhere?: () => Promise<unknown>;
}>;

function makeRepo(handlers: RepoHandlers = {}) {
  const calls = {
    requestReset: [] as { email: string; redirectTo: string }[],
    exchange: [] as string[],
    update: [] as string[],
    signOut: 0,
  };
  const repository: AuthRecoveryRepositoryLike = {
    requestReset: async (email, redirectTo) => {
      calls.requestReset.push({ email, redirectTo });
      return (
        handlers.requestReset ? await handlers.requestReset(email, redirectTo) : null
      ) as null;
    },
    exchangeRecoveryCode: async (code) => {
      calls.exchange.push(code);
      return (
        handlers.exchangeRecoveryCode ? await handlers.exchangeRecoveryCode(code) : null
      ) as null;
    },
    updatePassword: async (password) => {
      calls.update.push(password);
      return (handlers.updatePassword ? await handlers.updatePassword(password) : null) as null;
    },
    signOutEverywhere: async () => {
      calls.signOut += 1;
      return (handlers.signOutEverywhere ? await handlers.signOutEverywhere() : null) as null;
    },
  };
  return { repository, calls };
}

function deps(
  repository: AuthRecoveryRepositoryLike | null,
  overrides: Partial<PasswordRecoveryDeps> = {},
): PasswordRecoveryDeps {
  return {
    mode: repository ? "supabase-local" : "fixtures",
    repository,
    resolveRedirectTo: () => "http://127.0.0.1:5000/reset-password",
    consumeLimit: async () => ({
      allowed: true,
      remaining: 10,
      limit: 5,
      policy: "password-reset",
    }),
    prepareResponse: () => {},
    ...overrides,
  };
}

describe("P4-S1 recovery redirect allowlist", () => {
  test("pins loopback recovery redirects and normalizes localhost", () => {
    expect(buildPasswordRecoveryRedirect(new URL("http://localhost:5000/forgot-password"))).toBe(
      "http://127.0.0.1:5000/reset-password",
    );
    expect(buildPasswordRecoveryRedirect(new URL("http://127.0.0.1:5000/forgot-password"))).toBe(
      "http://127.0.0.1:5000/reset-password",
    );
  });

  test("accepts HTTPS origins and always targets the recovery-only route", () => {
    const url = new URL(
      buildPasswordRecoveryRedirect(new URL("https://app.example.test/forgot-password?next=/evil")),
    );
    expect(url.origin).toBe("https://app.example.test");
    expect(url.pathname).toBe("/reset-password");
    expect([...url.searchParams.keys()]).toEqual([]);
  });

  test("rejects non-approved origins", () => {
    expect(() => resolveApprovedAccountEmailOrigin(new URL("http://evil.test/"))).toThrow(
      "not approved",
    );
    expect(() => resolveApprovedAccountEmailOrigin(new URL("http://127.0.0.1:3000/"))).toThrow(
      "not approved",
    );
    expect(() => resolveApprovedAccountEmailOrigin(new URL("ftp://app.test/"))).toThrow(
      "not approved",
    );
  });
});

describe("P4-S1 provider error classification", () => {
  test("treats unknown accounts and provider 4xx as the same acknowledgement", () => {
    expect(classifyRecoveryRequestError(null)).toBe("acknowledged");
    expect(classifyRecoveryRequestError({ status: 400, code: "user_not_found" })).toBe(
      "acknowledged",
    );
    expect(classifyRecoveryRequestError({ status: 422 })).toBe("acknowledged");
  });

  test("distinguishes rate limits and outages", () => {
    expect(classifyRecoveryRequestError({ status: 429 })).toBe("rate-limited");
    expect(classifyRecoveryRequestError({ status: 0 })).toBe("unavailable");
    expect(classifyRecoveryRequestError({ status: 503 })).toBe("unavailable");
    expect(classifyRecoveryRequestError(null)).not.toBe("unavailable");
  });
});

describe("P4-S1 recovery link handling", () => {
  test("accepts bounded URL-safe codes only", () => {
    expect(isRecoveryCodeWellFormed(VALID_CODE)).toBe(true);
    expect(isRecoveryCodeWellFormed("short")).toBe(false);
    expect(isRecoveryCodeWellFormed("not a code!")).toBe(false);
    expect(isRecoveryCodeWellFormed(undefined)).toBe(false);
    expect(isRecoveryCodeWellFormed("a".repeat(1025))).toBe(false);
  });

  test("extracts a code and names the stripped path", () => {
    const result = readRecoveryLink(`?code=${VALID_CODE}`);
    expect(result.state).toEqual({ kind: "code", code: VALID_CODE });
    expect(result.cleanPath).toBe("/reset-password");
  });

  test("treats provider errors, tokens and malformed links as invalid", () => {
    expect(readRecoveryLink("?error=access_denied&error_description=leak").state).toEqual({
      kind: "invalid",
    });
    expect(readRecoveryLink("?error_code=otp_expired").state).toEqual({ kind: "invalid" });
    expect(readRecoveryLink("?token=abc").state).toEqual({ kind: "invalid" });
    expect(readRecoveryLink("?token_hash=abc").state).toEqual({ kind: "invalid" });
    expect(readRecoveryLink("?code=short").state).toEqual({ kind: "invalid" });
    expect(readRecoveryLink("").state).toEqual({ kind: "invalid" });
  });
});

describe("P4-S1 recovery schemas", () => {
  test("normalizes the recovery email and bounds the new password", () => {
    expect(passwordRecoveryRequestSchema.parse({ email: " FICTIONAL@TEST.INVALID " }).email).toBe(
      "fictional@test.invalid",
    );
    expect(() =>
      passwordRecoveryRequestSchema.parse({ email: "fictional@test.invalid", x: 1 }),
    ).toThrow();
    expect(() => recoveredPasswordSchema.parse({ password: "short" })).toThrow();
    expect(recoveredPasswordSchema.parse({ password: "long-enough-password" })).toEqual({
      password: "long-enough-password",
    });
    expect(() => recoveryExchangeSchema.parse({ code: "short" })).toThrow();
    expect(() => recoveryExchangeSchema.parse({ code: VALID_CODE, next: "/evil" })).toThrow();
  });
});

describe("P4-S1 recovery service", () => {
  test("fixtures never contact a provider and never claim delivery", async () => {
    const { repository, calls } = makeRepo();
    const result = await requestPasswordRecovery({ email: "fictional@test.invalid" }, deps(null));
    expect(result).toEqual({ acknowledged: true, delivery: "not-configured" });
    expect(calls.requestReset).toEqual([]);
  });

  test("known and unknown accounts receive the identical response", async () => {
    const known = makeRepo();
    const unknown = makeRepo({
      requestReset: async () => ({ status: 400, code: "user_not_found" }),
    });
    const input = { email: "fictional@test.invalid" };
    const a = await requestPasswordRecovery(input, deps(known.repository));
    const b = await requestPasswordRecovery(input, deps(unknown.repository));
    expect(a).toEqual(b);
    expect(a).toEqual({ acknowledged: true, delivery: "requested" });
  });

  test("passes only the allowlisted recovery redirect to Auth", async () => {
    const { repository, calls } = makeRepo();
    await requestPasswordRecovery(
      { email: "fictional@test.invalid" },
      deps(repository, { resolveRedirectTo: () => "https://app.example.test/reset-password" }),
    );
    expect(calls.requestReset).toEqual([
      { email: "fictional@test.invalid", redirectTo: "https://app.example.test/reset-password" },
    ]);
  });

  test("provider outage and unapproved origin fail safely without echoing the email", async () => {
    const outage = makeRepo({ requestReset: async () => ({ status: 503 }) });
    await expect(
      requestPasswordRecovery({ email: "fictional@test.invalid" }, deps(outage.repository)),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });

    const origin = makeRepo();
    try {
      await requestPasswordRecovery(
        { email: "fictional@test.invalid" },
        deps(origin.repository, {
          resolveRedirectTo: () => {
            throw new Error("The application origin is not approved for account email.");
          },
        }),
      );
      throw new Error("expected rejection");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      expect(message).not.toContain("fictional@test.invalid");
      expect(message.toLowerCase()).toContain("not available");
    }
  });

  test("enforces the recovery request limit with a safe retry window", async () => {
    const { repository, calls } = makeRepo();
    await expect(
      requestPasswordRecovery(
        { email: "fictional@test.invalid" },
        deps(repository, {
          consumeLimit: async () => ({
            allowed: false,
            remaining: 0,
            limit: 5,
            policy: "password-reset",
            retryAfterSeconds: 42,
            reason: "limit",
          }),
        }),
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", retryAfterSeconds: 42 });
    expect(calls.requestReset).toEqual([]);
  });

  test("exchange returns ready, invalid or unsupported without leaking provider detail", async () => {
    const ok = makeRepo();
    expect(await completePasswordRecovery({ code: VALID_CODE }, deps(ok.repository))).toEqual({
      status: "ready",
    });
    expect(ok.calls.exchange).toEqual([VALID_CODE]);

    const expired = makeRepo({
      exchangeRecoveryCode: async () => ({ status: 403, code: "otp_expired" }),
    });
    expect(await completePasswordRecovery({ code: VALID_CODE }, deps(expired.repository))).toEqual({
      status: "invalid",
    });

    const outage = makeRepo({ exchangeRecoveryCode: async () => ({ status: 503 }) });
    await expect(
      completePasswordRecovery({ code: VALID_CODE }, deps(outage.repository)),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });

    const malformed = makeRepo();
    expect(await completePasswordRecovery({ code: "short" }, deps(malformed.repository))).toEqual({
      status: "invalid",
    });
    expect(malformed.calls.exchange).toEqual([]);

    expect(await completePasswordRecovery({ code: VALID_CODE }, deps(null))).toEqual({
      status: "unsupported",
    });
  });

  test("password update revokes other sessions and maps expired sessions safely", async () => {
    const updated = makeRepo();
    expect(
      await updateRecoveredPassword({ password: "a-new-safe-password" }, deps(updated.repository)),
    ).toEqual({ status: "updated" });
    expect(updated.calls.update).toEqual(["a-new-safe-password"]);
    expect(updated.calls.signOut).toBe(1);

    const expired = makeRepo({ updatePassword: async () => ({ status: 400 }) });
    await expect(
      updateRecoveredPassword({ password: "a-new-safe-password" }, deps(expired.repository)),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    const outage = makeRepo({ updatePassword: async () => ({ status: 500 }) });
    await expect(
      updateRecoveredPassword({ password: "a-new-safe-password" }, deps(outage.repository)),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });

    await expect(
      updateRecoveredPassword({ password: "a-new-safe-password" }, deps(null)),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});

describe("P4-S1 repository boundary", () => {
  test("reduces provider responses to status and code only", async () => {
    const fakeClient = {
      auth: {
        resetPasswordForEmail: async () => ({
          error: { status: 500, code: "provider_error", message: "raw provider body" },
        }),
        exchangeCodeForSession: async () => ({
          error: { status: 403, code: "otp_expired", message: "raw provider body" },
        }),
        updateUser: async () => ({
          error: { status: 400, code: "weak_password", message: "raw provider body" },
        }),
        signOut: async () => ({
          error: { status: 503, code: "unavailable", message: "raw provider body" },
        }),
      },
    } as never;
    const repository = new AuthRecoveryRepository(fakeClient);

    expect(
      await repository.requestReset("fictional@test.invalid", "https://app.test/reset-password"),
    ).toEqual({
      status: 500,
      code: "provider_error",
    });
    expect(await repository.exchangeRecoveryCode(VALID_CODE)).toEqual({
      status: 403,
      code: "otp_expired",
    });
    expect(await repository.updatePassword("a-new-safe-password")).toEqual({
      status: 400,
      code: "weak_password",
    });
    expect(await repository.signOutEverywhere()).toEqual({ status: 503, code: "unavailable" });
  });
});

describe("P4-S1 account-email setup checker", () => {
  test("reports names and state only in fixture mode", () => {
    const status = inspectAuthEmailSetup({ VITE_DATA_MODE: "fixtures" });
    expect(status.provider).toBe("supabase-auth-custom-smtp");
    expect(status.vendor).toBe("resend");
    expect(status.state).toBe("not-configured");
    expect(status.dataMode).toBe("fixtures");
    expect(status.redirectPaths).toEqual(["/auth/confirm", "/reset-password"]);
    expect(status.checks.some((check) => check.name.includes("SMTP"))).toBe(true);
    expect(status.checks.every((check) => typeof check.state === "string")).toBe(true);
  });

  test("reports hosted verification without returning any secret value", () => {
    const status = inspectAuthEmailSetup({
      VITE_DATA_MODE: "supabase-local",
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    });
    expect(status.state).toBe("requires-hosted-verification");
    expect(status.dataMode).toBe("supabase-local");
    const serialized = JSON.stringify(status);
    expect(serialized).not.toMatch(/sb_(?:secret|publishable)_/);
    expect(serialized).not.toMatch(/smtp\.resend\.com/i);
    expect(serialized).not.toMatch(/password=/i);
  });

  test("the acknowledgement never mentions a specific account", () => {
    expect(RECOVERY_ACKNOWLEDGEMENT).not.toMatch(/@/);
  });
});
