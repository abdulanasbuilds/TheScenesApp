import { describe, expect, test } from "bun:test";

import {
  findDisabledServiceContainers,
  readServiceEnablement,
  verifyDisabledServices,
} from "./config.ts";

const DISABLED_TOML = `
[api]
enabled = true

[db]
enabled = true

[realtime]
enabled = false

[studio]
enabled = false

[local_smtp]
enabled = false

[storage]
enabled = false

[edge_runtime]
enabled = false

[analytics]
enabled = false
`;

describe("readServiceEnablement", () => {
  test("reads the first enabled value per section", () => {
    const state = readServiceEnablement(DISABLED_TOML);
    expect(state.api).toBe(true);
    expect(state.realtime).toBe(false);
    expect(state.storage).toBe(false);
  });

  test("ignores commented lines", () => {
    const state = readServiceEnablement("[studio]\n# enabled = true\nenabled = false");
    expect(state.studio).toBe(false);
  });
});

describe("verifyDisabledServices", () => {
  test("passes when every required service is disabled", () => {
    const check = verifyDisabledServices(DISABLED_TOML);
    expect(check.ok).toBe(true);
    expect(check.offenders).toHaveLength(0);
  });

  test("fails and names a service left enabled", () => {
    const check = verifyDisabledServices(
      DISABLED_TOML.replace("[realtime]\nenabled = false", "[realtime]\nenabled = true"),
    );
    expect(check.ok).toBe(false);
    expect(check.offenders).toContain("realtime");
  });

  test("fails when a required service section is missing", () => {
    const check = verifyDisabledServices("[storage]\nenabled = false", ["storage", "studio"]);
    expect(check.offenders).toContain("studio");
  });
});

describe("findDisabledServiceContainers", () => {
  test("flags containers for disabled services", () => {
    const offenders = findDisabledServiceContainers([
      "supabase_db_the-scenes-app",
      "supabase_realtime_the-scenes-app",
      "supabase_studio_the-scenes-app",
      "supabase_kong_the-scenes-app",
    ]);
    expect(offenders.some((o) => o.startsWith("realtime:"))).toBe(true);
    expect(offenders.some((o) => o.startsWith("studio:"))).toBe(true);
    expect(offenders.some((o) => o.startsWith("kong"))).toBe(false);
  });
});
