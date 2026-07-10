import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">S</span>
          <span className="text-base font-semibold tracking-tight text-slate-900">SukaSpace</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link to="/discover" className="hover:text-slate-900">Discover</Link>
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#creators" className="hover:text-slate-900">For Creators</a>
          <a href="#learners" className="hover:text-slate-900">For Learners</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" search={{ mode: "signin" }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Log in</Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
            <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center rounded-lg bg-[#0284C7] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0369A1]">
              Get started
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
