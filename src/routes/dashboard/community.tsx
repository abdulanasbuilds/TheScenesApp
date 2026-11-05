import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Globe2,
  Lock,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  buttonClass,
} from "@/components/ui";
import { categories, getCommunity } from "@/data/seed";
import { formatCompact, formatMoney } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/community")({
  head: () => ({ meta: [{ title: "Community settings — The Scenes creator workspace" }] }),
  component: CommunitySettingsPage,
});

function CommunitySettingsPage() {
  const community = getCommunity("ai-builders-guild")!;
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  const [values, setValues] = useState({
    name: community.name,
    tagline: community.tagline,
    description: community.description,
    category: community.categorySlug,
    privacy: community.privacy,
    language: community.languages[0] ?? "English",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rules, setRules] = useState(community.rules);
  const [newRule, setNewRule] = useState("");
  const [approval, setApproval] = useState(true);
  const [directMessages, setDirectMessages] = useState(false);
  const [publicLeaderboard, setPublicLeaderboard] = useState(false);
  const [publicDirectory, setPublicDirectory] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveText, setArchiveText] = useState("");

  const saveGeneral = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 3) next.name = "Use at least 3 characters.";
    if (values.tagline.trim().length < 10) next.tagline = "Use at least 10 characters.";
    if (values.description.trim().length < 40)
      next.description = "Add at least 40 characters of context.";
    setErrors(next);
    if (Object.keys(next).length) return;
    toast(
      "Community details saved",
      "Saved to local preview state only; no server write occurred.",
    );
  };

  const addRule = () => {
    if (newRule.trim().length < 8) {
      toast("Rule is too short", "Write a specific rule with at least 8 characters.");
      return;
    }
    setRules((current) => [...current, newRule.trim()]);
    setNewRule("");
  };

  return (
    <CreatorShell active="community">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Community management
                </p>
                <Badge tone={community.privacy === "private" ? "slate" : "green"}>
                  {community.privacy === "private" ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Globe2 className="h-3 w-3" />
                  )}
                  {community.privacy}
                </Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                {community.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Shape how the room reads, who can enter and what members can do. Settings are local
                to this preview.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/communities/${community.slug}`} className={buttonClass("secondary", "md")}>
                Public page <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href={`/c/${community.slug}`} className={buttonClass("primary", "md")}>
                View as member
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
              <TabsTrigger value="danger">Danger zone</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="mt-4 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-indigo-700" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Community identity
                  </h2>
                </div>
                <form onSubmit={saveGeneral} className="mt-5 space-y-5" noValidate>
                  <Field
                    label="Community name"
                    htmlFor="community-name"
                    error={errors.name}
                    required
                  >
                    <Input
                      id="community-name"
                      value={values.name}
                      onChange={(event) => setValues({ ...values, name: event.target.value })}
                      invalid={Boolean(errors.name)}
                    />
                  </Field>
                  <Field
                    label="One-line promise"
                    htmlFor="community-tagline"
                    hint="Shown in discovery and at the top of the public page."
                    error={errors.tagline}
                    required
                  >
                    <Input
                      id="community-tagline"
                      value={values.tagline}
                      onChange={(event) => setValues({ ...values, tagline: event.target.value })}
                      invalid={Boolean(errors.tagline)}
                    />
                  </Field>
                  <Field
                    label="Description"
                    htmlFor="community-description"
                    hint="What happens inside, who it is for and what makes it different."
                    error={errors.description}
                    required
                  >
                    <Textarea
                      id="community-description"
                      value={values.description}
                      onChange={(event) =>
                        setValues({ ...values, description: event.target.value })
                      }
                      invalid={Boolean(errors.description)}
                      className="min-h-32"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category" htmlFor="community-category">
                      <Select
                        id="community-category"
                        value={values.category}
                        onChange={(event) => setValues({ ...values, category: event.target.value })}
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Primary language" htmlFor="community-language">
                      <Select
                        id="community-language"
                        value={values.language}
                        onChange={(event) => setValues({ ...values, language: event.target.value })}
                      >
                        <option>English</option>
                        <option>French</option>
                        <option>Twi</option>
                        <option>Swahili</option>
                        <option>Portuguese</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Privacy"
                      htmlFor="community-privacy"
                      hint="Private communities are hidden from public discovery."
                    >
                      <Select
                        id="community-privacy"
                        value={values.privacy}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            privacy: event.target.value as "public" | "private",
                          })
                        }
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </Select>
                    </Field>
                    <Field
                      label="Membership price"
                      htmlFor="community-price"
                      hint="Price changes belong to the payments phase."
                    >
                      <Input
                        id="community-price"
                        value={
                          community.pricing.type === "free"
                            ? "Free"
                            : `${formatMoney(community.pricing.amount)} / ${
                                community.pricing.interval ?? "one time"
                              }`
                        }
                        disabled
                        readOnly
                      />
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Changes stay in browser memory until this preview reloads.
                    </p>
                    <Button type="submit">
                      <Save className="h-4 w-4" /> Save details
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="rules">
              <Card className="mt-4 p-5 sm:p-6">
                <h2 className="font-display text-lg font-extrabold text-slate-900">House rules</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Short, observable rules work better than vague values. Members see the first three
                  on the community feed.
                </p>
                <ol className="mt-5 space-y-3">
                  {rules.map((rule, index) => (
                    <li
                      key={`${rule}-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <span className="mt-2 font-mono text-xs font-bold text-indigo-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700">{rule}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setRules((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                        aria-label={`Remove rule ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ol>
                {!rules.length ? (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-950">
                    No rules remain. Add at least one before publishing the community.
                  </p>
                ) : null}
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <label htmlFor="new-rule" className="text-xs font-bold text-slate-700">
                    Add a rule
                  </label>
                  <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="new-rule"
                      value={newRule}
                      onChange={(event) => setNewRule(event.target.value)}
                      placeholder="e.g. Post the constraint before asking for feedback"
                    />
                    <Button type="button" variant="secondary" onClick={addRule}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button
                    onClick={() =>
                      toast(
                        "Rules saved locally",
                        "Community rules are not persisted to a server in this phase.",
                      )
                    }
                  >
                    <Save className="h-4 w-4" /> Save rules
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="access">
              <Card className="mt-4 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Access and moderation
                  </h2>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  These switches change the local interface only. Server-side enforcement and audit
                  logging are required before production.
                </p>
                <div className="mt-4 divide-y divide-slate-100">
                  <Toggle
                    id="approval"
                    checked={approval}
                    onChange={setApproval}
                    label="Review new member requests"
                    description="Hold new members until an admin approves them."
                  />
                  <Toggle
                    id="direct-messages"
                    checked={directMessages}
                    onChange={setDirectMessages}
                    label="Allow member direct messages"
                    description="Off by default. Messaging is a later product phase."
                  />
                  <Toggle
                    id="public-directory"
                    checked={publicDirectory}
                    onChange={setPublicDirectory}
                    label="Show the member directory"
                    description="Members can browse each other by name and skill."
                  />
                  <Toggle
                    id="public-leaderboard"
                    checked={publicLeaderboard}
                    onChange={setPublicLeaderboard}
                    label="Enable the leaderboard"
                    description="Ranking policy is unresolved; keep this off until a privacy decision is made."
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">
                    Current preview: {approval ? "approval on" : "open joining"} ·{" "}
                    {publicDirectory ? "directory visible" : "directory hidden"}
                  </p>
                  <Button
                    onClick={() =>
                      toast(
                        "Access settings saved locally",
                        "No server policy or RLS rule was changed.",
                      )
                    }
                  >
                    <Check className="h-4 w-4" /> Save access
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="danger">
              <Card className="mt-4 border-rose-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                  <h2 className="font-display text-lg font-extrabold">Danger zone</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Archiving would hide the community and stop new joins. It is intentionally not
                  implemented because destructive operations need explicit production authority.
                </p>
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-bold text-rose-950">Archive this community</p>
                  <p className="mt-1 text-xs leading-5 text-rose-900">
                    No data will be deleted from this preview. The action opens an explanation
                    instead.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3 border-rose-300 text-rose-800 hover:bg-rose-100"
                    onClick={() => setArchiveOpen(true)}
                  >
                    Archive community
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <aside className="space-y-4">
            <Card className="p-4">
              <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                Community snapshot
              </h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Members</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatCompact(community.members)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Online now</dt>
                  <dd className="font-semibold text-emerald-700">● {community.online}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Posts / week</dt>
                  <dd className="font-semibold text-slate-900">{community.postsPerWeek}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Rating</dt>
                  <dd className="font-semibold text-slate-900">
                    {community.rating} ({community.reviews})
                  </dd>
                </div>
              </dl>
            </Card>
            <Card className="p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Users className="h-4 w-4 text-indigo-700" /> Member experience
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Preview the room exactly as a member sees it before changing more settings.
              </p>
              <a
                href={`/c/${community.slug}`}
                className={buttonClass("secondary", "md", "mt-3 w-full")}
              >
                Open member view
              </a>
            </Card>
            <Card className="border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-950">Settings are not production policy</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-900">
                Nothing here writes to a database, sends email or changes authorization. Those
                controls require server-side implementation and review.
              </p>
            </Card>
          </aside>
        </div>
      </div>

      <Modal
        open={archiveOpen}
        onOpenChange={(open) => {
          setArchiveOpen(open);
          if (!open) setArchiveText("");
        }}
        title="Archive is not connected"
        description="This preview cannot archive a community or delete member data."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setArchiveOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={archiveText !== community.name}
              onClick={() => {
                setArchiveOpen(false);
                setArchiveText("");
                toast(
                  "No community was archived",
                  "Destructive actions are disabled in the frontend preview.",
                );
              }}
            >
              Confirm preview archive
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-950">
            A production archive would require server-side authorization, audit logging, data
            retention rules and a recovery plan. None of that exists in this build.
          </div>
          <Field label={`Type “${community.name}” to confirm`} htmlFor="archive-confirm">
            <Input
              id="archive-confirm"
              value={archiveText}
              onChange={(event) => setArchiveText(event.target.value)}
              placeholder={community.name}
            />
          </Field>
        </div>
      </Modal>
    </CreatorShell>
  );
}
