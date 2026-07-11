import type { ReactNode } from "react";

export function BrowserFrame({ url, children, className = "" }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
      <div className="flex items-center gap-2 border-b border-border bg-accent px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="mx-auto flex max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent0" />
          <span className="truncate">{url}</span>
        </div>
      </div>
      <div className="bg-card">{children}</div>
    </div>
  );
}

export function Avatar({ initials, size = 32, tone = "slate" }: { initials: string; size?: number; tone?: "slate" | "sky" | "emerald" | "amber" | "rose" }) {
  const tones: Record<string, string> = {
    slate: "bg-foreground text-white",
    sky: "bg-sky-600 text-white",
    emerald: "bg-success text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-500 text-white",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tones[tone]}`}
      style={{ width: size, height: size, fontSize: size < 28 ? 10 : 12 }}
    >
      {initials}
    </span>
  );
}
