import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · SukaSpace" }] }),
  component: Settings,
});

function Settings() {
  const store = useAppStore();
  const usernameDefault = store.session?.email ? "@" + store.session.email.split("@")[0] : "";
  const [values, setValues] = useState<Record<string, string>>({
    "Display name": store.session?.name || "",
    Username: usernameDefault,
    Bio: "",
    Email: store.session?.email || "",
    Password: "•••••••••",
    "Two-factor auth": "Not enabled",
    "New posts in my channels": "Instant",
    "Direct messages": "Instant",
    "Weekly digest": "Every Monday",
    Plan: "Free · Early access",
    "Next invoice": "—",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const sections = [
    { k: "Profile", items: ["Display name", "Username", "Bio"] },
    { k: "Account", items: ["Email", "Password", "Two-factor auth"] },
    { k: "Notifications", items: ["New posts in my channels", "Direct messages", "Weekly digest"] },
    { k: "Billing", items: ["Plan", "Next invoice"] },
  ];

  const startEdit = (label: string) => { setEditing(label); setDraft(values[label]); };
  const save = (label: string) => { setValues((v) => ({ ...v, [label]: draft })); setEditing(null); };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, account, and notifications.</p>

        <div className="mt-6 space-y-4">
          {sections.map((s) => (
            <section key={s.k} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold text-foreground">{s.k}</h2>
              </div>
              <ul>
                {s.items.map((label) => (
                  <li key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{label}</div>
                      {editing === label ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") save(label); if (e.key === "Escape") setEditing(null); }}
                          className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">{values[label] || <span className="italic opacity-60">Not set</span>}</div>
                      )}
                    </div>
                    {editing === label ? (
                      <button onClick={() => save(label)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"><Check size={12} />Save</button>
                    ) : (
                      <button onClick={() => startEdit(label)} className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">Edit</button>
                    )}
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
