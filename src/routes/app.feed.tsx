import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Hash, Heart, MessageSquare, Share2, Send, X, Plus, Trash2, Link2,
  Users, BookOpen, Calendar, Info, LayoutGrid, ExternalLink, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore, type FeedPost, type Community, type CommunityEvent, detectResourceSource } from "@/lib/app-store";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Community · SukaSpace" }] }),
  component: CommunityHub,
});

function CommunityHub() {
  return <CommunityHubInner />;
}

const TABS = ["Feed", "About", "Members", "Resources", "Events", "Courses"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS = {
  Feed: LayoutGrid, About: Info, Members: Users,
  Resources: Link2, Events: Calendar, Courses: BookOpen,
};

const DEFAULT_CHANNELS = [
  { id: "announcements", name: "announcements" },
  { id: "general", name: "general" },
  { id: "questions", name: "questions" },
  { id: "wins", name: "wins" },
];

const SOURCE_META: Record<string, { label: string; color: string }> = {
  gdrive: { label: "Google Drive", color: "bg-green-100 text-green-700" },
  dropbox: { label: "Dropbox", color: "bg-blue-100 text-blue-700" },
  onedrive: { label: "OneDrive", color: "bg-sky-100 text-sky-700" },
  notion: { label: "Notion", color: "bg-slate-100 text-slate-700" },
  github: { label: "GitHub", color: "bg-gray-100 text-gray-700" },
  canva: { label: "Canva", color: "bg-violet-100 text-violet-700" },
  figma: { label: "Figma", color: "bg-orange-100 text-orange-700" },
  other: { label: "Link", color: "bg-slate-100 text-slate-500" },
};

const EVENT_TYPE_STYLES = {
  session: { dot: "bg-sky-500", chip: "bg-sky-100 text-sky-700", label: "Live session" },
  deadline: { dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700", label: "Deadline" },
  meetup: { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700", label: "Meetup" },
  personal: { dot: "bg-violet-500", chip: "bg-violet-100 text-violet-700", label: "Personal" },
};

function toKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

function CommunityHubInner() {
  const store = useAppStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("Feed");
  const community = store.communities[0] ?? null;

  if (!community) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
            <LayoutGrid size={24} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No community yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your own community to get started.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={() => nav({ to: "/create-community" })} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Create a community</button>
            <button onClick={() => nav({ to: "/discover" })} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">Explore</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      {/* Community header */}
      <div className={`relative h-24 bg-gradient-to-br ${community.banner}`}>
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-4 pb-0 translate-y-1/2">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-white bg-foreground text-lg font-bold text-white shadow">{community.avatar}</div>
        </div>
      </div>
      <div className="px-4 pt-10 pb-3">
        <h1 className="text-xl font-bold text-foreground">{community.title}</h1>
        <p className="text-xs text-muted-foreground">{community.category} · {community.members.toLocaleString()} {community.members === 1 ? "member" : "members"} · {community.tag === "FREE" ? "Free" : community.price}</p>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-20 flex gap-0 overflow-x-auto border-b border-border bg-card">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} />{t}
            </button>
          );
        })}
      </div>

      {tab === "Feed" && <FeedTab community={community} />}
      {tab === "About" && <AboutTab community={community} />}
      {tab === "Members" && <MembersTab community={community} />}
      {tab === "Resources" && <ResourcesTab community={community} />}
      {tab === "Events" && <EventsTab community={community} />}
      {tab === "Courses" && <CoursesTab community={community} />}
    </div>
  );
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

