import { createFileRoute } from "@tanstack/react-router";
import { Download, UserPlus } from "lucide-react";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/app/members")({
  head: () => ({ meta: [
    { title: "Members · SukaSpace" },
    { name: "description", content: "Manage classroom participants, roles, XP, and activity status." },
  ] }),
  component: MembersPage,
});

function MembersPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Members</h1>
          <p className="mt-1 text-sm text-slate-500">Manage classroom participants, roles, and progress.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download size={14} />Export</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"><UserPlus size={14} />Add Member</button>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <img src={UPLOADED_MOCKUPS.membersTable} alt="SukaSpace member management table with roles and XP" className="w-full object-cover" />
      </div>
    </div>
  );
}
