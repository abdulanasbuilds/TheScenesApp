import { createFileRoute } from "@tanstack/react-router";
import { Download, UserPlus, X, Check } from "lucide-react";
import { useState } from "react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { MOCK_ONLINE } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/members")({
  head: () => ({ meta: [
    { title: "Members · SukaSpace" },
    { name: "description", content: "Manage classroom participants, roles, XP, and activity status." },
  ] }),
  component: MembersPage,
});

function MembersPage() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const rows = ["name,role", ...MOCK_ONLINE.map((m) => `${m.name},${m.role}`)];
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
    setInvited((i) => [...i, email.trim()]);
    store.pushNotification(`Invitation sent to ${email.trim()}.`);
    setEmail(""); setOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage classroom participants, roles, and progress.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">
            {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} />}{exported ? "Exported" : "Export"}
          </button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"><UserPlus size={14} />Add Member</button>
        </div>
      </div>

      {invited.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          Pending invites: {invited.join(", ")}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <img src={UPLOADED_MOCKUPS.membersTable} alt="SukaSpace member management table with roles and XP" className="w-full object-cover" />
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
