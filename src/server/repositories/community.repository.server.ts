import "@tanstack/react-start/server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export type CommunityRow = Readonly<{
  id: string;
  slug: string;
  name: string;
  tagline: string;
  accentHue: number;
}>;

export type MembershipRow = Readonly<{
  communityId: string;
  role: string;
  status: string;
}>;

export type JoinResult = Readonly<{
  ok: boolean;
  changed: boolean;
  code?: string;
}>;

export type LeaveResult = Readonly<{
  ok: boolean;
  changed: boolean;
}>;

export class CommunityRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findListedCommunities(): Promise<CommunityRow[]> {
    const { data, error } = await this.client
      .from("communities")
      .select("id, slug, name, tagline, accent_hue")
      .eq("status", "published")
      .eq("discoverability", "listed")
      .order("published_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      accentHue: row.accent_hue,
    }));
  }

  async findOwnMemberships(userId: string): Promise<MembershipRow[]> {
    const { data, error } = await this.client
      .from("community_memberships")
      .select("community_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      communityId: row.community_id,
      role: row.role,
      status: row.status,
    }));
  }

  async joinCommunity(communityId: string, requestId: string): Promise<JoinResult> {
    const { data, error } = await this.client.rpc("join_community", {
      p_community_id: communityId,
      p_request_id: requestId,
    });
    if (error) throw error;
    const result = data as JoinResult;
    return { ok: result.ok, changed: result.changed, code: result.code };
  }

  async leaveCommunity(communityId: string, requestId: string): Promise<LeaveResult> {
    const { data, error } = await this.client.rpc("leave_community", {
      p_community_id: communityId,
      p_request_id: requestId,
    });
    if (error) throw error;
    const result = data as LeaveResult;
    return { ok: result.ok, changed: result.changed };
  }
}
