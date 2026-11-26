#!/usr/bin/env bun
/**
 * P4-S2 distributed rate-limit proof harness (operator tool, not app code).
 *
 * Evidence this tool produces, against the real provider:
 *   1. configuration presence — variable NAMES and states only, never values;
 *   2. a shared limit across two separate OS processes (no shared memory);
 *   3. the counter read back from Upstash itself (count + TTL on the hashed key);
 *   4. a cold start that is already limited, proving nothing local is required;
 *   5. the documented failure modes: misconfigured never falls back to memory, auth fails
 *      closed after floor(limit/2) emergency requests, learning writes fail open;
 *   6. latency percentiles for the provider round trip and the limiter call;
 *   7. a client-bundle scan that reports only booleans.
 *
 * Safety: secrets are read from the runtime environment and used in-process only. Nothing
 * here prints, logs, or persists a token, URL, secret value, or raw subject. Subjects are
 * synthetic `@rate-limit-proof.test` addresses; only their truncated HMAC is shown.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PublicAppError } from "../src/features/shared/safe-handler";
import {
  assertRateLimit,
  createRateLimitService,
  deriveSubjectHash,
  RATE_LIMIT_POLICIES,
  type RateLimitDecision,
  type RateLimitPolicyName,
  type RateLimitService,
} from "../src/server/security/rate-limit.server";
import {
  readRateLimitConfig,
  type RateLimitConfig,
} from "../src/server/security/rate-limit-config.server";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const ARTIFACT_DIR = path.join(ROOT, ".audit", "p4-s2-upstash");

type RestResult = Readonly<{ status: number; payload: unknown; ms: number }>;
type RestConfig = Readonly<{ url: string; token: string }>;
type ProbeRecord = Readonly<{
  i: number;
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds?: number;
  reason?: string;
  degraded?: boolean;
  ms: number;
}>;
type ProbeSummary = Readonly<{
  mode: "probe";
  label: string;
  pid: number;
  driver: string;
  policy: RateLimitPolicyName;
  subjectHashPrefix: string;
  requested: number;
  allowed: number;
  blocked: number;
  firstBlockedAt: number | null;
  durationMs: number;
  decisions: readonly ProbeRecord[];
}>;

const results: { id: string; ok: boolean; detail: string }[] = [];
const evidence: Record<string, unknown> = {};

function record(id: string, ok: boolean, detail: string): void {
  results.push({ id, ok, detail });
  process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${id}  —  ${detail}\n`);
}

function note(message: string): void {
  process.stdout.write(`${message}\n`);
}

function heading(message: string): void {
  process.stdout.write(`\n== ${message}\n`);
}

function numbers(list: readonly number[]): { p50: number; p95: number; max: number; n: number } {
  if (list.length === 0) return { p50: 0, p95: 0, max: 0, n: 0 };
  const sorted = [...list].sort((a, b) => a - b);
  const at = (fraction: number) =>
    sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(fraction * sorted.length)))];
  return {
    p50: Number(at(0.5).toFixed(1)),
    p95: Number(at(0.95).toFixed(1)),
    max: Number(sorted[sorted.length - 1].toFixed(1)),
    n: sorted.length,
  };
}

function parseFlags(argv: readonly string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const body = arg.slice(2);
    const separator = body.indexOf("=");
    const key = separator === -1 ? body : body.slice(0, separator);
    const value = separator === -1 ? "true" : body.slice(separator + 1);
    flags.set(key, value);
  }
  return flags;
}

async function rest(config: RestConfig, command: readonly unknown[], timeoutMs = 5_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    const status = response.status;
    const payload: unknown = await response.json().catch(() => null);
    return { status, payload, ms: Number((performance.now() - startedAt).toFixed(1)) };
  } catch {
    return {
      status: 0,
      payload: null as unknown,
      ms: Number((performance.now() - startedAt).toFixed(1)),
    };
  } finally {
    clearTimeout(timer);
  }
}

function payloadResult(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return undefined;
  return (payload as { result?: unknown }).result;
}

function syntheticSubject(): string {
  return `proof-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@rate-limit-proof.test`;
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 12)}…`;
}

function collectorLogger() {
  const events: { level: string; event: string; detail: Record<string, unknown> }[] = [];
  const logger = (
    level: "info" | "warn" | "error",
    event: string,
    detail: Record<string, unknown>,
  ) => {
    events.push({ level, event, detail });
  };
  return { events, logger };
}

function memorySample(): { p50: number; p95: number; max: number; n: number } {
  return { p50: 0, p95: 0, max: 0, n: 0 };
}

/** One measured limiter call, using the same factory the app uses. */
async function consumeOnce(
  service: RateLimitService,
  policy: RateLimitPolicyName,
  subject: string,
): Promise<{ decision: RateLimitDecision; ms: number }> {
  const startedAt = performance.now();
  const decision = await service.consume(policy, subject);
  return { decision, ms: Number((performance.now() - startedAt).toFixed(2)) };
}

