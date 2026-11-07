import "@tanstack/react-start/server-only";
import type { ViewerDTO } from "../../features/auth/contracts";
import { CommunityRepository } from "../repositories/community.repository.server";
import { ProfileRepository } from "../repositories/profile.repository.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

export async function getSessionProfile(): Promise<ViewerDTO | null> {
  const principal = await getVerifiedPrincipal();
  if (!principal) return null;
  const client = createRequestSupabaseClient();
  const [profile, memberships] = await Promise.all([
    new ProfileRepository(client).findPublicProfile(principal.userId),
    new CommunityRepository(client).findOwnMemberships(principal.userId),
  ]);
  if (!profile) throw new Error("Authenticated account has no profile.");

  // Build joined communities list from active memberships.
  // We select the community metadata the client needs for navigation/display.
  const joinedCommunities: Array<{ id: string; slug: string; name: string; accentHue: number }> =
    [];
  if (memberships.length > 0) {
    const { data } = await client
      .from("communities")
      .select("id, slug, name, accent_hue")
      .in(
        "id",
        memberships.map((m) => m.communityId),
      )
      .eq("status", "published");
    for (const row of data ?? []) {
      joinedCommunities.push({
        id: row.id,
        slug: row.slug,
        name: row.name,
        accentHue: row.accent_hue,
      });
    }
  }

  return { ...profile, accountEmail: principal.email, joinedCommunities };
}
