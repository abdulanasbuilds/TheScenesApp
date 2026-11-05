import { describe, expect, test } from "bun:test";

import {
  LOOPBACK_NETWORK_NAME,
  NetworkError,
  buildNetworkCreateArgs,
  buildNetworkInspectArgs,
} from "./network.ts";

describe("buildNetworkCreateArgs", () => {
  test("creates the loopback-bound bridge network with the documented option", () => {
    const args = buildNetworkCreateArgs();
    expect(args[0]).toBe("network");
    expect(args[1]).toBe("create");
    expect(args).toContain("--opt");
    expect(args).toContain("com.docker.network.bridge.host_binding_ipv4=127.0.0.1");
    expect(args[args.length - 1]).toBe(LOOPBACK_NETWORK_NAME);
  });

  test("refuses to manage an unexpected network name", () => {
    expect(() => buildNetworkCreateArgs("some-other-network")).toThrow(NetworkError);
  });
});

describe("buildNetworkInspectArgs", () => {
  test("inspects the loopback network", () => {
    expect(buildNetworkInspectArgs()).toEqual(["network", "inspect", LOOPBACK_NETWORK_NAME]);
  });

  test("refuses to inspect an unexpected network name", () => {
    expect(() => buildNetworkInspectArgs("host")).toThrow(NetworkError);
  });
});
