#!/usr/bin/env bun
/**
 * Phase 3 database gate wrapper: `reset` | `test` | `lint` | `types` | `fingerprint` | `gate`.
 *
 * Reuses the Phase 3 stack wrapper's guarantees:
 * - pinned `supabase@3.0.0` CLI resolution with `SUPABASE_TELEMETRY_DISABLED=1`;
 * - hosted credentials/targets stripped from the child environment;
 * - all CLI output captured in memory and printed only after redaction;
 * - every command is constructed with `--local` and rejects hosted flags.
 *
 * `gate` performs the Wave 1 sequence: reset, fingerprint, reset, fingerprint,
 * compare, pgTAP, database lint, and generated-type drift.
 *
 * Usage: phase3-db <reset|test|lint|types|fingerprint|gate> [--write]
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildChildEnv, runSupabase, type CliResult } from "./phase3-stack/cli.ts";
import { LOOPBACK_NETWORK_NAME } from "./phase3-stack/network.ts";
import { createRedactor } from "./phase3-stack/redact.ts";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(PROJECT_ROOT, "supabase", "config.toml");
const TYPES_PATH = path.join(PROJECT_ROOT, "db", "database.types.ts");

export const DB_COMMANDS = ["reset", "test", "lint", "types", "fingerprint", "gate"] as const;
export type DbCommand = (typeof DB_COMMANDS)[number];

export interface DbInvocation {
  command: DbCommand;
  write: boolean;
}

export class DbUsageError extends Error {
  override readonly name = "DbUsageError";
}

export function parseDbArgs(argv: readonly string[]): DbInvocation {
  const [command, ...rest] = argv;
  if (!command) {
    throw new DbUsageError(`expected one of: ${DB_COMMANDS.join(", ")}`);
  }
  if (!(DB_COMMANDS as readonly string[]).includes(command)) {
    throw new DbUsageError(
      `unknown command "${command}"; expected one of: ${DB_COMMANDS.join(", ")}`,
    );
  }
  const unknown = rest.filter((arg) => arg !== "--write");
  if (unknown.length > 0) {
    throw new DbUsageError(`unknown option(s): ${unknown.join(", ")}`);
  }
  const write = rest.includes("--write");
  if (write && command !== "types") {
    throw new DbUsageError("--write is only valid with `types`");
  }
  return { command: command as DbCommand, write };
}

/** CLI arguments for a single local-only command. */
export function cliArgsFor(command: Exclude<DbCommand, "fingerprint" | "gate">): string[] {
  const localNetworkArgs = ["--local", "--network-id", LOOPBACK_NETWORK_NAME];
  switch (command) {
    case "reset":
      return ["db", "reset", ...localNetworkArgs];
    case "test":
      return ["test", "db", ...localNetworkArgs];
    case "lint":
      return ["db", "lint", ...localNetworkArgs, "--level", "warning", "--fail-on", "error"];
    case "types":
      return ["gen", "types", "--lang", "typescript", "--schema", "public", "--local"];
  }
}

const HOSTED_FLAGS = ["--linked", "--project-ref", "--db-url", "--experimental"] as const;

/** Guards every child invocation against hosted targets. */
export function assertLocalOnly(args: readonly string[]): void {
  if (!args.includes("--local")) {
    throw new DbUsageError("refusing to run a database command without --local");
  }
  for (const arg of args) {
    for (const flag of HOSTED_FLAGS) {
      if (arg === flag || arg.startsWith(`${flag}=`)) {
        throw new DbUsageError(`refusing hosted flag ${flag}`);
      }
    }
  }
}

/** Normalises generated types for a stable comparison. */
export function normaliseGeneratedTypes(input: string): string {
  const withoutTrailingSpaces = input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
  return `${withoutTrailingSpaces.replace(/\s+$/, "")}\n`;
}

export function typesMatch(committed: string, generated: string): boolean {
  return normaliseGeneratedTypes(committed) === normaliseGeneratedTypes(generated);
}

/** Extracts the md5 fingerprint from psql output. */
export function parseFingerprint(raw: string): string {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const last = lines.at(-1) ?? "";
  if (!/^[0-9a-f]{32}$/.test(last)) {
    throw new Error("could not parse the semantic seed fingerprint");
  }
  return last;
}

