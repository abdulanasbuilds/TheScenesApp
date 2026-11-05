import { describe, expect, test } from "bun:test";

import { execute, type StackRuntime } from "./stack.ts";

const JWT_SECRET_VALUE = "super-secret-jwt-value-should-never-print";
const SERVICE_ROLE_VALUE =
  "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.anotherSignaturePart999";

const DISABLED_TOML = `
[api]
enabled = true
[db]
enabled = true
[realtime]
enabled = false
[studio]
enabled = false
[local_smtp]
enabled = false
[storage]
enabled = false
[edge_runtime]
enabled = false
[analytics]
enabled = false
`;

const OK_STATUS = JSON.stringify({
  API_URL: "http://127.0.0.1:54321",
  DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  PUBLISHABLE_KEY: "sb_publishable_local_only",
  JWT_SECRET: JWT_SECRET_VALUE,
  SERVICE_ROLE_KEY: SERVICE_ROLE_VALUE,
});

interface FakeOptions {
  startCode?: number;
  statusCode?: number;
  stopCode?: number;
  statusJson?: string;
  transientStatusFailures?: number;
  statusFailureStderr?: string;
  containers?: { name: string; ports: string }[];
  hostListeners?: { service: string; host: string; port: number; source: "host" }[];
  config?: string;
  stripped?: string[];
  networkCreated?: boolean;
  networkError?: string;
}

function makeRuntime(options: FakeOptions = {}): {
  runtime: StackRuntime;
  calls: string[][];
  out: string[];
  err: string[];
  sleeps: number[];
} {
  const calls: string[][] = [];
  const out: string[] = [];
  const err: string[] = [];
  const sleeps: number[] = [];
  let statusCalls = 0;
  const runtime: StackRuntime = {
    cwd: "C:/root",
    runSupabase: (args) => {
      calls.push([...args]);
      const command = args[0];
      if (command === "start") return { code: options.startCode ?? 0, stdout: "", stderr: "" };
      if (command === "status") {
        statusCalls += 1;
        if (statusCalls <= (options.transientStatusFailures ?? 0)) {
          return {
            code: 1,
            stdout: "",
            stderr: options.statusFailureStderr ?? "container is not ready: starting",
          };
        }
        return {
          code: options.statusCode ?? 0,
          stdout: options.statusJson ?? OK_STATUS,
          stderr: "",
        };
      }
      if (command === "stop") return { code: options.stopCode ?? 0, stdout: "", stderr: "" };
      return { code: 0, stdout: "", stderr: "" };
    },
    buildChildEnv: () => ({ env: {}, stripped: options.stripped ?? [] }),
    assertBinaryAvailable: () => {},
    ensureLoopbackNetwork: () => {
      if (options.networkError) throw new Error(options.networkError);
      return { name: "the-scenes-phase3-loopback", created: options.networkCreated ?? false };
    },
    listProjectContainers: () =>
      options.containers ?? [
        { name: "supabase_kong_the-scenes-app", ports: "127.0.0.1:54321->8000/tcp" },
        { name: "supabase_db_the-scenes-app", ports: "127.0.0.1:54322->5432/tcp" },
      ],
    listHostListeners: () =>
      options.hostListeners ?? [
        { service: "host", host: "127.0.0.1", port: 54321, source: "host" },
        { service: "host", host: "127.0.0.1", port: 54322, source: "host" },
      ],
    readConfig: () => options.config ?? DISABLED_TOML,
    cliVersion: () => "3.0.0",
    lockedVersion: () => "3.0.0",
    sleep: (ms) => sleeps.push(ms),
    out: (text) => out.push(text),
    err: (text) => err.push(text),
  };
  return { runtime, calls, out, err, sleeps };
}

function stopCalls(calls: string[][]): string[][] {
  return calls.filter((c) => c[0] === "stop");
}

function statusCalls(calls: string[][]): string[][] {
  return calls.filter((c) => c[0] === "status");
}

