import { describe, expect, test } from "bun:test";

import {
  EnvValidationError,
  LOCAL_API_PORT,
  parseAppEnv,
  type EnvErrorCode,
} from "../../src/lib/env.ts";

// Harmless fixtures assembled from parts so source-level secret scanners never
// see a contiguous real-token shape. The runtime values still match the patterns
// the parser must reject.
const JWT = ["eyJhbGciOiJIUzI1NiJ9", "eyJyb2xlIjoiYW5vbiJ9", "c2lnbmF0dXJl"].join(".");
const SECRET_KEY = ["sb", "secret", "9aZxQ1wErT2yUiOp3aSdFg"].join("_");
const PAT = ["sbp", "0123456789abcdef0123456789abcdef01234567"].join("_");
const PUBLISHABLE_KEY = ["sb", "publishable", "a".repeat(24)].join("_");

function errorCode(run: () => unknown): EnvErrorCode {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(EnvValidationError);
    return (error as EnvValidationError).code;
  }
  throw new Error("Expected an EnvValidationError");
}

describe("parseAppEnv / fixtures mode", () => {
  test("accepts fixtures with only the mode set", () => {
    expect(parseAppEnv({ VITE_DATA_MODE: "fixtures" })).toEqual({ dataMode: "fixtures" });
  });

  test("ignores optional Supabase values in fixtures mode", () => {
    const env = parseAppEnv({
      VITE_DATA_MODE: "fixtures",
      // Spec: fixtures never parses or initializes these values.
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "not-a-real-local-key",
    });
    expect(env).toEqual({ dataMode: "fixtures" });
  });

  test("rejects a secret-looking VITE_ name even in fixtures mode", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          VITE_DATA_MODE: "fixtures",
          VITE_SUPABASE_SERVICE_ROLE_KEY: "irrelevant",
        }),
      ),
    ).toBe("SECRET_VITE_NAME");
  });

  test("rejects a JWT-shaped VITE_ value", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          VITE_DATA_MODE: "fixtures",
          VITE_SUPABASE_ANON_KEY: JWT,
        }),
      ),
    ).toBe("SECRET_VITE_VALUE");
  });

  test("rejects a secret-prefixed VITE_ value", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          VITE_DATA_MODE: "fixtures",
          VITE_SUPABASE_KEY: SECRET_KEY,
        }),
      ),
    ).toBe("SECRET_VITE_VALUE");
  });
});

describe("parseAppEnv / mode selection", () => {
  test("rejects a missing mode", () => {
    expect(errorCode(() => parseAppEnv({}))).toBe("MODE_MISSING");
  });

  test("rejects a blank mode", () => {
    expect(errorCode(() => parseAppEnv({ VITE_DATA_MODE: "   " }))).toBe("MODE_MISSING");
  });

  test("rejects an unknown mode", () => {
    expect(errorCode(() => parseAppEnv({ VITE_DATA_MODE: "hosted" }))).toBe("MODE_UNKNOWN");
  });
});

