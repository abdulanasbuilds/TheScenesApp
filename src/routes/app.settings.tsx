import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bell, Camera, Check, MonitorSmartphone, User } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [
    { title: "Settings · The Scenes" },
    { name: "description", content: "Manage your local The Scenes profile and interface preferences." },
    { property: "og:title", content: "Settings · The Scenes" },
    { property: "og:description", content: "Manage your local The Scenes profile and interface preferences." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SettingsPage,
});

type Tab = "profile" | "notifications" | "device";

function SettingsPage() {
  const store = useAppStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState(store.session?.name ?? "");
  const [bio, setBio] = useState(store.session?.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(store.session?.photoUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const tabs = [
    { key: "profile" as const, label: "Profile", icon: User },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
    { key: "device" as const, label: "Device", icon: MonitorSmartphone },
  ];
  const save = () => { store.updateProfile({ name: name.trim(), bio: bio.trim(), photoUrl }); toast.success("Saved on this device."); };
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Preferences are stored only in this browser.</p>
      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold ${tab===key?"border-primary text-primary":"border-transparent text-muted-foreground"}`}><Icon size={14}/>{label}</button>)}
      </div>
      {tab === "profile" && <section className="mt-5 border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          {photoUrl ? <img src={photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover"/> : <span className="grid h-16 w-16 place-items-center rounded-full bg-foreground text-lg font-bold text-background">{store.session?.avatar ?? "TS"}</span>}
          <div><Button variant="outline" onClick={() => fileRef.current?.click()}><Camera size={14}/>Choose photo</Button><input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setPhotoUrl(String(r.result));r.readAsDataURL(f)}}/><p className="mt-1 text-xs text-muted-foreground">Stored locally on this device.</p></div>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="text-xs font-semibold text-muted-foreground">Display name<input value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"/></label>
          <label className="text-xs font-semibold text-muted-foreground">Bio<textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} className="mt-1.5 w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"/></label>
          <Button onClick={save} className="w-fit"><Check size={14}/>Save changes</Button>
        </div>
      </section>}
      {tab === "notifications" && <section className="mt-5 border border-border bg-card p-5"><h2 className="font-semibold text-foreground">Local notifications</h2><p className="mt-1 text-sm text-muted-foreground">These switches only change the frontend presentation.</p><div className="mt-4 divide-y divide-border">{Object.entries(store.notificationPrefs).map(([key,value])=><label key={key} className="flex items-center justify-between py-3 text-sm capitalize text-foreground">{key}<input type="checkbox" checked={value} onChange={e=>store.updateNotificationPrefs({...store.notificationPrefs,[key]:e.target.checked})}/></label>)}</div></section>}
      {tab === "device" && <section className="mt-5 border border-border bg-card p-5"><MonitorSmartphone size={20} className="text-primary"/><h2 className="mt-3 font-semibold text-foreground">Frontend-only mode</h2><p className="mt-1 text-sm text-muted-foreground">No account service, database, payment processor, email service, or external API is connected.</p></section>}
    </div>
  );
}
