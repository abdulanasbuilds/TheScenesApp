import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Users, GraduationCap, Hash, Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ONLINE, MOCK_CHANNELS, MOCK_CLASSROOM_MODULES } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/search")({
  head: () => ({ meta: [
    { title: "Search · SukaSpace" },
    { name: "description", content: "Search across communities, courses, members, messages, and resources." },
  ] }),
  component: SearchPage,
});

type Filter = "all" | "communities" | "members" | "lessons" | "channels";

function SearchPage() {
  const store = useAppStore();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const lessons = useMemo(() => MOCK_CLASSROOM_MODULES.flatMap((mod) => mod.lessons.map((l) => ({ module: mod.name, title: l.title, status: l.status }))), []);

  const q = query.trim().toLowerCase();

  const communities = useMemo(() => store.communities.filter((c) => !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)), [store.communities, q]);
  const members = useMemo(() => MOCK_ONLINE.filter((m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)), [q]);
  const filteredLessons = useMemo(() => lessons.filter((l) => !q || l.title.toLowerCase().includes(q) || l.module.toLowerCase().includes(q)), [lessons, q]);
  const channels = useMemo(() => MOCK_CHANNELS.filter((c) => !q || c.name.toLowerCase().includes(q)), [q]);

  const totalResults = communities.length + members.length + filteredLessons.length + channels.length;

  const show = (key: Filter) => filter === "all" || filter === key;

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">Communities, courses, experts, and channels unified in one view.</p>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-1 shadow-sm">
        <Search size={18} className="ml-2.5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities, lessons, members, channels…"
          className="flex-1 bg-transparent px-1 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {([["all", "All"], ["communities", "Communities"], ["members", "Members"], ["lessons", "Lessons"], ["channels", "Channels"]] as [Filter, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === key ? "border-primary bg-sky-50 text-primary" : "border-border text-muted-foreground"}`}>{label}</button>
        ))}
      </div>

      {query && <p className="mt-3 text-xs text-muted-foreground">{totalResults} result{totalResults === 1 ? "" : "s"} for "{query}"</p>}

      <div className="mt-4 space-y-6">
        {show("communities") && (
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Building2 size={12} />Communities</h2>
            {communities.length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">{store.communities.length === 0 ? "No communities have launched yet — " : "No matches. "}<Link to="/create-community" className="font-semibold text-primary">Create one</Link>.</p>
            ) : (
              <div className="space-y-2">
                {communities.map((c) => (
                  <button key={c.id} onClick={() => nav({ to: "/discover" })} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40">
                    <Avatar initials={c.avatar} size={32} tone="primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{c.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.category} · {c.members.toLocaleString()} members</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {show("members") && (
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Users size={12} />Members</h2>
            {members.length === 0 ? <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No matches.</p> : (
              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((m) => (
                  <button key={m.name} onClick={() => nav({ to: "/app/members" })} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-left hover:border-primary/40">
                    <Avatar initials={m.avatar} size={28} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {show("lessons") && (
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><GraduationCap size={12} />Lessons</h2>
            {filteredLessons.length === 0 ? <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No matches.</p> : (
              <div className="space-y-2">
                {filteredLessons.map((l) => (
                  <button key={l.title} onClick={() => nav({ to: "/app/classroom" })} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{l.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{l.module}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.status === "complete" ? "bg-emerald-100 text-emerald-700" : l.status === "in_progress" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>{l.status.replace("_", " ")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {show("channels") && (
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
        )}
      </div>
    </div>
  );
}