function waitUntilEpoch(epochMs: number): Promise<void> {
  const delay = Math.min(5_000, Math.max(0, epochMs - Date.now()));
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/* ---------------------------------------------------------------------------------------------
 * probe: one process, one subject, a fixed number of calls. Spawned children use this so the
 * evidence shows genuinely separate PIDs and genuinely separate memory.
 * ------------------------------------------------------------------------------------------- */
async function runProbe(options: {
  label: string;
  policy: RateLimitPolicyName;
  subject: string;
  count: number;
  concurrent: boolean;
  startAt?: number;
  driver?: "memory";
  config?: RateLimitConfig;
}): Promise<ProbeSummary> {
  const config =
    options.config ??
    (options.driver === "memory" ? ({ driver: "memory" } as const) : readRateLimitConfig());
  const hashSecret =
    config.driver === "upstash" ? config.hashSecret : `proof-hmac-secret-${"0".repeat(16)}`;
  const { logger } = collectorLogger();
  const service = createRateLimitService({ config, memoryHashSecret: hashSecret, logger });
  const policy = RATE_LIMIT_POLICIES[options.policy];
  const subjectHash = await deriveSubjectHash(hashSecret, policy, options.subject);

  if (options.startAt) await waitUntilEpoch(options.startAt);

  const startedAt = performance.now();
  const decisions: ProbeRecord[] = [];

  if (options.concurrent) {
    const settled = await Promise.all(
      Array.from({ length: options.count }, (_, index) =>
        consumeOnce(service, options.policy, options.subject).then(({ decision, ms }) => ({
          index,
          decision,
          ms,
        })),
      ),
    );
    for (const { index, decision, ms } of settled) {
      decisions.push({
        i: index + 1,
        allowed: decision.allowed,
        remaining: decision.remaining,
        limit: decision.limit,
        retryAfterSeconds: decision.retryAfterSeconds,
        reason: decision.reason,
        degraded: decision.degraded,
        ms,
      });
    }
  } else {
    for (let index = 0; index < options.count; index += 1) {
      const { decision, ms } = await consumeOnce(service, options.policy, options.subject);
      decisions.push({
        i: index + 1,
        allowed: decision.allowed,
        remaining: decision.remaining,
        limit: decision.limit,
        retryAfterSeconds: decision.retryAfterSeconds,
        reason: decision.reason,
        degraded: decision.degraded,
        ms,
      });
    }
  }

  const allowed = decisions.filter((entry) => entry.allowed).length;
  const firstBlocked = decisions.find((entry) => !entry.allowed);
  return {
    mode: "probe",
    label: options.label,
    pid: process.pid,
    driver: config.driver,
    policy: options.policy,
    subjectHashPrefix: shortHash(subjectHash),
    requested: options.count,
    allowed,
    blocked: decisions.length - allowed,
    firstBlockedAt: firstBlocked?.i ?? null,
    durationMs: Number((performance.now() - startedAt).toFixed(1)),
    decisions,
  };
}

async function spawnProbe(
  args: readonly string[],
): Promise<{ summary: ProbeSummary; stderr: string }> {
  const child = Bun.spawn({
    cmd: [process.execPath, SELF, "probe", ...args],
    cwd: ROOT,
    env: { ...process.env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  await child.exited;
  const line = stdout.split(/\r?\n/).find((entry) => entry.startsWith("PROBE_JSON "));
  if (!line) {
    throw new Error(`probe ${args.join(" ")} produced no summary. stderr: ${stderr.slice(-400)}`);
  }
  return { summary: JSON.parse(line.slice("PROBE_JSON ".length)) as ProbeSummary, stderr };
}

function probeArgs(input: {
  label: string;
  policy: string;
  subject: string;
  count: number;
  concurrent?: boolean;
  startAt?: number;
  driver?: string;
  mock?: { url: string; token: string; secret: string };
}): string[] {
  const args = [
    `--label=${input.label}`,
    `--policy=${input.policy}`,
    `--subject=${input.subject}`,
    `--count=${String(input.count)}`,
  ];
  if (input.concurrent) args.push("--concurrent");
  if (input.startAt) args.push(`--startAt=${String(input.startAt)}`);
  if (input.driver) args.push(`--driver=${input.driver}`);
  if (input.mock) {
    args.push(
      `--mockUrl=${input.mock.url}`,
      `--mockToken=${input.mock.token}`,
      `--mockSecret=${input.mock.secret}`,
    );
  }
  return args;
}

/**
 * Harness self-test endpoint. It implements only the REST subset this limiter uses, with the same
 * atomic increment + TTL semantics, so the two-process plumbing can be verified before a real
 * Upstash database exists. This is never reachable from application code.
 */
function startMockProvider(): { port: number; stop: () => void } {
  const store = new Map<string, { count: number; expiresAt: number }>();
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      if (request.method !== "POST") return new Response("{}", { status: 405 });
      const body = (await request.json().catch(() => null)) as unknown;
      if (!Array.isArray(body)) return new Response(JSON.stringify({ error: "bad command" }));
      const [command, ...args] = body as [string, ...unknown[]];
      const now = Date.now();
      const bucket = args[2] === undefined ? undefined : store.get(String(args[2]));
      if (bucket && bucket.expiresAt <= now) store.delete(String(args[2]));

      switch (command) {
        case "PING":
          return Response.json({ result: "PONG" });
        case "EVAL": {
          const key = String(args[2]);
          const windowMs = Number(args[3]);
          const current = store.get(key) ?? { count: 0, expiresAt: now + windowMs };
          current.count += 1;
          store.set(key, current);
          return Response.json({ result: [current.count, Math.max(0, current.expiresAt - now)] });
        }
        case "GET": {
          const entry = store.get(String(args[0]));
          return Response.json({ result: entry ? String(entry.count) : null });
        }
        case "PTTL": {
          const entry = store.get(String(args[0]));
          return Response.json({ result: entry ? Math.max(0, entry.expiresAt - now) : -2 });
        }
        case "DEL": {
          const deleted = store.delete(String(args[0])) ? 1 : 0;
          return Response.json({ result: deleted });
        }
        default:
          return Response.json({ error: `unsupported ${command}` }, { status: 400 });
      }
    },
  });
  return { port: server.port ?? 0, stop: () => server.stop(true) };
}

/* ---------------------------------------------------------------------------------------------
 * check
 * ------------------------------------------------------------------------------------------- */
async function modeCheck(): Promise<void> {
  heading("Configuration (names and states only)");
  const config = readRateLimitConfig();
  const names = [
    "RATE_LIMIT_DRIVER",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_HASH_SECRET",
  ] as const;

  for (const name of names) {
    const value = process.env[name];
    const present = typeof value === "string" && value.trim().length > 0;
    const rejected =
      config.driver === "misconfigured" && config.problems.includes(name)
        ? " rejected-by-config"
        : "";
    note(`  ${name.padEnd(26)} present=${present ? "yes" : "no"}${rejected}`);
  }
  note(`  selected driver            ${config.driver}`);
  if (config.driver === "misconfigured") {
    note(`  configuration problems     ${config.problems.join(", ")}`);
  }
  note(`  data mode                  ${process.env.VITE_DATA_MODE ?? "(unset)"}`);
  note(`  server-only variables      never prefixed with VITE_ (client cannot read them)`);

  try {
    const { inspectIntegrations } = await import("../src/server/integrations/health.server");
    const report = inspectIntegrations();
    const rateLimit = report.integrations.find((entry) => entry.name === "rate-limit");
    note(
      `  app integration report     state=${rateLimit?.state ?? "unknown"} missing=${
        rateLimit && rateLimit.missingVariables.length > 0
          ? rateLimit.missingVariables.join(",")
          : "none"
      }`,
    );
    evidence.health = { state: rateLimit?.state, missing: rateLimit?.missingVariables };
  } catch (error) {
    note(`  app integration report     unavailable (${(error as Error).message})`);
  }

  record(
    "check.selection",
    config.driver !== "misconfigured",
    config.driver === "memory"
      ? "memory driver is selected (local mode only, per process)"
      : config.driver === "upstash"
        ? "upstash driver is fully configured"
        : `incomplete selection, reported as misconfigured: ${config.problems.join(", ")}`,
  );

  if (config.driver === "upstash") {
    const ping = await rest({ url: config.url, token: config.token }, ["PING"]);
    const pong = payloadResult(ping.payload) === "PONG";
    record(
      "check.provider-reachable",
      ping.status === 200 && pong,
      `HTTP ${ping.status}, ${ping.ms}ms`,
    );
    evidence.ping = ping;
  } else {
    note("  provider probe             skipped (driver is not upstash)");
  }
}

async function modeProbe(flags: Map<string, string>): Promise<void> {
  const mockUrl = flags.get("mockUrl");
  const config: RateLimitConfig | undefined = mockUrl
    ? {
        driver: "upstash",
        url: mockUrl.replace(/\/$/, ""),
        token: flags.get("mockToken") ?? "mock-rest-token",
        hashSecret: flags.get("mockSecret") ?? "mock-hmac-secret-0123456789",
      }
    : undefined;
  const summary = await runProbe({
    label: flags.get("label") ?? "probe",
    policy: (flags.get("policy") ?? "login") as RateLimitPolicyName,
    subject: flags.get("subject") ?? syntheticSubject(),
    count: Number(flags.get("count") ?? "12"),
    concurrent: flags.has("concurrent"),
    startAt: flags.has("startAt") ? Number(flags.get("startAt")) : undefined,
    driver: flags.get("driver") === "memory" ? "memory" : undefined,
    config,
  });
  process.stdout.write(`PROBE_JSON ${JSON.stringify(summary)}\n`);
}

/* ---------------------------------------------------------------------------------------------
 * pair: two OS processes, one subject, plus a cold start and a memory control
 * ------------------------------------------------------------------------------------------- */
async function modePair(flags: Map<string, string>): Promise<void> {
  if (flags.has("mock")) {
    const mock = startMockProvider();
    const config = {
      driver: "upstash" as const,
      url: `http://127.0.0.1:${mock.port}`,
      token: "mock-rest-token",
      hashSecret: "mock-hmac-secret-0123456789",
    };
    note("HARNESS SELF-TEST — local mock endpoint. This validates the harness, not Upstash.");
    try {
      await pairWith(
        config,
        { url: config.url, token: config.token, secret: config.hashSecret },
        "mock",
      );
    } finally {
      mock.stop();
    }
    return;
  }

  const config = readRateLimitConfig();
  if (config.driver !== "upstash") {
    note("pair proof needs RATE_LIMIT_DRIVER=upstash with a complete configuration.");
    record("pair.configured", false, `driver=${config.driver}; nothing shared to prove`);
    return;
  }
  await pairWith(config, undefined, "upstash");
}

async function pairWith(
  config: RestConfig & { hashSecret: string },
  mock: { url: string; token: string; secret: string } | undefined,
  endpoint: "upstash" | "mock",
): Promise<void> {
  const policy: RateLimitPolicyName = "login";
  const limit = RATE_LIMIT_POLICIES.login.limit;
  const subject = syntheticSubject();
  const hashSecret = config.hashSecret;
  const key = `rl:${policy}:${await deriveSubjectHash(
    hashSecret,
    RATE_LIMIT_POLICIES.login,
    subject,
  )}`;
  note(`subject (synthetic)  ${subject}`);
  note(`bucket key          rl:${policy}:${shortHash(key.slice(policy.length + 4))}`);
  note(
    `documented policy   ${policy} = ${limit} per ${RATE_LIMIT_POLICIES.login.windowMs / 60_000} min`,
  );
  note("");

  /* 1. two separate processes, 12 concurrent calls each, one shared bucket */
  const startAt = Date.now() + 1_200;
  note("Launching instance A and instance B as separate OS processes…");
  const [a, b] = await Promise.all([
    spawnProbe(
      probeArgs({ label: "A", policy, subject, count: 12, concurrent: true, startAt, mock }),
    ),
    spawnProbe(
      probeArgs({ label: "B", policy, subject, count: 12, concurrent: true, startAt, mock }),
    ),
  ]);
  const summaryA = a.summary;
  const summaryB = b.summary;
  const totalAllowed = summaryA.allowed + summaryB.allowed;
  const totalBlocked = summaryA.blocked + summaryB.blocked;
  note(
    `  instance A  pid=${summaryA.pid}  allowed=${summaryA.allowed}/12  blocked=${summaryA.blocked}`,
  );
  note(
    `  instance B  pid=${summaryB.pid}  allowed=${summaryB.allowed}/12  blocked=${summaryB.blocked}`,
  );
  note(`  combined    allowed=${totalAllowed}/24  blocked=${totalBlocked}`);

  record(
    "pair.separate-processes",
    summaryA.pid !== summaryB.pid,
    `pids ${summaryA.pid} and ${summaryB.pid}`,
  );
  record(
    "pair.shared-limit",
    totalAllowed === limit && totalBlocked === 24 - limit,
    `exactly ${limit} allowed across 24 concurrent requests from two instances`,
  );

  /* 2. the provider itself holds the counter */
  const counter = await rest(config, ["GET", key]);
  const ttl = await rest(config, ["PTTL", key]);
  const providerCount = Number(payloadResult(counter.payload));
  const providerTtl = Number(payloadResult(ttl.payload));
  note(`  provider counter    count=${providerCount}  ttlMs=${providerTtl}`);
  record(
    "pair.provider-counter",
    providerCount === 24,
    "all 24 requests from both instances incremented one key inside the provider",
  );
  record(
    "pair.window-ttl",
    Number.isFinite(providerTtl) &&
      providerTtl > 0 &&
      providerTtl <= RATE_LIMIT_POLICIES.login.windowMs,
    `key expires within the documented 15-minute window (${providerTtl}ms remaining)`,
  );

  /* 3. cold start: a brand-new process with zero local state is already limited */
  note("");
  note("Cold start: a third process starts fresh and tries 5 more times…");
  const cold = await spawnProbe(probeArgs({ label: "C", policy, subject, count: 5, mock }));
  note(
    `  instance C  pid=${cold.summary.pid}  allowed=${cold.summary.allowed}/5  firstBlockedAt=${cold.summary.firstBlockedAt}`,
  );
  record(
    "pair.cold-start",
    cold.summary.allowed === 0 &&
      cold.summary.pid !== summaryA.pid &&
      cold.summary.pid !== summaryB.pid,
    "a fresh process inherits the shared limit with no local memory",
  );

  /* 4. control: the same two-process experiment on the memory driver is NOT shared */
  note("");
  note(
    "Control (test instrument only, not app behaviour): same two-process run with driver=memory…",
  );
  const controlSubject = syntheticSubject();
  const controlStart = Date.now() + 900;
  const [m1, m2] = await Promise.all([
    spawnProbe(
      probeArgs({
        label: "M1",
        policy,
        subject: controlSubject,
        count: 12,
        concurrent: true,
        startAt: controlStart,
        driver: "memory",
      }),
    ),
    spawnProbe(
      probeArgs({
        label: "M2",
        policy,
        subject: controlSubject,
        count: 12,
        concurrent: true,
        startAt: controlStart,
        driver: "memory",
      }),
    ),
  ]);
  const controlAllowed = m1.summary.allowed + m2.summary.allowed;
  note(`  memory control  allowed=${controlAllowed}/24 (each process keeps its own buckets)`);
  record(
    "pair.memory-is-not-shared",
    controlAllowed === 24,
    "without the provider both processes admit all 24, so the 20/24 result is genuinely shared",
  );

  evidence.pair = {
    endpoint,
    subjectHashPrefix: summaryA.subjectHashPrefix,
    instanceA: summaryA,
    instanceB: summaryB,
    coldStart: cold.summary,
    memoryControl: { allowed: controlAllowed, a: m1.summary.allowed, b: m2.summary.allowed },
    provider: { count: providerCount, ttlMs: providerTtl, keyPrefix: key.slice(0, 12) },
  };

  /* 5. leave no test state behind */
  if (subject.includes("@rate-limit-proof.test")) {
    await rest(config, ["DEL", key]);
    note("  test key deleted from the provider");
  }
}

/* ---------------------------------------------------------------------------------------------
 * failure: the documented failure modes
 * ------------------------------------------------------------------------------------------- */
async function modeFailure(): Promise<void> {
  const live = readRateLimitConfig();
  const secret = live.driver === "upstash" ? live.hashSecret : "proof-only-hmac-secret-0000000";

  heading("A. Selected driver with a missing variable");
  const incomplete = readRateLimitConfig({
    ...process.env,
    RATE_LIMIT_DRIVER: "upstash",
    UPSTASH_REDIS_REST_TOKEN: undefined,
  });
  note(
    `  config result: ${incomplete.driver}${incomplete.driver === "misconfigured" ? ` (${incomplete.problems.join(", ")})` : ""}`,
  );
  record(
    "failure.misconfigured-reported",
    incomplete.driver === "misconfigured" &&
      incomplete.problems.includes("UPSTASH_REDIS_REST_TOKEN"),
    "reported as misconfigured with the variable name only, no value",
  );

  const { events, logger } = collectorLogger();
  const misconfiguredService = createRateLimitService({
    config: incomplete,
    memoryHashSecret: secret,
    logger,
  });
  const authDecisions: RateLimitDecision[] = [];
  for (let index = 0; index < 12; index += 1) {
    authDecisions.push(
      await misconfiguredService.consume("login", "learner@rate-limit-proof.test"),
    );
  }
  const emergencyAllowance = Math.max(1, Math.floor(RATE_LIMIT_POLICIES.login.limit / 2));
  const allowedBeforeBlock = authDecisions.filter((decision) => decision.allowed).length;
  note(
    `  login attempts: ${allowedBeforeBlock} allowed, then ${authDecisions.length - allowedBeforeBlock} blocked`,
  );
  note(
    `  first block: reason=${authDecisions[emergencyAllowance]?.reason} degraded=${authDecisions[emergencyAllowance]?.degraded}`,
  );
  record(
    "failure.auth-fail-closed",
    allowedBeforeBlock === emergencyAllowance &&
      authDecisions[emergencyAllowance]?.allowed === false &&
      authDecisions[emergencyAllowance]?.reason === "unavailable",
    `auth admits the documented emergency allowance (floor(20/2)=${emergencyAllowance}) then refuses`,
  );
  record(
    "failure.no-memory-fallback",
    allowedBeforeBlock === emergencyAllowance,
    "a silent memory fallback would have admitted all 12; it did not",
  );
  record(
    "failure.logged-once",
    events.some((entry) => entry.event === "rate_limit_configuration_invalid") &&
      events.some((entry) => entry.event === "rate_limit_provider_failed"),
    "logs carry event names and policy names, never the subject",
  );
  record(
    "failure.logs-hold-no-subject",
    !JSON.stringify(events).includes("learner@"),
    "no raw email address appears in the log payloads",
  );

  // Exercise the real mapping the service call sites use, not a hand-built error.
  const blockedDecision = authDecisions[emergencyAllowance];
  let thrown: unknown;
  try {
    assertRateLimit(blockedDecision, "Please wait before trying again.");
  } catch (error) {
    thrown = error;
  }
  record(
    "failure.safe-error-code",
    thrown instanceof PublicAppError && thrown.code === "UNAVAILABLE",
    "assertRateLimit turns the unavailable decision into PublicAppError(UNAVAILABLE)",
  );

  // The envelope that converts that code to an HTTP status is server-only code.
  const errorSource = readFileSync(path.join(ROOT, "src/server/http/errors.server.ts"), "utf8");
  record(
    "failure.safe-503-envelope",
    /UNAVAILABLE:\s*503/.test(errorSource) &&
      /Math\.min\(300, retryAfterSeconds\)/.test(errorSource),
    "the safe error envelope maps UNAVAILABLE to 503 and clamps Retry-After to 1–300s",
  );

  const learningDecisions: RateLimitDecision[] = [];
  for (const policy of ["lesson-complete", "course-enrol", "community-join"] as const) {
    learningDecisions.push(await misconfiguredService.consume(policy, "proof-user-identity"));
  }
  record(
    "failure.learning-fail-open",
    learningDecisions.every((decision) => decision.allowed && decision.degraded),
    "lesson-complete, course-enrol and community-join stay allowed and flagged degraded",
  );

  heading("B. An unknown driver is never treated as memory");
  const unknown = readRateLimitConfig({ ...process.env, RATE_LIMIT_DRIVER: "redis" });
  record(
    "failure.unknown-driver",
    unknown.driver === "misconfigured" && unknown.problems.includes("RATE_LIMIT_DRIVER"),
    "unrecognised selection is reported as misconfigured",
  );

  heading("C. Real provider rejection (invalid credential, real endpoint)");
  if (live.driver !== "upstash") {
    note("  skipped: no live Upstash configuration yet");
  } else {
    const rejected = createRateLimitService({
      config: {
        driver: "upstash",
        url: live.url,
        token: "invalid-proof-token-not-a-credential",
        hashSecret: live.hashSecret,
      },
      memoryHashSecret: live.hashSecret,
      logger: () => {},
    });
    const decisions: RateLimitDecision[] = [];
    for (let index = 0; index < 6; index += 1) {
      decisions.push(await rejected.consume("signup", "learner@rate-limit-proof.test"));
    }
    const allowed = decisions.filter((decision) => decision.allowed).length;
    const blocked = decisions.filter((decision) => decision.reason === "unavailable").length;
    record(
      "failure.real-provider-401",
      allowed === Math.floor(RATE_LIMIT_POLICIES.signup.limit / 2) && blocked > 0,
      `the real endpoint rejects the credential; auth policy still closes after ${allowed} emergency requests`,
    );
    const learning = await rejected.consume("lesson-complete", "proof-user-identity");
    record(
      "failure.real-provider-401-fail-open",
      learning.allowed && learning.degraded === true,
      "learning writes stay allowed while the provider is failing",
    );
  }
}

/* ---------------------------------------------------------------------------------------------
 * latency
 * ------------------------------------------------------------------------------------------- */
async function modeLatency(): Promise<void> {
  const config = readRateLimitConfig();
  const rounds = Number(process.env.PROOF_LATENCY_ROUNDS ?? "30");
  const subject = syntheticSubject();

  heading(`Latency (${rounds} limiter calls, one process, this machine's network)`);

  const memoryService = createRateLimitService({
    config: { driver: "memory" },
    memoryHashSecret: "proof-latency-secret-0000",
    logger: () => {},
  });
  const memoryTimes: number[] = [];
  for (let index = 0; index < rounds; index += 1) {
    memoryTimes.push((await consumeOnce(memoryService, "login", subject)).ms);
  }
  const memory = numbers(memoryTimes);
  note(`  memory driver   p50=${memory.p50}ms  p95=${memory.p95}ms  max=${memory.max}ms`);

  if (config.driver === "upstash") {
    const pings: number[] = [];
    for (let index = 0; index < Math.min(rounds, 20); index += 1) {
      const ping = await rest({ url: config.url, token: config.token }, ["PING"]);
      if (ping.status === 200) pings.push(ping.ms);
    }
    const pingStats = numbers(pings);
    note(
      `  bare PING       p50=${pingStats.p50}ms  p95=${pingStats.p95}ms  max=${pingStats.max}ms`,
    );

    const service = createRateLimitService({ config, logger: () => {} });
    await consumeOnce(service, "login", subject);
    const upstashTimes: number[] = [];
    for (let index = 0; index < rounds; index += 1) {
      upstashTimes.push((await consumeOnce(service, "login", subject)).ms);
    }
    const upstash = numbers(upstashTimes);
    note(`  limiter (EVAL)  p50=${upstash.p50}ms  p95=${upstash.p95}ms  max=${upstash.max}ms`);
    note(`  overhead over bare PING at p50: ${(upstash.p50 - pingStats.p50).toFixed(1)}ms`);
    record(
      "latency.upstash-measured",
      upstash.p95 > 0,
      `p50 ${upstash.p50}ms / p95 ${upstash.p95}ms per limited request from this machine`,
    );
    evidence.latency = { memory, ping: pingStats, upstash };

    const hash = await deriveSubjectHash(config.hashSecret, RATE_LIMIT_POLICIES.login, subject);
    await rest({ url: config.url, token: config.token }, ["DEL", `rl:login:${hash}`]);
    note("  latency test key deleted from Upstash");
  } else {
    note("  upstash limiter latency skipped (driver is not upstash)");
    evidence.latency = { memory, upstash: memorySample() };
  }
}

/* ---------------------------------------------------------------------------------------------
 * bundle: no secret reaches the browser
 * ------------------------------------------------------------------------------------------- */
function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const target = path.join(directory, entry);
    return statSync(target).isDirectory() ? walkFiles(target) : [target];
  });
}

