import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Send, Smile, MessagesSquare } from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/messages")({
  head: () => ({ meta: [{ title: "Messages · SukaSpace" }] }),
  component: Messages,
});

const EMOJIS = ["👍", "🎉", "🔥", "😂", "❤️", "🙌"];

function Messages() {
  const store = useAppStore();
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const addEmoji = (e: string) => { setDraft((d) => d + e); setShowEmoji(false); };

  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-56px)]">
      <aside className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-border bg-card">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-accent px-2 py-1.5 text-sm text-muted-foreground">
            <Search size={14} /><span>Search messages</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <MessagesSquare size={28} className="text-muted-foreground/60" />
          <p className="mt-3 text-xs font-semibold text-foreground">No conversations yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Messages from community members will appear here once they reach out.</p>
        </div>
      </aside>

      <section className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <MessagesSquare size={40} className="text-muted-foreground/30" />
          <h2 className="mt-3 text-base font-semibold text-foreground">No conversation selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">When community members send you a message, you can reply here.</p>
          {store.session && (
            <p className="mt-4 text-xs text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{store.session.name}</span></p>
          )}
        </div>

        <div className="relative border-t border-border bg-card p-3">
          {showEmoji && (
            <div className="absolute bottom-full right-3 mb-2 flex gap-1 rounded-lg border border-border bg-card p-2 shadow-md">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => addEmoji(e)} className="rounded p-1 text-lg hover:bg-accent">{e}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) setDraft(""); }}
              placeholder="Select a conversation to reply…"
              disabled
              className="flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button onClick={() => setShowEmoji((v) => !v)} className="text-muted-foreground hover:text-foreground"><Smile size={16} /></button>
            <button disabled className="rounded-lg bg-primary p-2 text-white opacity-40 cursor-not-allowed"><Send size={14} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
