import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";

type LogoProps = {
  /** "icon" = square mark only (sidebars, badges). "full" = mark + wordmark. */
  variant?: "icon" | "full";
  className?: string;
};

/** Brand mark. Always use this instead of hand-rolled "S" badges or text wordmarks. */
export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "icon") {
    return <img src={logoIcon} alt="SukaSpace" className={className ?? "h-8 w-8"} />;
  }
  return <img src={logoFull} alt="SukaSpace" className={className ?? "h-8 w-auto"} />;
}
