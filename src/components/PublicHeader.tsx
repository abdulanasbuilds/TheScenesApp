import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const PUBLIC_NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/learners", label: "Learners" },
  { to: "/creators", label: "Creators" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6 md:flex md:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-white">S</span>
          <span className="truncate text-base font-bold text-foreground">SukaSpace</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {PUBLIC_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/auth" search={{ mode: "signin" }} className="rounded-lg px-5 py-2 text-sm font-bold text-foreground border border-border hover:bg-gray-50 transition-colors">Log in</Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
            <Link to="/create-community" className="inline-flex items-center rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white border border-transparent hover:bg-blue-600 transition-colors">
              Get started
            </Link>
          </motion.div>
        </div>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-foreground md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-white px-4 py-3 md:hidden">
          <nav className="grid gap-1 text-sm font-medium text-foreground">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)} className="rounded-lg border border-border bg-white px-3 py-2 text-center text-sm font-bold text-foreground hover:bg-gray-50 transition-colors">Log in</Link>
            <Link to="/create-community" onClick={() => setOpen(false)} className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-white border border-transparent hover:bg-blue-600 transition-colors">Get started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
