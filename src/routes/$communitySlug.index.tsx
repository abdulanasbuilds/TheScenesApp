import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$communitySlug/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: `/${params.communitySlug}/posts` });
  },
});
