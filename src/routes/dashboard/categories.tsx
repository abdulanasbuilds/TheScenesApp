import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { FolderTree, Plus, ShieldCheck, Tags, Trash2 } from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { categories } from "@/data/seed";
import { createLocalId } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/categories")({
  head: () => ({ meta: [{ title: "Categories — The Scenes creator workspace" }] }),
  component: CreatorCategoriesPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function hueFor(value: string) {
  const total = Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return total % 360;
}

function CreatorCategoriesPage() {
  const { creatorCategories, addCategory, removeCategory } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const slug = slugify(name);
    if (name.trim().length < 3) {
      setError("Use a category name with at least 3 characters.");
      return;
    }
    if (blurb.trim().length < 20) {
      setError("Describe the category in at least 20 characters.");
      return;
    }
    if (
      categories.some((item) => item.slug === slug) ||
      creatorCategories.some((item) => item.slug === slug)
    ) {
      setError("That category already exists. Pick a different name.");
      return;
    }
    addCategory({
      id: createLocalId("cat-local"),
      name: name.trim(),
      slug,
      blurb: blurb.trim(),
      hue: hueFor(name),
      communityCount: 0,
    });
    setName("");
    setBlurb("");
    setError("");
    toast(
      "Category created as a draft",
      "It is available in your community editor. Public listing requires review before it appears in Explore.",
    );
  };

  return (
    <CreatorShell active="categories">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
            Taxonomy
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
            Categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Create categories for the knowledge you teach. New categories start as drafts and are
            available in your own community editor immediately.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
            <ShieldCheck className="h-3.5 w-3.5" />
            Draft categories are local to this preview. A public taxonomy needs review, duplicate
            checks and a server-side write.
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-indigo-700" />
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Your draft categories
              </h2>
            </div>
            {creatorCategories.length ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {creatorCategories.map((category) => (
                  <li key={category.id} className="flex items-start gap-3 py-3">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: `hsl(${category.hue} 52% 44%)` }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{category.name}</p>
                        <Badge tone="amber">Draft</Badge>
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{category.blurb}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">
                        /categories/{category.slug}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Remove ${category.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                No draft categories yet. Create the first one with the form.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-indigo-700" />
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Create a category
              </h2>
            </div>
            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <Field label="Category name" htmlFor="category-name" error={error} required>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Climate data practice"
                  invalid={Boolean(error)}
                />
              </Field>
              <Field
                label="What belongs here?"
                htmlFor="category-blurb"
                hint="One or two sentences. This becomes the category description."
              >
                <Textarea
                  id="category-blurb"
                  value={blurb}
                  onChange={(event) => {
                    setBlurb(event.target.value);
                    if (error) setError("");
                  }}
                  className="min-h-24"
                  placeholder="Analysts and builders working on climate adaptation, measurement and public decisions."
                />
              </Field>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4" /> Create draft category
              </Button>
            </form>
          </Card>
        </div>

        <Card className="mt-6 p-5">
          <h2 className="font-display text-lg font-extrabold text-slate-900">
            Public taxonomy ({categories.length})
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            These categories are already visible in Explore and are shared across every creator.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: `hsl(${category.hue} 52% 44%)` }}
                  aria-hidden="true"
                />
                {category.name}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </CreatorShell>
  );
}
