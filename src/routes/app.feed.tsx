import { createFileRoute } from "@tanstack/react-router";
import { CommunityWorkspaceInner } from "@/components/CommunityWorkspaceLoader";
import { useAppStore } from "@/lib/app-store";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Community · SukaSpace" }] }),
  component: CommunityHub,
});

function CommunityHub() {
  const store = useAppStore();
  const nav = useNavigate();
  const community = store.communities[0] ?? null;

  if (!community) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <h2 className="mt-4 text-lg font-semibold text-foreground">No community yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your own community to get started.
          </p>
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <button
              onClick={() => nav({ to: "/create-community" })}
              className="rounded-3xl bg-primary px-6 py-2.5 text-base font-extrabold text-white border border-transparent hover:bg-primary/85 h-12"
            >
              Create a community
            </button>
            <button
              onClick={() => nav({ to: "/discover" })}
              className="rounded-3xl border border-gray-300 bg-card px-6 py-2.5 text-base font-extrabold text-foreground hover:bg-gray-50 h-12"
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <CommunityWorkspaceInner community={community} />;
}