describe("start", () => {
  test("returns 0 and does not stop when every listener is loopback", () => {
    const { runtime, calls, out } = makeRuntime();
    expect(execute(["start"], runtime)).toBe(0);
    expect(stopCalls(calls)).toHaveLength(0);
    expect(out.join("")).toContain("isolated: true");
  });

  test("starts the stack on the loopback network", () => {
    const { runtime, calls, out } = makeRuntime({ networkCreated: true });
    expect(execute(["start"], runtime)).toBe(0);
    const start = calls.find((c) => c[0] === "start");
    expect(start).toBeDefined();
    expect(start).toContain("--network-id");
    expect(start).toContain("the-scenes-phase3-loopback");
    expect(out.join("")).toContain("loopback network: the-scenes-phase3-loopback");
  });

  test("fails before starting (and does not stop) when the loopback network cannot be prepared", () => {
    const { runtime, calls, err } = makeRuntime({
      networkError: "docker is not running",
    });
    expect(execute(["start"], runtime)).toBe(1);
    expect(calls.some((c) => c[0] === "start")).toBe(false);
    expect(stopCalls(calls)).toHaveLength(0);
    expect(err.join("")).toContain("could not prepare the loopback network");
  });

  test("fails, reports the offender, and stops the project on a non-loopback bind", () => {
    const { runtime, calls, out, err } = makeRuntime({
      hostListeners: [
        { service: "host", host: "127.0.0.1", port: 54321, source: "host" },
        { service: "host", host: "0.0.0.0", port: 54322, source: "host" },
      ],
    });
    expect(execute(["start"], runtime)).toBe(1);
    const stops = stopCalls(calls);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toContain("--project-id");
    expect(stops[0]).toContain("the-scenes-app");
    expect(stops[0]).not.toContain("--all");
    expect(out.join("") + err.join("")).toContain("non-loopback listener");
  });

  test("fails and stops when the status output is malformed", () => {
    const { runtime, calls, err } = makeRuntime({ statusJson: "not-json" });
    expect(execute(["start"], runtime)).toBe(1);
    expect(stopCalls(calls)).toHaveLength(1);
    expect(err.join("")).toContain("could not parse status output");
  });

  test("fails and stops when the CLI start fails", () => {
    const { runtime, calls } = makeRuntime({ startCode: 1 });
    expect(execute(["start"], runtime)).toBe(1);
    expect(stopCalls(calls)).toHaveLength(1);
  });

  test("rejects a hosted API URL and stops", () => {
    const { runtime, calls } = makeRuntime({
      statusJson: JSON.stringify({ API_URL: "https://abcd.supabase.co" }),
    });
    expect(execute(["start"], runtime)).toBe(1);
    expect(stopCalls(calls)).toHaveLength(1);
  });

  test("fails when a disabled service container is running", () => {
    const { runtime, calls } = makeRuntime({
      containers: [
        { name: "supabase_kong_the-scenes-app", ports: "127.0.0.1:54321->8000/tcp" },
        { name: "supabase_realtime_the-scenes-app", ports: "127.0.0.1:54340->4000/tcp" },
      ],
    });
    expect(execute(["start"], runtime)).toBe(1);
    expect(stopCalls(calls)).toHaveLength(1);
  });

  test("never prints raw secret values (json mode)", () => {
    const { runtime, out, err } = makeRuntime();
    expect(execute(["start", "--json"], runtime)).toBe(0);
    const combined = out.join("") + err.join("");
    expect(combined).not.toContain(JWT_SECRET_VALUE);
    expect(combined).not.toContain(SERVICE_ROLE_VALUE);
    expect(combined).toContain("childEnv");
  });

  test("accepts --github-mask without leaking secrets outside GitHub Actions", () => {
    const { runtime, out, err } = makeRuntime();
    expect(execute(["start", "--json", "--github-mask"], runtime)).toBe(0);
    const combined = out.join("") + err.join("");
    expect(combined).not.toContain(JWT_SECRET_VALUE);
    expect(combined).not.toContain(SERVICE_ROLE_VALUE);
    if (process.env.GITHUB_ACTIONS !== "true") {
      expect(combined).not.toContain("::add-mask::");
    }
  });

  test("only forwards approved child-env values, adding the DB URL on request", () => {
    const { runtime, out } = makeRuntime();
    execute(["status", "--json", "--with-db-url"], runtime);
    const payload = JSON.parse(out.join("").trim()) as {
      childEnv: Record<string, string>;
      secretFieldsPresent: string[];
    };
    expect(payload.childEnv.VITE_SUPABASE_URL).toBe("http://127.0.0.1:54321");
    expect(payload.childEnv.VITE_SUPABASE_PUBLISHABLE_KEY).toBe("sb_publishable_local_only");
    expect(payload.childEnv.PHASE3_LOCAL_DB_URL).toContain("127.0.0.1:54322");
    expect(payload.secretFieldsPresent).toContain("JWT_SECRET");
  });
});

describe("status readiness retry", () => {
  test("retries a transient cold-start readiness failure and then succeeds", () => {
    const { runtime, calls, sleeps } = makeRuntime({ transientStatusFailures: 2 });
    expect(execute(["status"], runtime)).toBe(0);
    expect(statusCalls(calls)).toHaveLength(3);
    expect(sleeps).toEqual([2000, 2000]);
  });

  test("does not retry a non-transient status failure", () => {
    const { runtime, calls, sleeps } = makeRuntime({
      transientStatusFailures: 1,
      statusFailureStderr: "permission denied",
    });
    expect(execute(["status"], runtime)).toBe(1);
    expect(statusCalls(calls)).toHaveLength(1);
    expect(sleeps).toHaveLength(0);
  });

  test("gives up after the bounded number of attempts", () => {
    const { runtime, calls, sleeps } = makeRuntime({ transientStatusFailures: 10 });
    expect(execute(["status"], runtime)).toBe(1);
    expect(statusCalls(calls)).toHaveLength(6);
    expect(sleeps).toHaveLength(5);
  });

  test("start also retries a transient status failure before passing the gate", () => {
    const { runtime, calls } = makeRuntime({ transientStatusFailures: 1 });
    expect(execute(["start"], runtime)).toBe(0);
    expect(statusCalls(calls)).toHaveLength(2);
    expect(stopCalls(calls)).toHaveLength(0);
  });
});

describe("stop", () => {
  test("targets only the local project and never --all", () => {
    const { runtime, calls, out } = makeRuntime();
    expect(execute(["stop"], runtime)).toBe(0);
    const stops = stopCalls(calls);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toEqual(["stop", "--workdir", "C:/root", "--project-id", "the-scenes-app"]);
    expect(out.join("")).toContain("project-targeted");
  });
});

describe("usage", () => {
  test("rejects an unknown command with exit 2", () => {
    const { runtime, err } = makeRuntime();
    expect(execute(["frobnicate"], runtime)).toBe(2);
    expect(err.join("")).toContain("usage:");
  });

  test("rejects a hosted command name", () => {
    const { runtime } = makeRuntime();
    expect(execute(["link"], runtime)).toBe(2);
  });
});