async function modeBundle(): Promise<void> {
  heading("Client bundle boundary");
  const assets = path.join(ROOT, ".output", "public");
  if (!existsSync(assets)) {
    note("  skipped: .output/public is missing (run `bun run build`)");
    return;
  }
  const files = walkFiles(assets).filter((file) => /\.(?:js|mjs|html|css)$/.test(file));
  const contents = files.map((file) => ({ file, text: readFileSync(file, "utf8") }));
  note(`  scanned ${contents.length} client files under .output/public`);

  const secrets = [
    ["UPSTASH_REDIS_REST_URL value", process.env.UPSTASH_REDIS_REST_URL],
    ["UPSTASH_REDIS_REST_TOKEN value", process.env.UPSTASH_REDIS_REST_TOKEN],
    ["RATE_LIMIT_HASH_SECRET value", process.env.RATE_LIMIT_HASH_SECRET],
  ] as const;

  for (const [label, value] of secrets) {
    const present = typeof value === "string" && value.trim().length > 0;
    if (!present) {
      note(`  ${label.padEnd(32)} not set, nothing to leak`);
      continue;
    }
    const hits = contents.filter((entry) => entry.text.includes(value)).length;
    record(
      `bundle.absent:${label.split(" ")[0]}`,
      hits === 0,
      `${hits} client file(s) contain the value`,
    );
  }

  for (const marker of ["UPSTASH_REDIS_REST_TOKEN", "RATE_LIMIT_HASH_SECRET", "upstash.io"]) {
    const hits = contents.filter((entry) => entry.text.includes(marker)).length;
    record(`bundle.marker:${marker}`, hits === 0, `${hits} client file(s) mention it`);
  }
}

