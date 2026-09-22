import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Globe, Lock, Users, ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { useAppStore, type Community } from "@/lib/app-store";
import { PublicHeader } from "@/components/PublicHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$slug/about")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.slug)} · The Scenes` },
      {
        name: "description",
        content: `Preview and join the ${decodeURIComponent(params.slug)} community on The Scenes.`,
      },
      { property: "og:title", content: `${decodeURIComponent(params.slug)} · The Scenes` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityAbout,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CommunityAbout() {
  const { slug } = Route.useParams();
  const store = useAppStore();
  const nav = useNavigate();

  const community: Community | undefined = useMemo(
    () => store.communities.find((c) => slugify(c.title) === slug),
    [store.communities, slug],
  );

  if (!community) {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col">
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
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Browse Discover <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const brand = community.color || "#3B82F6";
  const joined = store.isJoined(community.id);

  const handleJoin = () => {
    if (!store.session) {
      window.location.assign(`/auth?next=/c/${slug}/about`);
      return;
    }
    store.joinCommunity(community.id);
    nav({ to: "/app/feed" });
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <PublicHeader />

      {/* Cover */}
      <div
        className="relative w-full aspect-[1084/380] max-h-[380px] overflow-hidden"
        style={{ backgroundColor: brand }}
      >
        {community.coverImageUrl && (
          <img
            src={community.coverImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="max-w-3xl w-full mx-auto -mt-14 px-4 sm:px-6 pb-16 relative z-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-md flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: brand }}
            >
              {community.iconUrl ? (
                <img
                  src={community.iconUrl}
                  alt={community.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                community.title.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                  {community.title}
                </h1>
                {community.isPrivate ? (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Private
                  </span>
                ) : (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {community.category} · by {community.creator}
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed mt-5 whitespace-pre-wrap">
            {community.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${brand}20`, color: brand }}
            >
              {community.tag === "FREE" ? "Free" : community.price || "Paid"}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> {community.members.toLocaleString()} members
            </span>
          </div>

          {community.discoveryKeywords && community.discoveryKeywords.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {community.discoveryKeywords.map((k) => (
                  <span
                    key={k}
                    className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {community.screeningQuestions && community.screeningQuestions.length > 0 && !joined && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Before you join, you'll be asked:
              </p>
              <ul className="space-y-1.5">
                {community.screeningQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 pl-3 border-l-2"
                    style={{ borderColor: brand }}
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleJoin}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm text-white",
                joined ? "bg-slate-400 cursor-default" : "hover:opacity-90",
              )}
              style={!joined ? { backgroundColor: brand } : undefined}
              disabled={joined}
            >
              {joined
                ? "You're a member"
                : community.tag === "PAID"
                  ? `Join · ${community.price ?? ""}`
                  : "Join community"}
              {!joined && <ArrowRight className="w-4 h-4" />}
            </button>
            <Link
              to="/discover"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
            >
              Back to Discover
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
