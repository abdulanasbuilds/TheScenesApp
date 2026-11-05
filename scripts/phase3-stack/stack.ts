/**
 * Orchestration for the Phase 3 local Supabase stack wrapper.
 *
 * The side-effecting operations (CLI spawn, Docker/OS queries, config read,
 * console) are supplied through a `StackRuntime` so the start/status/stop logic
 * — including failure cleanup and redaction — can be unit tested without Docker.
 */

import type { ChildEnvResult, CliResult } from "./cli.ts";
import { createRedactor } from "./redact.ts";
import { extractStatus, parseCliJson, statusPorts, type StackStatus } from "./status.ts";
import { describeListener, evaluateIsolation, type Listener } from "./listeners.ts";
import { findDisabledServiceContainers, verifyDisabledServices } from "./config.ts";
import { containersToListeners, type DockerContainer } from "./docker.ts";
import { emitGithubMasks } from "./ci.ts";
import { LOOPBACK_NETWORK_NAME, type LoopbackNetwork } from "./network.ts";
import {
  LOCAL_PROJECT_ID,
  assertAllowedCliArgs,
  assertLocalProjectId,
  assertLoopbackHttpUrl,
} from "./guard.ts";

export interface StackRuntime {
  cwd: string;
  runSupabase(args: readonly string[], env: NodeJS.ProcessEnv): CliResult;
  buildChildEnv(): ChildEnvResult;
  assertBinaryAvailable(): void;
  /**
   * Ensures the loopback-bound Docker network exists (idempotent), so the stack
   * publishes ports on 127.0.0.1 instead of 0.0.0.0/:: on every start path.
   */
  ensureLoopbackNetwork(): LoopbackNetwork;
  listProjectContainers(projectId: string): DockerContainer[];
  listHostListeners(ports: readonly number[]): Listener[];
  readConfig(): string;
  cliVersion(): string;
  lockedVersion(): string;
  /** Waits before retrying a transient CLI status failure. */
  sleep(ms: number): void;
  out(text: string): void;
  err(text: string): void;
}

export interface Options {
  command: "start" | "status" | "stop";
  json: boolean;
  withDbUrl: boolean;
  githubMask: boolean;
}

export function parseOptions(argv: readonly string[]): Options {
  const [rawCommand, ...rest] = argv;
  const command = assertAllowedCliArgs([rawCommand ?? ""]);
  let json = false;
  let withDbUrl = false;
  let githubMask = false;
  for (const arg of rest) {
    if (arg === "--json") json = true;
    else if (arg === "--with-db-url") withDbUrl = true;
    else if (arg === "--github-mask") githubMask = true;
    else throw new Error(`unknown option "${arg}"`);
  }
  return { command, json, withDbUrl, githubMask };
}

