import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Reply,
  ShieldCheck,
} from "lucide-react";
import { CommunityShell } from "@/components/layout/community-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  Textarea,
} from "@/components/ui";
import { creators, currentUserId, getCommunity, getMember, posts as seedPosts } from "@/data/seed";
import type { PostComment } from "@/data/types";
import { cn, relativeTime } from "@/lib/utils";
import { useApp, usePosts, useToast } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/posts/$postId")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community, postId: params.postId };
  },
  head: ({ loaderData }) => {
    const post = loaderData ? seedPosts.find((item) => item.id === loaderData.postId) : undefined;
    return { meta: [{ title: `${post?.title ?? "Discussion"} — The Scenes` }] };
  },
  component: PostDetailPage,
});

function PostDetailPage() {
  const { community, postId } = Route.useLoaderData();
  const router = useRouter();
  const post = usePosts().find((item) => item.id === postId);
  const { state, toggleLike, addComment } = useApp();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!post)
    return (
      <CommunityShell community={community} active="feed">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Card className="p-7 text-center">
            <h1 className="font-display text-2xl font-extrabold text-slate-900">
              This discussion is no longer available.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Local posts disappear when the preview session resets. Return to the feed to continue.
            </p>
            <a
              href={`/c/${community.slug}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white"
            >
              Return to community
            </a>
          </Card>
        </div>
      </CommunityShell>
    );
  const author =
    creators.find((creator) => creator.id === post.authorId) ?? getMember(post.authorId);
  const liked = state.likedPosts.includes(post.id);

  const copyDiscussionLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied", url);
    } catch {
      toast("Copy unavailable", `Copy this address manually: ${url}`);
    }
  };

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 2) {
      setError("Write at least two characters before posting.");
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      addComment(post.id, comment.trim());
      setComment("");
      setError("");
      setSubmitting(false);
      toast("Comment posted", "Saved to local preview state.");
    }, 350);
  };

  return (
    <CommunityShell community={community} active="feed">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <a
            href={`/c/${community.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to community
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 space-y-4">
          <Card as="article" className="overflow-hidden">
            {post.pinned ? (
              <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-2.5 text-[11px] font-bold tracking-wide text-indigo-800 uppercase">
                Pinned discussion
              </div>
            ) : null}
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <Avatar
                  name={author?.name ?? "Member"}
                  size={46}
                  online={Boolean(
                    "online" in (author ?? {}) && (author as { online?: boolean }).online,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/c/${community.slug}/members/${post.authorId}`}
                      className="font-bold text-slate-900 hover:text-indigo-700"
                    >
                      {author?.name}
                    </a>
                    {"verified" in (author ?? {}) && (author as { verified?: boolean }).verified ? (
                      <Badge tone="indigo">Verified creator</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {relativeTime(post.createdAt)} · {post.category}
                  </p>
                </div>
                <Dropdown>
                  <DropdownTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Discussion actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownTrigger>
                  <DropdownContent>
                    {post.authorId === currentUserId ? (
                      <DropdownItem
                        onSelect={() =>
                          void router.navigate({
                            href: `/c/${community.slug}/posts/new?edit=${encodeURIComponent(post.id)}`,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" /> Edit post
                      </DropdownItem>
                    ) : null}
                    <DropdownItem onSelect={() => void copyDiscussionLink()}>
                      <Link2 className="h-4 w-4" /> Copy link
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      onSelect={() =>
                        toast(
                          "Report noted",
                          "No report was sent; moderation is not connected in this preview.",
                        )
                      }
                    >
                      <Flag className="h-4 w-4" /> Report discussion
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </div>

              {post.title ? (
                <h1 className="mt-6 font-display text-2xl leading-tight font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  {post.title}
                </h1>
              ) : null}
              <p className="mt-4 text-[15px] leading-7 whitespace-pre-line text-slate-700">
                {post.body}
              </p>

              {post.attachment ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">{post.attachment.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {post.attachment.meta} · Preview attachment
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  aria-pressed={liked}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
                    liked
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-rose-600")} /> {post.likes}
                </button>
                <span className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                  <MessageCircle className="h-4 w-4" /> {post.comments.length}
                </span>
              </div>
            </div>
          </Card>

          <section aria-labelledby="comments-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="comments-heading"
                className="font-display text-lg font-extrabold text-slate-900"
              >
                Discussion · {post.comments.length}
              </h2>
              <span className="text-xs font-semibold text-slate-500">Oldest first</span>
            </div>
            <Card className="divide-y divide-slate-100">
              {post.comments.map((item) => (
                <Comment key={item.id} comment={item} communitySlug={community.slug} />
              ))}
              {!post.comments.length ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-slate-900">Start the discussion</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ask a specific question or add useful context.
                  </p>
                </div>
              ) : null}
            </Card>
          </section>

          <Card className="p-4 sm:p-5">
            <form onSubmit={submitComment} noValidate>
              <div className="flex gap-3">
                <Avatar name="Ama Boateng" size={38} online />
                <div className="min-w-0 flex-1">
                  <label htmlFor="new-comment" className="sr-only">
                    Add a comment
                  </label>
                  <Textarea
                    id="new-comment"
                    value={comment}
                    onChange={(event) => {
                      setComment(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Add something useful to the discussion…"
                    invalid={Boolean(error)}
                    aria-describedby={error ? "comment-error" : "comment-hint"}
                    className="min-h-24"
                  />
                  {error ? (
                    <p
                      id="comment-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {error}
                    </p>
                  ) : (
                    <p id="comment-hint" className="mt-1.5 text-xs text-slate-500">
                      Be specific, kind and relevant to the post.
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button type="submit" size="sm" disabled={submitting}>
                      {submitting ? "Posting…" : "Post comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        <aside
          className="space-y-4 lg:sticky lg:top-20 lg:self-start"
          aria-label="Discussion context"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wide">Healthy discussion</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Critique the system, not the person. Report content only when it breaks the house
              rules.
            </p>
          </Card>
          <Card className="p-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              In this thread
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-semibold text-slate-900">{post.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Reactions</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{post.likes}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Replies</dt>
                <dd className="font-semibold tabular-nums text-slate-900">
                  {post.comments.length}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </CommunityShell>
  );
}

function Comment({
  comment,
  communitySlug,
  nested = false,
}: {
  comment: PostComment;
  communitySlug: string;
  nested?: boolean;
}) {
  const author =
    getMember(comment.authorId) ?? creators.find((creator) => creator.id === comment.authorId);
  const { toast } = useToast();
  return (
    <div
      className={cn(
        "p-4 sm:p-5",
        nested && "ml-7 border-l-2 border-indigo-100 bg-slate-50/60 sm:ml-10",
      )}
    >
      <div className="flex gap-3">
        <a href={`/c/${communitySlug}/members/${comment.authorId}`}>
          <Avatar
            name={author?.name ?? "Member"}
            size={nested ? 30 : 36}
            online={Boolean("online" in (author ?? {}) && (author as { online?: boolean }).online)}
          />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/c/${communitySlug}/members/${comment.authorId}`}
              className="text-sm font-bold text-slate-900 hover:text-indigo-700"
            >
              {author?.name}
            </a>
            <span className="text-xs text-slate-600">{relativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-slate-700">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                toast("Reaction saved", "Comment reactions are local preview state only.")
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-700"
            >
              <Heart className="h-3.5 w-3.5" /> {comment.likes || "Like"}
            </button>
            <button
              type="button"
              onClick={() =>
                toast(
                  "Reply composer",
                  "Nested reply creation will connect to the community API later.",
                )
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-700"
            >
              <Reply className="h-3.5 w-3.5" /> Reply
            </button>
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <Comment key={reply.id} comment={reply} communitySlug={communitySlug} nested />
      ))}
    </div>
  );
}
