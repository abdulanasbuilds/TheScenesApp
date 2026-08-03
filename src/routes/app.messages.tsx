import { EmptyState } from "@/components/EmptyState";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Send, MessagesSquare, Plus, X, ArrowLeft, Check, CheckCheck,
  Search, Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type Conversation, type DirectMessage } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { SPRING_FAST } from "@/lib/pwa";

export const Route = createFileRoute("/app/messages")({
  head: () => ({ meta: [{ title: "Messages · SukaSpace" }] }),
  component: Messages,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)   return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60)   return `${min}m`;
  const hr  = Math.floor(min / 60);
  if (hr < 24)    return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day === 1)  return "Yesterday";
  if (day < 7)    return new Date(ts).toLocaleDateString([], { weekday: "short" });
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullTime(ts: number): string {
  const d   = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ts) / 86_400_000);

  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays < 7)   return d.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Conversation list item ───────────────────────────────────────────────────

function ConvoItem({
  convo, active, onClick,
}: {
  convo: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors rounded-xl",
        active ? "bg-blue-50 border border-blue-100" : "hover:bg-slate-50",
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
          {initials(convo.peerEmail)}
        </div>
        {convo.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
            {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn("text-sm font-semibold truncate", active ? "text-blue-700" : "text-slate-800")}>
            {convo.peerEmail}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
            {formatTime(convo.lastMessage.createdAt)}
          </span>
        </div>
        <p className={cn(
          "text-xs truncate mt-0.5",
          convo.unreadCount > 0 ? "text-slate-700 font-medium" : "text-slate-400",
        )}>
          {convo.lastMessage.body}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isMine }: { msg: DirectMessage; isMine: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING_FAST}
      className={cn("flex", isMine ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm",
        isMine
          ? "bg-blue-500 text-white rounded-br-sm"
          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm",
      )}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isMine ? "justify-end" : "justify-start",
        )}>
          <span className={cn("text-[10px]", isMine ? "text-blue-200" : "text-slate-400")}>
            {formatFullTime(msg.createdAt)}
          </span>
          {isMine && (
            msg.read
              ? <CheckCheck className="w-3 h-3 text-blue-200" />
              : <Check className="w-3 h-3 text-blue-300" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Thread view ──────────────────────────────────────────────────────────────

function Thread({
  peerEmail,
  myEmail,
  messages,
  onSend,
  onBack,
}: {
  peerEmail: string;
  myEmail: string;
  messages: DirectMessage[];
  onSend: (body: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
          {initials(peerEmail)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{peerEmail}</p>
          <p className="text-xs text-emerald-500 flex items-center gap-1">
            <Circle className="w-1.5 h-1.5 fill-current" /> Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50/50">
        {messages.length === 0 && (
          <EmptyState
            compact
            variant="empty"
            icon={<MessagesSquare className="w-5 h-5" />}
            title="Start the conversation"
            description="No messages here yet. Say hello, ask a question, or share what you are working on \u2014 the first message usually gets a reply within a day."
            helper="This thread is private and only visible to the two of you."
          />
        )}
        {messages.map(msg => (
          <Bubble
            key={msg.id}
            msg={msg}
            isMine={msg.fromEmail === myEmail}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 max-h-32 transition-colors"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── New DM modal ─────────────────────────────────────────────────────────────

function NewDMModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const trimmed = email.trim();
  const valid   = /\S+@\S+\.\S+/.test(trimmed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 48, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 48, scale: 0.96 }}
        transition={SPRING_FAST}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">New Message</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Recipient email
        </label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && valid && onStart(trimmed)}
          placeholder="user@example.com"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={() => valid && onStart(trimmed)}
          disabled={!valid}
          className="mt-3 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Start Conversation
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Root Messages page ───────────────────────────────────────────────────────

function Messages() {
  const store        = useAppStore();
  const myEmail      = store.session?.email ?? "";
  const [peer, setPeer]       = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [search, setSearch]   = useState("");

  const allConvos = store.getConversations();
  const convos    = search
    ? allConvos.filter(c => c.peerEmail.toLowerCase().includes(search.toLowerCase()))
    : allConvos;

  const totalUnread = allConvos.reduce((s, c) => s + c.unreadCount, 0);

  const selectPeer = (email: string) => {
    setPeer(email);
    store.markDMsRead(email);
    setMobileView("thread");
  };

  const handleSend = (body: string) => {
    if (!peer) return;
    store.sendDM(peer, body);
  };

  const startNew = (email: string) => {
    setShowNew(false);
    selectPeer(email);
  };

  const messages = peer ? store.getMessagesWithUser(peer) : [];

  return (
    <>
      <div className="flex h-[calc(100dvh-56px)] overflow-hidden bg-white">

        {/* ── Sidebar (conversation list) ── */}
        <div className={cn(
          "flex flex-col border-r border-slate-100 bg-white",
          "w-full lg:w-80 xl:w-96 flex-shrink-0",
          "transition-all duration-200",
          // Mobile: hide list when viewing thread
          mobileView === "thread" ? "hidden lg:flex" : "flex",
        )}>
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900">Messages</h2>
                {totalUnread > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {convos.length === 0 && (
              <div className="px-2 py-3">
                <EmptyState
                  compact
                  variant={search ? "no-results" : "empty"}
                  icon={<MessagesSquare className="w-5 h-5" />}
                  title={search ? "No conversations match" : "No messages yet"}
                  description={search
                    ? "Nothing matches that name. Clear the search to see every conversation you are part of."
                    : "Direct messages you send or receive show up here. Reach out to a member of your community to get started."}
                  primary={search ? undefined : { label: "Start a conversation", onClick: () => setShowNew(true) }}
                  helper="Only people in your communities can message you."
                />

              </div>
            )}
            <AnimatePresence>
              {convos.map(c => (
                <ConvoItem
                  key={c.peerEmail}
                  convo={c}
                  active={peer === c.peerEmail}
                  onClick={() => selectPeer(c.peerEmail)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Thread panel ── */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          mobileView === "list" ? "hidden lg:flex" : "flex",
        )}>
          {peer ? (
            <Thread
              peerEmail={peer}
              myEmail={myEmail}
              messages={messages}
              onSend={handleSend}
              onBack={() => setMobileView("list")}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
                <MessagesSquare className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-700">Your messages</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-[200px]">
                Select a conversation or start a new one
              </p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── New DM modal ── */}
      <AnimatePresence>
        {showNew && (
          <NewDMModal onClose={() => setShowNew(false)} onStart={startNew} />
        )}
      </AnimatePresence>
    </>
  );
}
