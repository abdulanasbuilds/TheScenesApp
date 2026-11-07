import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Bell,
  Check,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { MemberShell } from "@/components/layout/member-shell";
import {
  Avatar,
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
import { updateOwnProfile } from "@/features/auth/auth.functions";
import { formatCompact, formatDate } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — The Scenes" }] }),
  component: SettingsPage,
});

type DangerMode = "deactivate" | "delete" | null;

function SettingsPage() {
  const router = useRouter();
  const { currentMember, user, signOut, dataMode } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: currentMember?.name ?? "Ama Boateng",
    handle: currentMember?.handle ?? "amaboateng",
    headline:
      currentMember?.headline ??
      "Product designer learning to ship AI features without breaking the craft.",
    location: currentMember?.location ?? "Accra, Ghana",
    bio:
      currentMember?.bio ??
      "Product designer in Accra. I joined The Scenes to learn how to ship AI features without breaking the craft.",
    expertise: "Product design, AI prototyping, Design systems",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  const [email, setEmail] = useState(user?.email ?? "ama@thescenes.example");
  const [emailError, setEmailError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [notifications, setNotifications] = useState({
    digest: true,
    replies: true,
    events: true,
    creator: false,
    product: false,
    push: false,
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showOnline: true,
    allowDms: false,
    searchIndex: true,
  });
  const [activityVisibility, setActivityVisibility] = useState("communities");

  const [dangerMode, setDangerMode] = useState<DangerMode>(null);
  const [dangerText, setDangerText] = useState("");

  const updateProfile = (field: keyof typeof profile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setProfileSaved(false);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (profile.name.trim().length < 2) next.name = "Use at least 2 characters.";
    if (dataMode === "fixtures" && !/^[a-z0-9_]{3,20}$/.test(profile.handle.trim()))
      next.handle = "Use 3–20 lowercase letters, numbers or underscores.";
    if (profile.headline.trim().length < 10) next.headline = "Add at least 10 characters.";
    if (profile.bio.trim().length < 40)
      next.bio = "Add at least 40 characters so people know what you do.";
    if (profile.location.trim().length < 2) next.location = "Add a city or region.";
    setProfileErrors(next);
    if (Object.keys(next).length) return;
    if (dataMode === "supabase-local") {
      const result = await updateOwnProfile({
        data: {
          displayName: profile.name,
          headline: profile.headline.trim() || null,
          bio: profile.bio.trim() || null,
          location: profile.location.trim() || null,
        },
      });
      if (!result.ok) {
        setProfileErrors({ form: result.error.message });
        return;
      }
      await router.invalidate();
      setProfileSaved(true);
      toast("Profile saved", "Your isolated local profile was updated.");
      return;
    }
    setProfileSaved(true);
    toast("Profile saved locally", "No server profile was updated in this frontend preview.");
  };

  const saveEmail = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    toast(
      "Email change is not connected",
      "No verification email was sent and no account record changed.",
    );
  };

  const savePassword = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = "Enter your current password.";
    if (newPassword.length < 8) next.next = "Use at least 8 characters.";
    if (confirmPassword !== newPassword) next.confirm = "Passwords do not match.";
    setPasswordErrors(next);
    if (Object.keys(next).length) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast(
      "Password unchanged",
      "Authentication is simulated in this preview. No credential was stored.",
    );
  };

  const closeDanger = () => {
    setDangerMode(null);
    setDangerText("");
  };

  return (
    <MemberShell active="settings">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Account
                </p>
                <Badge tone={dataMode === "fixtures" ? "amber" : "green"}>
                  {dataMode === "fixtures" ? "Frontend preview" : "Connected local proof"}
                </Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Your profile, security preferences and notification choices. Nothing here writes to
                a production account.
              </p>
            </div>
            {currentMember ? (
              <a
                href={`/c/ai-builders-guild/members/${currentMember.id}`}
                className={buttonClass("secondary", "md")}
              >
                View public profile
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="danger">Danger zone</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="mt-4 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-indigo-700" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Public profile
                  </h2>
                  {profileSaved ? (
                    <Badge tone="green">
                      <Check className="h-3 w-3" /> Saved locally
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  This is what members see in the directory and on your posts.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Avatar name={profile.name || "Member"} size={56} online />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {profile.name || "Your name"}
                    </p>
                    <p className="text-xs text-slate-500">@{profile.handle || "handle"}</p>
                  </div>
                  <Badge tone="outline">Avatar uploads not connected</Badge>
                </div>

                <form onSubmit={saveProfile} className="mt-5 space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Display name"
                      htmlFor="profile-name"
                      error={profileErrors.name}
                      required
                    >
                      <Input
                        id="profile-name"
                        value={profile.name}
                        onChange={(event) => updateProfile("name", event.target.value)}
                        invalid={Boolean(profileErrors.name)}
                      />
                    </Field>
                    <Field
                      label="Handle"
                      htmlFor="profile-handle"
                      hint={
                        dataMode === "fixtures"
                          ? "Lowercase letters, numbers and underscores."
                          : "Your registered handle cannot be changed."
                      }
                      error={profileErrors.handle}
                      required
                    >
                      <Input
                        id="profile-handle"
                        value={profile.handle}
                        readOnly={dataMode === "supabase-local"}
                        onChange={(event) => updateProfile("handle", event.target.value)}
                        invalid={Boolean(profileErrors.handle)}
                      />
                    </Field>
                  </div>
                  <Field
                    label="Headline"
                    htmlFor="profile-headline"
                    error={profileErrors.headline}
                    required
                  >
                    <Input
                      id="profile-headline"
                      value={profile.headline}
                      onChange={(event) => updateProfile("headline", event.target.value)}
                      invalid={Boolean(profileErrors.headline)}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Location"
                      htmlFor="profile-location"
                      error={profileErrors.location}
                      required
                    >
                      <Input
                        id="profile-location"
                        value={profile.location}
                        onChange={(event) => updateProfile("location", event.target.value)}
                        invalid={Boolean(profileErrors.location)}
                      />
                    </Field>
                    <Field
                      label="Skills"
                      htmlFor="profile-expertise"
                      hint="Comma-separated. Used for directory search."
                    >
                      <Input
                        id="profile-expertise"
                        value={profile.expertise}
                        onChange={(event) => updateProfile("expertise", event.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="About you" htmlFor="profile-bio" error={profileErrors.bio} required>
                    <Textarea
                      id="profile-bio"
                      value={profile.bio}
                      onChange={(event) => updateProfile("bio", event.target.value)}
                      className="min-h-28"
                      invalid={Boolean(profileErrors.bio)}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Changes reset when this preview reloads.
                    </p>
                    <Button type="submit">
                      <Save className="h-4 w-4" /> Save profile
                    </Button>
                  </div>
                  {profileErrors.form ? (
                    <p role="alert" className="text-sm font-medium text-red-600">
                      {profileErrors.form}
                    </p>
                  ) : null}
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <div className="mt-4 space-y-4">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-700" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      Email address
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Used for sign-in and important account messages. Verification email is not
                    connected.
                  </p>
                  <form onSubmit={saveEmail} className="mt-4 space-y-4" noValidate>
                    <Field label="Email" htmlFor="account-email" error={emailError} required>
                      <Input
                        id="account-email"
                        type="email"
                        value={email}
                        readOnly={dataMode === "supabase-local"}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (emailError) setEmailError("");
                        }}
                        invalid={Boolean(emailError)}
                      />
                    </Field>
                    {dataMode === "fixtures" ? (
                      <div className="flex justify-end">
                        <Button type="submit" variant="secondary">
                          Update email
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Email changes are unavailable in this local phase.
                      </p>
                    )}
                  </form>
                </Card>

                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-indigo-700" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">Password</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {dataMode === "fixtures"
                      ? "Authentication is simulated. These fields validate locally and never store a credential."
                      : "Password changes are unavailable until secure recovery and transactional email are connected."}
                  </p>
                  {dataMode === "fixtures" ? (
                    <form onSubmit={savePassword} className="mt-4 space-y-4" noValidate>
                      <Field
                        label="Current password"
                        htmlFor="current-password"
                        error={passwordErrors.current}
                        required
                      >
                        <Input
                          id="current-password"
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(event) => setCurrentPassword(event.target.value)}
                          invalid={Boolean(passwordErrors.current)}
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="New password"
                          htmlFor="new-password"
                          hint="At least 8 characters."
                          error={passwordErrors.next}
                          required
                        >
                          <Input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            invalid={Boolean(passwordErrors.next)}
                          />
                        </Field>
                        <Field
                          label="Confirm password"
                          htmlFor="confirm-password"
                          error={passwordErrors.confirm}
                          required
                        >
                          <Input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            invalid={Boolean(passwordErrors.confirm)}
                          />
                        </Field>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" variant="secondary">
                          <LockKeyhole className="h-4 w-4" /> Update password
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </Card>

                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h2 className="font-display text-lg font-extrabold text-slate-900">Session</h2>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">This browser session</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {dataMode === "fixtures"
                          ? "Local demo session · no server token"
                          : "Verified isolated local session"}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void (async () => {
                          await signOut();
                          await router.invalidate();
                          toast("Signed out", "This browser session was cleared.");
                          await router.navigate({ href: "/login" });
                        })()
                      }
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="mt-4 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-700" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    What reaches you
                  </h2>
                  <Badge tone="amber">Delivery not connected</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  These switches save a local preference. Email, push and in-app delivery are not
                  wired to a provider in this phase.
                </p>
                <div className="mt-4 divide-y divide-slate-100">
                  <Toggle
                    id="notify-digest"
                    checked={notifications.digest}
                    onChange={(value) => setNotifications({ ...notifications, digest: value })}
                    label="Weekly learning digest"
                    description="A short summary of new lessons and posts from your communities."
                  />
                  <Toggle
                    id="notify-replies"
                    checked={notifications.replies}
                    onChange={(value) => setNotifications({ ...notifications, replies: value })}
                    label="Replies and mentions"
                    description="When someone responds to your post or mentions your handle."
                  />
                  <Toggle
                    id="notify-events"
                    checked={notifications.events}
                    onChange={(value) => setNotifications({ ...notifications, events: value })}
                    label="Event reminders"
                    description="A reminder before sessions you confirmed."
                  />
                  <Toggle
                    id="notify-creator"
                    checked={notifications.creator}
                    onChange={(value) => setNotifications({ ...notifications, creator: value })}
                    label="Creator announcements"
                    description="Updates from the teachers and communities you follow."
                  />
                  <Toggle
                    id="notify-product"
                    checked={notifications.product}
                    onChange={(value) => setNotifications({ ...notifications, product: value })}
                    label="Product and marketplace updates"
                    description="Occasional changes to resources you saved or bought."
                  />
                  <Toggle
                    id="notify-push"
                    checked={notifications.push}
                    onChange={(value) => {
                      setNotifications({ ...notifications, push: value });
                      if (value) {
                        toast(
                          "Push permission was not requested",
                          "Browser notification permission belongs to a later phase.",
                        );
                      }
                    }}
                    label="Browser push notifications"
                    description="Requires explicit browser permission. Not requested in this preview."
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">Preferences are local to this session.</p>
                  <Button
                    onClick={() =>
                      toast(
                        "Notification preferences saved locally",
                        "No email or push provider was contacted.",
                      )
                    }
                  >
                    <Save className="h-4 w-4" /> Save preferences
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card className="mt-4 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Visibility and contact
                  </h2>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  These controls describe the intended product policy. Server-side enforcement and
                  database policies do not exist yet.
                </p>
                <div className="mt-4 divide-y divide-slate-100">
                  <Toggle
                    id="privacy-public"
                    checked={privacy.publicProfile}
                    onChange={(value) => setPrivacy({ ...privacy, publicProfile: value })}
                    label="Public member profile"
                    description="Let people outside your communities view your profile."
                  />
                  <Toggle
                    id="privacy-online"
                    checked={privacy.showOnline}
                    onChange={(value) => setPrivacy({ ...privacy, showOnline: value })}
                    label="Show when I am online"
                    description="Display a presence dot in the directory and posts."
                  />
                  <Toggle
                    id="privacy-dms"
                    checked={privacy.allowDms}
                    onChange={(value) => setPrivacy({ ...privacy, allowDms: value })}
                    label="Allow direct messages"
                    description="Messaging is a later product phase. This preference is stored locally only."
                  />
                  <Toggle
                    id="privacy-search"
                    checked={privacy.searchIndex}
                    onChange={(value) => setPrivacy({ ...privacy, searchIndex: value })}
                    label="Appear in member search"
                    description="Allow members of your communities to find you by skill and name."
                  />
                </div>
                <div className="mt-5 max-w-sm">
                  <Field label="Who can see your learning activity" htmlFor="privacy-activity">
                    <Select
                      id="privacy-activity"
                      value={activityVisibility}
                      onChange={(event) => setActivityVisibility(event.target.value)}
                    >
                      <option value="communities">Members of my communities</option>
                      <option value="signed-in">Anyone signed in</option>
                      <option value="private">Only me</option>
                    </Select>
                  </Field>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">
                    No database policy or RLS rule is changed here.
                  </p>
                  <Button
                    onClick={() =>
                      toast(
                        "Privacy preferences saved locally",
                        "Production authorization was not changed.",
                      )
                    }
                  >
                    <Save className="h-4 w-4" /> Save privacy
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="danger">
              <Card className="mt-4 border-rose-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-rose-700">
                  <TriangleAlert className="h-4 w-4" />
                  <h2 className="font-display text-lg font-extrabold">Danger zone</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Deactivation and deletion are not implemented. Both actions would need server-side
                  authorization, audit logging, retention rules and a recovery path.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-bold text-rose-950">Deactivate account</p>
                    <p className="mt-1 text-xs leading-5 text-rose-900">
                      Hide the profile and stop sign-in without deleting content.
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-3 border-rose-300 text-rose-800 hover:bg-rose-100"
                      onClick={() => setDangerMode("deactivate")}
                    >
                      Deactivate
                    </Button>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white p-4">
                    <p className="text-sm font-bold text-rose-950">Delete account data</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Permanently remove the account and owned content.
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-3 border-rose-300 text-rose-800 hover:bg-rose-100"
                      onClick={() => setDangerMode("delete")}
                    >
                      Delete data
                    </Button>
                  </div>
                </div>
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
                  These buttons open an explanation. They never claim a destructive action
                  succeeded.
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col items-center text-center">
                <Avatar name={profile.name || "Member"} size={64} online />
                <p className="mt-3 text-sm font-bold text-slate-900">{profile.name || "Member"}</p>
                <p className="text-xs text-slate-500">@{profile.handle || "handle"}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{profile.headline}</p>
              </div>
              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Points</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatCompact(currentMember?.points ?? 0)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Level</dt>
                  <dd className="font-semibold text-slate-900">{currentMember?.level ?? 1}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Joined</dt>
                  <dd className="font-semibold text-slate-900">
                    {currentMember ? formatDate(currentMember.joined) : "Preview member"}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Settings2 className="h-4 w-4 text-indigo-700" /> Account boundary
              </h2>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <li>• Profile edits stay in browser memory</li>
                <li>• Sign-in is a local demo session</li>
                <li>• No password is stored or transmitted</li>
                <li>• No verification email is sent</li>
              </ul>
              <a href="/help#status" className={buttonClass("secondary", "sm", "mt-3 w-full")}>
                View service status
              </a>
            </Card>
          </aside>
        </div>
      </div>

      <Modal
        open={Boolean(dangerMode)}
        onOpenChange={(open) => (!open ? closeDanger() : undefined)}
        title={dangerMode === "delete" ? "Delete account data?" : "Deactivate account?"}
        description="This is a preview explanation, not a destructive operation."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closeDanger}>
              Cancel
            </Button>
            <Button
              className="bg-rose-700 hover:bg-rose-800"
              disabled={dangerText !== profile.handle}
              onClick={() => {
                const mode = dangerMode;
                closeDanger();
                toast(
                  mode === "delete" ? "No data was deleted" : "No account was deactivated",
                  "Destructive account operations are disabled in this frontend preview.",
                );
              }}
            >
              <TriangleAlert className="h-4 w-4" />
              {dangerMode === "delete"
                ? "Confirm preview deletion"
                : "Confirm preview deactivation"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-950">
            {dangerMode === "delete"
              ? "A production deletion would need identity re-verification, ownership rules for posts and files, retention exceptions and an audit trail. None of that exists in this build."
              : "A production deactivation would need session revocation, sign-in blocking and a clear policy for public content. None of that exists in this build."}
          </div>
          <Field label={`Type “${profile.handle}” to confirm`} htmlFor="danger-confirm">
            <Input
              id="danger-confirm"
              value={dangerText}
              onChange={(event) => setDangerText(event.target.value)}
              placeholder={profile.handle}
            />
          </Field>
        </div>
      </Modal>
    </MemberShell>
  );
}
