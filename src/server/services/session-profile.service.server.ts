import "@tanstack/react-start/server-only";
import type { ViewerDTO } from "../../features/auth/contracts";
import { ProfileRepository } from "../repositories/profile.repository.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

export async function getSessionProfile(): Promise<ViewerDTO | null> {
  const principal = await getVerifiedPrincipal();
  if (!principal) return null;
  const profile = await new ProfileRepository(createRequestSupabaseClient()).findPublicProfile(
    principal.userId,
  );
  if (!profile) throw new Error("Authenticated account has no profile.");
  return { ...profile, accountEmail: principal.email, joinedCommunities: [] };
}
