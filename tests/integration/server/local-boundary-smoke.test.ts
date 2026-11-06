import { describe, expect, test } from "bun:test";

const url = process.env.PHASE3_API_URL ?? "";
const key = process.env.PHASE3_PUBLISHABLE_KEY ?? "";
if (url && !/^http:\/\/(?:127\.0\.0\.1|localhost):54321$/.test(url)) {
  throw new Error("refusing non-loopback server-boundary smoke target");
}

const suite = url && key ? describe : describe.skip;

suite("Wave 2 local request boundary", () => {
  test("approved publishable configuration reaches local Auth without privileged material", async () => {
    expect(key).toStartWith("sb_publishable_");
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(5_000),
    });
    expect(response.ok).toBe(true);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
