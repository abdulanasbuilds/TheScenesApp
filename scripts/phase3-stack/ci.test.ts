import { describe, expect, test } from "bun:test";

import { emitGithubMasks } from "./ci.ts";

describe("emitGithubMasks", () => {
  test("is a no-op outside GitHub Actions", () => {
    const out: string[] = [];
    const masked = emitGithubMasks(["super-secret-value"], { GITHUB_ACTIONS: "false" }, (t) =>
      out.push(t),
    );
    expect(masked).toBe(0);
    expect(out).toHaveLength(0);
  });

  test("registers masks inside GitHub Actions", () => {
    const out: string[] = [];
    const masked = emitGithubMasks(
      ["super-secret-value", "another-secret-value"],
      { GITHUB_ACTIONS: "true" },
      (t) => out.push(t),
    );
    expect(masked).toBe(2);
    expect(out).toEqual(["::add-mask::super-secret-value\n", "::add-mask::another-secret-value\n"]);
  });

  test("skips short and duplicate values", () => {
    const out: string[] = [];
    const masked = emitGithubMasks(
      ["abc", "same-secret", "same-secret"],
      { GITHUB_ACTIONS: "true" },
      (t) => out.push(t),
    );
    expect(masked).toBe(1);
    expect(out).toHaveLength(1);
  });
});
