import { createFileRoute, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { AppShell } from "@/components/AppShell";
import { useMemo, useEffect } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$communitySlug")({
  component: CommunityLayout,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CommunityLayout() {
  const { communitySlug } = Route.useParams();
  const store = useAppStore();
  const loc = useLocation();
  const nav = useNavigate();

  const community = useMemo(
    () => store.communities.find((c) => slugify(c.title) === communitySlug),
    [store.communities, communitySlug]
  );

  const isAbout = loc.pathname.endsWith("/about");

  const isJoined = useMemo(() => {
    if (!community) return false;
    return store.isJoined(community.id);
  }, [store.joinedCommunityIds, community]);

  const isOwner = useMemo(() => {
    if (!community || !store.session) return false;
    return store.session.email === community.creatorEmail;
  }, [store.session, community]);

  useEffect(() => {
    if (!store.isHydrated) return;

    if (!isAbout) {
      if (!store.session) {
        nav({ to: "/auth", search: { mode: "signin" } });
      } else if (community && !isJoined && !isOwner) {
        nav({ to: `/${communitySlug}/about` });
      }
    }
  }, [store.isHydrated, store.session, isJoined, isOwner, isAbout, communitySlug, community]);

  if (!store.isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm font-semibold">Loading SukaSpace…</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-slate-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Community not found</h1>
            <p className="text-sm text-slate-500 mt-1">
              This community may be private or has been removed.
            </p>
            <Link
              to="/discover"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Browse Discover <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAbout) {
    return <Outlet />;
  }

  if (!store.session || (!isJoined && !isOwner)) {
    return null; // Don't flash unauthorized workspace page content during redirect
  }

  return (
    <AppShell />
  );
}
