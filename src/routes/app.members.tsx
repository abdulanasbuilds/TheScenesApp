import { createFileRoute } from "@tanstack/react-router";
import { Download, UserPlus, X, Check, Search, MoreVertical, ShieldCheck, Trash2, Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_ONLINE, xpToTier } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/members")({
  head: () => ({ meta: [
    { title: "Members · SukaSpace" },
    { name: "description", content: "Manage classroom participants, roles, XP, and activity status." },
  ] }),
  component: MembersPage,
});

type Role = "Admin" | "Moderator" | "Member";
type Member = { id: string; name: string; role: string; avatar: string; status: string; xp: number; streak: number; posts: number; accessRole: Role; pending?: boolean };

function seedMembers(): Member[] {
  return MOCK_ONLINE.map((m, i) => ({
    id: `seed-${i}`,
    name: m.name,
    role: m.role,
    avatar: m.avatar,
    status: m.status,
    xp: m.xp,
    streak: m.streak,
    posts: m.posts,
    accessRole: i === 0 ? "Admin" : i < 3 ? "Moderator" : "Member",
  }));
}

function MembersPage() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<Member[]>(seedMembers());
  const [exported, setExported] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => roleFilter === "All" || m.accessRole === roleFilter)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q))
      .sort((a, b) => b.xp - a.xp);
  }, [members, query, roleFilter]);

  const handleExport = () => {
    const rows = ["name,role,access,xp,posts,streak", ...members.map((m) => `${m.name},${m.role},${m.accessRole},${m.xp},${m.posts},${m.streak}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const sendInvite = () => {
    if (!email.trim()) return;
    const name = email.split("@")[0];
    const pending: Member = {
      id: `invite-${Date.now()}`,
      name: email.trim(),
      role: "Invited member",
      avatar: name.slice(0, 2).toUpperCase(),
      status: "pending",
      xp: 0,
      streak: 0,
      posts: 0,
      accessRole: "Member",
      pending: true,
    };
    setMembers((m) => [pending, ...m]);
    store.pushNotification(`Invitation sent to ${email.trim()}.`);
    setEmail(""); setOpen(false);
  };

  const setAccessRole = (id: string, role: Role) => {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, accessRole: role } : x)));
    setMenuFor(null);
  };

  const removeMember = (id: string) => {
    setMembers((m) => m.filter((x) => x.id !== id));
    setMenuFor(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">{members.length} people · manage roles, XP, and access.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">
            {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}{exported ? "Exported" : "Export"}
          </button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><UserPlus size={14} />Add Member</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-xs">
          <Search size={14} className="shrink-0 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="flex gap-1.5">
          {(["All", "Admin", "Moderator", "Member"] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${roleFilter === r ? "border-primary bg-sky-50 text-primary" : "border-border text-muted-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 text-left">Member</th>
                <th className="text-left">Access</th>
                <th className="text-left">Tier</th>
                <th className="text-left">XP</th>
                <th className="text-left">Posts</th>
                <th className="text-left">Streak</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const tier = xpToTier(m.xp);
                return (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar initials={m.avatar} size={28} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate font-medium text-foreground">{m.name}{m.accessRole === "Admin" && <Crown size={11} className="text-amber-500" />}</div>
                          <div className="truncate text-xs text-muted-foreground">{m.pending ? "Invite pending" : m.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground"><ShieldCheck size={10} />{m.accessRole}</span>
                    </td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>{tier.name}</span></td>
                    <td className="font-semibold text-foreground">{m.xp.toLocaleString()}</td>
                    <td className="text-foreground">{m.posts}</td>
                    <td className="font-semibold text-primary">{m.streak > 0 ? `${m.streak} 🔥` : "—"}</td>
                    <td className="relative px-3 text-right">
                      <button onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><MoreVertical size={14} /></button>
                      {menuFor === m.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                          <div className="absolute right-3 top-9 z-40 w-40 rounded-lg border border-border bg-card p-1 text-left shadow-lg">
                            {(["Admin", "Moderator", "Member"] as Role[]).map((r) => (
                              <button key={r} onClick={() => setAccessRole(m.id, r)} className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-accent">Make {r}</button>
                            ))}
                            <button onClick={() => removeMember(m.id)} className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={12} />Remove</button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No members match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Invite a member</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@company.com" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <button onClick={sendInvite} disabled={!email.trim()} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Send invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
