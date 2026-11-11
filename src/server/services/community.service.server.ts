import "@tanstack/react-start/server-only";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import { CommunityRepository } from "../repositories/community.repository.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";
import { PublicAppError } from "../../features/shared/safe-handler";
import { assertRateLimit, consumeRateLimit } from "../security/rate-limit.server";

export type CommunityMutationResult = Readonly<{
  changed: boolean;
}>;

export async function joinCommunity(
  communityId: string,
  requestId: string,
): Promise<CommunityMutationResult> {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Sign in to join a community.");
  assertRateLimit(
    await consumeRateLimit("community-join", principal.userId),
    "Please wait before joining another community.",
  );
  const client = createRequestSupabaseClient();
  const result = await new CommunityRepository(client).joinCommunity(communityId, requestId);
  if (!result.ok) {
    if (result.code === "not_authenticated") {
      throw new PublicAppError("UNAUTHENTICATED", "Sign in to join a community.");
    }
    throw new PublicAppError("NOT_FOUND", "Community not found or not open to join.");
  }
  return { changed: result.changed };
}

export async function leaveCommunity(
  communityId: string,
  requestId: string,
): Promise<CommunityMutationResult> {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Sign in to leave a community.");
  const client = createRequestSupabaseClient();
  const result = await new CommunityRepository(client).leaveCommunity(communityId, requestId);
  if (!result.ok) {
    throw new PublicAppError("UNAVAILABLE", "Could not leave community. Please try again.");
  }
  return { changed: result.changed };
}
