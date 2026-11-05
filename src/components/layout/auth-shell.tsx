import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, MessageSquareText, ShieldCheck } from "lucide-react";
import { Brand } from "./public-shell";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="relative hidden overflow-hidden bg-indigo-700 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="relative z-10">
          <Brand inverted />
        </div>
        <div className="relative z-10 my-auto max-w-md py-16">
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-200 uppercase">
            One account, every scene
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight">
            Learn with people who show the work.
          </h2>
          <p className="mt-4 text-base leading-7 text-indigo-100">
            Join focused communities, follow practical courses and keep your progress in one calm
            place.
          </p>
          <div className="mt-8 space-y-4">
            {[
              [MessageSquareText, "Participate in focused community discussions"],
              [BookOpen, "Move through practical courses in sequence"],
              [CheckCircle2, "Track lessons, events and useful resources"],
              [ShieldCheck, "Clear privacy boundaries and no fake provider success"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof BookOpen;
              return (
                <div
                  key={String(label)}
                  className="flex items-center gap-3 text-sm font-medium text-indigo-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <ItemIcon className="h-4 w-4" />
                  </span>
                  {String(label)}
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative z-10 text-xs leading-5 text-indigo-200">
          Frontend preview. Authentication is simulated locally and no account is created on a
          server.
        </p>
        <div className="absolute -right-24 -bottom-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-8 -bottom-20 h-64 w-64 rounded-full border border-white/10" />
      </aside>
      <main id="main-content" className="flex min-h-screen flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 sm:px-6 lg:hidden">
          <Brand />
          <a href="/explore" className="text-sm font-semibold text-slate-600">
            Explore
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-[440px]">
            <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
              The Scenes account
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
              {footer}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