/**
 * Deterministic semantic fingerprint of the committed seed. Auth rows are
 * restricted to the reserved `@catalogue.invalid` actors. The gate computes the
 * value immediately after each clean reset, before pgTAP or integration tests
 * create their own `.invalid` users, so test-created rows cannot affect it.
 */
export const FINGERPRINT_SQL = `
with doc as (
  select jsonb_build_object(
    'authUsers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'encrypted_password', u.encrypted_password,
        'email_confirmed_at', u.email_confirmed_at,
        'raw_app_meta_data', u.raw_app_meta_data,
        'raw_user_meta_data', u.raw_user_meta_data,
        'created_at', u.created_at,
        'updated_at', u.updated_at
      ) order by u.id), '[]'::jsonb)
      from auth.users u
      where u.email like '%@catalogue.invalid'
    ),
    'profiles', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.id), '[]'::jsonb) from public.profiles p
    ),
    'workspaces', (
      select coalesce(jsonb_agg(to_jsonb(w) order by w.id), '[]'::jsonb) from public.workspaces w
    ),
    'workspaceMemberships', (
      select coalesce(jsonb_agg(to_jsonb(m) order by m.id), '[]'::jsonb)
      from public.workspace_memberships m
    ),
    'categories', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb) from public.categories c
    ),
    'communities', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb) from public.communities c
    ),
    'communityCategories', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'community_id', cc.community_id,
        'category_id', cc.category_id,
        'is_primary', cc.is_primary
      ) order by cc.community_id, cc.category_id), '[]'::jsonb)
      from public.community_categories cc
    ),
    'communityMemberships', (
      select coalesce(jsonb_agg(to_jsonb(m) order by m.id), '[]'::jsonb)
      from public.community_memberships m
    ),
    'courses', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb) from public.courses c
    ),
    'courseOutcomes', (
      select coalesce(jsonb_agg(to_jsonb(o) order by o.id), '[]'::jsonb) from public.course_outcomes o
    ),
    'courseModules', (
      select coalesce(jsonb_agg(to_jsonb(m) order by m.id), '[]'::jsonb) from public.course_modules m
    ),
    'lessons', (
      select coalesce(jsonb_agg(to_jsonb(l) order by l.id), '[]'::jsonb) from public.lessons l
    ),
    'lessonContents', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.lesson_id), '[]'::jsonb)
      from public.lesson_contents c
    ),
    'lessonResources', (
      select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from public.lesson_resources r
    ),
    'courseEnrollments', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.id), '[]'::jsonb)
      from public.course_enrollments e
    ),
    'lessonCompletions', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb)
      from public.lesson_completions c
    ),
    'auditEvents', (
      select coalesce(jsonb_agg(to_jsonb(a) order by a.id), '[]'::jsonb)
      from private.audit_events a
    )
  ) as payload
)
select md5(payload::text) from doc;
`;

export interface DbRuntime {
  runCli(args: readonly string[]): CliResult;
  fingerprint(): string;
  readCommittedTypes(): string | null;
  writeCommittedTypes(content: string): void;
  out(text: string): void;
  err(text: string): void;
  redact(input: string): string;
}

function printResult(result: CliResult, runtime: DbRuntime): void {
  const stdout = runtime.redact(result.stdout);
  const stderr = runtime.redact(result.stderr);
  if (stdout) runtime.out(stdout.endsWith("\n") ? stdout : `${stdout}\n`);
  if (stderr) runtime.err(stderr.endsWith("\n") ? stderr : `${stderr}\n`);
}

function runStep(args: readonly string[], runtime: DbRuntime): number {
  assertLocalOnly(args);
  const result = runtime.runCli(args);
  printResult(result, runtime);
  return result.code;
}

function runTypes(invocation: DbInvocation, runtime: DbRuntime): number {
  const args = cliArgsFor("types");
  assertLocalOnly(args);
  const result = runtime.runCli(args);
  if (result.code !== 0) {
    printResult(result, runtime);
    return result.code;
  }

  const generated = runtime.redact(result.stdout);
  if (invocation.write) {
    mkdirSync(path.dirname(TYPES_PATH), { recursive: true });
    runtime.writeCommittedTypes(normaliseGeneratedTypes(generated));
    runtime.out("wrote db/database.types.ts\n");
    return 0;
  }

  const committed = runtime.readCommittedTypes();
  if (committed === null) {
    runtime.err(
      "db/database.types.ts is missing; run `bun run db:types:write` against the local stack\n",
    );
    return 1;
  }
  if (!typesMatch(committed, generated)) {
    runtime.err("generated database types do not match db/database.types.ts\n");
    return 1;
  }
  runtime.out("database types match db/database.types.ts\n");
  return 0;
}

