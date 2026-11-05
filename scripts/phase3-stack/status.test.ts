import { describe, expect, test } from "bun:test";

import { CliOutputError, extractStatus, parseCliJson, statusPorts } from "./status.ts";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signaturePartABCDEF123456";

describe("parseCliJson", () => {
  test("parses an object payload", () => {
    const pairs = parseCliJson('{"API_URL":"http://127.0.0.1:54321"}', "status");
    expect(pairs.API_URL).toBe("http://127.0.0.1:54321");
  });

  test("parses an array of name/value pairs", () => {
    const pairs = parseCliJson('[{"name":"API_URL","value":"http://127.0.0.1:54321"}]', "status");
    expect(pairs.API_URL).toBe("http://127.0.0.1:54321");
  });

  test("tolerates log lines before the JSON object", () => {
    const raw = 'Starting local dev environment...\n{"API_URL":"http://127.0.0.1:54321"}';
    expect(parseCliJson(raw, "status").API_URL).toBe("http://127.0.0.1:54321");
  });

  test("throws on malformed output", () => {
    expect(() => parseCliJson("not json at all", "status")).toThrow(CliOutputError);
  });

  test("throws on empty output", () => {
    expect(() => parseCliJson("   ", "status")).toThrow(CliOutputError);
  });

  test("throws on an unexpected shape", () => {
    expect(() => parseCliJson("42", "status")).toThrow(CliOutputError);
  });
});

describe("extractStatus", () => {
  test("keeps only approved values and records secret field names (no values)", () => {
    const status = extractStatus({
      API_URL: "http://127.0.0.1:54321",
      DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      PUBLISHABLE_KEY: "sb_publishable_abc",
      JWT_SECRET: "super-secret-jwt-value",
      SERVICE_ROLE_KEY: JWT,
    });

    expect(status.apiUrl).toBe("http://127.0.0.1:54321");
    expect(status.publishableKey).toBe("sb_publishable_abc");
    expect(status.secretFieldsPresent).toContain("JWT_SECRET");
    expect(status.secretFieldsPresent).toContain("SERVICE_ROLE_KEY");
    // The secret values are not carried on the reduced object.
    expect(JSON.stringify(status)).not.toContain("super-secret-jwt-value");
    expect(JSON.stringify(status)).not.toContain(JWT);
  });
});

describe("statusPorts", () => {
  test("collects ports from approved URLs", () => {
    const status = extractStatus({
      API_URL: "http://127.0.0.1:54321",
      DB_URL: "postgresql://postgres@127.0.0.1:54322/postgres",
    });
    expect(statusPorts(status)).toEqual([54321, 54322]);
  });
});
