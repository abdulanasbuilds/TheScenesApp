import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicHeader } from "@/components/PublicHeader";
import { GraduationCap, Users, Wallet, ShieldCheck, Layers, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

function useGoCreate() {
  const store = useAppStore();
  const nav = useNavigate();
  return () => {
    if (store.isHydrated && store.session) nav({ to: "/create-community" });
    else nav({ to: "/auth", search: { mode: "signup" } });
  };
}

function GoCreateBtn({ label, className = "" }: { label: string; className?: string }) {
  const go = useGoCreate();
  return (
    <button
      onClick={go}
      className={`inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 ${className}`}
    >
      {label}
    </button>
  );
}

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · SukaSpace" },
      {
        name: "description",
        content:
          "SukaSpace combines Circle-style community discussion with Skool-style structured courses so experts can teach, monetize, and build an audience in one place.",
      },
      { property: "og:title", content: "About · SukaSpace" },
      {
        property: "og:description",
        content:
          "The community and course platform for experts who teach and monetize their knowledge.",
      },
    ],
  }),
  component: AboutPage,
});

const PILLARS = [
  {
    icon: Users,
    title: "Community, not just a chat",
    body: "Multi-channel discussion spaces, live presence, DMs, and a leaderboard that rewards your most engaged members — the social layer that keeps people coming back daily.",
  },
  {
    icon: GraduationCap,
    title: "Courses with real structure",
    body: "Linear modules, lesson progress tracking, XP and streaks. Learners always know what to do next instead of getting lost in a dumped folder of videos.",
  },
  {
    icon: Wallet,
    title: "Built to monetize",
    body: "Launch free or paid access, track MRR and payouts, and grow discovery visibility across categories — the business side is native, not bolted on.",
  },
];

const FOR_WHO = [
  {
    title: "For creators & experts",
    body: "If you teach automation, code, design, marketing, or any other skill, SukaSpace gives you one workspace to run your paid community and your curriculum — instead of stitching together a Discord, a course host, and a spreadsheet.",
  },
  {
    title: "For learners & members",
    body: "Join a focused space led by a real practitioner, track your progress through their curriculum, and get direct access to the community and the person teaching it.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              <Sparkles size={12} className="text-primary" /> Community + Courses, one platform
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              The first community and course platform built for the AI era.
            </h1>
            <p className="mt-5 text-lg font-medium text-muted-foreground">
              SukaSpace takes what works from community platforms like Circle and course-driven
              platforms like Skool, and fuses them into one workspace — so experts can teach, build
              an audience, and get paid for it without juggling five separate tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GoCreateBtn label="Launch your community" />
              <Link
                to="/discover"
                className="inline-flex rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
              >
                Explore the platform
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              What SukaSpace is
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Three things, working as one system
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.title} className="rounded-xl border border-border bg-background p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <p.icon size={18} />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Who it's for
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Two sides of the same room
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {FOR_WHO.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-5">
                <Layers size={20} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    One workspace, not five subscriptions
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Community, classroom, messaging, leaderboard, calendar, and payouts live in the
                    same app — no more gluing a course host to a separate community tool.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-5">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Creator-first economics</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set your own pricing, free or paid, and keep full ownership of your audience and
                    content — SukaSpace is the workspace, not the middleman.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-border bg-background p-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Ready to build your space?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                It takes about two minutes to go from idea to a live, discoverable community.
              </p>
              <GoCreateBtn label="Create your community" className="mt-5" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
