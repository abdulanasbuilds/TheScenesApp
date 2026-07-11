import { createFileRoute } from "@tanstack/react-router";
import { UPLOADED_MOCKUPS } from "@/lib/mockup-assets";

export const Route = createFileRoute("/app/search")({
  head: () => ({ meta: [
    { title: "Search · SukaSpace" },
    { name: "description", content: "Search across communities, courses, members, messages, and resources." },
  ] }),
  component: SearchPage,
});

function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Search results</h1>
        <p className="mt-1 text-sm text-slate-500">Communities, courses, experts, resources, and threads unified in one view.</p>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <img src={UPLOADED_MOCKUPS.searchResults} alt="SukaSpace unified search results screen" className="w-full object-cover" />
      </div>
    </div>
  );
}
