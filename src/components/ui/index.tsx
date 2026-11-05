import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, X } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn, hashHue, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ buttons */

type Variant = "primary" | "secondary" | "ghost" | "dark" | "clay" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-700 text-white hover:bg-indigo-800 active:bg-indigo-900 shadow-[0_1px_2px_rgba(15,23,42,0.12)]",
  secondary:
    "bg-white text-slate-800 border border-slate-300 hover:border-slate-400 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
  clay: "bg-clay-600 text-white hover:bg-clay-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  soft: "bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-9 w-9",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- surfaces */

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag className={cn("rounded-xl border border-slate-200 bg-white", className)}>{children}</Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-[0.16em] text-indigo-700 uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "green" | "amber" | "clay" | "outline";
  className?: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-600 text-white",
    green: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    clay: "bg-clay-50 text-clay-700 ring-1 ring-clay-200",
    outline: "border border-slate-300 bg-white text-slate-600",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  active,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- forms */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[13px] font-semibold text-slate-800"
      >
        {label}
        {required ? (
          <span className="text-clay-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const fieldBase =
  "w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50";

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        fieldBase,
        "h-10",
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
          : "border-slate-300 focus:border-indigo-600",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        fieldBase,
        "min-h-28 py-2.5 leading-relaxed",
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
          : "border-slate-300 focus:border-indigo-600",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pr-9 pl-3.5 text-sm font-medium text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-indigo-700 bg-indigo-700 text-white"
            : "border-slate-300 bg-white hover:border-slate-400",
        )}
      >
        {checked ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-slate-700">
        <span className="font-medium text-slate-900">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-slate-900">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-indigo-700" : "bg-slate-300",
        )}
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
    </div>
  );
}

/* ------------------------------------------------------------------- feedback */

export function Progress({
  value,
  className,
  tone = "indigo",
  label,
}: {
  value: number;
  className?: string;
  tone?: "indigo" | "emerald" | "clay";
  label?: string;
}) {
  const tones = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    clay: "bg-clay-600",
  } as const;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-200", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/80", className)} />;
}

/* --------------------------------------------------------------------- people */

export function Avatar({
  name,
  size = 36,
  online,
  className,
  src,
}: {
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
  src?: string;
}) {
  const hue = hashHue(name);
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
          style={{
            background: `linear-gradient(140deg, hsl(${hue} 46% 42%), hsl(${(hue + 38) % 360} 54% 30%))`,
            fontSize: Math.max(10, size * 0.34),
          }}
        >
          {initials(name)}
        </span>
      )}
      {online ? (
        <span className="absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      ) : null}
      <span className="sr-only">{name}</span>
    </span>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((name) => (
        <span key={name} className="-ml-2 first:ml-0">
          <Avatar name={name} size={28} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- cover art */

export function CoverArt({
  seed,
  hue,
  className,
  label,
  rounded = "rounded-xl",
}: {
  seed: string;
  hue: number;
  className?: string;
  label?: string;
  rounded?: string;
}) {
  const shift = (hue + 26) % 360;
  return (
    <div
      role="img"
      aria-label={label ?? `Abstract cover art for ${seed}`}
      className={cn("relative overflow-hidden", rounded, className)}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 52% 30%), hsl(${shift} 58% 46%))`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <pattern
            id={`grid-${hue}-${seed.length}`}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="white"
              strokeOpacity="0.10"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="400" height="220" fill={`url(#grid-${hue}-${seed.length})`} />
        <circle cx="322" cy="52" r="86" fill="white" fillOpacity="0.10" />
        <circle cx="322" cy="52" r="52" fill="white" fillOpacity="0.08" />
        <path
          d="M-20 190 C 80 120, 160 230, 260 150 S 380 90, 440 120"
          fill="none"
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
        <path
          d="M-20 214 C 80 144, 160 254, 260 174 S 380 114, 440 144"
          fill="none"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="2"
        />
        <rect x="24" y="150" width="86" height="8" rx="4" fill="white" fillOpacity="0.35" />
        <rect x="24" y="166" width="54" height="8" rx="4" fill="white" fillOpacity="0.2" />
      </svg>
      {label ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-4 pt-8 pb-3 text-[11px] font-semibold tracking-wide text-white/90">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------- tabs */

export const Tabs = TabsPrimitive.Root;

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="relative shrink-0 px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-slate-500 transition-colors hover:text-slate-900 data-[state=active]:text-slate-900 after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-indigo-700 after:opacity-0 data-[state=active]:after:opacity-100"
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Content value={value} className={cn("focus-visible:outline-none", className)}>
      {children}
    </TabsPrimitive.Content>
  );
}

/* -------------------------------------------------------------------- dialog */

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[71] max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6",
            size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-slate-600">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ dropdown */

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-[72] min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg",
          className,
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  children,
  onSelect,
  className,
}: {
  children: ReactNode;
  onSelect?: () => void;
  className?: string;
}) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none select-none data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900",
        className,
      )}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-slate-200" />;
}
