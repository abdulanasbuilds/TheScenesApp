import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/PublicHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · SukaSpace" },
      { name: "description", content: "SukaSpace is a premium community and course platform for experts teaching modern technical skills." },
      { property: "og:title", content: "About · SukaSpace" },
      { property: "og:description", content: "A focused platform vision for learning communities in the AI and engineering era." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">SukaSpace is built for serious learning communities.</h1>
            <p className="mt-5 text-lg font-medium text-slate-500">We’re combining structured course progression with deep multi-topic community discussion so experts can teach with clarity and learners can keep momentum.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["Courses with direction", "Communities with context", "Creator tools with control"].map((item) => <div key={item} className="rounded-xl border border-slate-200 bg-white p-5 text-base font-semibold text-slate-900 shadow-sm">{item}</div>)}
            </div>
            <Link to="/discover" className="mt-8 inline-flex rounded-xl bg-[#0284C7] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0369A1]">Explore the Platform</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
