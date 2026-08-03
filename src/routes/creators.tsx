import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, Settings, Users } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";
import { useAppStore } from "@/lib/app-store";

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
  const store = useAppStore();
  const nav = useNavigate();
  const goCreate = () => {
    if (store.isHydrated && store.session) nav({ to: "/create-community" });
    else nav({ to: "/auth", search: { mode: "signup" } });
  };
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:py-20">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Creator Operating System</div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Launch the community, course, and access model in one flow.</h1>
              <p className="mt-4 text-lg font-medium text-muted-foreground">SukaSpace gives experts a premium command center for setup, members, lessons, revenue signals, and discoverability.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={goCreate} className="rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-white hover:bg-primary/90">Create a Community</button>
                <Link to="/app/creator" className="rounded-xl border border-border bg-card px-5 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent">View Creator Hub</Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <img src={UPLOADED_MOCKUPS.createCommunityStep1} alt="Create a SukaSpace community setup modal" className="rounded-xl border border-border bg-card shadow-sm" />
              <img src={UPLOADED_MOCKUPS.createCommunityStep2} alt="Select a SukaSpace community niche mockup" className="rounded-xl border border-border bg-card shadow-sm" />
              <img src={UPLOADED_MOCKUPS.inviteMembers} alt="Invite members to a SukaSpace community mockup" className="rounded-xl border border-border bg-card shadow-sm" />
              <img src={UPLOADED_MOCKUPS.manageAccess} alt="Manage SukaSpace member access settings mockup" className="rounded-xl border border-border bg-card shadow-sm" />
            </div>
          </div>
        </section>

        <section className="bg-card">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">What you get on day one</h2>
              <p className="mt-2 text-base font-medium text-muted-foreground">Your workspace starts clean \u2014 every number below is measured from your own community, never simulated.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                { icon: BarChart3,   label: "Revenue tracking",  body: "Server-verified payments only, so what you see is what you can withdraw." },
                { icon: Users,       label: "Member insights",   body: "Joins, active contributors, and engagement measured per community." },
                { icon: CheckCircle2,label: "Course completion", body: "Module and lesson progress for every enrolled member." },
                { icon: Settings,    label: "Discovery controls",body: "Keywords, screening questions, and a public about page you control." },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-muted-foreground">{metric.label}</span><metric.icon size={16} className="text-primary" /></div>
                  <p className="mt-3 text-sm text-muted-foreground">{metric.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-background p-5 text-center">
              <div className="text-base font-semibold text-foreground">Your growth timeline starts with your first member</div>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Create a community and the analytics dashboard begins recording joins, posts, and enrolments from that moment.</p>
              <button onClick={goCreate} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Create a Community</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
