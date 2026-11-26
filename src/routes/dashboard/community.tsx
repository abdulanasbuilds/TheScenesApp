import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Globe2,
  LayoutGrid,
  Link2,
  Lock,
  Palette,
  Plus,
  Save,
  Search,
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
import { MediaUploadField } from "@/components/domain/media-upload";
import { categories, getCommunity } from "@/data/seed";
import type { CommunitySpace } from "@/data/types";
import { createLocalId, formatCompact } from "@/lib/utils";
import { EARLY_ACCESS } from "@/lib/early-access";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/community")({
  head: () => ({ meta: [{ title: "Community settings — The Scenes creator workspace" }] }),
  component: CommunitySettingsPage,
});

function CommunitySettingsPage() {
  const community = getCommunity("ai-builders-guild")!;
  const { toast } = useToast();
  const { creatorCategories } = useApp();
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
  const [iconUrl, setIconUrl] = useState(community.iconUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(community.logoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(community.coverUrl ?? "");
  const [brandColor, setBrandColor] = useState(community.brandColor ?? "#4338ca");
  const [keywords, setKeywords] = useState((community.keywords ?? []).join(", "));
  const [customDomain, setCustomDomain] = useState(community.customDomain ?? "");
  const [minPostLevel, setMinPostLevel] = useState(String(community.minPostLevel ?? 1));
  const [spaces, setSpaces] = useState<CommunitySpace[]>(community.spaces ?? []);
  const [newSpace, setNewSpace] = useState({
    name: "",
    group: "Community",
    type: "posts" as CommunitySpace["type"],
    layout: "feed" as CommunitySpace["layout"],
  });
  const [links, setLinks] = useState(community.externalLinks ?? []);
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const keywordList = keywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const brandColorValid = /^#[0-9a-fA-F]{6}$/.test(brandColor);

  const addSpace = () => {
    if (newSpace.name.trim().length < 3) {
      toast("Name the space", "Use at least 3 characters so members know what it is for.");
      return;
    }
    setSpaces((current) => [
      ...current,
      {
        id: createLocalId("space-local"),
        name: newSpace.name.trim(),
        group: newSpace.group.trim() || "Community",
        type: newSpace.type,
        layout: newSpace.layout,
      },
    ]);
    setNewSpace({ ...newSpace, name: "" });
    toast("Space added locally", "No server record was created.");
  };

  const addLink = () => {
    if (!newLink.label.trim() || !/^https:\/\//.test(newLink.url.trim())) {
      toast("Link needs a label and an https address", "Nothing was saved.");
      return;
    }
    setLinks((current) => [...current, { label: newLink.label.trim(), url: newLink.url.trim() }]);
    setNewLink({ label: "", url: "" });
  };

  const saveGeneral = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 3) next.name = "Use at least 3 characters.";
    if (values.tagline.trim().length < 10) next.tagline = "Use at least 10 characters.";
    if (values.description.trim().length < 40)
      next.description = "Add at least 40 characters of context.";
    setErrors(next);
    if (Object.keys(next).length) return;
    toast("Community details saved", "Saved in this preview. Cloud sync is coming soon.");
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
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="spaces">Spaces</TabsTrigger>
              <TabsTrigger value="discovery">Discovery</TabsTrigger>
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
                        {[...categories, ...creatorCategories].map((category) => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                            {creatorCategories.some((item) => item.id === category.id)
                              ? " (draft)"
                              : ""}
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
                      hint="Free for early access. Paid plans belong to a later, approved payments phase."
                    >
                      <Input
                        id="community-price"
                        value={EARLY_ACCESS.shortLabel}
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

            <TabsContent value="branding">
              <div className="mt-4 space-y-5">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-indigo-700" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      Brand identity
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Upload the images members see in discovery, the community page and the
                    classroom. Keep icons simple and text-free because they render small.
                  </p>
                  <div className="mt-5 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <MediaUploadField
                      label="Community icon"
                      recommended="128 × 128"
                      value={iconUrl}
                      onChange={setIconUrl}
                      seed={community.slug}
                      hue={community.accentHue}
                      aspectClassName="aspect-square"
                    />
                    <MediaUploadField
                      label="Cover image"
                      recommended="1084 × 576"
                      value={coverUrl}
                      onChange={setCoverUrl}
                      seed={community.slug}
                      hue={community.accentHue}
                    />
                  </div>
                  <div className="mt-5 max-w-xs">
                    <MediaUploadField
                      label="Wordmark logo"
                      recommended="200 × 50 (4:1)"
                      value={logoUrl}
                      onChange={setLogoUrl}
                      seed={`${community.slug}-logo`}
                      hue={community.accentHue}
                      aspectClassName="aspect-[4/1]"
                    />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Brand colour"
                      htmlFor="brand-colour"
                      hint="Six-digit hex value. Used for buttons and accents."
                      error={brandColorValid ? undefined : "Use a hex colour like #4338ca."}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-9 w-9 shrink-0 rounded-lg border border-slate-200"
                          style={{ backgroundColor: brandColorValid ? brandColor : "#e2e8f0" }}
                          aria-hidden="true"
                        />
                        <Input
                          id="brand-colour"
                          value={brandColor}
                          onChange={(event) => setBrandColor(event.target.value)}
                          invalid={!brandColorValid}
                          spellCheck={false}
                        />
                      </div>
                    </Field>
                    <Field
                      label="Theme"
                      htmlFor="brand-theme"
                      hint="Light theme today. More themes are coming soon."
                    >
                      <Select id="brand-theme" value="light" disabled>
                        <option value="light">Light (default)</option>
                        <option value="dark">Dark (coming soon)</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Images stay in this browser tab. Upload storage and dark-mode tokens are not
                      connected.
                    </p>
                    <Button
                      disabled={!brandColorValid}
                      onClick={() =>
                        toast(
                          "Brand settings saved locally",
                          "No image was uploaded and no theme token was changed.",
                        )
                      }
                    >
                      <Save className="h-4 w-4" /> Save branding
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="spaces">
              <div className="mt-4 space-y-5">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-indigo-700" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      Spaces and layouts
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Group content the way Circle does with spaces. Each space has a type, a layout
                    and an uploaded image icon that stays crisp at small sizes.
                  </p>
                  <div className="mt-4 space-y-3">
                    {spaces.map((space) => (
                      <div
                        key={space.id}
                        className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_130px_130px_96px_auto] sm:items-end"
                      >
                        <div>
                          <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                            {space.group}
                          </p>
                          <Input
                            value={space.name}
                            aria-label={`Space name for ${space.name}`}
                            onChange={(event) =>
                              setSpaces((current) =>
                                current.map((item) =>
                                  item.id === space.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-9"
                          />
                        </div>
                        <Field label="Type" htmlFor={`space-type-${space.id}`}>
                          <Select
                            id={`space-type-${space.id}`}
                            value={space.type}
                            onChange={(event) =>
                              setSpaces((current) =>
                                current.map((item) =>
                                  item.id === space.id
                                    ? {
                                        ...item,
                                        type: event.target.value as CommunitySpace["type"],
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="h-9"
                          >
                            <option value="posts">Posts</option>
                            <option value="chat">Chat</option>
                            <option value="events">Events</option>
                            <option value="courses">Courses</option>
                          </Select>
                        </Field>
                        <Field label="Layout" htmlFor={`space-layout-${space.id}`}>
                          <Select
                            id={`space-layout-${space.id}`}
                            value={space.layout}
                            onChange={(event) =>
                              setSpaces((current) =>
                                current.map((item) =>
                                  item.id === space.id
                                    ? {
                                        ...item,
                                        layout: event.target.value as CommunitySpace["layout"],
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="h-9"
                          >
                            <option value="feed">Feed</option>
                            <option value="list">List</option>
                            <option value="card">Card</option>
                          </Select>
                        </Field>
                        <div className="w-20">
                          <MediaUploadField
                            label="Icon"
                            value={space.iconUrl}
                            onChange={(value) =>
                              setSpaces((current) =>
                                current.map((item) =>
                                  item.id === space.id ? { ...item, iconUrl: value } : item,
                                ),
                              )
                            }
                            seed={space.id}
                            hue={community.accentHue}
                            aspectClassName="aspect-square"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSpaces((current) => current.filter((item) => item.id !== space.id))
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Remove ${space.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-700">Add a space</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_130px_130px_auto]">
                      <Input
                        value={newSpace.name}
                        onChange={(event) => setNewSpace({ ...newSpace, name: event.target.value })}
                        placeholder="Space name"
                        aria-label="New space name"
                      />
                      <Input
                        value={newSpace.group}
                        onChange={(event) =>
                          setNewSpace({ ...newSpace, group: event.target.value })
                        }
                        placeholder="Group"
                        aria-label="New space group"
                      />
                      <Select
                        value={newSpace.type}
                        onChange={(event) =>
                          setNewSpace({
                            ...newSpace,
                            type: event.target.value as CommunitySpace["type"],
                          })
                        }
                        aria-label="New space type"
                      >
                        <option value="posts">Posts</option>
                        <option value="chat">Chat</option>
                        <option value="events">Events</option>
                        <option value="courses">Courses</option>
                      </Select>
                      <Select
                        value={newSpace.layout}
                        onChange={(event) =>
                          setNewSpace({
                            ...newSpace,
                            layout: event.target.value as CommunitySpace["layout"],
                          })
                        }
                        aria-label="New space layout"
                      >
                        <option value="feed">Feed</option>
                        <option value="list">List</option>
                        <option value="card">Card</option>
                      </Select>
                      <Button type="button" variant="secondary" onClick={addSpace}>
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Saved for this preview. Full space permissions are coming soon.
                    </p>
                    <Button
                      onClick={() =>
                        toast(
                          "Spaces saved locally",
                          "Your layout is saved for this preview. Connected routing is coming soon.",
                        )
                      }
                    >
                      <Save className="h-4 w-4" /> Save spaces
                    </Button>
                  </div>
                </Card>

                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-indigo-700" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      External links
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Links shown in the community sidebar. Only https addresses are accepted.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {links.map((link) => (
                      <li
                        key={`${link.label}-${link.url}`}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
                      >
                        <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">
                            {link.label}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {link.url}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLinks((current) => current.filter((item) => item !== link))
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Remove link ${link.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                    <Input
                      value={newLink.label}
                      onChange={(event) => setNewLink({ ...newLink, label: event.target.value })}
                      placeholder="Link label"
                      aria-label="New external link label"
                    />
                    <Input
                      value={newLink.url}
                      onChange={(event) => setNewLink({ ...newLink, url: event.target.value })}
                      placeholder="https://"
                      aria-label="New external link address"
                      spellCheck={false}
                    />
                    <Button type="button" variant="secondary" onClick={addLink}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="discovery">
              <div className="mt-4 space-y-5">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-indigo-700" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      Discovery and search
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Describe the room in the words a member would search for. Discovery keyword
                    metadata is stored locally in this preview.
                  </p>
                  <div className="mt-4">
                    <Field
                      label="Search keywords"
                      htmlFor="community-keywords"
                      hint={`${keywordList.length} of 11 keywords · separate with commas.`}
                      error={keywordList.length > 11 ? "Use at most 11 keywords." : undefined}
                    >
                      <Textarea
                        id="community-keywords"
                        value={keywords}
                        onChange={(event) => setKeywords(event.target.value)}
                        className="min-h-20"
                        invalid={keywordList.length > 11}
                      />
                    </Field>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {keywordList.slice(0, 11).map((keyword) => (
                        <Badge key={keyword} tone="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Custom domain"
                      htmlFor="community-domain"
                      hint="Custom domains are coming soon."
                    >
                      <Input
                        id="community-domain"
                        value={customDomain}
                        onChange={(event) => setCustomDomain(event.target.value)}
                        placeholder="community.yourbrand.com"
                        spellCheck={false}
                      />
                    </Field>
                    <Field
                      label="Minimum level to post"
                      htmlFor="community-post-level"
                      hint="Spam prevention: hold new members at level 1 until they participate."
                    >
                      <Select
                        id="community-post-level"
                        value={minPostLevel}
                        onChange={(event) => setMinPostLevel(event.target.value)}
                      >
                        <option value="1">Level 1 · post immediately</option>
                        <option value="2">Level 2 · after activity</option>
                        <option value="3">Level 3 · after more activity</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Public preview for non-members is already on; private spaces stay concealed.
                    </p>
                    <Button
                      disabled={keywordList.length > 11}
                      onClick={() =>
                        toast(
                          "Discovery settings saved locally",
                          "Saved in this preview. Search indexing and domain routing are coming soon.",
                        )
                      }
                    >
                      <Save className="h-4 w-4" /> Save discovery
                    </Button>
                  </div>
                </Card>
              </div>
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
                      toast("Rules saved locally", "Community rules are saved for this preview.")
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
                    description="Off by default. Messaging is coming soon."
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
                  <dd className="font-semibold text-emerald-700">
                    <span
                      className="mr-1 inline-block h-2 w-2 rounded-full bg-current align-middle"
                      aria-hidden="true"
                    />
                    {community.online}
                  </dd>
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
        title="Archiving is coming soon"
        description="Community archiving and member-data deletion are coming soon."
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
                  "Destructive actions stay off until archiving is live.",
                );
              }}
            >
              Confirm archive
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-950">
            Archiving will require authorization, audit logging, data-retention rules and a recovery
            plan. That work is coming soon, so no community can be archived yet.
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
