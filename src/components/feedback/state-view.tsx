import type { ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { Button, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * State system for The Scenes.
 *
 * One primitive for every non-happy path: empty, no-results, filtered, loading, error,
 * offline, permission, success, partial, setup and preview. Each state must answer three
 * questions in order:
 *
 *   1. Why is this happening?
 *   2. What should I do next? (one dominant action)
 *   3. How does this build trust or momentum?
 *
 * The component is deliberately small. It renders a title, an explanation, one primary
 * action, an optional secondary action, optional helper text and an optional checklist.
 * Prefer this over ad-hoc "nothing here" blocks so the whole product speaks one language.
 */

export type StateType =
  | "empty"
  | "no-results"
  | "filtered"
  | "loading"
  | "error"
  | "offline"
  | "permission"
  | "success"
  | "partial"
  | "setup"
  | "preview";

export type StateTone = "activation" | "neutral" | "warning" | "danger" | "success";

export type StateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
};

export type SetupStep = {
  id: string;
  title: string;
  hint?: string;
  href?: string;
  done?: boolean;
};

const TONE_DEFAULTS: Record<StateType, StateTone> = {
  empty: "neutral",
  "no-results": "neutral",
  filtered: "neutral",
  loading: "neutral",
  error: "danger",
  offline: "warning",
  permission: "warning",
  success: "success",
  partial: "warning",
  setup: "activation",
  preview: "warning",
};

const TONE_SURFACE: Record<StateTone, string> = {
  activation: "border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white",
  neutral: "border border-dashed border-slate-300 bg-white",
  warning: "border border-amber-200 bg-amber-50",
  danger: "border border-rose-200 bg-rose-50",
  success: "border border-emerald-200 bg-emerald-50",
};

const TONE_RING: Record<StateTone, string> = {
  activation: "bg-indigo-100 text-indigo-700",
  neutral: "bg-slate-100 text-slate-500",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  success: "bg-emerald-100 text-emerald-700",
};

const TONE_TITLE: Record<StateTone, string> = {
  activation: "text-slate-900",
  neutral: "text-slate-900",
  warning: "text-amber-950",
  danger: "text-rose-950",
  success: "text-emerald-950",
};

const TONE_BODY: Record<StateTone, string> = {
  activation: "text-slate-600",
  neutral: "text-slate-500",
  warning: "text-amber-900",
  danger: "text-rose-900",
  success: "text-emerald-900",
};

function toneFor(type: StateType, tone?: StateTone): StateTone {
  return tone ?? TONE_DEFAULTS[type];
}

function a11yFor(type: StateType): {
  role?: "status" | "alert";
  live?: "polite" | "assertive";
  busy?: boolean;
} {
  switch (type) {
    case "loading":
      return { role: "status", live: "polite", busy: true };
    case "error":
    case "permission":
      return { role: "alert", live: "assertive" };
    case "offline":
    case "partial":
      return { role: "status", live: "polite" };
    default:
      return {};
  }
}

export function StateIllustration({
  icon,
  tone = "neutral",
  compact,
}: {
  icon?: ReactNode;
  tone?: StateTone;
  compact?: boolean;
}) {
  if (!icon) return null;
  return (
    <div
      className={cn(
        "mb-3 flex items-center justify-center rounded-full",
        compact ? "h-9 w-9" : "h-11 w-11",
        TONE_RING[tone],
      )}
      aria-hidden="true"
    >
      {icon}
    </div>
  );
}

function StateActionButton({ action }: { action: StateAction }) {
  const icon = action.icon ? <span aria-hidden="true">{action.icon}</span> : null;
  if (action.href) {
    return (
      <a
        href={action.href}
        className={buttonClass(action.variant === "secondary" ? "secondary" : "primary", "md")}
      >
        {icon}
        {action.label}
      </a>
    );
  }
  return (
    <Button
      variant={action.variant === "secondary" ? "secondary" : "primary"}
      onClick={action.onClick}
    >
      {icon}
      {action.label}
    </Button>
  );
}

export function SetupChecklist({ steps, className }: { steps: SetupStep[]; className?: string }) {
  return (
    <ol className={cn("grid gap-2 text-left", className)}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white/80 p-2.5"
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              step.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
            )}
            aria-hidden="true"
          >
            {step.done ? <Check className="h-3 w-3" /> : index + 1}
          </span>
          <span className="min-w-0 flex-1">
            {step.href ? (
              <a href={step.href} className="block text-xs font-semibold text-slate-900">
                {step.title}
              </a>
            ) : (
              <span className="block text-xs font-semibold text-slate-900">{step.title}</span>
            )}
            {step.hint ? (
              <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{step.hint}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function StateView({
  type = "empty",
  tone,
  icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  helperText,
  checklist,
  meta,
  compact,
  className,
  id,
}: {
  type?: StateType;
  tone?: StateTone;
  icon?: ReactNode;
  title: string;
  description: string;
  /** Legacy/passthrough action node, used by existing call sites. */
  action?: ReactNode;
  primaryAction?: StateAction;
  secondaryAction?: StateAction;
  helperText?: string;
  checklist?: SetupStep[];
  meta?: ReactNode;
  compact?: boolean;
  className?: string;
  id?: string;
}) {
  const resolvedTone = toneFor(type, tone);
  const a11y = a11yFor(type);
  const hasActions = Boolean(action || primaryAction || secondaryAction);

  return (
    <div
      id={id}
      role={a11y.role}
      aria-live={a11y.live}
      aria-busy={a11y.busy || undefined}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        TONE_SURFACE[resolvedTone],
        className,
      )}
    >
      <StateIllustration icon={icon} tone={resolvedTone} compact={compact} />
      <h3 className={cn("font-display text-lg font-bold", TONE_TITLE[resolvedTone])}>{title}</h3>
      <p
        className={cn(
          "mt-1 max-w-md text-sm leading-relaxed",
          TONE_BODY[resolvedTone],
          type === "offline" || type === "partial" || type === "preview" ? "" : "text-balance",
        )}
      >
        {description}
      </p>

      {meta ? <div className="mt-3">{meta}</div> : null}

      {checklist?.length ? (
        <SetupChecklist steps={checklist} className="mt-4 w-full max-w-md" />
      ) : null}

      {hasActions ? (
        <div className="mt-5 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row">
          {primaryAction ? <StateActionButton action={primaryAction} /> : null}
          {action}
          {secondaryAction ? <StateActionButton action={secondaryAction} /> : null}
        </div>
      ) : null}

      {helperText ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{helperText}</span>
        </p>
      ) : null}
    </div>
  );
}
