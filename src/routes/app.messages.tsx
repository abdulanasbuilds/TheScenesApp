import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, MessagesSquare, Plus, X, ArrowLeft, Database } from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore, type Conversation, type DirectMessage } from "@/lib/app-store";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/app/messages")({
  head: () => ({ meta: [{ title: "Messages · SukaSpace" }] }),
  component: Messages,
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = Date.now() - ts;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Root ────────────────────────────────────────────────────────────────────

function Messages() {
  const store = useAppStore();
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [showNewDM, setShowNewDM] = useState(false);
  // On mobile, when a conversation is selected we hide the sidebar
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const conversations = store.getConversations();

  const selectConversation = (peerEmail: string) => {
    setSelectedPeer(peerEmail);
    store.markDMsRead(peerEmail);
    setMobileView("thread");
  };

  const backToList = () => {
    setSelectedPeer(null);
    setMobileView("list");
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
            <Database size={24} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Supabase required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Direct messages need a live database. Add <code className="rounded bg-accent px-1 font-mono text-xs">VITE_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-accent px-1 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to your environment to enable messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] overflow-hidden">
      {/* Conversation list — hidden on mobile when thread is open */}
      <aside
        className={`${mobileView === "thread" ? "hidden" : "flex"} w-full flex-col border-r border-border bg-card md:flex md:w-80 lg:w-96 shrink-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Messages</h2>
          <button
            onClick={() => setShowNewDM(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            <Plus size={13} /> New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <MessagesSquare size={32} className="text-muted-foreground/40" />
              <p className="mt-3 text-sm font-semibold text-foreground">No conversations yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Start a direct message with any SukaSpace member.</p>
              <button
                onClick={() => setShowNewDM(true)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Start conversation
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((conv) => (
                <ConversationRow
                  key={conv.peerEmail}
                  conv={conv}
                  isActive={selectedPeer === conv.peerEmail}
                  onClick={() => selectConversation(conv.peerEmail)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread — full width on mobile when selected, flex-1 on desktop */}
      <main className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-background`}>
        {selectedPeer ? (
          <MessageThread
            peerEmail={selectedPeer}
            onBack={backToList}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
            <MessagesSquare size={40} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Select a conversation or start a new one.</p>
          </div>
        )}
      </main>

      {/* New DM modal */}
      {showNewDM && (
        <NewDMDialog
          onClose={() => setShowNewDM(false)}
          onStart={(email) => {
            setShowNewDM(false);
            selectConversation(email);
          }}
        />
      )}
    </div>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConversationRow({ conv, isActive, onClick }: { conv: Conversation; isActive: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${isActive ? "bg-sky-50" : ""}`}
      >
        <div className="relative shrink-0">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials(conv.peerEmail)}
          </div>
          {conv.unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{conv.peerEmail}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(conv.lastMessage.createdAt)}</span>
          </div>
          <p className={`mt-0.5 truncate text-xs ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {conv.lastMessage.fromEmail === useAppStore().session?.email ? "You: " : ""}
            {conv.lastMessage.body}
          </p>
        </div>
      </button>
    </li>
  );
}

// ─── Message thread ───────────────────────────────────────────────────────────

function MessageThread({ peerEmail, onBack }: { peerEmail: string; onBack: () => void }) {
  const store = useAppStore();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = store.getMessagesWithUser(peerEmail);
  const myEmail = store.session?.email || "";

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark incoming messages as read when thread mounts / messages arrive
  useEffect(() => {
    store.markDMsRead(peerEmail);
  }, [peerEmail, messages.length]);

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setBody("");
    try {
      await store.sendDM(peerEmail, text);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={onBack} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent md:hidden">
          <ArrowLeft size={16} />
        </button>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials(peerEmail)}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{peerEmail}</div>
          <div className="text-[11px] text-muted-foreground">Direct message</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessagesSquare size={28} className="text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.fromEmail === myEmail} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Message ${peerEmail}…`}
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white disabled:opacity-40 hover:enabled:bg-primary/90 transition"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: DirectMessage; isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isMe ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isMe
              ? "rounded-br-sm bg-primary text-white"
              : "rounded-bl-sm bg-card border border-border text-foreground"
          }`}
        >
          {msg.body}
        </div>
        <div className={`mt-0.5 text-[10px] text-muted-foreground ${isMe ? "text-right" : "text-left"}`}>
          {formatTime(msg.createdAt)}
          {isMe && !msg.read && <span className="ml-1 opacity-60">· Sent</span>}
          {isMe && msg.read && <span className="ml-1 opacity-60">· Read</span>}
        </div>
      </div>
    </div>
  );
}

// ─── New DM dialog ────────────────────────────────────────────────────────────

function NewDMDialog({ onClose, onStart }: { onClose: () => void; onStart: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const start = () => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) { setError("Please enter a valid email address."); return; }
    onStart(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">New message</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Recipient email</label>
            <input
              autoFocus
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && start()}
              placeholder="someone@example.com"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            {error && <p className="mt-1 text-[11px] text-rose-500">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent">
              Cancel
            </button>
            <button onClick={start} disabled={!email.trim()} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:enabled:bg-primary/90">
              Open chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
