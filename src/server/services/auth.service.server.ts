import "@tanstack/react-start/server-only";
import { getRequestUrl } from "@tanstack/react-start/server";
import { PublicAppError } from "../../features/shared/safe-handler";
import type { z } from "zod";
import { buildEmailConfirmationRedirect } from "../../features/auth/redirects";
import type { signInSchema, signUpSchema, updateProfileSchema } from "../../features/auth/schemas";
import { getServerEnv } from "../env.server";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import { ProfileRepository } from "../repositories/profile.repository.server";
import { assertRateLimit, consumeRateLimit } from "../security/rate-limit.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

type SignUpInput = z.infer<typeof signUpSchema>;
type SignInInput = z.infer<typeof signInSchema>;
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function signUp(input: SignUpInput) {
  applyPrivateNoStoreResponse();
  assertRateLimit(
    await consumeRateLimit("signup", input.email),
    "Please wait before trying again.",
  );
  const env = getServerEnv();
  const client = createRequestSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { handle: input.handle, display_name: input.displayName },
      ...(env.dataMode === "supabase-staging"
        ? { emailRedirectTo: buildEmailConfirmationRedirect(getRequestUrl()) }
        : {}),
    },
  });
  if (error || !data.user) {
    throw new PublicAppError(
      "CONFLICT",
      "We could not create that account. Check your details or sign in.",
    );
  }
  const profile = await new ProfileRepository(client).findPublicProfile(data.user.id);
  if (data.session === null) {
    if ((data.user.identities?.length ?? 0) > 0 && !profile) {
      throw new Error("Profile bootstrap failed.");
    }
    return { changed: true as const, profile: null, confirmationRequired: true as const };
  }
  if (!profile) throw new Error("Profile bootstrap failed.");
  return { changed: true as const, profile, confirmationRequired: false as const };
}

export async function signIn(input: SignInInput) {
  applyPrivateNoStoreResponse();
  assertRateLimit(await consumeRateLimit("login", input.email), "Please wait before trying again.");
  const client = createRequestSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword(input);
  if (error || !data.user) {
    throw new PublicAppError("UNAUTHENTICATED", "The email or password is incorrect.");
  }
  const profile = await new ProfileRepository(client).findPublicProfile(data.user.id);
  if (!profile) throw new Error("Authenticated account has no profile.");
  return { changed: true as const, profile };
}

export async function signOut() {
  applyPrivateNoStoreResponse();
  const { error } = await createRequestSupabaseClient().auth.signOut({ scope: "local" });
  if (error) throw new Error("Local sign out failed.");
  return { changed: true as const, signedOut: true as const };
}

export async function updateProfile(input: UpdateProfileInput) {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Please sign in again.");
  const client = createRequestSupabaseClient();
  try {
    const profile = await new ProfileRepository(client).updateOwnProfile(principal.userId, input);
    return { changed: true as const, profile };
  } catch {
    throw new PublicAppError("CONFLICT", "We could not save that profile update.");
  }
}
