import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Inbox, Loader2, Lock, SearchX, WifiOff, Wrench, ArrowRight, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable state system for the whole product.
 *
 * Formula every state follows:  state type + reason + next action + reassurance
 *
 * Variants map to a real screen state, never decoration:
 *  empty      – nothing created yet (first-run)
 *  no-results – filters/search removed everything
 *  setup      – something must be connected/finished first
 *  locked     – no permission / gated by plan or membership
 *  loading    – work in flight
 *  error      – something broke, recoverable
 *  offline    – disconnected
 *  success    – goal completed, emptiness is a reward
 */
export type EmptyStateVariant =
  | "empty" | "no-results" | "setup" | "locked" | "loading" | "error" | "offline" | "success";

type Action = {
  label: string;
  /** Internal route. Use `onClick` instead for in-page actions. */
  to?: string;
  search?: Record<string, unknown>;
  onClick?: () => void;
  disabled?: boolean;
};

export type EmptyStateProps = {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  /** Overrides the variant icon. */
  icon?: ReactNode;
  primary?: Action;
  secondary?: Action;
  /** Small reassurance line under the buttons, e.g. "You can edit this later." */
  helper?: string;
  /** Ordered onboarding steps; `done` renders a check. */
  checklist?: { label: string; done?: boolean }[];
  /** Extra content (examples, tips, inline form). */
  children?: ReactNode;
  className?: string;
  /** Tighter padding for use inside cards/tables. */
  compact?: boolean;
};

const VARIANT_ICON: Record<EmptyStateVariant, ReactNode> = {
  empty: <Inbox size={22} />,
  "no-results": <SearchX size={22} />,
  setup: <Wrench size={22} />,
  locked: <Lock size={22} />,
  loading: <Loader2 size={22} className="animate-spin" />,
  error: <AlertTriangle size={22} />,
  offline: <WifiOff size={22} />,
  success: <CheckCircle2 size={22} />,
};

const VARIANT_TONE: Record<EmptyStateVariant, string> = {
  empty: "border-border bg-accent text-muted-foreground",
  "no-results": "border-border bg-accent text-muted-foreground",
  setup: "border-sky-200 bg-sky-50 text-primary",
  locked: "border-border bg-accent text-muted-foreground",
  loading: "border-border bg-accent text-muted-foreground",
  error: "border-red-200 bg-red-50 text-red-600",
  offline: "border-amber-200 bg-amber-50 text-amber-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-600",
};

function ActionButton({ action, kind }: { action: Action; kind: "primary" | "secondary" }) {
  const cls = cn(
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    kind === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-border bg-card text-foreground hover:bg-accent",
  );
  const content = (
    <>
      {action.label}
      {kind === "primary" && <ArrowRight size={14} />}
    </>
  );

  if (action.to && !action.disabled) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={action.to as any} search={action.search as any} className={cls} onClick={action.onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} disabled={action.disabled} className={cls}>
      {content}
    </button>
  );
}

export function EmptyState({
  variant = "empty",
  title,
  description,
  icon,
  primary,
  secondary,
  helper,
  checklist,
  children,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
      role={variant === "error" ? "alert" : undefined}
      aria-busy={variant === "loading" || undefined}
      className={cn(
        "flex w-full flex-col items-center rounded-xl border border-dashed border-border bg-card text-center",
        compact ? "px-4 py-6" : "px-5 py-10 sm:px-8 sm:py-12",
        className,
      )}
    >
      <span className={cn("grid h-12 w-12 place-items-center rounded-full border", VARIANT_TONE[variant])}>
        {icon ?? VARIANT_ICON[variant]}
      </span>

      <h3 className="mt-3.5 text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}

      {checklist && checklist.length > 0 && (
        <ol className="mx-auto mt-4 w-full max-w-sm space-y-2 text-left">
          {checklist.map((step, i) => (
            <li key={step.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  step.done ? "bg-emerald-100 text-emerald-600" : "bg-accent text-muted-foreground",
                )}
              >
                {step.done ? <Check size={12} /> : i + 1}
              </span>
              <span className={cn("text-xs font-medium", step.done ? "text-muted-foreground line-through" : "text-foreground")}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {children && <div className="mt-4 w-full">{children}</div>}

      {(primary || secondary) && (
        <div className="mt-5 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row">
          {primary && <ActionButton action={primary} kind="primary" />}
          {secondary && <ActionButton action={secondary} kind="secondary" />}
        </div>
      )}

      {helper && <p className="mt-3 text-xs text-muted-foreground">{helper}</p>}
    </motion.div>
  );
}

export default EmptyState;
