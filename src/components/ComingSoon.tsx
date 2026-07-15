import { motion } from "framer-motion";
import { Bell, ArrowLeft, Sparkles, CheckCircle2, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { toast } from "sonner";

interface FeatureItem {
  icon: LucideIcon;
  label: string;
  desc: string;
}

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features?: FeatureItem[];
  badge?: string;
  backTo?: string;
  backLabel?: string;
  /** Optional visual accent gradient class applied to the header strip */
  gradientClass?: string;
}

export function ComingSoon({
  icon: Icon,
  title,
  subtitle,
  description,
  features = [],
  badge = "Coming Soon",
  backTo = "/app/feed",
  backLabel = "Back to Dashboard",
  gradientClass = "from-primary/10 via-primary/5 to-background",
}: ComingSoonProps) {
  const store = useAppStore();
  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    if (notified) return;
    store.pushNotification(`Early access list: You'll be notified when ${title} launches.`);
    toast.success("You're on the early-access list! We'll notify you in-app when it's live.");
    setNotified(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12 pb-24 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        className="w-full max-w-2xl"
      >
        {/* Back link */}
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> {backLabel}
        </Link>

        {/* Main card */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header strip */}
          <div
            className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${gradientClass}`}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl border border-primary/20 bg-primary/10 backdrop-blur-sm shadow-lg"
            >
              <Icon size={30} className="text-primary" />
            </motion.div>

            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              <Sparkles size={10} /> {badge}
            </span>
          </div>

          {/* Body */}
          <div className="p-7 sm:p-9">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm font-semibold text-primary">{subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

            {features.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <f.icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{f.label}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNotify}
                disabled={notified}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-default disabled:opacity-80 transition-all"
              >
                {notified ? (
                  <>
                    <CheckCircle2 size={15} />
                    You're on the early-access list
                  </>
                ) : (
                  <>
                    <Bell size={15} />
                    Notify me when it launches
                  </>
                )}
              </motion.button>
              <Link
                to={backTo}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                {backLabel}
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          We're building {title} to be more powerful than anything on the market.
          You'll receive an in-app notification the moment early access opens.
        </p>
      </motion.div>
    </div>
  );
}
