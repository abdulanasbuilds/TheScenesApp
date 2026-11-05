import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bold, ImagePlus, Italic, Link2, List, Paperclip, Save, Send, X } from "lucide-react";
import { CommunityShell } from "@/components/layout/community-shell";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { currentUserId, getCommunity } from "@/data/seed";
import { createLocalId } from "@/lib/utils";
import { useApp, usePosts, useToast } from "@/store/app-store";

type PostEditorSearch = { edit?: string };

export const Route = createFileRoute("/c/$communityId/posts/new")({
  validateSearch: (search: Record<string, unknown>): PostEditorSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `New post · ${loaderData?.community.name ?? "The Scenes"}` }],
  }),
  component: NewPostPage,
});

function NewPostPage() {
  const { community } = Route.useLoaderData();
  const { edit: editId } = Route.useSearch();
  const posts = usePosts();
  const editingPost = editId
    ? posts.find(
        (post) =>
          post.id === editId &&
          post.communitySlug === community.slug &&
          post.authorId === currentUserId,
      )
    : undefined;
  const { addPost, updatePost } = useApp();
  const { toast } = useToast();
  const draftKey = `the-scenes-draft-${community.slug}-${editId ?? "new"}`;
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [body, setBody] = useState(editingPost?.body ?? "");
  const [category, setCategory] = useState(editingPost?.category ?? "Questions");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (editId) return;
    const restoreTimer = window.setTimeout(() => {
      const saved = window.sessionStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { title?: string; body?: string; category?: string };
          setTitle(parsed.title ?? "");
          setBody(parsed.body ?? "");
          setCategory(parsed.category ?? "Questions");
        } catch {
          window.sessionStorage.removeItem(draftKey);
        }
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [draftKey, editId]);

  const saveDraft = () => {
    window.sessionStorage.setItem(draftKey, JSON.stringify({ title, body, category }));
    toast("Draft saved", "Stored in this browser tab only.");
  };
  const publish = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (body.trim().length < 20)
      next.body = "Add at least 20 characters so members have enough context.";
    if (title.trim() && title.trim().length < 5)
      next.title = "Use at least 5 characters or leave the title empty.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const changes = {
      category,
      title: title.trim() || undefined,
      body: body.trim(),
    };
    if (editingPost) {
      updatePost(editingPost.id, changes);
    } else {
      addPost({
        id: createLocalId("post-local"),
        communitySlug: community.slug,
        authorId: currentUserId,
        ...changes,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      });
    }
    window.sessionStorage.removeItem(draftKey);
    setPublished(true);
    toast(
      editingPost ? "Post updated in preview" : "Post published to preview",
      "It now appears at the top of the local community feed.",
    );
  };

  if (editId && !editingPost)
    return (
      <CommunityShell community={community} active="feed">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Card className="p-7 text-center">
            <h1 className="font-display text-2xl font-extrabold text-slate-900">
              This post cannot be edited here.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Only posts you created during this local preview session can be edited.
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

  if (published)
    return (
      <CommunityShell community={community} active="feed">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Card className="p-7 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Send className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">
              {editingPost ? "Your post was updated." : "Your post is on the local feed."}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No server request was made. The post will remain until this preview state resets.
            </p>
            <a
              href={`/c/${community.slug}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white"
            >
              View community feed
            </a>
          </Card>
        </div>
      </CommunityShell>
    );

  const insert = (token: string) => setBody((current) => `${current}${current ? " " : ""}${token}`);
  return (
    <CommunityShell community={community} active="feed">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-slate-500">{community.name}</p>
            <h1 className="font-display text-xl font-extrabold text-slate-900">
              {editingPost ? "Edit post" : "Create a post"}
            </h1>
          </div>
          <a
            href={`/c/${community.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Cancel post"
          >
            <X className="h-5 w-5" />
          </a>
        </div>
      </div>
      <div className="mx-auto grid max-w-4xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <Card className="overflow-hidden">
          <form onSubmit={publish} noValidate>
            <div className="space-y-5 p-5 sm:p-6">
              <Field label="Category" htmlFor="post-category">
                <Select
                  id="post-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>Questions</option>
                  <option>Build logs</option>
                  <option>Resources</option>
                  <option>Wins</option>
                  <option>Announcements</option>
                </Select>
              </Field>
              <Field
                label="Title"
                htmlFor="post-title"
                hint="Optional — useful for longer discussions"
                error={errors.title}
              >
                <Input
                  id="post-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  invalid={Boolean(errors.title)}
                  placeholder="A clear title helps people decide whether to open the post"
                />
              </Field>
              <div>
                <label htmlFor="post-body" className="text-[13px] font-semibold text-slate-800">
                  Post body
                  <span className="text-clay-600" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-slate-300 bg-slate-50 p-2">
                  {[
                    [Bold, "**bold**"],
                    [Italic, "_emphasis_"],
                    [List, "\n- item"],
                    [Link2, "[link](https://)"],
                    [ImagePlus, "[image]"],
                    [Paperclip, "[attachment]"],
                  ].map(([Icon, token], index) => {
                    const ToolIcon = Icon as typeof Bold;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          index < 4
                            ? insert(String(token))
                            : toast(
                                "Attachment unavailable",
                                "File storage is not connected in this frontend phase.",
                              )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-900"
                        aria-label={`Insert ${String(token)}`}
                      >
                        <ToolIcon className="h-4 w-4" />
                      </button>
                    );
                  })}
                  <Badge tone="outline" className="ml-auto">
                    Markdown preview
                  </Badge>
                </div>
                <Textarea
                  id="post-body"
                  value={body}
                  onChange={(event) => {
                    setBody(event.target.value);
                    if (errors.body) setErrors({ ...errors, body: "" });
                  }}
                  invalid={Boolean(errors.body)}
                  className="min-h-64 rounded-t-none"
                  placeholder="Share the constraint, what you tried and the question you want answered…"
                />
                {errors.body ? (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.body}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {body.length} characters · be specific and give enough context
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <Button type="button" variant="secondary" onClick={saveDraft}>
                <Save className="h-4 w-4" /> Save draft
              </Button>
              <div className="flex gap-2">
                <a
                  href={`/c/${community.slug}`}
                  className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </a>
                <Button type="submit">
                  <Send className="h-4 w-4" /> {editingPost ? "Save changes" : "Publish post"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              A useful post includes
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
              <li>• The real context and constraint</li>
              <li>• What you already tried</li>
              <li>• Evidence, numbers or a screenshot</li>
              <li>• One clear question or takeaway</li>
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              Draft behaviour
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Drafts use session storage. Published posts use in-memory state. Neither is synced to
              a backend.
            </p>
          </Card>
        </aside>
      </div>
    </CommunityShell>
  );
}
