#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ASSETS = path.join(ROOT, ".output", "public", "assets");
const SOURCE = path.join(ROOT, "src");

const FORBIDDEN_BUNDLE_MARKERS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "sb_secret_",
  "service_role",
  "server-client.server",
  "src/server/",
] as const;

export function findForbiddenMarkers(content: string): string[] {
  return FORBIDDEN_BUNDLE_MARKERS.filter((marker) => content.includes(marker));
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const target = path.join(directory, entry);
    return statSync(target).isDirectory() ? walk(target) : [target];
  });
}

function isClientReachableSource(file: string): boolean {
  const normalized = file.replaceAll("\\", "/");
  return (
    /\.(?:ts|tsx)$/.test(normalized) &&
    !normalized.includes("/src/server/") &&
    !normalized.includes(".server.")
  );
}

export function sourceBoundaryViolations(files: readonly string[]): string[] {
  const violations: string[] = [];
  for (const file of files.filter(isClientReachableSource)) {
    const content = readFileSync(file, "utf8");
    if (/from\s+["'][^"']*(?:\/server\/|\.server(?:\.|["']))/.test(content)) {
      violations.push(path.relative(ROOT, file).replaceAll("\\", "/"));
    }
  }
  return violations;
}

export function serverFunctionShapeViolations(files: readonly string[]): string[] {
  return files
    .filter((file) => file.endsWith(".functions.ts"))
    .filter((file) => {
      const content = readFileSync(file, "utf8");
      return (
        !/import\s*{[^}]*createServerFn[^}]*}\s*from\s*["']@tanstack\/react-start["']/.test(
          content,
        ) || !/createServerFn\s*\(/.test(content)
      );
    })
    .map((file) => path.relative(ROOT, file).replaceAll("\\", "/"));
}

export function verifyClientBoundary(): void {
  const sourceViolations = sourceBoundaryViolations(walk(SOURCE));
  if (sourceViolations.length > 0) {
    throw new Error(
      `client-reachable source imports protected server code: ${sourceViolations.join(", ")}`,
    );
  }
  const functionShapeViolations = serverFunctionShapeViolations(walk(SOURCE));
  if (functionShapeViolations.length > 0) {
    throw new Error(
      `server function modules must import and call createServerFn directly: ${functionShapeViolations.join(", ")}`,
    );
  }
  if (!existsSync(PUBLIC_ASSETS))
    throw new Error("client build output is missing; run `bun run build` first");
  const bundleViolations = walk(PUBLIC_ASSETS)
    .filter((file) => /\.(?:js|mjs)$/.test(file))
    .flatMap((file) =>
      findForbiddenMarkers(readFileSync(file, "utf8")).map((marker) => ({ file, marker })),
    );
  if (bundleViolations.length > 0) {
    throw new Error(
      `client bundle contains forbidden marker(s): ${bundleViolations
        .map(({ file, marker }) => `${path.basename(file)}:${marker}`)
        .join(", ")}`,
    );
  }
}

if (import.meta.main) {
  verifyClientBoundary();
  process.stdout.write("client/server boundary verified\n");
}