/* ---------------------------------------------------------------------------------------------
 * entry
 * ------------------------------------------------------------------------------------------- */
async function modeProve(): Promise<void> {
  const startedAt = new Date().toISOString();
  await modeCheck();
  let driver: RateLimitConfig["driver"] = "memory";
  try {
    driver = readRateLimitConfig().driver;
  } catch {
    // keep the default for the summary
  }
  if (driver === "upstash") {
    await modePair(new Map());
  } else {
    heading("Cross-instance proof");
    record(
      "pair.configured",
      false,
      "RATE_LIMIT_DRIVER is not upstash; add the provider variables first",
    );
  }
  await modeFailure();
  await modeLatency();
  await modeBundle();

  const failed = results.filter((entry) => !entry.ok);
  heading("Summary");
  for (const entry of results) {
    note(`  ${entry.ok ? "PASS" : "FAIL"}  ${entry.id}`);
  }
  note(`\n  ${results.length - failed.length}/${results.length} checks passed`);

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const artifact = path.join(ARTIFACT_DIR, `proof-${startedAt.replaceAll(":", "-")}.json`);
  writeFileSync(
    artifact,
    `${JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), driver, results, evidence }, null, 2)}\n`,
    "utf8",
  );
  note(`  evidence written to ${path.relative(ROOT, artifact)}`);
  if (failed.length > 0) process.exitCode = 1;
}

async function main(): Promise<void> {
  const [mode = "check", ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  switch (mode) {
    case "check":
      return modeCheck();
    case "probe":
      return modeProbe(flags);
    case "pair":
      return modePair(flags);
    case "failure":
      return modeFailure();
    case "latency":
      return modeLatency();
    case "bundle":
      return modeBundle();
    case "prove":
      return modeProve();
    default:
      note(
        [
          "usage: bun scripts/rate-limit-upstash-proof.ts <mode>",
          "  check     configuration presence, driver state, provider reachability",
          "  pair      two-process shared-limit proof, cold start, memory control",
          "  failure   misconfiguration, fail-closed and fail-open evidence",
          "  latency   provider and limiter latency percentiles",
          "  bundle    scan the built client bundle for leaked values (booleans only)",
          "  prove     all of the above, writes .audit/p4-s2-upstash/*.json",
        ].join("\n"),
      );
  }
}

await main();
