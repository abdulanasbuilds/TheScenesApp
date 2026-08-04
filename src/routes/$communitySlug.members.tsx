import { createFileRoute } from "@tanstack/react-router";
import { CommunityWorkspaceLoader } from "@/components/CommunityWorkspaceLoader";

export const Route = createFileRoute("/$communitySlug/members")({
  head: ({ params }) => ({
    meta: [{ title: `${decodeURIComponent(params.communitySlug)} · Members · SukaSpace` }],
  }),
  component: MembersRoute,
});

function MembersRoute() {
  const { communitySlug } = Route.useParams();
  return <CommunityWorkspaceLoader communitySlug={communitySlug} activeTab="Members" />;
}
