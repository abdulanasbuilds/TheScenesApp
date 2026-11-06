import { describe, expect, test } from "bun:test";

import {
  assertLocalOnly,
  cliArgsFor,
  DB_COMMANDS,
  executeDb,
  normaliseGeneratedTypes,
  parseDbArgs,
  parseFingerprint,
  typesMatch,
  type DbRuntime,
} from "./phase3-db.ts";

const FINGERPRINT_A = "0123456789abcdef0123456789abcdef";
const FINGERPRINT_B = "fedcba9876543210fedcba9876543210";
const GENERATED_TYPES = "export type Database = { public: Record<string, never> }\n";

interface FakeOptions {
  fingerprints?: string[];
  resetCode?: number;
  testCode?: number;
  lintCode?: number;
  generated?: string;
  committed?: string | null;
}

function fakeRuntime(options: FakeOptions = {}): {
  runtime: DbRuntime;
  calls: string[][];
  output: string[];
  errors: string[];
  writes: string[];
} {
  const calls: string[][] = [];
  const output: string[] = [];
  const errors: string[] = [];
  const writes: string[] = [];
  let fingerprintIndex = 0;
  const fingerprints = options.fingerprints ?? [FINGERPRINT_A, FINGERPRINT_A];

  const runtime: DbRuntime = {
    runCli: (args) => {
      calls.push([...args]);
      if (args[0] === "db" && args[1] === "reset") {
        return { code: options.resetCode ?? 0, stdout: "reset ok\n", stderr: "" };
      }
      if (args[0] === "test") {
        return { code: options.testCode ?? 0, stdout: "1..1\nok 1\n", stderr: "" };
      }
      if (args[0] === "db" && args[1] === "lint") {
        return { code: options.lintCode ?? 0, stdout: "lint ok\n", stderr: "" };
      }
      if (args[0] === "gen") {
        return { code: 0, stdout: options.generated ?? GENERATED_TYPES, stderr: "" };
      }
      return { code: 1, stdout: "", stderr: `unexpected command ${args.join(" ")}\n` };
    },
    fingerprint: () => {
      const value = fingerprints[fingerprintIndex] ?? fingerprints.at(-1) ?? FINGERPRINT_A;
      fingerprintIndex += 1;
      return value;
    },
    readCommittedTypes: () =>
      options.committed === undefined ? GENERATED_TYPES : options.committed,
    writeCommittedTypes: (content) => {
      writes.push(content);
    },
    out: (text) => {
      output.push(text);
    },
    err: (text) => {
      errors.push(text);
    },
    redact: (input) => input,
  };

  return { runtime, calls, output, errors, writes };
}

describe("parseDbArgs", () => {
  test("accepts every declared command", () => {
    for (const command of DB_COMMANDS) {
      expect(parseDbArgs([command]).command).toBe(command);
    }
  });

  test("accepts --write only with types", () => {
    expect(parseDbArgs(["types", "--write"]).write).toBe(true);
    expect(() => parseDbArgs(["reset", "--write"])).toThrow("--write is only valid");
  });

  test("rejects unknown commands and options", () => {
    expect(() => parseDbArgs([])).toThrow("expected one of");
    expect(() => parseDbArgs(["push"])).toThrow("unknown command");
    expect(() => parseDbArgs(["reset", "--linked"])).toThrow("unknown option");
  });
});

describe("local command construction", () => {
  test("every CLI command includes --local", () => {
    for (const command of ["reset", "test", "lint", "types"] as const) {
      expect(cliArgsFor(command)).toContain("--local");
    }
  });

  test("assertLocalOnly rejects missing --local and hosted flags", () => {
    expect(() => assertLocalOnly(["db", "reset"])).toThrow("without --local");
    expect(() => assertLocalOnly(["db", "reset", "--local", "--linked"])).toThrow(
      "refusing hosted flag",
    );
    expect(() => assertLocalOnly(["db", "reset", "--local", "--project-ref=abc"])).toThrow(
      "refusing hosted flag",
    );
    expect(() => assertLocalOnly(["db", "reset", "--local", "--db-url=postgres://x"])).toThrow(
      "refusing hosted flag",
    );
    expect(() => assertLocalOnly(["db", "reset", "--local"])).not.toThrow();
  });
});