function FeedTab({ community }: { community: Community }) {
  const [channel, setChannel] = useState("general");
  const [thread, setThread] = useState<number | null>(null);
  const store = useAppStore();
  const posts = store.posts.filter(p => p.communityId === community.id && p.channel === channel);
  const threadPost = store.posts.find(p => p.id === thread) || null;

  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-180px)]">
      <aside className="hidden border-r border-border bg-card p-2 md:block md:col-span-3 lg:col-span-2">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</div>
        <ul className="space-y-0.5">
          {DEFAULT_CHANNELS.map(c => (
            <li key={c.id}>
              <button
                onClick={() => setChannel(c.id)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${channel === c.id ? "bg-accent font-semibold text-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                <Hash size={14} className={channel === c.id ? "text-primary" : ""} />
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="col-span-12 border-r border-border md:col-span-9 lg:col-span-7">
        <div className="sticky top-[108px] z-10 flex items-center gap-2 border-b border-border bg-card/90 px-4 py-2.5 backdrop-blur">
          <Hash size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold">{channel}</span>
          <span className="text-xs text-muted-foreground">· {posts.length} posts</span>
        </div>
        <div className="space-y-3 p-4">
          <PostComposer communityId={community.id} channel={channel} />
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-semibold text-foreground">No posts yet in #{channel}</p>
              <p className="mt-1 text-xs text-muted-foreground">Start the conversation above.</p>
            </div>
          ) : posts.map(p => <FeedPostCard key={p.id} post={p} onOpenThread={() => setThread(p.id)} />)}
        </div>
      </main>

      <aside className="hidden lg:block lg:col-span-3 bg-card p-3">
        <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Online · 1</div>
        {store.session && (
          <div className="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent">
            <div className="relative">
              <Avatar initials={store.session.avatar} tone="sky" size={28} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{store.session.name}</div>
              <div className="text-xs capitalize text-muted-foreground">{store.session.role}</div>
            </div>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">YOU</span>
          </div>
        )}
      </aside>

      <AnimatePresence>
        {threadPost && <ThreadDrawer post={threadPost} onClose={() => setThread(null)} />}
      </AnimatePresence>
    </div>
  );
}

function PostComposer({ communityId, channel }: { communityId: number; channel: string }) {
  const store = useAppStore();
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    store.addPost({ communityId, channel, title: text.trim().slice(0, 60), body: text.trim(), category: "General" });
    setText("");
  };
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Avatar initials={store.session?.avatar || "YU"} tone="sky" size={28} />
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) submit(); }}
          placeholder="Share something with the community…"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={submit} disabled={!text.trim()} className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Post</button>
      </div>
    </div>
  );
}

const REACTION_EMOJIS = ["👍", "❤️", "🔥", "🎉"];

function FeedPostCard({ post, onOpenThread }: { post: FeedPost; onOpenThread: () => void }) {
  const store = useAppStore();
  const liked = store.isLiked(post.id);
  const reactions = store.getReactions(post.id);
  const [showReact, setShowReact] = useState(false);

  return (
    <motion.article layout whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex cursor-pointer items-start justify-between" onClick={onOpenThread}>
        <div className="flex items-center gap-2">
          <Avatar initials={post.avatar} size={32} />
          <div>
            <div className="text-sm font-semibold">{post.author} <span className="font-normal text-muted-foreground">· {post.role}</span></div>
            <div className="text-xs text-muted-foreground">Just now</div>
          </div>
        </div>
      </div>
      <div className="mt-3 cursor-pointer" onClick={onOpenThread}>
        <h3 className="text-base font-semibold">{post.title}</h3>
        <p className="mt-1 text-sm text-foreground">{post.body}</p>
      </div>

      {/* Reactions display */}
      {reactions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {reactions.map(r => (
            <button key={r.emoji} onClick={() => store.toggleReaction(post.id, r.emoji)} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${r.reacted ? "border-primary bg-sky-50 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
              {r.emoji} {r.count}
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-muted-foreground">
        <button onClick={() => store.toggleLike(post.id)} className={`inline-flex items-center gap-1.5 hover:text-foreground ${liked ? "font-semibold text-red-500" : ""}`}>
          <Heart size={14} fill={liked ? "currentColor" : "none"} /> {post.likes + (liked ? 1 : 0)}
        </button>
        <button onClick={onOpenThread} className="inline-flex items-center gap-1.5 hover:text-foreground"><MessageSquare size={14} /> {post.comments}</button>
        <div className="relative">
          <button onClick={() => setShowReact(v => !v)} className="inline-flex items-center gap-1 hover:text-foreground">React</button>
          {showReact && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowReact(false)} />
              <div className="absolute bottom-7 left-0 z-30 flex gap-1 rounded-lg border border-border bg-card p-2 shadow-md">
                {REACTION_EMOJIS.map(e => (
                  <button key={e} onClick={() => { store.toggleReaction(post.id, e); setShowReact(false); }} className="rounded p-1 text-lg hover:bg-accent">{e}</button>
                ))}
              </div>
            </>
          )}
        </div>
        <button onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})} className="inline-flex items-center gap-1.5 hover:text-foreground ml-auto"><Share2 size={14} /> Share</button>
      </div>
    </motion.article>
  );
}

