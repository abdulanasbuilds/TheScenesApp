import { createFileRoute } from "@tanstack/react-router";
import { CommunityWorkspaceLoader } from "@/components/CommunityWorkspaceLoader";

export const Route = createFileRoute("/$communitySlug/resources")({
  head: ({ params }) => ({
    meta: [{ title: `${decodeURIComponent(params.communitySlug)} · Resources · SukaSpace` }],
  }),
  component: ResourcesRoute,
});

function ResourcesRoute() {
  const { communitySlug } = Route.useParams();
  return <CommunityWorkspaceLoader communitySlug={communitySlug} activeTab="Resources" />;
}