function secretLiterals(status: StackStatus, pairs: Record<string, string>): string[] {
  return status.secretFieldsPresent
    .map((key) => pairs[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

const STATUS_ATTEMPTS = 6;
const STATUS_RETRY_DELAY_MS = 2_000;
const TRANSIENT_STATUS_FAILURE =
  /(?:is not ready|still starting|health check|not healthy|container is starting)/i;

/**
 * `supabase status` can race a container health check immediately after a cold
 * start. Retry only recognised readiness failures; real errors fail at once.
 */
function runStatusCommand(runtime: StackRuntime, env: NodeJS.ProcessEnv): CliResult {
  const args = ["status", "-o", "json", "--workdir", runtime.cwd];
  let result = runtime.runSupabase(args, env);
  for (let attempt = 1; attempt < STATUS_ATTEMPTS && result.code !== 0; attempt += 1) {
    if (!TRANSIENT_STATUS_FAILURE.test(`${result.stderr}\n${result.stdout}`)) return result;
    runtime.sleep(STATUS_RETRY_DELAY_MS);
    result = runtime.runSupabase(args, env);
  }
  return result;
}

interface Collected {
  containers: DockerContainer[];
  listeners: Listener[];
  problems: string[];
  disabledStates: Record<string, boolean | null>;
  detail: string;
}

function collectIsolation(runtime: StackRuntime, status: StackStatus): Collected {
  const problems: string[] = [];
  const containers = runtime.listProjectContainers(LOCAL_PROJECT_ID);
  const dockerListeners = containersToListeners(containers);
  const hostListeners = runtime.listHostListeners(statusPorts(status));
  const listeners = [...dockerListeners, ...hostListeners];

  const gate = evaluateIsolation(listeners);
  if (listeners.length === 0) {
    problems.push("no enabled listeners were detected; isolation cannot be proven");
  }
  for (const listener of gate.offenders) {
    problems.push(`non-loopback listener: ${describeListener(listener)}`);
  }
  for (const listener of gate.unknown) {
    problems.push(`unclassifiable listener: ${describeListener(listener)}`);
  }

  const disabled = verifyDisabledServices(runtime.readConfig());
  if (!disabled.ok) {
    problems.push(`services not disabled in config: ${disabled.offenders.join(", ")}`);
  }
  const disabledContainers = findDisabledServiceContainers(containers.map((c) => c.name));
  for (const offender of disabledContainers) {
    problems.push(`disabled service container is running: ${offender}`);
  }

  return {
    containers,
    listeners,
    problems,
    disabledStates: disabled.states,
    detail: "",
  };
}

function summaryPayload(
  runtime: StackRuntime,
  status: StackStatus,
  collected: Collected,
  options: Options,
): Record<string, unknown> {
  const childEnv: Record<string, string> = {};
  if (status.apiUrl) childEnv.VITE_SUPABASE_URL = status.apiUrl;
  if (status.publishableKey) childEnv.VITE_SUPABASE_PUBLISHABLE_KEY = status.publishableKey;
  if (options.withDbUrl && status.dbUrl) childEnv.PHASE3_LOCAL_DB_URL = status.dbUrl;

  return {
    project: LOCAL_PROJECT_ID,
    cliVersion: runtime.cliVersion(),
    lockedVersion: runtime.lockedVersion(),
    loopbackNetwork: LOOPBACK_NETWORK_NAME,
    apiUrl: status.apiUrl,
    publishableKeyPresent: Boolean(status.publishableKey),
    dbUrlPresent: Boolean(status.dbUrl),
    secretFieldsPresent: status.secretFieldsPresent,
    services: collected.containers.map((c) => c.name).sort(),
    listeners: collected.listeners.map((l) => ({
      service: l.service,
      host: l.host,
      port: l.port,
      source: l.source,
    })),
    disabledServices: collected.disabledStates,
    isolated: collected.problems.length === 0,
    problems: collected.problems,
    childEnv,
  };
}

function printHuman(
  runtime: StackRuntime,
  payload: Record<string, unknown>,
  redact: (s: string) => string,
): void {
  const lines: string[] = [];
  lines.push(`project: ${payload.project}`);
  lines.push(`supabase CLI: ${payload.cliVersion} (locked: ${payload.lockedVersion})`);
  lines.push(`loopback network: ${payload.loopbackNetwork}`);
  if (payload.apiUrl) lines.push(`api url: ${payload.apiUrl}`);
  lines.push(`publishable key present: ${payload.publishableKeyPresent}`);
  const listeners = payload.listeners as Listener[];
  lines.push(`listeners (${listeners.length}):`);
  for (const listener of listeners) lines.push(`  - ${describeListener(listener)}`);
  lines.push(`disabled services: ${JSON.stringify(payload.disabledServices)}`);
  lines.push(`isolated: ${payload.isolated}`);
  const problems = payload.problems as string[];
  if (problems.length > 0) {
    lines.push("problems:");
    for (const problem of problems) lines.push(`  - ${problem}`);
  }
  runtime.out(`${redact(lines.join("\n"))}\n`);
}

function reportCliFailure(
  runtime: StackRuntime,
  command: string,
  result: CliResult,
  redact: (s: string) => string,
): void {
  const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  runtime.err(`phase3:stack ${command} failed (exit ${result.code}).\n${redact(detail)}\n`);
}

/** Stops only the wrapper-owned local project. Never `--all`. Never throws. */
export function safeStop(
  runtime: StackRuntime,
  env: NodeJS.ProcessEnv,
  redact: (s: string) => string,
): void {
  try {
    const args = ["stop", "--workdir", runtime.cwd, "--project-id", LOCAL_PROJECT_ID];
    assertAllowedCliArgs(args);
    const result = runtime.runSupabase(args, env);
    if (result.code !== 0) {
      runtime.err(
        `phase3:stack stop after failure returned exit ${result.code}.\n${redact(result.stderr)}\n`,
      );
    } else {
      runtime.err("phase3:stack stopped the local project after a failed isolation gate.\n");
    }
  } catch (error) {
    runtime.err(`phase3:stack could not stop the stack automatically: ${redact(String(error))}\n`);
  }
}

export function runStart(runtime: StackRuntime, options: Options): number {
  const { env, stripped } = runtime.buildChildEnv();
  if (stripped.length > 0) {
    runtime.err(
      `phase3:stack removed hosted environment variables before start: ${stripped.join(", ")}\n`,
    );
  }

  let redact = createRedactor();

  // Bind published ports to loopback before the stack starts. Without this the
  // Supabase CLI publishes 0.0.0.0/:: bridges reachable from other machines.
  let network: LoopbackNetwork;
  try {
    network = runtime.ensureLoopbackNetwork();
  } catch (error) {
    runtime.err(`phase3:stack could not prepare the loopback network: ${redact(String(error))}\n`);
    return 1;
  }

  const startArgs = ["start", "--workdir", runtime.cwd, "--network-id", network.name];
  assertAllowedCliArgs(startArgs);

  const startResult = runtime.runSupabase(startArgs, env);
  if (startResult.code !== 0) {
    reportCliFailure(runtime, "start", startResult, redact);
    safeStop(runtime, env, redact);
    return 1;
  }

  const statusResult = runStatusCommand(runtime, env);
  if (statusResult.code !== 0) {
    reportCliFailure(runtime, "status", statusResult, redact);
    safeStop(runtime, env, redact);
    return 1;
  }

  let pairs: Record<string, string>;
  let status: StackStatus;
  try {
    pairs = parseCliJson(statusResult.stdout, "status");
    status = extractStatus(pairs);
  } catch (error) {
    runtime.err(`phase3:stack could not parse status output: ${redact(String(error))}\n`);
    safeStop(runtime, env, redact);
    return 1;
  }
  const startSecrets = secretLiterals(status, pairs);
  if (options.githubMask) emitGithubMasks(startSecrets, process.env, runtime.out);
  redact = createRedactor(startSecrets);

  try {
    if (!status.apiUrl) throw new Error("status did not report an API URL");
    assertLoopbackHttpUrl(status.apiUrl, "Supabase API URL");
    assertLocalProjectId(LOCAL_PROJECT_ID);
  } catch (error) {
    runtime.err(`phase3:stack rejected the stack target: ${redact(String(error))}\n`);
    safeStop(runtime, env, redact);
    return 1;
  }

  let collected: Collected;
  try {
    collected = collectIsolation(runtime, status);
  } catch (error) {
    runtime.err(`phase3:stack could not verify isolation: ${redact(String(error))}\n`);
    safeStop(runtime, env, redact);
    return 1;
  }

  const payload = summaryPayload(runtime, status, collected, options);
  if (options.json) runtime.out(`${redact(JSON.stringify(payload, null, 2))}\n`);
  else printHuman(runtime, payload, redact);

  if (collected.problems.length > 0) {
    runtime.err(
      "phase3:stack isolation gate FAILED. Stopping the local project. " +
        "No firewall/machine mutation was attempted.\n",
    );
    safeStop(runtime, env, redact);
    return 1;
  }
  return 0;
}

export function runStatus(runtime: StackRuntime, options: Options): number {
  const { env } = runtime.buildChildEnv();
  const statusResult = runStatusCommand(runtime, env);
  let redact = createRedactor();
  if (statusResult.code !== 0) {
    reportCliFailure(runtime, "status", statusResult, redact);
    return 1;
  }

  let pairs: Record<string, string>;
  let status: StackStatus;
  try {
    pairs = parseCliJson(statusResult.stdout, "status");
    status = extractStatus(pairs);
  } catch (error) {
    runtime.err(`phase3:stack could not parse status output: ${redact(String(error))}\n`);
    return 1;
  }
  const statusSecrets = secretLiterals(status, pairs);
  if (options.githubMask) emitGithubMasks(statusSecrets, process.env, runtime.out);
  redact = createRedactor(statusSecrets);

  const problems: string[] = [];
  try {
    if (status.apiUrl) assertLoopbackHttpUrl(status.apiUrl, "Supabase API URL");
  } catch (error) {
    problems.push(String(error));
  }

  let collected: Collected = {
    containers: [],
    listeners: [],
    problems: [],
    disabledStates: {},
    detail: "",
  };
  try {
    collected = collectIsolation(runtime, status);
  } catch (error) {
    problems.push(`could not verify isolation: ${redact(String(error))}`);
  }

  const allProblems = [...problems, ...collected.problems];
  const payload = summaryPayload(runtime, status, collected, options);
  payload.problems = allProblems;
  payload.isolated = allProblems.length === 0;

  if (options.json) runtime.out(`${redact(JSON.stringify(payload, null, 2))}\n`);
  else printHuman(runtime, payload, redact);
  return allProblems.length === 0 ? 0 : 1;
}

export function runStop(runtime: StackRuntime): number {
  const { env, stripped } = runtime.buildChildEnv();
  if (stripped.length > 0) {
    runtime.err(
      `phase3:stack removed hosted environment variables before stop: ${stripped.join(", ")}\n`,
    );
  }
  const args = ["stop", "--workdir", runtime.cwd, "--project-id", LOCAL_PROJECT_ID];
  assertAllowedCliArgs(args);
  const redact = createRedactor();
  const result = runtime.runSupabase(args, env);
  if (result.code !== 0) {
    reportCliFailure(runtime, "stop", result, redact);
    return 1;
  }
  runtime.out("phase3:stack stopped the local project (project-targeted; never --all).\n");
  return 0;
}

export function execute(argv: readonly string[], runtime: StackRuntime): number {
  let options: Options;
  try {
    options = parseOptions(argv);
  } catch (error) {
    runtime.err(`phase3:stack: ${(error as Error).message}\n`);
    runtime.err(
      "usage: phase3-stack <start|status|stop> [--json] [--with-db-url] [--github-mask]\n",
    );
    return 2;
  }
  try {
    runtime.assertBinaryAvailable();
  } catch (error) {
    runtime.err(`phase3:stack: ${(error as Error).message}\n`);
    return 1;
  }
  switch (options.command) {
    case "start":
      return runStart(runtime, options);
    case "status":
      return runStatus(runtime, options);
    case "stop":
      return runStop(runtime);
  }
}
