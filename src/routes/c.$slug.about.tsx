import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/c/$slug/about")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: `/${params.slug}/about` });
  },
});
