import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/$communitySlug/settings")({
  head: ({ params }) => ({
    meta: [{ title: `${decodeURIComponent(params.communitySlug)} · Settings · SukaSpace` }],
  }),
  component: CommunitySettings,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function CommunitySettings() {
  const { communitySlug } = Route.useParams();
  const store = useAppStore();
  const nav = useNavigate();

  const community = useMemo(
    () => store.communities.find((c) => slugify(c.title) === communitySlug),
    [store.communities, communitySlug]
  );

  const isOwner = useMemo(() => {
    if (!community || !store.session) return false;
    return store.session.email === community.creatorEmail;
  }, [store.session, community]);

  useEffect(() => {
    if (store.isHydrated && community && !isOwner) {
      toast.error("You are not authorized to view settings for this community.");
      nav({ to: `/${communitySlug}/posts` });
    }
  }, [store.isHydrated, community, isOwner, communitySlug, nav]);

  const [title, setTitle] = useState(community?.title || "");
  const [summary, setSummary] = useState(community?.summary || "");
  const [welcomeMessage, setWelcomeMessage] = useState(community?.welcomeMessage || "");
  const [color, setColor] = useState(community?.color || "#3B82F6");

  if (!community || !isOwner) {
    return null;
  }

  const handleSave = () => {
    store.updateCommunity(community.id, {
      title: title.trim(),
      summary: summary.trim(),
      welcomeMessage: welcomeMessage.trim(),
      color: color,
    });
    toast.success("Community settings updated successfully!");
    const newSlug = slugify(title.trim());
    if (newSlug !== communitySlug) {
      nav({ to: `/${newSlug}/settings` });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete "${community.title}"? This cannot be undone.`)) {
      store.deleteCommunity(community.id);
      toast.success("Community deleted successfully.");
      nav({ to: "/discover" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Community Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure metadata, onboarding messages, and branding options for {community.title}.
          </p>
        </div>
        <Link
          to={`/${communitySlug}/posts`}
          className="text-xs font-semibold text-primary hover:underline border border-border rounded-lg bg-card px-3 py-1.5 shadow-sm"
        >
          ← Back to Feed
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Community Name
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            maxLength={100}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description / Summary
          </span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
            maxLength={400}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Welcome Message (Auto-DM on join)
          </span>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
            placeholder="Introduce new members to your goals or rules..."
            maxLength={500}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Brand HEX Color
          </span>
          <div className="mt-1.5 flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-9 rounded border border-border p-0.5 cursor-pointer"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              maxLength={7}
            />
          </div>
        </label>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Save Changes
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-rose-700">Delete Community</h2>
        <p className="mt-1 text-sm text-rose-600">
          This permanently deletes the community, including all posts, files, members, events, and courses.
        </p>
        <button
          onClick={handleDelete}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          <Trash2 size={14} /> Delete permanently
        </button>
      </section>
    </div>
  );
}
