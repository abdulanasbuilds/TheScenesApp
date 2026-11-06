import { describe, expect, test } from "bun:test";
import { handleSchema, signUpSchema, updateProfileSchema } from "../../src/features/auth/schemas";

describe("Wave 3 auth schemas", () => {
  test("normalizes and validates an immutable handle", () => {
    expect(handleSchema.parse("  Ama_Boateng ")).toBe("ama_boateng");
    expect(() => handleSchema.parse("Bad Handle")).toThrow();
  });

  test("normalizes registration email and bounds password", () => {
    expect(
      signUpSchema.parse({
        displayName: "Ama Boateng",
        handle: "amaboateng",
        email: " AMA@EXAMPLE.COM ",
        password: "safe-local-password",
      }).email,
    ).toBe("ama@example.com");
    expect(() =>
      signUpSchema.parse({
        displayName: "Ama",
        handle: "ama",
        email: "a@b.com",
        password: "short",
      }),
    ).toThrow();
  });

  test("profile updates reject immutable and authority fields", () => {
    expect(() => updateProfileSchema.parse({ displayName: "Ama", handle: "changed" })).toThrow();
    expect(() => updateProfileSchema.parse({ displayName: "Ama", status: "active" })).toThrow();
  });
});
