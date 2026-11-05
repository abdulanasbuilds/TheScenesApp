import { describe, expect, test } from "bun:test";

import { REDACTED, containsSecretShape, createRedactor, redactSecrets } from "./redact.ts";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcDEF123456_-_x";
const SAMPLE_SECRET_KEY = "sb_secret_9aZxQ1wErT2yUiOp3aSdFg";
// Built from parts so this harmless test fixture never reads as a real
// Supabase personal access token to source-level secret scanners, while the
// runtime value still matches the `sbp_...` shape the redactor must catch.
const SAMPLE_ACCESS_TOKEN = ["sbp", "0123456789abcdef0123456789abcdef01234567"].join("_");

describe("redactSecrets", () => {
  test("removes JWT-shaped values", () => {
    const out = redactSecrets(`JWT is ${SAMPLE_JWT} here`);
    expect(out).not.toContain(SAMPLE_JWT);
    expect(out).toContain(REDACTED);
  });

  test("removes Supabase secret keys and access tokens", () => {
    const out = redactSecrets(`key=${SAMPLE_SECRET_KEY} token=${SAMPLE_ACCESS_TOKEN}`);
    expect(out).not.toContain(SAMPLE_SECRET_KEY);
    expect(out).not.toContain(SAMPLE_ACCESS_TOKEN);
  });

  test("removes passwords from connection URLs", () => {
    const out = redactSecrets("postgresql://postgres:s3cr3t-pw@127.0.0.1:54322/postgres");
    expect(out).not.toContain("s3cr3t-pw");
    expect(out).toContain("postgresql://postgres:");
  });

  test("collapses secret-looking assignments", () => {
    const out = redactSecrets("JWT_SECRET=super-secret-value\nSERVICE_ROLE_KEY: another");
    expect(out).not.toContain("super-secret-value");
    expect(out).not.toContain("another");
    expect(out).toContain("JWT_SECRET=");
  });

  test("leaves ordinary loopback output intact", () => {
    const text = "API_URL=http://127.0.0.1:54321\nisolated: true";
    expect(redactSecrets(text)).toBe(text);
  });
});

describe("createRedactor", () => {
  test("replaces exact secret literals even without a matching shape", () => {
    const redact = createRedactor(["my-opaque-local-secret-value"]);
    expect(redact("value=my-opaque-local-secret-value")).not.toContain(
      "my-opaque-local-secret-value",
    );
  });

  test("ignores trivially short literals so text is not blanked", () => {
    const redact = createRedactor(["a", "", "  "]);
    expect(redact("abc")).toBe("abc");
  });
});

describe("containsSecretShape", () => {
  test("detects a leftover JWT", () => {
    expect(containsSecretShape(`x ${SAMPLE_JWT}`)).toBe(true);
  });
  test("is false for sanitised text", () => {
    expect(containsSecretShape(`x ${REDACTED}`)).toBe(false);
  });
});
