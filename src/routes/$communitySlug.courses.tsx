import { createFileRoute } from "@tanstack/react-router";
import { CommunityWorkspaceLoader } from "@/components/CommunityWorkspaceLoader";

export const Route = createFileRoute("/$communitySlug/courses")({
  head: ({ params }) => ({
    meta: [{ title: `${decodeURIComponent(params.communitySlug)} · Courses · SukaSpace` }],
  }),
  component: CoursesRoute,
});

function CoursesRoute() {
  const { communitySlug } = Route.useParams();
  return <CommunityWorkspaceLoader communitySlug={communitySlug} activeTab="Courses" />;
}
