import "@tanstack/react-start/server-only";
import { PublicAppError } from "../../features/shared/safe-handler";
import type { z } from "zod";
import type { signInSchema, signUpSchema, updateProfileSchema } from "../../features/auth/schemas";
import { ProfileRepository } from "../repositories/profile.repository.server";
import { localRateLimiter } from "../security/local-rate-limit.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

type SignUpInput = z.infer<typeof signUpSchema>;
type SignInInput = z.infer<typeof signInSchema>;
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function signUp(input: SignUpInput) {
  const limit = localRateLimiter.check(`signup:${input.email}`, { limit: 10, windowMs: 900_000 });
  if (!limit.allowed)
    throw new PublicAppError(
      "RATE_LIMITED",
      "Please wait before trying again.",
      limit.retryAfterSeconds,
    );
  const client = createRequestSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { handle: input.handle, display_name: input.displayName } },
  });
  if (error || !data.user) {
    throw new PublicAppError(
      "CONFLICT",
      "We could not create that account. Check your details or sign in.",
    );
  }
  const profile = await new ProfileRepository(client).findPublicProfile(data.user.id);
  if (!profile) throw new Error("Profile bootstrap failed.");
  return { changed: true as const, profile };
}

export async function signIn(input: SignInInput) {
  const limit = localRateLimiter.check(`login:${input.email}`, { limit: 20, windowMs: 900_000 });
  if (!limit.allowed)
    throw new PublicAppError(
      "RATE_LIMITED",
      "Please wait before trying again.",
      limit.retryAfterSeconds,
    );
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
  const { error } = await createRequestSupabaseClient().auth.signOut({ scope: "local" });
  if (error) throw new Error("Local sign out failed.");
  return { changed: true as const, signedOut: true as const };
}

export async function updateProfile(input: UpdateProfileInput) {
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Please sign in again.");
  const client = createRequestSupabaseClient();
  const { data, error } = await client
    .from("profiles")
    .update({
      display_name: input.displayName,
      headline: input.headline ?? null,
      bio: input.bio ?? null,
      location: input.location ?? null,
    })
    .eq("id", principal.userId)
    .select("id, handle, display_name, headline, bio, location")
    .single();
  if (error) throw new PublicAppError("CONFLICT", "We could not save that profile update.");
  return {
    changed: true as const,
    profile: {
      id: data.id,
      handle: data.handle,
      displayName: data.display_name,
      headline: data.headline,
      bio: data.bio,
      location: data.location,
    },
  };
}
