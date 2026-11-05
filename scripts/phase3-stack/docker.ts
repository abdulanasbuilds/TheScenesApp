/**
 * Docker/OS listener evidence for the isolation gate.
 *
 * Pure parsers are separated from the process wrappers so they can be unit
 * tested without Docker. The wrappers only run when the orchestrator actually
 * starts the stack.
 */

import { spawnSync } from "node:child_process";
import { classifyHost, parseHostPort, type Listener } from "./listeners.ts";

export class DockerUnavailableError extends Error {
  override readonly name = "DockerUnavailableError";
}

/**
 * Parses the `docker ps` published-ports field, e.g.
 * `127.0.0.1:54321->54321/tcp, 0.0.0.0:54322->54322/tcp, 54323/tcp`.
 * Unpublished entries (no `->`) are ignored.
 */
export function parsePublishedPorts(portsField: string, service: string): Listener[] {
  const listeners: Listener[] = [];
  for (const entry of portsField.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed.includes("->")) continue;
    const hostSide = trimmed.split("->")[0];
    const parsed = parseHostPort(hostSide);
    if (!parsed) continue;
    listeners.push({
      service,
      host: parsed.host,
      port: parsed.port,
      source: "docker",
    });
  }
  return listeners;
}

export interface DockerContainer {
  name: string;
  ports: string;
}

/** Parses one `docker ps --format "{{.Names}}|{{.Ports}}"` line. */
export function parseDockerPsLine(line: string): DockerContainer | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const sep = trimmed.indexOf("|");
  if (sep < 0) return null;
  return { name: trimmed.slice(0, sep), ports: trimmed.slice(sep + 1) };
}

export function containersToListeners(containers: readonly DockerContainer[]): Listener[] {
  return containers.flatMap((container) => parsePublishedPorts(container.ports, container.name));
}

function run(cmd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) {
    throw new DockerUnavailableError(`${cmd} failed: ${result.error.message}`);
  }
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Lists running Supabase containers for the given local project id. */
export function listProjectContainers(projectId: string): DockerContainer[] {
  const primary = run("docker", [
    "ps",
    "--filter",
    `label=com.supabase.cli.project=${projectId}`,
    "--format",
    "{{.Names}}|{{.Ports}}",
  ]);
  let lines = primary.stdout.split(/\r?\n/);
  let containers = lines.map(parseDockerPsLine).filter((c): c is DockerContainer => c !== null);

  if (containers.length === 0 && primary.code === 0) {
    const fallback = run("docker", ["ps", "--format", "{{.Names}}|{{.Ports}}"]);
    containers = fallback.stdout
      .split(/\r?\n/)
      .map(parseDockerPsLine)
      .filter((c): c is DockerContainer => c !== null)
      .filter((c) => c.name.startsWith("supabase_") && c.name.endsWith(`_${projectId}`));
    lines = fallback.stdout.split(/\r?\n/);
  }

  if (primary.code !== 0 && containers.length === 0) {
    throw new DockerUnavailableError(
      `docker ps failed (${primary.stderr.trim() || `exit ${primary.code}`})`,
    );
  }
  void lines;
  return containers;
}

/** Parses Windows `netstat -ano` LISTENING rows. */
export function parseNetstatListeners(output: string, ports?: Set<number>): Listener[] {
  const listeners: Listener[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = /^\s*TCP\s+(\S+)\s+\S+\s+LISTENING\b/i.exec(line);
    if (!match) continue;
    const parsed = parseHostPort(match[1]);
    if (!parsed) continue;
    if (ports && !ports.has(parsed.port)) continue;
    listeners.push({ service: "host", host: parsed.host, port: parsed.port, source: "host" });
  }
  return listeners;
}

/** Parses Linux `ss -ltn` output. */
export function parseSsListeners(output: string, ports?: Set<number>): Listener[] {
  const listeners: Listener[] = [];
  for (const line of output.split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 5) continue;
    if (!/^(listen|unconn|tcp)/i.test(fields[0])) continue;
    const local = fields[3];
    const idx = local.lastIndexOf(":");
    if (idx <= 0) continue;
    const parsed = parseHostPort(`${local.slice(0, idx)}:${local.slice(idx + 1)}`);
    if (!parsed) continue;
    if (ports && !ports.has(parsed.port)) continue;
    listeners.push({ service: "host", host: parsed.host, port: parsed.port, source: "host" });
  }
  return listeners;
}

/** Enumerates host sockets listening on the given ports. */
export function listHostListeners(ports: readonly number[]): Listener[] {
  const portSet = new Set(ports);
  if (process.platform === "win32") {
    const result = run("netstat", ["-ano"]);
    return parseNetstatListeners(result.stdout, portSet);
  }
  const result = run("ss", ["-ltn"]);
  return parseSsListeners(result.stdout, portSet);
}

/** Reads the bind address a listener reports, for classification. */
export function isLoopbackListener(listener: Listener): boolean {
  return classifyHost(listener.host) === "loopback";
}
