type LogoProps = {
  variant?: "icon" | "full";
  className?: string;
};

export function Logo({ variant = "full", className }: LogoProps) {
  const mark = (
    <span aria-hidden="true" className="grid h-full aspect-square place-items-center rounded-md bg-primary text-primary-foreground font-black tracking-normal">
      TS
    </span>
  );
  if (variant === "icon") return <span aria-label="The Scenes" className={className ?? "inline-flex h-8 w-8"}>{mark}</span>;
  return <span aria-label="The Scenes" className={className ?? "inline-flex h-8 items-center gap-2"}>{mark}<span className="whitespace-nowrap text-base font-extrabold text-foreground">The Scenes</span></span>;
}
