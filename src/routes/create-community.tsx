import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/create-community")({
  head: () => ({
    meta: [
      { title: "Create a Community · SukaSpace" },
      { name: "description", content: "Preview the SukaSpace creator setup flow for launching a learning community and course workspace." },
      { property: "og:title", content: "Create a Community · SukaSpace" },
      { property: "og:description", content: "Launch setup, niche selection, invitations, access management, and success confirmation." },
    ],
  }),
  component: CreateCommunityPage,
});

const STEPS = [
  { title: "Create your foundation", img: UPLOADED_MOCKUPS.createCommunityStep1, alt: "Create community form mockup" },
  { title: "Select your niche", img: UPLOADED_MOCKUPS.createCommunityStep2, alt: "SukaSpace niche selection mockup" },
  { title: "Invite members", img: UPLOADED_MOCKUPS.inviteMembers, alt: "Invite members mockup" },
  { title: "Manage access", img: UPLOADED_MOCKUPS.manageAccess, alt: "Manage access mockup" },
  { title: "Launch successfully", img: UPLOADED_MOCKUPS.launchSuccess, alt: "Community launch success mockup" },
] as const;

function CreateCommunityPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Launch a premium learning space in minutes.</h1>
              <p className="mt-4 text-lg font-medium text-slate-500">The uploaded SukaSpace mockups are now embedded as production assets to show the exact creator journey.</p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/auth" search={{ mode: "signup" }} className="rounded-xl bg-[#0284C7] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0369A1]">Start Creator Setup <ArrowRight size={16} className="inline" /></Link>
                <Link to="/creators" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">View Creator Tools</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {STEPS.map((step, index) => (
              <motion.article key={step.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 24, delay: index * 0.04 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
                  <h2 className="truncate text-base font-semibold text-slate-900">{step.title}</h2>
                </div>
                <img src={step.img} alt={step.alt} className="w-full object-cover" loading="lazy" />
              </motion.article>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 size={16} className="mr-2 inline" />All valid uploaded mockups are stored as production asset URLs and used in this flow.</div>
        </section>
      </main>
    </div>
  );
}
