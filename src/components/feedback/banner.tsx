import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact, full-width banners for non-blocking states: degraded data, offline, partial
 * results, preview ceilings and success confirmations. Pair with StateView for blocking
 * states; use these when the page can still do useful work.
 */

export type BannerTone = "info" | "warning" | "danger" | "success" | "preview";

const TONE_STYLES: Record<BannerTone, { surface: string; icon: ReactNode }> = {
  info: {
    surface: "border-indigo-200 bg-indigo-50 text-indigo-950",
    icon: <Info className="h-4 w-4" />,
  },
  warning: {
    surface: "border-amber-200 bg-amber-50 text-amber-950",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  danger: {
    surface: "border-rose-200 bg-rose-50 text-rose-950",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  success: {
    surface: "border-emerald-200 bg-emerald-50 text-emerald-950",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  preview: {
    surface: "border-slate-200 bg-slate-50 text-slate-700",
    icon: <Sparkles className="h-4 w-4" />,
  },
};

export function InlineBanner({
  tone = "info",
  title,
  description,
  action,
  onDismiss,
  className,
}: {
  tone?: BannerTone;
  title: string;
  description?: string;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const style = TONE_STYLES[tone];
  const role = tone === "danger" ? "alert" : "status";
  return (
    <div
      role={role}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        style.surface,
        className,
      )}
    >
      <p className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          {tone === "warning" || tone === "danger" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            style.icon
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-5 opacity-90">{description}</span>
          ) : null}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
        {action}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="flex h-7 w-7 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PreviewNotice({
  title = "Preview mode",
  description = "Actions save in this browser only. Payments, email and live video are not connected yet.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <InlineBanner tone="preview" title={title} description={description} className={className} />
  );
}

export function OfflineIcon() {
  return <WifiOff className="h-5 w-5" />;
}
