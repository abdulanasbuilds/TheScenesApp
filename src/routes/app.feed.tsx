import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Hash, Heart, MessageSquare, Share2, MoreHorizontal, Send, X, Pin, BarChart3 } from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_CHANNELS, MOCK_COMMUNITY_POSTS, MOCK_ONLINE } from "@/lib/mock-data";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Community · SukaSpace" }] }),
  component: Feed,
});

function Feed() {
  const [active, setActive] = useState("ai-automation-engineering");
  const [thread, setThread] = useState<number | null>(null);
  const [showChannels, setShowChannels] = useState(false);

  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-56px)]">
      {/* Channels rail */}
      <aside className={`col-span-12 md:col-span-3 lg:col-span-2 border-r border-slate-200 bg-white ${showChannels ? "" : "hidden md:block"}`}>
        <div className="border-b border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-900">AI Automation Architects</div>
          <div className="text-xs text-slate-500">4,820 members</div>
        </div>
        <div className="p-2">
          <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Spaces</div>
          <ul className="space-y-0.5">
            {MOCK_CHANNELS.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { setActive(c.id); setShowChannels(false); }}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${active === c.id ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="flex items-center gap-1.5 truncate"><Hash size={14} className={active === c.id ? "text-[#0284C7]" : "text-slate-400"} />{c.name}</span>
                  {c.unread ? <span className="rounded-full bg-[#0284C7] px-1.5 text-[10px] font-semibold text-white">{c.unread}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Center feed */}
      <main className="col-span-12 md:col-span-6 lg:col-span-7 border-r border-slate-200">
        <div className="sticky top-14 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChannels((v) => !v)} className="md:hidden rounded border border-slate-200 px-2 py-1 text-xs">Channels</button>
            <Hash size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">{active}</span>
            <span className="hidden text-xs text-slate-500 sm:inline">· 312 posts · 48 online</span>
          </div>
          <button className="rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-semibold text-white">New post</button>
        </div>

        <div className="space-y-3 p-4">
          <PostComposer />
          {MOCK_COMMUNITY_POSTS.map((p) => (
            <motion.article
              key={p.id}
              layout
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => setThread(p.id)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar initials={p.avatar} size={36} tone="slate" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.author} <span className="font-normal text-slate-500">· {p.role}</span></div>
                    <div className="text-xs text-slate-500">{p.category} · 2h ago</div>
                  </div>
                </div>
                <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={16} /></button>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{p.body}</p>
              {p.id === 2 && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><BarChart3 size={12} /> POLL · closes in 2d</div>
                  {[{ k: "Outbound cold email", v: 62 }, { k: "Referral partnerships", v: 24 }, { k: "Paid ads", v: 14 }].map((o) => (
                    <div key={o.k} className="mt-2">
                      <div className="mb-0.5 flex items-center justify-between text-xs"><span className="text-slate-700">{o.k}</span><span className="font-semibold text-slate-900">{o.v}%</span></div>
                      <div className="h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-[#0284C7]" style={{ width: `${o.v}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 hover:text-slate-900"><Heart size={14} /> {p.likes}</span>
                <span className="inline-flex items-center gap-1.5 hover:text-slate-900"><MessageSquare size={14} /> {p.comments}</span>
                <span className="inline-flex items-center gap-1.5 hover:text-slate-900"><Share2 size={14} /> Share</span>
              </div>
            </motion.article>
          ))}
        </div>
      </main>

      {/* Members rail */}
      <aside className="hidden lg:block lg:col-span-3 bg-white p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Online · {MOCK_ONLINE.length}</div>
          <button className="text-[10px] font-semibold text-[#0284C7]">See all</button>
        </div>
        <ul className="space-y-1">
          {MOCK_ONLINE.map((u) => (
            <li key={u.name} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-slate-50">
              <div className="relative"><Avatar initials={u.avatar} tone={u.status === "leader" ? "sky" : "slate"} size={30} /><span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500" /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">{u.name}</div>
                <div className="truncate text-xs text-slate-500">{u.role}</div>
              </div>
              {u.status === "leader" && <span className="rounded-md bg-[#0284C7]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0284C7]">LEAD</span>}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500"><Pin size={11} /> Pinned</div>
          <div className="mt-1 text-xs font-semibold text-slate-900">Weekly AMA — Thu 3pm ET</div>
          <div className="text-xs text-slate-600">Elena Rostova walks through the automation masterclass roadmap.</div>
        </div>
      </aside>

      {/* Thread drawer */}
      <AnimatePresence>
        {thread !== null && (
          <ThreadDrawer post={MOCK_COMMUNITY_POSTS.find((p) => p.id === thread)!} onClose={() => setThread(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PostComposer() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Avatar initials="YU" tone="sky" size={30} />
        <input placeholder="Share an insight, ask a question, drop a win…" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0284C7]" />
        <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Post</button>
      </div>
    </div>
  );
}

function ThreadDrawer({ post, onClose }: { post: { id: number; author: string; avatar: string; title: string; body: string }; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Thread</div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <div className="flex items-center gap-2"><Avatar initials={post.avatar} size={32} /><div><div className="text-sm font-semibold text-slate-900">{post.author}</div><div className="text-xs text-slate-500">2h ago</div></div></div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">{post.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{post.body}</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-slate-500">3 comments</div>
            {[
              { a: "David Kim", av: "DK", t: "The routing meta-agent pattern is 🔑. Curious how you handle tool-call caching." },
              { a: "Priya Nair", av: "PN", t: "We wired LangSmith for evals and it caught 3 silent regressions. Recommend." },
              { a: "Elena Rostova", av: "ER", t: "Sharing this in our #ai-automation-engineering channel — really clean." },
            ].map((c, i) => (
              <div key={i} className="mt-3 flex items-start gap-2">
                <Avatar initials={c.av} size={28} />
                <div className="flex-1 rounded-xl bg-[#F8FAFC] p-2.5">
                  <div className="text-xs font-semibold text-slate-900">{c.a}</div>
                  <div className="mt-0.5 text-sm text-slate-700">{c.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <input placeholder="Reply to thread…" className="flex-1 bg-transparent px-2 text-sm outline-none" />
            <button className="rounded-md bg-[#0284C7] p-2 text-white"><Send size={14} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