function runGate(runtime: DbRuntime): number {
  const fail = (step: string, code: number): number => {
    runtime.err(`wave 1 database gate failed at ${step} (exit ${code})\n`);
    return 1;
  };

  let code = runStep(cliArgsFor("reset"), runtime);
  if (code !== 0) return fail("first reset", code);

  let first: string;
  try {
    first = runtime.fingerprint();
  } catch (error) {
    runtime.err(`${error instanceof Error ? error.message : "fingerprint failed"}\n`);
    return fail("first fingerprint", 1);
  }
  runtime.out(`seed fingerprint (reset 1): ${first}\n`);

  code = runStep(cliArgsFor("reset"), runtime);
  if (code !== 0) return fail("second reset", code);

  let second: string;
  try {
    second = runtime.fingerprint();
  } catch (error) {
    runtime.err(`${error instanceof Error ? error.message : "fingerprint failed"}\n`);
    return fail("second fingerprint", 1);
  }
  runtime.out(`seed fingerprint (reset 2): ${second}\n`);

  if (first !== second) {
    runtime.err("seed fingerprint mismatch across clean resets\n");
    return fail("fingerprint comparison", 1);
  }

  code = runStep(cliArgsFor("test"), runtime);
  if (code !== 0) return fail("pgTAP", code);

  code = runStep(cliArgsFor("lint"), runtime);
  if (code !== 0) return fail("database lint", code);

  code = runTypes({ command: "types", write: false }, runtime);
  if (code !== 0) return fail("generated-type drift", code);

  runtime.out("wave 1 database gate passed\n");
  return 0;
}

export function executeDb(invocation: DbInvocation, runtime: DbRuntime): number {
  switch (invocation.command) {
    case "reset":
    case "test":
    case "lint":
      return runStep(cliArgsFor(invocation.command), runtime);
    case "types":
      return runTypes(invocation, runtime);
    case "fingerprint":
      try {
        runtime.out(`${runtime.fingerprint()}\n`);
        return 0;
      } catch (error) {
        runtime.err(`${error instanceof Error ? error.message : "fingerprint failed"}\n`);
        return 1;
      }
    case "gate":
      return runGate(runtime);
    default:
      throw new DbUsageError(`unsupported command: ${String(invocation.command)}`);
  }
}

function readProjectId(): string {
  const config = readFileSync(CONFIG_PATH, "utf8");
  const match = /^\s*project_id\s*=\s*"([a-z0-9-]+)"\s*$/m.exec(config);
  if (!match?.[1]) {
    throw new Error("could not read project_id from supabase/config.toml");
  }
  return match[1];
}

/** Runs the fingerprint query inside the local stack's Postgres container. */
export function computeFingerprint(): string {
  const container = `supabase_db_${readProjectId()}`;
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      FINGERPRINT_SQL,
    ],
    {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error) {
    throw new Error(`failed to run docker exec: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `fingerprint query failed: ${createRedactor()(result.stderr ?? "").trim() || "unknown error"}`,
    );
  }
  return parseFingerprint(result.stdout ?? "");
}

function createRuntime(): DbRuntime {
  const redact = createRedactor();
  return {
    runCli: (args) => {
      assertLocalOnly(args);
      const { env } = buildChildEnv();
      return runSupabase(args, { cwd: PROJECT_ROOT, env });
    },
    fingerprint: () => computeFingerprint(),
    readCommittedTypes: () => (existsSync(TYPES_PATH) ? readFileSync(TYPES_PATH, "utf8") : null),
    writeCommittedTypes: (content) => {
      writeFileSync(TYPES_PATH, content, "utf8");
    },
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
    redact,
  };
}

if (import.meta.main) {
  try {
    const invocation = parseDbArgs(process.argv.slice(2));
    process.exit(executeDb(invocation, createRuntime()));
  } catch (error) {
    process.stderr.write(
      `phase3-db: ${error instanceof Error ? error.message : "unknown error"}\n`,
    );
    process.exit(1);
  }
}
