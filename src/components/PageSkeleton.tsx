/**
 * Shimmer skeleton components — looping CSS gradient pulse that matches
 * the typography layouts of the main content areas. Used whenever a view
 * is transitioning so the user never sees a blank white screen.
 */
import { cn } from "@/lib/utils";

// ─── Base shimmer atom ────────────────────────────────────────────────────────

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-100",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.4s_ease-in-out_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
        className,
      )}
    />
  );
}

// Inject keyframe once — Tailwind doesn't ship "shimmer" by default
if (typeof document !== "undefined") {
  const id = "sukaspace-shimmer-keyframe";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes shimmer {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ─── Composed skeletons ───────────────────────────────────────────────────────

/** Generic feed-post card skeleton */
export function PostCardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-100 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shimmer className="h-8 w-8 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-3 w-32" />
          <Shimmer className="h-2.5 w-20" />
        </div>
      </div>
      <Shimmer className="h-4 w-3/4" />
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-5/6" />
      <div className="flex gap-3 pt-1">
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-3 w-12" />
      </div>
    </div>
  );
}

/** Feed page skeleton — 3 post cards */
export function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  );
}

/** Dashboard stats skeleton */
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-100 bg-card p-3 space-y-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-6 w-10" />
          </div>
        ))}
      </div>
      {/* List rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3 w-48" />
            <Shimmer className="h-2.5 w-32" />
          </div>
          <Shimmer className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Course list skeleton */
export function CourseListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-neutral-100 bg-card overflow-hidden">
          <Shimmer className="h-32 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="h-3 w-1/2" />
            <Shimmer className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Members skeleton */
export function MembersSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-card p-3"
        >
          <Shimmer className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="h-2.5 w-20" />
          </div>
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Full-page loading screen — shown during AppShell hydration */
export function AppLoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar ghost — desktop only */}
      <aside className="hidden w-56 shrink-0 border-r border-neutral-100 bg-card md:flex flex-col p-3 gap-1">
        <Shimmer className="h-8 w-28 mb-3 mt-1" />
        {[...Array(9)].map((_, i) => (
          <Shimmer key={i} className="h-8 w-full rounded-lg" />
        ))}
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top bar ghost */}
        <div className="h-14 border-b border-neutral-100 bg-card flex items-center gap-3 px-4">
          <Shimmer className="h-8 flex-1 rounded-lg" />
          <Shimmer className="h-8 w-8 rounded-lg" />
          <Shimmer className="h-8 w-8 rounded-full" />
        </div>
        {/* Content */}
        <FeedSkeleton />
      </div>
    </div>
  );
}
