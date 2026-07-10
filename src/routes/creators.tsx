import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, Settings, Users } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { MOCK_ANALYTICS, MOCK_GROWTH_SERIES } from "@/lib/mock-data";

export const Route = createFileRoute("/creators")({
  head: () => ({
    meta: [
      { title: "Creators Hub · SukaSpace" },
      { name: "description", content: "Launch, manage, and grow a premium community and course workspace with SukaSpace creator tools." },
      { property: "og:title", content: "Creators Hub · SukaSpace" },
      { property: "og:description", content: "Creator workflows for community setup, access control, invitations, courses, and analytics." },
    ],
  }),
  component: CreatorsPage,
});

function CreatorsPage() {
  const max = Math.max(...MOCK_GROWTH_SERIES);
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:py-20">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">Creator Operating System</div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Launch the community, course, and access model in one flow.</h1>
              <p className="mt-4 text-lg font-medium text-slate-500">SukaSpace gives experts a premium command center for setup, members, lessons, revenue signals, and discoverability.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/create-community" className="rounded-xl bg-[#0284C7] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#0369A1]">Create a Community</Link>
                <Link to="/app/creator" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50">View Creator Hub</Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <img src={UPLOADED_MOCKUPS.createCommunityStep1} alt="Create a SukaSpace community setup modal" className="rounded-xl border border-slate-200 bg-white shadow-sm" />
              <img src={UPLOADED_MOCKUPS.createCommunityStep2} alt="Select a SukaSpace community niche mockup" className="rounded-xl border border-slate-200 bg-white shadow-sm" />
              <img src={UPLOADED_MOCKUPS.inviteMembers} alt="Invite members to a SukaSpace community mockup" className="rounded-xl border border-slate-200 bg-white shadow-sm" />
              <img src={UPLOADED_MOCKUPS.manageAccess} alt="Manage SukaSpace member access settings mockup" className="rounded-xl border border-slate-200 bg-white shadow-sm" />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[{ icon: BarChart3, label: "MRR", value: MOCK_ANALYTICS.mrr }, { icon: Users, label: "Active members", value: MOCK_ANALYTICS.activeMembers }, { icon: CheckCircle2, label: "Completion", value: MOCK_ANALYTICS.courseCompletionRate }, { icon: Settings, label: "Discovery growth", value: MOCK_ANALYTICS.growthPercentage }].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-slate-500">{metric.label}</span><metric.icon size={16} className="text-[#0284C7]" /></div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
              <div className="mb-4 text-base font-semibold text-slate-900">Member growth timeline</div>
              <div className="flex h-48 items-end gap-2 rounded-lg border border-slate-200 bg-white p-4">
                {MOCK_GROWTH_SERIES.map((value, index) => <div key={index} className="flex-1 rounded-t bg-[#0284C7]" style={{ height: `${(value / max) * 100}%` }} />)}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
