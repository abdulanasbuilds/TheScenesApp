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
    const ownerSignup = await owner.auth.signUp({
      email: first.email,
      password,
      options: { data: { handle: first.handle, display_name: "First Learner" } },
    });
    expect(ownerSignup.error).toBeNull();
    expect(ownerSignup.data.user?.id).toBeString();
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
    const hostileLogin = await client().auth.signInWithPassword({
      email: hostile.email,
      password,
    });
    expect(hostileLogin.error).not.toBeNull();
    expect(hostileLogin.data.session).toBeNull();
    const hostileProfiles = await client()
      .from("profiles")
      .select("id")
      .eq("handle", hostile.handle);
    expect(hostileProfiles.error).toBeNull();
    expect(hostileProfiles.data).toEqual([]);

    const duplicateEmail = identity("other").email;
    const duplicate = await client().auth.signUp({
      email: duplicateEmail,
      password,
      options: { data: { handle: first.handle, display_name: "Duplicate Learner" } },
    });
    expect(duplicate.error).not.toBeNull();
    expect(duplicate.data.session).toBeNull();
    const duplicateLogin = await client().auth.signInWithPassword({
      email: duplicateEmail,
      password,
    });
    expect(duplicateLogin.error).not.toBeNull();
    expect(duplicateLogin.data.session).toBeNull();
    const ownerProfiles = await owner.from("profiles").select("id").eq("handle", first.handle);
    expect(ownerProfiles.error).toBeNull();
    expect(ownerProfiles.data).toEqual([{ id: ownerSignup.data.user!.id }]);
  });

  test("unknown account and wrong password expose the same provider-safe failure class", async () => {
    const account = identity("login");
    const api = client();
    const signup = await api.auth.signUp({
      email: account.email,
      password,
      options: { data: { handle: account.handle, display_name: "Login Learner" } },
    });
    expect(signup.error).toBeNull();
    expect(signup.data.user?.id).toBeString();
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
    const signupA = await clientA.auth.signUp({
      email: a.email,
      password,
      options: { data: { handle: a.handle, display_name: "Profile A" } },
    });
    expect(signupA.error).toBeNull();
    expect(signupA.data.user?.id).toBeString();
    const userA = signupA.data.user!;
    const signupB = await clientB.auth.signUp({
      email: b.email,
      password,
      options: { data: { handle: b.handle, display_name: "Profile B" } },
    });
    expect(signupB.error).toBeNull();
    expect(signupB.data.user?.id).toBeString();
    const initial = await clientA
      .from("profiles")
      .update({ headline: "Keep me", bio: "Clear me" })
      .eq("id", userA.id);
    expect(initial.error).toBeNull();
    const changed = await clientA
      .from("profiles")
      .update({ display_name: "Profile A Updated", bio: null })
      .eq("id", userA.id)
      .select("display_name,headline,bio")
      .single();
    expect(changed.error).toBeNull();
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
    expect(cross.error).toBeNull();
    expect(cross.data).toEqual([]);
    const unchanged = await clientA
      .from("profiles")
      .select("display_name")
      .eq("id", userA.id)
      .single();
    expect(unchanged.error).toBeNull();
    expect(unchanged.data).toEqual({ display_name: "Profile A Updated" });
  });
});
