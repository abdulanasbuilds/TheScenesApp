import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Lock, PlayCircle, Download, Plus, Trophy, Flame, Zap } from "lucide-react";
import { MOCK_CLASSROOM_MODULES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/classroom")({
  head: () => ({ meta: [{ title: "Classroom · SukaSpace" }] }),
  component: Classroom,
});

function Classroom() {
  const [role, setRole] = useState<"learner" | "creator">("learner");
  const [active, setActive] = useState({ m: 2, l: 0 });

  const lesson = MOCK_CLASSROOM_MODULES.find((m) => m.id === active.m)?.lessons[active.l];

  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-56px)]">
      <aside className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[10px]">
              {(["learner", "creator"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)} className={`rounded px-2 py-0.5 font-semibold uppercase ${role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{r}</button>
              ))}
            </div>
          </div>
          {role === "learner" ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Level 7</span>
                <span className="inline-flex items-center gap-1"><Flame size={12} className="text-orange-500" /> 12-day streak</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">1,240 XP</div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-[#0284C7]" style={{ width: "62%" }} /></div>
              <div className="mt-1 text-[10px] text-slate-500">760 XP to Level 8</div>
            </div>
          ) : (
            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:border-[#0284C7] hover:text-[#0284C7]">
              <Plus size={14} /> Add module
            </button>
          )}
        </div>
        <div className="p-3">
          {MOCK_CLASSROOM_MODULES.map((m, mi) => (
            <div key={m.id} className="mb-3">
              <div className="flex items-center justify-between px-1.5">
                <div className="text-xs font-semibold text-slate-900">{m.name}</div>
                {role === "creator" && <button className="text-slate-400 hover:text-[#0284C7]"><Plus size={12} /></button>}
              </div>
              <div className="mt-1 flex items-center gap-2 px-1.5">
                <div className="h-1 flex-1 rounded-full bg-slate-100"><div className="h-1 rounded-full bg-emerald-500" style={{ width: `${m.progress}%` }} /></div>
                <span className="text-[10px] font-semibold text-slate-500">{m.progress}%</span>
              </div>
              <ul className="mt-1.5">
                {m.lessons.map((l, li) => {
                  const isActive = active.m === m.id && active.l === li;
                  return (
                    <li key={l.title}>
                      <button
                        onClick={() => l.status !== "locked" && setActive({ m: m.id, l: li })}
                        disabled={l.status === "locked"}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${isActive ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"} ${l.status === "locked" ? "opacity-50" : ""}`}
                      >
                        {l.status === "complete" && <CheckCircle2 size={14} className="text-emerald-600" />}
                        {l.status === "in_progress" && <span className="grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-[#0284C7]"><span className="h-1 w-1 rounded-full bg-[#0284C7]" /></span>}
                        {l.status === "locked" && <Lock size={12} className="text-slate-400" />}
                        <span className="flex-1 truncate">{l.title}</span>
                      </button>
                    </li>
                  );
                })}
                {role === "creator" && (
                  <li><button className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] font-semibold text-slate-500 hover:text-[#0284C7]"><Plus size={11} /> Add lesson</button></li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      <section className="col-span-12 md:col-span-8 lg:col-span-9 bg-[#F8FAFC]">
        <div className="mx-auto max-w-3xl p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Module 2 · Lesson 2.1</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{lesson?.title.replace(/^\d+\.\d+\s/, "")}</h1>

          <div className="mt-4 relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
            <div className="absolute inset-0 grid place-items-center">
              <button className="grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-lg hover:bg-white"><PlayCircle size={32} className="text-slate-900" /></button>
            </div>
            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">HD · 18:42</div>
          </div>

          <div className="prose prose-sm mt-6 max-w-none text-slate-700">
            <h2 className="text-base font-semibold text-slate-900">Overview</h2>
            <p>State is the load-bearing wall of any agentic system. In this lesson we cover checkpointing, replay semantics, and how to design a state schema that survives tool failures and human-in-the-loop pauses.</p>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">You'll learn</h3>
            <ul>
              <li>Designing a durable state graph with LangGraph</li>
              <li>Handling partial tool failures with retry envelopes</li>
              <li>Persisting agent memory across sessions</li>
            </ul>
          </div>

          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold text-slate-500">Resources</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[{ n: "agent-graph.py", s: "2.4 KB" }, { n: "state-schema.pdf", s: "318 KB" }, { n: "project-files.zip", s: "1.2 MB" }, { n: "slide-deck.pdf", s: "4.7 MB" }].map((r) => (
                <button key={r.n} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:border-slate-300">
                  <Download size={16} className="text-[#0284C7]" />
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-slate-900">{r.n}</div><div className="text-xs text-slate-500">{r.s}</div></div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Previous</button>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Zap size={12} /> +50 XP on complete</div>
            <button className="rounded-lg bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]">Mark complete →</button>
          </div>
        </div>
      </section>
    </div>
  );
}
