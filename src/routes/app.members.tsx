import { createFileRoute } from "@tanstack/react-router";
import { Download, UserPlus, X, Check, Search, MoreVertical, Trash2, ChevronDown, ChevronLeft, ChevronRight, ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/members")({
  head: () => ({ meta: [
    { title: "Members · SukaSpace" },
    { name: "description", content: "Manage classroom participants, roles, and progress." },
  ] }),
  component: MembersPage,
});

type Role = "Instructor" | "Moderator" | "Student";
type Status = "Online" | "Offline";
type Member = { id: string; name: string; email: string; role: Role; avatar: string; status: Status; xp: number; joinedDate: string; lastActive: string; pending?: boolean };

const ROLE_STYLES: Record<Role, string> = {
  Instructor: "bg-emerald-100 text-emerald-700",
  Moderator: "bg-sky-100 text-sky-700",
  Student: "bg-slate-100 text-slate-600",
};

const PAGE_SIZE = 6;

function MembersPage() {
  const store = useAppStore();

  function makeInitialMembers(): Member[] {
    if (!store.session) return [];
    const today = new Date().toISOString().split("T")[0];
    return [{
      id: "self",
      name: store.session.name,
      email: store.session.email,
      role: store.session.role === "creator" ? "Instructor" : "Student",
      avatar: store.session.avatar,
      status: "Online",
      xp: 0,
      joinedDate: today,
      lastActive: "Just now",
    }];
  }

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<Member[]>(makeInitialMembers());
  const [exported, setExported] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => roleFilter === "All" || m.role === roleFilter)
      .filter((m) => statusFilter === "All" || m.status === statusFilter)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      .sort((a, b) => (sortDesc ? b.xp - a.xp : a.xp - b.xp));
  }, [members, query, roleFilter, statusFilter, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const handleExport = () => {
    const rows = ["name,email,role,status,xp,joined,last_active", ...members.map((m) => `${m.name},${m.email},${m.role},${m.status},${m.xp},${m.joinedDate},"${m.lastActive}"`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const [inviteError, setInviteError] = useState<string | null>(null);

  const sendInvite = () => {
    const trimmed = email.trim();
    if (!trimmed) { setInviteError("Enter an email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setInviteError("Enter a valid email address."); return; }
    if (members.some((m) => m.email.toLowerCase() === trimmed.toLowerCase())) {
      setInviteError("That email is already a member or has a pending invite.");
      return;
    }
    setInviteError(null);
    const name = email.split("@")[0];
    const today = new Date().toISOString().split("T")[0];
    const pending: Member = {
      id: `invite-${Date.now()}`,
      name: email.trim(),
      email: email.trim(),
      role: "Student",
      avatar: name.slice(0, 2).toUpperCase(),
      status: "Offline",
      xp: 0,
      joinedDate: today,
      lastActive: "Just invited",
      pending: true,
    };
    setMembers((m) => [pending, ...m]);
    store.pushNotification(`Invitation sent to ${email.trim()}.`);
    setEmail(""); setOpen(false);
  };

  const setRole = (id: string, role: Role) => {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, role } : x)));
    setMenuFor(null);
  };

  const removeMember = (id: string) => {
    setMembers((m) => m.filter((x) => x.id !== id));
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    setMenuFor(null);
  };

  const bulkRemove = () => {
    setMembers((m) => m.filter((x) => !selected.has(x.id)));
    store.pushNotification(`Removed ${selected.size} member${selected.size === 1 ? "" : "s"}.`);
    setSelected(new Set());
  };

  const toggleSelectAll = () => {
    if (paged.every((m) => selected.has(m.id))) {
      setSelected((s) => { const n = new Set(s); paged.forEach((m) => n.delete(m.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); paged.forEach((m) => n.add(m.id)); return n; });
    }
  };

  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage community participants, roles, and progress.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">
            {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}{exported ? "Exported" : "Export"}
          </button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><UserPlus size={14} />Add Member</button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 sm:max-w-sm">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search members by name or email…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>

          <div className="relative">
            <button onClick={() => { setRoleMenuOpen((v) => !v); setStatusMenuOpen(false); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Role: {roleFilter}<ChevronDown size={12} /></button>
            {roleMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setRoleMenuOpen(false)} />
                <div className="absolute left-0 top-10 z-40 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                  {(["All", "Instructor", "Moderator", "Student"] as const).map((r) => (
                    <button key={r} onClick={() => { setRoleFilter(r); setPage(1); setRoleMenuOpen(false); }} className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-accent">{r}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setStatusMenuOpen((v) => !v); setRoleMenuOpen(false); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Status: {statusFilter}<ChevronDown size={12} /></button>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute left-0 top-10 z-40 w-36 rounded-lg border border-border bg-card p-1 shadow-lg">
                  {(["All", "Online", "Offline"] as const).map((s) => (
                    <button key={s} onClick={() => { setStatusFilter(s); setPage(1); setStatusMenuOpen(false); }} className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-accent">{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={bulkRemove} disabled={selected.size === 0} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-40 hover:enabled:bg-rose-50 hover:enabled:text-rose-600 hover:enabled:border-rose-200">
            Bulk Actions {selected.size > 0 && `(${selected.size})`}<ChevronDown size={12} />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent text-[10px] font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-3"><input type="checkbox" checked={paged.length > 0 && paged.every((m) => selected.has(m.id))} onChange={toggleSelectAll} className="h-3.5 w-3.5 accent-primary" /></th>
                <th className="text-left">Member</th>
                <th className="text-left">Role</th>
                <th className="text-left"><button onClick={() => setSortDesc((v) => !v)} className="inline-flex items-center gap-1 hover:text-foreground">Total XP<ArrowDown size={11} className={sortDesc ? "" : "rotate-180"} /></button></th>
                <th className="text-left">Joined Date</th>
                <th className="text-left">Last Active</th>
                <th className="text-left">Status</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="py-3 pl-3"><input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} className="h-3.5 w-3.5 accent-primary" /></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={m.avatar} size={30} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{m.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.pending ? "Invite pending" : m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_STYLES[m.role]}`}>{m.role}</span></td>
                  <td className="font-semibold text-foreground">{m.xp.toLocaleString()}</td>
                  <td className="text-muted-foreground">{m.joinedDate}</td>
                  <td className="text-muted-foreground">{m.lastActive}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.status === "Online" ? "text-emerald-600" : "text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${m.status === "Online" ? "bg-emerald-500" : "bg-slate-300"}`} />{m.status}
                    </span>
                  </td>
                  <td className="relative px-3 text-right">
                    <button onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><MoreVertical size={14} /></button>
                    {menuFor === m.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-3 top-9 z-40 w-40 rounded-lg border border-border bg-card p-1 text-left shadow-lg">
                          {(["Instructor", "Moderator", "Student"] as Role[]).map((r) => (
                            <button key={r} onClick={() => setRole(m.id, r)} className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-accent">Make {r}</button>
                          ))}
                          <button onClick={() => removeMember(m.id)} className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={12} />Remove</button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No members match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Showing {filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1} to {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length} member{filtered.length === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} className="grid h-7 w-7 place-items-center rounded-md border border-border disabled:opacity-30 hover:enabled:bg-accent"><ChevronLeft size={13} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`grid h-7 w-7 place-items-center rounded-md text-xs font-semibold ${p === pageSafe ? "bg-primary text-white" : "border border-border text-foreground hover:bg-accent"}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages} className="grid h-7 w-7 place-items-center rounded-md border border-border disabled:opacity-30 hover:enabled:bg-accent"><ChevronRight size={13} /></button>
          </div>
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
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setInviteError(null); }}
                  placeholder="member@company.com"
                  className={`mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary ${inviteError ? "border-destructive" : "border-border"}`}
                />
                {inviteError && <p className="mt-1 text-xs font-medium text-destructive">{inviteError}</p>}
              </div>
              <button onClick={sendInvite} disabled={!email.trim()} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Send invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
