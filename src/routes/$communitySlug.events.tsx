import { createFileRoute } from "@tanstack/react-router";
import { CommunityWorkspaceLoader } from "@/components/CommunityWorkspaceLoader";

export const Route = createFileRoute("/$communitySlug/events")({
  head: ({ params }) => ({
    meta: [{ title: `${decodeURIComponent(params.communitySlug)} · Events · SukaSpace` }],
  }),
  component: EventsRoute,
});

function EventsRoute() {
  const { communitySlug } = Route.useParams();
  return <CommunityWorkspaceLoader communitySlug={communitySlug} activeTab="Events" />;
}
