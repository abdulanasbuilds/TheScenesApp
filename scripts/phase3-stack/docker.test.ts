import { describe, expect, test } from "bun:test";

import {
  containersToListeners,
  parseDockerPsLine,
  parseNetstatListeners,
  parsePublishedPorts,
  parseSsListeners,
} from "./docker.ts";

describe("parsePublishedPorts", () => {
  test("parses loopback and unspecified mappings", () => {
    const listeners = parsePublishedPorts(
      "127.0.0.1:54321->8000/tcp, 0.0.0.0:54322->5432/tcp",
      "supabase_kong_the-scenes-app",
    );
    expect(listeners).toHaveLength(2);
    expect(listeners[0]).toMatchObject({ host: "127.0.0.1", port: 54321, source: "docker" });
    expect(listeners[1]).toMatchObject({ host: "0.0.0.0", port: 54322, source: "docker" });
  });

  test("ignores unpublished entries", () => {
    expect(parsePublishedPorts("54323/tcp", "db")).toHaveLength(0);
  });

  test("handles IPv6 mappings", () => {
    const listeners = parsePublishedPorts("[::1]:54321->8000/tcp", "kong");
    expect(listeners[0]).toMatchObject({ host: "::1", port: 54321 });
  });
});

describe("parseDockerPsLine", () => {
  test("splits name and ports", () => {
    expect(parseDockerPsLine("supabase_db_x|127.0.0.1:54322->5432/tcp")).toEqual({
      name: "supabase_db_x",
      ports: "127.0.0.1:54322->5432/tcp",
    });
  });

  test("returns null for blank lines", () => {
    expect(parseDockerPsLine("   ")).toBeNull();
  });
});

describe("containersToListeners", () => {
  test("flattens containers into listeners", () => {
    const listeners = containersToListeners([
      { name: "a", ports: "127.0.0.1:1->1/tcp" },
      { name: "b", ports: "0.0.0.0:2->2/tcp, 127.0.0.1:3->3/tcp" },
    ]);
    expect(listeners).toHaveLength(3);
  });
});

describe("parseNetstatListeners", () => {
  test("parses Windows netstat LISTENING rows", () => {
    const output = [
      "  TCP    127.0.0.1:54321        0.0.0.0:0              LISTENING       1234",
      "  TCP    0.0.0.0:54322          0.0.0.0:0              LISTENING       5678",
      "  TCP    127.0.0.1:5000         0.0.0.0:0              LISTENING       9999",
    ].join("\r\n");
    const listeners = parseNetstatListeners(output, new Set([54321, 54322]));
    expect(listeners).toHaveLength(2);
    expect(listeners.map((l) => l.port).sort()).toEqual([54321, 54322]);
  });
});

describe("parseSsListeners", () => {
  test("parses Linux ss output", () => {
    const output = [
      "State  Recv-Q Send-Q Local Address:Port  Peer Address:Port",
      "LISTEN 0      4096   127.0.0.1:54321      0.0.0.0:*",
      "LISTEN 0      4096   *:54322              *:*",
    ].join("\n");
    const listeners = parseSsListeners(output, new Set([54321, 54322]));
    expect(listeners.map((l) => l.host)).toContain("127.0.0.1");
  });
});