describe("type comparison", () => {
  test("normalises CRLF and trailing whitespace", () => {
    expect(normaliseGeneratedTypes("a\r\nb\r\n\r\n")).toBe("a\nb\n");
  });

  test("matches equivalent generated output", () => {
    expect(typesMatch("a\r\nb\n", "a\nb")).toBe(true);
    expect(typesMatch("a\nb\n", "a\nc\n")).toBe(false);
  });
});

describe("parseFingerprint", () => {
  test("reads the last non-empty line", () => {
    expect(parseFingerprint("\nignored\n0123456789abcdef0123456789abcdef\n")).toBe(FINGERPRINT_A);
  });

  test("rejects malformed output", () => {
    expect(() => parseFingerprint("not-a-fingerprint")).toThrow("could not parse");
    expect(() => parseFingerprint("")).toThrow("could not parse");
  });
});

describe("executeDb gate", () => {
  test("runs two resets, compares fingerprints, then pgTAP, lint, and type drift", () => {
    const { runtime, calls, output } = fakeRuntime();
    expect(executeDb({ command: "gate", write: false }, runtime)).toBe(0);

    const labels = calls.map((args) => args.slice(0, 2).join(" "));
    expect(labels).toEqual(["db reset", "db reset", "test db", "db lint", "gen types"]);
    expect(output.join("")).toContain(`seed fingerprint (reset 1): ${FINGERPRINT_A}`);
    expect(output.join("")).toContain(`seed fingerprint (reset 2): ${FINGERPRINT_A}`);
    expect(output.join("")).toContain("wave 1 database gate passed");
  });

  test("stops before tests when the fingerprint changes", () => {
    const { runtime, calls, errors } = fakeRuntime({
      fingerprints: [FINGERPRINT_A, FINGERPRINT_B],
    });
    expect(executeDb({ command: "gate", write: false }, runtime)).toBe(1);
    expect(calls.map((args) => args.slice(0, 2).join(" "))).toEqual(["db reset", "db reset"]);
    expect(errors.join("")).toContain("fingerprint mismatch");
  });

  test("stops after a failing pgTAP run", () => {
    const { runtime, calls, errors } = fakeRuntime({ testCode: 2 });
    expect(executeDb({ command: "gate", write: false }, runtime)).toBe(1);
    expect(calls.map((args) => args.slice(0, 2).join(" "))).toEqual([
      "db reset",
      "db reset",
      "test db",
    ]);
    expect(errors.join("")).toContain("failed at pgTAP");
  });

  test("stops after a failing database lint run", () => {
    const { runtime, calls, errors } = fakeRuntime({ lintCode: 1 });
    expect(executeDb({ command: "gate", write: false }, runtime)).toBe(1);
    expect(calls.map((args) => args.slice(0, 2).join(" "))).toEqual([
      "db reset",
      "db reset",
      "test db",
      "db lint",
    ]);
    expect(errors.join("")).toContain("failed at database lint");
  });
});

describe("executeDb types", () => {
  test("fails clearly when the committed file is missing", () => {
    const { runtime, errors } = fakeRuntime({ committed: null });
    expect(executeDb({ command: "types", write: false }, runtime)).toBe(1);
    expect(errors.join("")).toContain("db/database.types.ts is missing");
  });

  test("reports drift", () => {
    const { runtime, errors } = fakeRuntime({ committed: "export type Database = {}\n" });
    expect(executeDb({ command: "types", write: false }, runtime)).toBe(1);
    expect(errors.join("")).toContain("do not match");
  });

  test("--write stores normalised output", () => {
    const { runtime, writes, output } = fakeRuntime({
      generated: "export type Database = {}\r\n\r\n",
    });
    expect(executeDb({ command: "types", write: true }, runtime)).toBe(0);
    expect(writes).toEqual(["export type Database = {}\n"]);
    expect(output.join("")).toContain("wrote db/database.types.ts");
  });
});