describe("parseAppEnv / supabase-local mode", () => {
  const valid = {
    VITE_DATA_MODE: "supabase-local",
    VITE_SUPABASE_URL: `http://127.0.0.1:${LOCAL_API_PORT}`,
    VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
  };

  test("accepts the approved loopback URL and publishable key", () => {
    expect(parseAppEnv(valid)).toEqual({
      dataMode: "supabase-local",
      supabaseUrl: `http://127.0.0.1:${LOCAL_API_PORT}`,
      supabasePublishableKey: PUBLISHABLE_KEY,
    });
  });

  test("accepts localhost on the approved port", () => {
    const env = parseAppEnv({
      ...valid,
      VITE_SUPABASE_URL: `http://localhost:${LOCAL_API_PORT}`,
    });
    expect(env).toMatchObject({ supabaseUrl: `http://localhost:${LOCAL_API_PORT}` });
  });

  test("returns a frozen result", () => {
    const env = parseAppEnv(valid);
    expect(Object.isFrozen(env)).toBe(true);
  });

  test("rejects a hosted URL", () => {
    expect(
      errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_URL: "https://abc.supabase.co" })),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects https even on loopback", () => {
    expect(
      errorCode(() =>
        parseAppEnv({ ...valid, VITE_SUPABASE_URL: `https://127.0.0.1:${LOCAL_API_PORT}` }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects a wrong port", () => {
    expect(
      errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_URL: "http://127.0.0.1:5432" })),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects userinfo", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          ...valid,
          VITE_SUPABASE_URL: `http://user:pass@127.0.0.1:${LOCAL_API_PORT}`,
        }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects a query string", () => {
    expect(
      errorCode(() =>
        parseAppEnv({ ...valid, VITE_SUPABASE_URL: `http://127.0.0.1:${LOCAL_API_PORT}?x=1` }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects a fragment", () => {
    expect(
      errorCode(() =>
        parseAppEnv({ ...valid, VITE_SUPABASE_URL: `http://127.0.0.1:${LOCAL_API_PORT}#frag` }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects an extra path", () => {
    expect(
      errorCode(() =>
        parseAppEnv({ ...valid, VITE_SUPABASE_URL: `http://127.0.0.1:${LOCAL_API_PORT}/rest/v1` }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
  });

  test("rejects an invalid URL", () => {
    expect(errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_URL: "not a url" }))).toBe(
      "SUPABASE_URL_INVALID",
    );
  });

  test("rejects a missing URL", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          VITE_DATA_MODE: "supabase-local",
          VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
        }),
      ),
    ).toBe("SUPABASE_URL_REQUIRED");
  });

  test("rejects a missing key", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          VITE_DATA_MODE: "supabase-local",
          VITE_SUPABASE_URL: valid.VITE_SUPABASE_URL,
        }),
      ),
    ).toBe("SUPABASE_KEY_REQUIRED");
  });

  test("rejects a JWT-form key", () => {
    expect(errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: JWT }))).toBe(
      "SECRET_VITE_VALUE",
    );
  });

  test("rejects a secret-prefixed key", () => {
    expect(
      errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: SECRET_KEY })),
    ).toBe("SECRET_VITE_VALUE");
  });

  test("rejects a personal-access-token-shaped key", () => {
    expect(errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: PAT }))).toBe(
      "SECRET_VITE_VALUE",
    );
  });

  test("rejects service-role material", () => {
    expect(
      errorCode(() =>
        parseAppEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: "service_role_local" }),
      ),
    ).toBe("SECRET_VITE_VALUE");
  });

  test("rejects the documented placeholder", () => {
    expect(
      errorCode(() =>
        parseAppEnv({
          ...valid,
          VITE_SUPABASE_PUBLISHABLE_KEY: "replace-with-local-publishable-key",
        }),
      ),
    ).toBe("SUPABASE_KEY_INVALID");
  });

  test("never echoes a rejected value in the error message", () => {
    const rejected = ["sb", "secret", "doNotEchoThisValue"].join("_");
    try {
      parseAppEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: rejected });
      throw new Error("Expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect(String((error as Error).message)).not.toContain("doNotEchoThisValue");
    }
  });
});

describe("parseAppEnv / supabase-staging mode", () => {
  const valid = {
    VITE_DATA_MODE: "supabase-staging",
    VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
  };

  test("accepts only the HTTPS root of a hosted Supabase project", () => {
    expect(parseAppEnv(valid)).toEqual({
      dataMode: "supabase-staging",
      supabaseUrl: valid.VITE_SUPABASE_URL,
      supabasePublishableKey: PUBLISHABLE_KEY,
    });
  });

  test("rejects insecure, non-Supabase and path-bearing hosted URLs", () => {
    expect(
      errorCode(() =>
        parseAppEnv({ ...valid, VITE_SUPABASE_URL: "http://abcdefghijklmnopqrst.supabase.co" }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
    expect(
      errorCode(() => parseAppEnv({ ...valid, VITE_SUPABASE_URL: "https://example.com" })),
    ).toBe("SUPABASE_URL_INVALID");
    expect(
      errorCode(() =>
        parseAppEnv({
          ...valid,
          VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co/rest/v1",
        }),
      ),
    ).toBe("SUPABASE_URL_INVALID");
  });
});
