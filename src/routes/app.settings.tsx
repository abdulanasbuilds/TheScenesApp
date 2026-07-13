import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Check, Camera, User } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · SukaSpace" }] }),
  component: Settings,
});

function Settings() {
  const store = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(store.session?.photoUrl || "");
  const [photoSaved, setPhotoSaved] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({
    "Display name": store.session?.name || "",
    Username: store.session?.email ? "@" + store.session.email.split("@")[0] : "",
    Bio: store.session?.bio || "",
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
    { k: "Account", items: ["Email", "Password", "Two-factor auth"] },
    { k: "Notifications", items: ["New posts in my channels", "Direct messages", "Weekly digest"] },
    { k: "Billing", items: ["Plan", "Next invoice"] },
  ];

  const startEdit = (label: string) => { setEditing(label); setDraft(values[label]); };
  const save = (label: string) => {
    setValues((v) => ({ ...v, [label]: draft }));
    if (label === "Display name") store.updateProfile({ name: draft });
    if (label === "Bio") store.updateProfile({ bio: draft });
    setEditing(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = () => {
    store.updateProfile({ photoUrl });
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 2000);
  };

  const removePhoto = () => {
    setPhotoUrl("");
    store.updateProfile({ photoUrl: "" });
  };

  const initials = store.session?.name?.slice(0, 2).toUpperCase() || "YU";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, account, and notifications.</p>

        {/* Profile photo section */}
        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
          </div>
          <div className="p-5">
            {/* Avatar upload */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="h-20 w-20 rounded-full border-2 border-border object-cover" />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-foreground text-2xl font-bold text-white">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-foreground text-white shadow hover:bg-slate-700"
                  title="Upload photo"
                >
                  <Camera size={13} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-foreground">{store.session?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{store.session?.role} · {store.session?.email}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                  >
                    {photoUrl ? "Change photo" : "Upload photo"}
                  </button>
                  {photoUrl && (
                    <button onClick={removePhoto} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                      Remove
                    </button>
                  )}
                  {photoUrl && photoUrl !== store.session?.photoUrl && (
                    <button onClick={savePhoto} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">
                      {photoSaved ? <><Check size={11} />Saved!</> : "Save photo"}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">JPEG, PNG, or WebP · max 2 MB</p>
              </div>
            </div>

            {/* Name + Bio */}
            <div className="mt-5 space-y-0 divide-y divide-slate-100">
              {["Display name", "Username", "Bio"].map((label) => (
                <div key={label} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    {editing === label ? (
                      label === "Bio" ? (
                        <textarea
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={3}
                          className="mt-1 w-full resize-none rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      ) : (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") save(label); if (e.key === "Escape") setEditing(null); }}
                          className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                        />
                      )
                    ) : (
                      <div className="text-xs text-muted-foreground">{values[label] || <span className="italic opacity-50">Not set</span>}</div>
                    )}
                  </div>
                  {editing === label ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => save(label)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"><Check size={12} />Save</button>
                      <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(label)} className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">Edit</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other sections */}
        <div className="mt-4 space-y-4">
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
                        <div className="text-xs text-muted-foreground">{values[label] || <span className="italic opacity-50">Not set</span>}</div>
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

        {/* Danger zone */}
        <section className="mt-4 overflow-hidden rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-rose-700">Sign out</h2>
          <p className="mt-1 text-sm text-rose-600">You'll be redirected to the login page.</p>
          <button onClick={() => store.signOut()} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
