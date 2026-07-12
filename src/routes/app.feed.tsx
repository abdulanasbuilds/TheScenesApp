import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Hash, Heart, MessageSquare, Share2, MoreHorizontal, Send, X } from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore, type FeedPost } from "@/lib/app-store";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Community · SukaSpace" }] }),
  component: Feed,
});

const DEFAULT_CHANNELS = [
  { id: "announcements", name: "announcements" },
  { id: "general", name: "general" },
  { id: "questions", name: "questions" },
  { id: "wins", name: "wins" },
];

function Feed() {
  const [active, setActive] = useState("general");
  const [thread, setThread] = useState<number | null>(null);
  const [showChannels, setShowChannels] = useState(false);
  const store = useAppStore();
  const nav = useNavigate();

  const community = store.communities[0] ?? null;
  const threadPost = store.posts.find((p) => p.id === thread) || null;

  if (!community) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
            <Hash size={24} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No community yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your own community or explore existing ones to start engaging in discussions.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={() => nav({ to: "/create-community" })} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Create a community</button>
            <button onClick={() => nav({ to: "/discover" })} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">Explore communities</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-56px)]">
      <aside className={`col-span-12 md:col-span-3 lg:col-span-2 border-r border-border bg-card ${showChannels ? "" : "hidden md:block"}`}>
        <div className="border-b border-border p-3">
          <div className="truncate text-sm font-semibold text-foreground">{community.title}</div>
          <div className="text-xs text-muted-foreground">{community.members.toLocaleString()} {community.members === 1 ? "member" : "members"}</div>
        </div>
        <div className="p-2">
          <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spaces</div>
          <ul className="space-y-0.5">
            {DEFAULT_CHANNELS.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { setActive(c.id); setShowChannels(false); }}
                  className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${active === c.id ? "bg-accent font-semibold text-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <Hash size={14} className={active === c.id ? "text-primary" : "text-muted-foreground"} />
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-6 lg:col-span-7 border-r border-border">
        <div className="sticky top-14 z-10 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChannels((v) => !v)} className="md:hidden rounded border border-border px-2 py-1 text-xs">Channels</button>
            <Hash size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{active}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">· {store.posts.length} {store.posts.length === 1 ? "post" : "posts"}</span>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <PostComposer />
          {store.posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm font-semibold text-foreground">No posts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Be the first to share an insight, ask a question, or drop a win.</p>
            </div>
          ) : (
            store.posts.map((p) => (
              <FeedPostCard key={p.id} post={p} onOpenThread={() => setThread(p.id)} />
            ))
          )}
        </div>
      </main>

      <aside className="hidden lg:block lg:col-span-3 bg-card p-3">
        <div className="mb-2 px-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Online · {store.session ? 1 : 0}</div>
        </div>
        {store.session ? (
          <ul className="space-y-1">
            <li className="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent">
              <div className="relative">
                <Avatar initials={store.session.avatar} tone="sky" size={30} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{store.session.name}</div>
                <div className="truncate text-xs capitalize text-muted-foreground">{store.session.role}</div>
              </div>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">YOU</span>
            </li>
          </ul>
        ) : (
          <p className="px-1 text-xs text-muted-foreground">No members online.</p>
        )}
      </aside>

      <AnimatePresence>
        {threadPost && (
          <ThreadDrawer post={threadPost} onClose={() => setThread(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedPostCard({ post, onOpenThread }: { post: FeedPost; onOpenThread: () => void }) {
  const store = useAppStore();
  const liked = store.isLiked(post.id);

  return (
    <motion.article
      layout
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex cursor-pointer items-start justify-between" onClick={onOpenThread}>
        <div className="flex items-center gap-2">
          <Avatar initials={post.avatar} size={36} tone="slate" />
          <div>
            <div className="text-sm font-semibold text-foreground">{post.author} <span className="font-normal text-muted-foreground">· {post.role}</span></div>
            <div className="text-xs text-muted-foreground">{post.category} · Just now</div>
          </div>
        </div>
        <button onClick={(e) => e.stopPropagation()} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><MoreHorizontal size={16} /></button>
      </div>
      <div className="cursor-pointer" onClick={onOpenThread}>
        <h3 className="mt-3 text-base font-semibold text-foreground">{post.title}</h3>
        <p className="mt-1 text-sm text-foreground">{post.body}</p>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-muted-foreground">
        <button onClick={() => store.toggleLike(post.id)} className={`inline-flex items-center gap-1.5 hover:text-foreground ${liked ? "font-semibold text-red-500" : ""}`}>
          <Heart size={14} fill={liked ? "currentColor" : "none"} /> {post.likes}
        </button>
        <button onClick={onOpenThread} className="inline-flex items-center gap-1.5 hover:text-foreground"><MessageSquare size={14} /> {post.comments}</button>
        <button onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})} className="inline-flex items-center gap-1.5 hover:text-foreground"><Share2 size={14} /> Share</button>
      </div>
    </motion.article>
  );
}

function PostComposer() {
  const store = useAppStore();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    store.addPost({ title: text.trim().slice(0, 60), body: text.trim(), category: "General" });
    setText("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Avatar initials={store.session?.avatar || "YU"} tone="sky" size={30} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Share an insight, ask a question, drop a win…"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={submit} disabled={!text.trim()} className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Post</button>
      </div>
    </div>
  );
}

function ThreadDrawer({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const store = useAppStore();
  const [reply, setReply] = useState("");
  const [localComments, setLocalComments] = useState<{ a: string; av: string; t: string }[]>([]);

  const sendReply = () => {
    if (!reply.trim()) return;
    setLocalComments((c) => [...c, { a: store.session?.name || "You", av: store.session?.avatar || "YU", t: reply.trim() }]);
    setReply("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Thread</div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <div className="flex items-center gap-2">
              <Avatar initials={post.avatar} size={32} />
              <div>
                <div className="text-sm font-semibold text-foreground">{post.author}</div>
                <div className="text-xs text-muted-foreground">Just now</div>
              </div>
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">{post.title}</h3>
            <p className="mt-2 text-sm text-foreground">{post.body}</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-muted-foreground">{localComments.length} {localComments.length === 1 ? "comment" : "comments"}</div>
            {localComments.length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">No replies yet. Be the first to respond.</p>
            )}
            {localComments.map((c, i) => (
              <div key={i} className="mt-3 flex items-start gap-2">
                <Avatar initials={c.av} size={28} />
                <div className="flex-1 rounded-xl bg-background p-2.5">
                  <div className="text-xs font-semibold text-foreground">{c.a}</div>
                  <div className="mt-0.5 text-sm text-foreground">{c.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
              placeholder="Reply to thread…"
              className="flex-1 bg-transparent px-2 text-sm outline-none"
            />
            <button onClick={sendReply} disabled={!reply.trim()} className="rounded-md bg-primary p-2 text-white disabled:opacity-40"><Send size={14} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
