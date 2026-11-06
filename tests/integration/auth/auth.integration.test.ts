import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, test } from "bun:test";

const url = process.env.PHASE3_API_URL ?? "";
const key = process.env.PHASE3_PUBLISHABLE_KEY ?? "";
if (url && !/^http:\/\/(?:127\.0\.0\.1|localhost):54321$/.test(url))
  throw new Error("refusing non-loopback Auth target");
if (key && (!key.startsWith("sb_publishable_") || /secret|service_role|eyJ/i.test(key)))
  throw new Error("refusing privileged Auth key");
const suite = url && key ? describe : describe.skip;
const password = "local-auth-test-password-123";

function client() {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function identity(label: string) {
  const suffix = `${Date.now().toString(36)}${randomUUID().replaceAll("-", "").slice(0, 8)}`;
  return { email: `${label}.${suffix}@test.invalid`, handle: `${label}${suffix}`.slice(0, 30) };
}

suite("Wave 3 local Auth and profile", () => {
  test("registration creates one matching normalized profile and a verified session", async () => {
    const account = identity("valid");
    const api = client();
    const signup = await api.auth.signUp({
      email: account.email,
      password,
      options: { data: { handle: account.handle.toUpperCase(), display_name: "Valid Learner" } },
    });
    expect(signup.error).toBeNull();
    expect(signup.data.session).not.toBeNull();
    const userId = signup.data.user?.id;
    expect(userId).toBeString();
    const profile = await api
      .from("profiles")
      .select("id,handle,display_name")
      .eq("id", userId!)
      .single();
    expect(profile.error).toBeNull();
    expect(profile.data).toEqual({
      id: userId,
      handle: account.handle.toLowerCase(),
      display_name: "Valid Learner",
    });
    const claims = await api.auth.getClaims();
    expect(claims.error).toBeNull();
    expect(claims.data?.claims.sub).toBe(userId);
  });

  test("hostile metadata and duplicate handle fail atomically", async () => {
    const first = identity("duplicate");
    const owner = client();
    expect(
      (
        await owner.auth.signUp({
          email: first.email,
          password,
          options: { data: { handle: first.handle, display_name: "First Learner" } },
        })
      ).error,
    ).toBeNull();
    const hostile = identity("hostile");
    const hostileResult = await client().auth.signUp({
      email: hostile.email,
      password,
      options: {
        data: { handle: hostile.handle, display_name: "Hostile Learner", status: "active" },
      },
    });
    expect(hostileResult.error).not.toBeNull();
    expect(hostileResult.data.session).toBeNull();
    const duplicate = await client().auth.signUp({
      email: identity("other").email,
      password,
      options: { data: { handle: first.handle, display_name: "Duplicate Learner" } },
    });
    expect(duplicate.error).not.toBeNull();
    expect(duplicate.data.session).toBeNull();
  });

  test("unknown account and wrong password expose the same provider-safe failure class", async () => {
    const account = identity("login");
    const api = client();
    expect(
      (
        await api.auth.signUp({
          email: account.email,
          password,
          options: { data: { handle: account.handle, display_name: "Login Learner" } },
        })
      ).error,
    ).toBeNull();
    const wrong = await client().auth.signInWithPassword({
      email: account.email,
      password: "wrong-password-123",
    });
    const unknown = await client().auth.signInWithPassword({
      email: identity("unknown").email,
      password: "wrong-password-123",
    });
    expect(wrong.error?.status).toBe(unknown.error?.status);
    expect(wrong.data.session).toBeNull();
    expect(unknown.data.session).toBeNull();
  });

  test("user-scoped profile updates preserve omitted fields and cannot cross accounts", async () => {
    const a = identity("profilea");
    const b = identity("profileb");
    const clientA = client();
    const clientB = client();
    const userA = (
      await clientA.auth.signUp({
        email: a.email,
        password,
        options: { data: { handle: a.handle, display_name: "Profile A" } },
      })
    ).data.user!;
    await clientB.auth.signUp({
      email: b.email,
      password,
      options: { data: { handle: b.handle, display_name: "Profile B" } },
    });
    await clientA
      .from("profiles")
      .update({ headline: "Keep me", bio: "Clear me" })
      .eq("id", userA.id);
    const changed = await clientA
      .from("profiles")
      .update({ display_name: "Profile A Updated", bio: null })
      .eq("id", userA.id)
      .select("display_name,headline,bio")
      .single();
    expect(changed.data).toEqual({
      display_name: "Profile A Updated",
      headline: "Keep me",
      bio: null,
    });
    const cross = await clientB
      .from("profiles")
      .update({ display_name: "Compromised" })
      .eq("id", userA.id)
      .select("id");
    expect(cross.data).toEqual([]);
  });
});
