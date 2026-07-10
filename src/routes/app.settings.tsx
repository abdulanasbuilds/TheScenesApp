import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · SukaSpace" }] }),
  component: Settings,
});

const SECTIONS = [
  { k: "Profile", items: [{ l: "Display name", v: "Alex Rivera" }, { l: "Username", v: "@alex.rivera" }, { l: "Bio", v: "AI systems engineer. Building agentic workflows in production." }] },
  { k: "Account", items: [{ l: "Email", v: "alex@company.com" }, { l: "Password", v: "•••••••••" }, { l: "Two-factor auth", v: "Enabled" }] },
  { k: "Notifications", items: [{ l: "New posts in my channels", v: "Instant" }, { l: "Direct messages", v: "Instant" }, { l: "Weekly digest", v: "Every Monday" }] },
  { k: "Billing", items: [{ l: "Plan", v: "Free · Early access" }, { l: "Next invoice", v: "—" }] },
];

function Settings() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC]">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile, account, and notifications.</p>

        <div className="mt-6 space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.k} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-base font-semibold text-slate-900">{s.k}</h2>
              </div>
              <ul>
                {s.items.map((i) => (
                  <li key={i.l} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{i.l}</div>
                      <div className="text-xs text-slate-500">{i.v}</div>
                    </div>
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
