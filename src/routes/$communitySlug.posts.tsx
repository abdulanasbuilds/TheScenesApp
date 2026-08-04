import { createFileRoute } from "@tanstack/react-router";
import { CommunityWorkspaceLoader } from "@/components/CommunityWorkspaceLoader";

export const Route = createFileRoute("/$communitySlug/posts")({
  head: ({ params }) => ({
    meta: [{ title: `${decodeURIComponent(params.communitySlug)} · Feed · SukaSpace` }],
  }),
  component: PostsRoute,
});

function PostsRoute() {
  const { communitySlug } = Route.useParams();
  return <CommunityWorkspaceLoader communitySlug={communitySlug} activeTab="Feed" />;
}
