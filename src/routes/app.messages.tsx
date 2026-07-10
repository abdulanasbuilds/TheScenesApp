import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Send, Paperclip, Smile } from "lucide-react";
import { Avatar } from "@/components/BrowserFrame";
import { MOCK_DIRECT_MESSAGES, MOCK_CHAT_STREAM } from "@/lib/mock-data";

export const Route = createFileRoute("/app/messages")({
  head: () => ({ meta: [{ title: "Messages · SukaSpace" }] }),
  component: Messages,
});

function Messages() {
  const [active, setActive] = useState(1);
  const chat = MOCK_DIRECT_MESSAGES.find((d) => d.id === active)!;
  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-56px)]">
      <aside className={`col-span-12 md:col-span-4 lg:col-span-3 border-r border-slate-200 bg-white ${active ? "hidden md:block" : ""}`}>
        <div className="border-b border-slate-200 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-500">
            <Search size={14} /><span>Search messages</span>
          </div>
        </div>
        <ul>
          {MOCK_DIRECT_MESSAGES.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => setActive(d.id)}
                className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${active === d.id ? "bg-slate-50" : ""}`}
              >
                <Avatar initials={d.avatar} tone="slate" size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <div className="truncate text-sm font-semibold text-slate-900">{d.sender}</div>
                    <div className="text-[10px] text-slate-500">{d.time}</div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="truncate text-xs text-slate-600">{d.text}</div>
                    {d.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#0284C7]" />}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col bg-[#F8FAFC]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar initials={chat.avatar} size={36} />
            <div>
              <div className="text-sm font-semibold text-slate-900">{chat.sender}</div>
              <div className="text-xs text-emerald-600">● Online · typically replies in minutes</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">{chat.role}</div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-500 border border-slate-200">Today</div>
          {MOCK_CHAT_STREAM.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.from === "me" ? "bg-[#0284C7] text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"}`}>
                <div>{m.text}</div>
                <div className={`mt-1 text-[10px] ${m.from === "me" ? "text-white/70" : "text-slate-400"}`}>{m.time}</div>
              </div>
            </div>
          ))}
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <button className="text-slate-400 hover:text-slate-700"><Paperclip size={16} /></button>
            <input placeholder="Message David Chen…" className="flex-1 bg-transparent text-sm outline-none" />
            <button className="text-slate-400 hover:text-slate-700"><Smile size={16} /></button>
            <button className="rounded-lg bg-[#0284C7] p-2 text-white hover:bg-[#0369A1]"><Send size={14} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