function ThreadDrawer({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const store = useAppStore();
  const [reply, setReply] = useState("");
  const comments = store.getComments(post.id);

  const sendReply = () => {
    if (!reply.trim()) return;
    store.addComment(post.id, reply.trim());
    setReply("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        onClick={e => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Thread</span>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent"><X size={16} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <div className="flex items-center gap-2">
              <Avatar initials={post.avatar} size={30} />
              <div><div className="text-sm font-semibold">{post.author}</div><div className="text-xs text-muted-foreground">Just now</div></div>
            </div>
            <h3 className="mt-3 text-base font-semibold">{post.title}</h3>
            <p className="mt-1 text-sm">{post.body}</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-muted-foreground">{comments.length} {comments.length === 1 ? "reply" : "replies"}</div>
            {comments.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No replies yet.</p>}
            {comments.map(c => (
              <div key={c.id} className="mt-3 flex items-start gap-2">
                <Avatar initials={c.avatar} size={26} />
                <div className="flex-1 rounded-xl bg-background p-2.5">
                  <div className="text-xs font-semibold">{c.author}</div>
                  <div className="mt-0.5 text-sm">{c.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendReply(); }} placeholder="Reply…" className="flex-1 bg-transparent px-2 text-sm outline-none" />
            <button onClick={sendReply} disabled={!reply.trim()} className="rounded-md bg-primary p-2 text-white disabled:opacity-40"><Send size={14} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────

function AboutTab({ community }: { community: Community }) {
  const store = useAppStore();
  const isCreator = store.session?.email && community.creator === store.session.name;
  const [editOpen, setEditOpen] = useState(false);
  const [summary, setSummary] = useState(community.summary);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-semibold">About this community</h2>
          {isCreator && (
            <button onClick={() => setEditOpen(true)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{community.summary || "No description added yet."}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          {[
            { label: "Members", value: community.members },
            { label: "Category", value: community.category },
            { label: "Access", value: community.tag === "FREE" ? "Free" : community.price || "Paid" },
            { label: "Founded", value: new Date(community.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-background p-3">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Creator</h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar initials={store.session?.avatar || community.avatar} tone="sky" size={40} />
          <div>
            <div className="font-semibold text-foreground">{community.creator}</div>
            <div className="text-xs text-muted-foreground">Community creator</div>
          </div>
        </div>
      </section>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setEditOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Edit community</h2>
              <button onClick={() => setEditOpen(false)}><X size={16} /></button>
            </div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            <button onClick={() => setEditOpen(false)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ community }: { community: Community }) {
  const store = useAppStore();
  const nav = useNavigate();
  const [invite, setInvite] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const isCreator = store.session?.name === community.creator;

  const members = store.session ? [{ id: "self", name: store.session.name, avatar: store.session.avatar, role: isCreator ? "Creator" : "Member", joined: new Date(Date.now()).toLocaleDateString() }] : [];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-xs text-muted-foreground">{community.members.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          {isCreator && (
            <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><Plus size={13} />Invite</button>
          )}
          <button onClick={() => nav({ to: "/app/members" })} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Manage all</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
            <tr><th className="py-2.5 px-4 text-left">Member</th><th className="text-left">Role</th><th className="px-4 text-left">Joined</th></tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <Avatar initials={m.avatar} size={28} />
                    <span className="font-medium text-foreground">{m.name}</span>
                  </div>
                </td>
                <td><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{m.role}</span></td>
                <td className="px-4 text-muted-foreground text-xs">{m.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Invite member</h2>
              <button onClick={() => setShowInvite(false)}><X size={16} /></button>
            </div>
            <input value={invite} onChange={e => setInvite(e.target.value)} placeholder="member@email.com" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
            <button onClick={() => { if (invite.trim()) { store.pushNotification(`Invite sent to ${invite}.`); setInvite(""); setShowInvite(false); } }} disabled={!invite.trim()} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Send invite</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

function ResourcesTab({ community }: { community: Community }) {
  const store = useAppStore();
  const isCreator = store.session?.name === community.creator;
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const resources = store.getCommunityResources(community.id);

  const add = () => {
    if (!url.trim() || !title.trim()) return;
    store.addCommunityResource(community.id, { title: title.trim(), url: url.trim() });
    setUrl(""); setTitle(""); setAdding(false);
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Community Resources</h2>
          <p className="text-xs text-muted-foreground">Shared links accessible to all members</p>
        </div>
        {isCreator && (
          <button onClick={() => setAdding(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><Plus size={13} />Add resource</button>
        )}
      </div>

      {adding && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Course notes" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Link (Google Drive, Notion, GitHub, Figma, etc.)</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            {url && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Source detected: <span className="font-semibold text-foreground">{SOURCE_META[detectResourceSource(url)].label}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!url.trim() || !title.trim()} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add</button>
            <button onClick={() => setAdding(false)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Link2 size={24} className="mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-foreground">No resources yet</p>
          <p className="mt-1 text-xs text-muted-foreground">{isCreator ? "Add Google Drive, Notion, GitHub, Figma or any link." : "The creator hasn't shared any resources yet."}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {resources.map(r => {
            const meta = SOURCE_META[r.source];
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${meta.color}`}>{meta.label.slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{r.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{meta.label}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><ExternalLink size={14} /></a>
                  {isCreator && (
                    <button onClick={() => store.removeCommunityResource(r.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab({ community }: { community: Community }) {
  const store = useAppStore();
  const isCreator = store.session?.name === community.creator;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<CommunityEvent["type"]>("session");
  const [adding, setAdding] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState(toKey(new Date()));

  const events = store.getCommunityEvents(community.id);
  const todayKey = toKey(new Date());

  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CommunityEvent[]>();
    events.forEach(e => { const list = map.get(e.date) || []; list.push(e); map.set(e.date, list); });
    return map;
  }, [events]);

  const addEvent = () => {
    if (!title.trim() || !date) return;
    store.addCommunityEvent(community.id, { title: title.trim(), date, time: time || undefined, type });
    setTitle(""); setDate(""); setTime(""); setType("session"); setAdding(false);
  };

  const changeMonth = (d: number) => setMonth(cur => {
    let m = cur.m + d, y = cur.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  const selectedEvents = eventsByDate.get(selectedDate) || [];
  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Events</h2>
        {isCreator && (
          <button onClick={() => setAdding(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={13} />Add event</button>
        )}
      </div>

      {adding && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["session", "deadline", "meetup", "personal"] as CommunityEvent["type"][]).map(t => (
              <button key={t} onClick={() => setType(t)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize ${type === t ? "border-primary bg-sky-50 text-primary" : "border-border text-muted-foreground"}`}>{EVENT_TYPE_STYLES[t].label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addEvent} disabled={!title.trim() || !date} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add event</button>
            <button onClick={() => setAdding(false)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <button onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <button onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 p-2 text-center text-[10px] font-semibold text-muted-foreground">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-2 pb-2">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const key = `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasEvents = eventsByDate.has(key);
              const isToday = key === todayKey;
              const isSel = key === selectedDate;
              return (
                <button key={i} onClick={() => setSelectedDate(key)} className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full text-sm ${isSel ? "bg-primary text-white font-bold" : isToday ? "border border-primary text-primary font-bold" : "text-foreground hover:bg-accent"}`}>
                  {day}
                  {hasEvents && !isSel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          {selectedEvents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No events on this day.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {selectedEvents.map(e => {
                const style = EVENT_TYPE_STYLES[e.type];
                return (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.time ? `${e.time} · ` : ""}<span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${style.chip}`}>{style.label}</span></div>
                    </div>
                    {isCreator && (
                      <button onClick={() => store.removeCommunityEvent(e.id)} className="shrink-0 rounded p-1 text-muted-foreground hover:text-rose-600"><Trash2 size={14} /></button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CoursesTab({ community }: { community: Community }) {
  const store = useAppStore();
  const nav = useNavigate();
  const isCreator = store.session?.name === community.creator;
  const communityCourses = store.courses.filter(c => c.communityId === community.id && (c.published || c.creatorEmail === store.session?.email));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Courses</h2>
          <p className="text-xs text-muted-foreground">{communityCourses.filter(c => c.published).length} published</p>
        </div>
        {isCreator && (
          <button onClick={() => nav({ to: "/app/courses" })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={13} />Create course</button>
        )}
      </div>

      {communityCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <BookOpen size={24} className="mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold">No courses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">{isCreator ? "Create your first course in the Course Builder." : "The creator hasn't published any courses yet."}</p>
          {isCreator && <button onClick={() => nav({ to: "/app/courses" })} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Go to Course Builder</button>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communityCourses.map(course => {
            const progress = store.getCourseProgress(course.id);
            const enrolled = store.isEnrolled(course.id);
            const totalLessons = course.modules.flatMap(m => m.lessons).length;
            return (
              <div key={course.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="h-24 bg-gradient-to-br from-sky-100 to-blue-50 flex items-center justify-center">
                  <BookOpen size={28} className="text-sky-400" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{course.title}</h3>
                    {!course.published && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Draft</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 flex-1">{course.description || "No description."}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}</div>
                  {enrolled && progress.total > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{progress.completed}/{progress.total} complete</div>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {enrolled ? (
                      <button onClick={() => nav({ to: "/app/classroom" })} className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white text-center">Continue</button>
                    ) : (
                      <button onClick={() => { store.enrollInCourse(course.id); nav({ to: "/app/classroom" }); }} className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">Enroll</button>
                    )}
                    {isCreator && (
                      <button onClick={() => nav({ to: "/app/courses" })} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Edit</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
