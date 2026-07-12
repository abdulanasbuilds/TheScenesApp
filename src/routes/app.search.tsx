import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Users, GraduationCap, Hash, Building2, UserPlus2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ONLINE, MOCK_CHANNELS, MOCK_CLASSROOM_MODULES, MOCK_SEARCH_COURSES } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/search")({
  head: () => ({ meta: [
    { title: "Search · SukaSpace" },
    { name: "description", content: "Search across communities, courses, members, messages, and resources." },
  ] }),
  component: SearchPage,
});

type Tab = "all" | "communities" | "courses" | "members" | "resources";
type ContentType = "discussions" | "courses" | "profiles";
type AccessLevel = "all" | "free" | "pro";
const SORTS = ["Most Relevant", "Newest", "Most Members"] as const;

function SearchPage() {
  const store = useAppStore();
  const nav = useNavigate();
  const [query, setQuery] = useState("UI Design");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Most Relevant");
  const [types, setTypes] = useState<Record<ContentType, boolean>>({ discussions: true, courses: true, profiles: false });
  const [access, setAccess] = useState<AccessLevel>("all");
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const lessons = useMemo(() => MOCK_CLASSROOM_MODULES.flatMap((mod) => mod.lessons.map((l) => ({ module: mod.name, title: l.title, status: l.status }))), []);
  const q = query.trim().toLowerCase();

  const communities = useMemo(() => store.communities.filter((c) => !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)), [store.communities, q]);
  const members = useMemo(() => MOCK_ONLINE.filter((m) => types.profiles || true).filter((m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)), [q, types.profiles]);
  const filteredLessons = useMemo(() => lessons.filter((l) => !q || l.title.toLowerCase().includes(q) || l.module.toLowerCase().includes(q)), [lessons, q]);
  const channels = useMemo(() => MOCK_CHANNELS.filter((c) => !q || c.name.toLowerCase().includes(q)), [q]);
  const courses = useMemo(() => MOCK_SEARCH_COURSES.filter((c) => !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)).filter((c) => access === "all" || (access === "pro" ? c.tag === "PRO" : c.tag !== "PRO")), [q, access]);

  const totalResults = communities.length + members.length + filteredLessons.length + channels.length + courses.length;
  const show = (key: Tab) => tab === "all" || tab === key;
  const highlight = (text: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark className="rounded bg-sky-200 px-0.5 text-foreground">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
  };
  const toggleFollow = (name: string) => setFollowed((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const toggleType = (t: ContentType) => setTypes((v) => ({ ...v, [t]: !v[t] }));
  const clearFilters = () => { setAccess("all"); setTypes({ discussions: true, courses: true, profiles: true }); setSort("Most Relevant"); };

  const discussionSamples = [
    { id: 1, channel: "General Channel", time: "2 hours ago", text: `Does anyone have recommendations for handling ${query || "this"} tokens across multiple repositories? We are struggling with sync issues between Figma and our codebase.`, replies: 4 },
    { id: 2, channel: "Advanced UI Patterns Community", time: "Yesterday", text: `I've posted a new case study on how we reduced cognitive load in our main dashboard. The core takeaway was simplifying the ${query || "design"} hierarchy and removing redundant borders.`, replies: 11 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1 shadow-sm">
            <Search size={18} className="ml-2.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities, lessons, members, channels…"
              className="flex-1 bg-transparent px-1 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && <button onClick={() => setQuery("")} className="mr-2 rounded p-1 text-muted-foreground hover:bg-accent"><X size={14} /></button>}
          </div>
          {query && <p className="mt-3 text-sm text-muted-foreground">{totalResults} result{totalResults === 1 ? "" : "s"} for "<span className="font-semibold text-foreground">{query}</span>"</p>}

          <div className="mt-3 flex flex-wrap gap-4 border-b border-border text-sm">
            {([["all", "All"], ["communities", "Communities"], ["courses", "Courses"], ["members", "Members"], ["resources", "Resources"]] as [Tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`border-b-2 pb-2 font-semibold ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>
            ))}
          </div>

          <div className="mt-5 space-y-7">
            {show("communities") && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Building2 size={12} />Top Communities</h2>
                {communities.length === 0 ? (
                  <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">{store.communities.length === 0 ? "No communities have launched yet — " : "No matches. "}<Link to="/create-community" className="font-semibold text-primary">Create one</Link>.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {communities.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${c.banner} text-sm font-bold text-slate-700`}>{c.avatar}</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">{highlight(c.title)}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.summary}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">{c.members.toLocaleString()} Members</div>
                        </div>
                        <button onClick={() => nav({ to: "/discover" })} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${store.isJoined(c.id) ? "border border-border text-foreground" : "bg-primary text-white hover:bg-primary/90"}`}>{store.isJoined(c.id) ? "View" : "Join"}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {show("courses") && types.courses && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><GraduationCap size={12} />Relevant Courses</h2>
                {courses.length === 0 && filteredLessons.length === 0 ? <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No matches.</p> : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {courses.map((c) => (
                      <button key={c.id} onClick={() => nav({ to: "/app/classroom" })} className="overflow-hidden rounded-xl border border-border bg-card text-left hover:border-primary/40">
                        <div className={`relative h-24 bg-gradient-to-br ${c.tone}`}>
                          {c.tag && <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-foreground">{c.tag}</span>}
                        </div>
                        <div className="p-3">
                          <div className="truncate text-sm font-semibold text-foreground">{highlight(c.title)}</div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.desc}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{c.lessons} Lessons {c.instructor ? `· ${c.instructor}` : ""}</span>
                            {c.progress > 0 && <span className="font-semibold text-primary">{c.progress}%</span>}
                          </div>
                          {c.progress > 0 && <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${c.progress}%` }} /></div>}
                        </div>
                      </button>
                    ))}
                    {filteredLessons.map((l) => (
                      <button key={l.title} onClick={() => nav({ to: "/app/classroom" })} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left hover:border-primary/40">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{highlight(l.title)}</div>
                          <div className="truncate text-xs text-muted-foreground">{l.module}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.status === "complete" ? "bg-emerald-100 text-emerald-700" : l.status === "in_progress" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>{l.status.replace("_", " ")}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {show("members") && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Users size={12} />Experts</h2>
                {members.length === 0 ? <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No matches.</p> : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {members.slice(0, 6).map((m) => (
                      <div key={m.name} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                        <Avatar initials={m.avatar} size={32} />
                        <button onClick={() => nav({ to: "/app/members" })} className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-medium text-foreground">{highlight(m.name)}</div>
                          <div className="truncate text-xs text-primary">{m.role}</div>
                        </button>
                        <button onClick={() => toggleFollow(m.name)} className={`shrink-0 rounded-lg p-1.5 ${followed.has(m.name) ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-accent"}`} aria-label="Follow"><UserPlus2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {show("resources") && (
              <>
                <div>
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Hash size={12} />Channels</h2>
                  {channels.length === 0 ? <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No matches.</p> : (
                    <div className="flex flex-wrap gap-2">
                      {channels.map((c) => (
                        <button key={c.id} onClick={() => nav({ to: "/app/feed" })} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40">
                          <Hash size={11} className="text-muted-foreground" />{c.name}
                          {c.unread > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] text-white">{c.unread}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {types.discussions && (
                  <div>
                    <h2 className="mb-2 mt-6 text-xs font-semibold uppercase text-muted-foreground">Recent Discussions</h2>
                    <div className="space-y-3">
                      {discussionSamples.map((d) => (
                        <div key={d.id} className="rounded-xl border border-border bg-card p-3.5">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="rounded bg-accent px-1.5 py-0.5 font-semibold text-foreground">{d.channel}</span>·<span>{d.time}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{highlight(d.text)}</p>
                          <button onClick={() => nav({ to: "/app/feed" })} className="mt-2 text-xs font-semibold text-primary hover:underline">{d.replies} replies</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="h-fit rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Filters</h2>
            <button onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">Clear all</button>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Sort By</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary">
              {SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Content Type</label>
            <div className="mt-2 space-y-2">
              {([["discussions", "Discussions", discussionSamples.length], ["courses", "Course Materials", courses.length + filteredLessons.length], ["profiles", "Profiles", members.length]] as [ContentType, string, number][]).map(([key, label, count]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-2"><input type="checkbox" checked={types[key]} onChange={() => toggleType(key)} className="h-3.5 w-3.5 accent-primary" />{label}</span>
                  <span className="text-muted-foreground">({count})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Access Level</label>
            <div className="mt-2 space-y-2">
              {([["all", "All Access"], ["free", "Free Only"], ["pro", "Pro Required"]] as [AccessLevel, string][]).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                  <input type="radio" name="access" checked={access === key} onChange={() => setAccess(key)} className="h-3.5 w-3.5 accent-primary" />{label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
