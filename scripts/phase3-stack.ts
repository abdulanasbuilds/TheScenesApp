#!/usr/bin/env bun
/**
 * Phase 3 local Supabase stack wrapper: `start` | `status` | `stop`.
 *
 * Credential-safe by construction (docs/SECURITY-RULES.md; docs/DECISIONS.md ADR-039):
 * - pinned `supabase@3.0.0`; `SUPABASE_TELEMETRY_DISABLED=1` on every child;
 * - hosted credentials/targets stripped from the child environment;
 * - CLI stdout/stderr captured in memory and only ever printed redacted;
 * - no `link`/`login`/`projects`/hosted command; `stop` is project-targeted only;
 * - `start` binds published ports to loopback by starting the stack on a
 *   dedicated loopback Docker network (`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`),
 *   then proves every enabled listener is loopback-only before returning, and
 *   stops the stack if any non-loopback/unspecified bind is found;
 * - disabled services (Realtime, Studio, Mailpit, Storage, Edge Functions,
 *   Analytics) are confirmed disabled in config and absent as containers.
 *
 * Usage: phase3-stack <start|status|stop> [--json] [--with-db-url] [--github-mask]
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  buildChildEnv,
  resolveSupabaseBinary,
  runSupabase,
  supabaseVersion,
} from "./phase3-stack/cli.ts";
import { listHostListeners, listProjectContainers } from "./phase3-stack/docker.ts";
import { ensureLoopbackNetwork } from "./phase3-stack/network.ts";
import { execute, type StackRuntime } from "./phase3-stack/stack.ts";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(PROJECT_ROOT, "supabase", "config.toml");

const runtime: StackRuntime = {
  cwd: PROJECT_ROOT,
  runSupabase: (args, env) => runSupabase(args, { cwd: PROJECT_ROOT, env }),
  buildChildEnv: () => buildChildEnv(),
  assertBinaryAvailable: () => {
    resolveSupabaseBinary();
  },
  ensureLoopbackNetwork: () => ensureLoopbackNetwork(),
  listProjectContainers: (projectId) => listProjectContainers(projectId),
  listHostListeners: (ports) => listHostListeners(ports),
  readConfig: () => readFileSync(CONFIG_PATH, "utf8"),
  cliVersion: () => {
    try {
      return supabaseVersion({ cwd: PROJECT_ROOT });
    } catch {
      return "unknown";
    }
  },
  lockedVersion: () => {
    const pkg = JSON.parse(readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8")) as {
      devDependencies?: Record<string, string>;
    };
    return pkg.devDependencies?.supabase ?? "unknown";
  },
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
};

process.exit(execute(process.argv.slice(2), runtime));
