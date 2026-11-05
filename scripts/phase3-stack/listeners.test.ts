import { describe, expect, test } from "bun:test";

import {
  classifyHost,
  describeListener,
  evaluateIsolation,
  parseHostPort,
  type Listener,
} from "./listeners.ts";

const listener = (host: string, port = 54321, service = "kong"): Listener => ({
  service,
  host,
  port,
  source: "host",
});

describe("classifyHost", () => {
  test("classifies loopback addresses", () => {
    expect(classifyHost("127.0.0.1")).toBe("loopback");
    expect(classifyHost("127.9.9.9")).toBe("loopback");
    expect(classifyHost("::1")).toBe("loopback");
    expect(classifyHost("[::1]")).toBe("loopback");
    expect(classifyHost("localhost")).toBe("loopback");
  });

  test("classifies unspecified addresses as offenders", () => {
    expect(classifyHost("0.0.0.0")).toBe("unspecified");
    expect(classifyHost("::")).toBe("unspecified");
    expect(classifyHost("*")).toBe("unknown");
  });

  test("classifies non-loopback addresses", () => {
    expect(classifyHost("192.168.0.5")).toBe("non-loopback");
    expect(classifyHost("10.0.0.1")).toBe("non-loopback");
    expect(classifyHost("2001:db8::1")).toBe("non-loopback");
  });
});

describe("parseHostPort", () => {
  test("parses IPv4 and bracketed IPv6", () => {
    expect(parseHostPort("127.0.0.1:54321")).toEqual({ host: "127.0.0.1", port: 54321 });
    expect(parseHostPort("[::1]:54321")).toEqual({ host: "::1", port: 54321 });
  });

  test("returns null for malformed specs", () => {
    expect(parseHostPort("nope")).toBeNull();
    expect(parseHostPort("127.0.0.1:0")).toBeNull();
    expect(parseHostPort("127.0.0.1:99999")).toBeNull();
  });
});

describe("evaluateIsolation", () => {
  test("passes when every listener is loopback", () => {
    const gate = evaluateIsolation([listener("127.0.0.1"), listener("::1", 54322, "db")]);
    expect(gate.ok).toBe(true);
    expect(gate.offenders).toHaveLength(0);
  });

  test("fails on an unspecified bind", () => {
    const gate = evaluateIsolation([listener("127.0.0.1"), listener("0.0.0.0", 54322, "db")]);
    expect(gate.ok).toBe(false);
    expect(gate.offenders.map((o) => o.host)).toContain("0.0.0.0");
  });

  test("fails on a non-loopback bind", () => {
    const gate = evaluateIsolation([listener("192.168.1.20")]);
    expect(gate.ok).toBe(false);
  });

  test("fails when nothing was detected", () => {
    expect(evaluateIsolation([]).ok).toBe(false);
  });
});

describe("describeListener", () => {
  test("includes the classification", () => {
    expect(describeListener(listener("0.0.0.0"))).toContain("unspecified");
  });
});
