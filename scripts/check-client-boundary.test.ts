import { describe, expect, test } from "bun:test";
import { findForbiddenMarkers, serverFunctionShapeViolations } from "./check-client-boundary";

describe("client bundle marker scan", () => {
  test("accepts ordinary client code", () => {
    expect(findForbiddenMarkers("export const mode = 'fixtures'")).toEqual([]);
  });

  test("detects privileged and server implementation markers", () => {
    const source = ["SUPABASE_SERVICE_ROLE_KEY", "sb_secret_", "src/server/"].join(" ");
    expect(findForbiddenMarkers(source)).toEqual([
      "SUPABASE_SERVICE_ROLE_KEY",
      "sb_secret_",
      "src/server/",
    ]);
  });

  test("requires direct createServerFn source shape", () => {
    expect(serverFunctionShapeViolations([])).toEqual([]);
  });
});
