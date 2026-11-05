/**
 * Resolves and runs the pinned Supabase CLI (`supabase@3.0.0`) with a sanitised
 * environment and fully captured output.
 *
 * Guarantees:
 * - telemetry is disabled per process (`SUPABASE_TELEMETRY_DISABLED=1`);
 * - hosted credential/target variables are stripped from the child env;
 * - stdout/stderr are captured in memory and never inherited, so nothing is
 *   printed or persisted by the CLI itself.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const PLATFORM_MAP: Record<string, Record<string, string[]>> = {
  darwin: { arm64: ["darwin-arm64"], x64: ["darwin-x64"] },
  linux: {
    arm64: ["linux-arm64", "linux-arm64-musl"],
    x64: ["linux-x64", "linux-x64-musl"],
  },
  win32: { arm64: ["windows-arm64"], x64: ["windows-x64"] },
};

/** Hosted credential/target variables that must never reach the CLI child. */
export const HOSTED_ENV_KEYS = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_PROJECT_ID",
  "SUPABASE_URL",
  "SUPABASE_API_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_JWT_SECRET",
  "SUPABASE_YES",
  "SUPABASE_PROFILE",
  "SUPABASE_ORGANIZATION_ID",
] as const;

export class CliResolutionError extends Error {
  override readonly name = "CliResolutionError";
}

/** Absolute path to the pinned platform CLI binary. */
export function resolveSupabaseBinary(): string {
  const override = process.env.SUPABASE_CLI_BINARY_OVERRIDE;
  if (override && override.trim()) return override;

  const candidates = PLATFORM_MAP[process.platform]?.[os.arch()];
  if (!candidates) {
    throw new CliResolutionError(
      `unsupported platform ${process.platform}-${os.arch()} for the Supabase CLI`,
    );
  }
  const require = createRequire(import.meta.url);
  const ext = process.platform === "win32" ? ".exe" : "";
  for (const suffix of candidates) {
    try {
      const pkgPath = require.resolve(`@supabase/cli-${suffix}/package.json`);
      return path.join(path.dirname(pkgPath), "bin", `supabase${ext}`);
    } catch {
      // try the next libc variant
    }
  }
  throw new CliResolutionError(
    `no installed Supabase CLI binary for ${process.platform}-${os.arch()}; run \`bun install --frozen-lockfile\``,
  );
}

export interface ChildEnvResult {
  env: NodeJS.ProcessEnv;
  /** Names of hosted variables that were present and removed (never values). */
  stripped: string[];
}

/**
 * Builds the child environment: telemetry off, hosted credentials/targets
 * removed. Returns the names of removed variables for sanitised reporting.
 */
export function buildChildEnv(base: NodeJS.ProcessEnv = process.env): ChildEnvResult {
  const env: NodeJS.ProcessEnv = { ...base };
  const stripped: string[] = [];
  for (const key of HOSTED_ENV_KEYS) {
    if (env[key] !== undefined) {
      stripped.push(key);
      delete env[key];
    }
  }
  env.SUPABASE_TELEMETRY_DISABLED = "1";
  env.DO_NOT_TRACK = "1";
  return { env, stripped };
}

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface RunOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  binary?: string;
}

/**
 * Runs the CLI with captured output. Output is returned to the caller only;
 * this function never writes it to the console.
 */
export function runSupabase(args: readonly string[], options: RunOptions): CliResult {
  const binary = options.binary ?? resolveSupabaseBinary();
  const result = spawnSync(binary, [...args], {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) {
    throw new CliResolutionError(`failed to run Supabase CLI: ${result.error.message}`);
  }
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** CLI version string from `--version` (no subcommand, no side effects). */
export function supabaseVersion(
  options: Omit<RunOptions, "env"> & { env?: NodeJS.ProcessEnv },
): string {
  const { env } = buildChildEnv(options.env ?? process.env);
  const result = runSupabase(["--version"], { cwd: options.cwd, env, binary: options.binary });
  return result.stdout.trim().replace(/^supabase\s+/i, "");
}
