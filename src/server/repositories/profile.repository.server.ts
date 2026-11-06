import "@tanstack/react-start/server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import type { PublicProfile } from "../../features/auth/contracts";

export type ProfileUpdate = Readonly<{
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
}>;

export function buildProfileUpdate(input: ProfileUpdate) {
  return {
    display_name: input.displayName,
    ...(input.headline !== undefined ? { headline: input.headline } : {}),
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
  };
}

export class ProfileRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findPublicProfile(userId: string): Promise<PublicProfile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, handle, display_name, headline, bio, location")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      handle: data.handle,
      displayName: data.display_name,
      headline: data.headline,
      bio: data.bio,
      location: data.location,
    };
  }

  async updateOwnProfile(userId: string, input: ProfileUpdate): Promise<PublicProfile> {
    const { data, error } = await this.client
      .from("profiles")
      .update(buildProfileUpdate(input))
      .eq("id", userId)
      .select("id, handle, display_name, headline, bio, location")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      handle: data.handle,
      displayName: data.display_name,
      headline: data.headline,
      bio: data.bio,
      location: data.location,
    };
  }
}
