/**
 * Loopback-only Docker network for the local Supabase stack.
 *
 * Supabase publishes container ports on `0.0.0.0`/`::` by default, which is
 * reachable from other machines. The documented remediation is a dedicated
 * Docker bridge network whose default published-port host binding is loopback:
 *
 *   docker network create \
 *     -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 \
 *     the-scenes-phase3-loopback
 *   supabase start --network-id the-scenes-phase3-loopback
 *
 * This is a container-runtime resource, not a host firewall/network change.
 */

import { spawnSync } from "node:child_process";

export const LOOPBACK_NETWORK_NAME = "the-scenes-phase3-loopback";
const BINDING_OPTION = "com.docker.network.bridge.host_binding_ipv4=127.0.0.1";

export class NetworkError extends Error {
  override readonly name = "NetworkError";
}

export interface LoopbackNetwork {
  name: string;
  /** True when this call created the network; false when it already existed. */
  created: boolean;
}

export function buildNetworkCreateArgs(name: string = LOOPBACK_NETWORK_NAME): string[] {
  if (name !== LOOPBACK_NETWORK_NAME) {
    throw new NetworkError(`refusing to manage unexpected network "${name}"`);
  }
  return ["network", "create", "--opt", BINDING_OPTION, name];
}

export function buildNetworkInspectArgs(name: string = LOOPBACK_NETWORK_NAME): string[] {
  if (name !== LOOPBACK_NETWORK_NAME) {
    throw new NetworkError(`refusing to inspect unexpected network "${name}"`);
  }
  return ["network", "inspect", name];
}

function runDocker(args: string[]): { code: number; stdout: string; stderr: string } {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) {
    throw new NetworkError(`docker ${args.join(" ")} failed: ${result.error.message}`);
  }
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * Ensures the loopback-bound network exists. Idempotent: inspects first, creates
 * only when missing. Returns whether it created the network.
 */
export function ensureLoopbackNetwork(): LoopbackNetwork {
  const inspect = runDocker(buildNetworkInspectArgs());
  if (inspect.code === 0) {
    return { name: LOOPBACK_NETWORK_NAME, created: false };
  }
  const create = runDocker(buildNetworkCreateArgs());
  if (create.code !== 0) {
    throw new NetworkError(
      `could not create loopback Docker network: ${(create.stderr || create.stdout).trim()}`,
    );
  }
  return { name: LOOPBACK_NETWORK_NAME, created: true };
}
