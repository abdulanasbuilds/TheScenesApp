import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Check,
  Camera,
  User,
  Wallet,
  CreditCard,
  Bell,
  Shield,
  Loader2,
  Landmark,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Zap,
  HelpCircle,
  HardDrive,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  MessagesSquare,
  Building2,
  Plus,
  Star,
  Target,
  Info,
  Globe,
  ShieldCheck,
  MessageCircle,
  SmartphoneNfc,
  AppWindow,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/app-store";
import { PAYOUT_COUNTRIES, getCountry } from "@/lib/banks";
import {
  PLANS,
  formatFeeBps,
  formatStorageQuota,
  formatCurrency,
  calcWithdrawalFee,
} from "@/lib/plans";
import {
  getPayoutSetup,
  savePayoutAccountFn,
  savePayoutPreferencesFn,
  removePayoutAccountFn,
} from "@/lib/payouts.functions";
import {
  getCreatorDashboard,
  requestWithdrawal,
  initializePayment,
  verifyAndRecordPayment,
} from "@/lib/monetization.functions";
import { initiatePaystackPayment } from "@/lib/paystack";
import { hasInstallPrompt, triggerInstallPrompt, hapticTap, SPRING_FAST } from "@/lib/pwa";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · The Scenes" },
      {
        name: "description",
        content: "Manage your profile, payout account, billing, and notification preferences.",
      },
    ],
  }),
  component: Settings,
});

type TabKey =
  | "profile"
  | "notifications"
  | "messages"
  | "monetization"
  | "payouts"
  | "billing"
  | "storage"
  | "security"
  | "device"
  | "account";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "messages", label: "Messages", icon: MessagesSquare },
  { key: "monetization", label: "Monetization", icon: BarChart3 },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "billing", label: "Plan & Billing", icon: CreditCard },
  { key: "storage", label: "Storage", icon: HardDrive },
  { key: "security", label: "Security", icon: Shield },
  { key: "device", label: "Device / PWA", icon: AppWindow },
  { key: "account", label: "Account", icon: Shield },
];

type PayoutAccountView = Awaited<ReturnType<typeof getPayoutSetup>>["account"];
type DashboardData = Awaited<ReturnType<typeof getCreatorDashboard>>;

// ─── Shared bits ──────────────────────────────────────────────────────────────

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-3 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Settings() {
  const store = useAppStore();
  const email = store.session?.email ?? "";
  const [tab, setTab] = useState<TabKey>("profile");

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background pb-12">
      <div className="mx-auto max-w-4xl p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, monetization, payouts, PWA, and security options.
        </p>

        {/* Tabs */}
        <div className="mt-5 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-1.5 border-b border-border pb-px">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {tab === "profile" && <ProfileTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "messages" && <MessagesTab />}
          {tab === "monetization" && <MonetizationTab email={email} />}
          {tab === "payouts" && <PayoutsTab email={email} />}
          {tab === "billing" && <PlanAndBillingTab email={email} />}
          {tab === "storage" && <StorageTab email={email} />}
          {tab === "security" && <SecurityTab />}
          {tab === "device" && <DeviceTab />}
          {tab === "account" && <AccountTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const store = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(store.session?.photoUrl || "");
  const [photoSaved, setPhotoSaved] = useState(false);
  const [name, setName] = useState(store.session?.name || "");
  const [bio, setBio] = useState(store.session?.bio || "");
  const initials = store.session?.name?.slice(0, 2).toUpperCase() || "YU";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Panel title="Profile" description="How you appear across communities and courses.">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Your profile"
              className="h-20 w-20 rounded-full border-2 border-border object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-foreground text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-foreground text-white shadow hover:bg-slate-700"
            title="Upload photo"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-foreground">{store.session?.name}</div>
          <div className="text-xs capitalize text-muted-foreground">
            {store.session?.role} · {store.session?.email}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {photoUrl && (
              <button
                onClick={() => {
                  setPhotoUrl("");
                  store.updateProfile({ photoUrl: "" });
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                Remove
              </button>
            )}
            {photoUrl && photoUrl !== store.session?.photoUrl && (
              <button
                onClick={() => {
                  store.updateProfile({ photoUrl });
                  setPhotoSaved(true);
                  setTimeout(() => setPhotoSaved(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                {photoSaved ? (
                  <>
                    <Check size={11} />
                    Saved
                  </>
                ) : (
                  "Save photo"
                )}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">JPEG, PNG, or WebP · max 2 MB</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            maxLength={80}
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            className={`${inputCls} resize-none`}
            placeholder="Tell members what you teach."
          />
        </Field>
        <div>
          <button
            onClick={() => {
              store.updateProfile({ name: name.trim(), bio: bio.trim() });
              toast.success("Profile updated.");
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Save changes
          </button>
        </div>
      </div>
    </Panel>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

const NOTIF_KEYS = [
  { key: "posts", label: "New posts in my communities", hint: "In-app alerts for new activity." },
  { key: "dms", label: "Direct messages", hint: "Alerts when someone messages you." },
  { key: "comments", label: "Replies to my posts", hint: "Alerts when someone replies." },
  { key: "sales", label: "Sales & new members", hint: "Alerts when someone joins or buys." },
] as const;

function NotificationsTab() {
  const store = useAppStore();
  const prefs = store.notificationPrefs;

  const set = (key: string, value: boolean) => {
    store.updateNotificationPrefs({ ...prefs, [key]: value });
  };

  return (
    <Panel
      title="Notifications"
      description="The Scenes uses in-app notifications — email is reserved for critical account alerts."
    >
      <div className="divide-y divide-slate-100">
        {NOTIF_KEYS.map((n) => (
          <Toggle
            key={n.key}
            label={n.label}
            hint={n.hint}
            checked={prefs[n.key] !== false}
            onChange={(v) => set(n.key, v)}
          />
        ))}
      </div>
    </Panel>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab() {
  const store = useAppStore();
  const myCommunities = store.userCommunities;
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | "">("");

  useEffect(() => {
    if (selectedCommunityId !== "") {
      const comm = myCommunities.find((c) => c.id === selectedCommunityId);
      setWelcomeMessage(comm?.welcomeMessage || "");
    } else {
      setWelcomeMessage("");
    }
  }, [selectedCommunityId, myCommunities]);

  const handleSaveWelcome = () => {
    if (selectedCommunityId === "") {
      toast.error("Please select a community first.");
      return;
    }
    store.updateCommunity(selectedCommunityId, { welcomeMessage: welcomeMessage.trim() });
    toast.success("Automated welcome template saved.");
  };

  return (
    <Panel
      title="In-App Messaging & Auto-DMs"
      description="Configure private messaging rules and community join auto-welcoming."
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Community Welcomer (Auto-DM)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            When a learner joins your community, The Scenes will automatically send them a welcome DM
            on your behalf.
          </p>
        </div>

        {myCommunities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            You don't own any communities yet. Create a community first to setup welcome messages.
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Select Community">
              <select
                value={selectedCommunityId}
                onChange={(e) =>
                  setSelectedCommunityId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className={inputCls}
              >
                <option value="">-- Choose a Community --</option>
                {myCommunities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>

            {selectedCommunityId !== "" && (
              <>
                <Field label="Welcome Message Template">
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className={`${inputCls} resize-none`}
                    placeholder="Hey! Welcome to our learning space. Let me know if you have any questions or goals you are excited to tackle!"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {welcomeMessage.length}/500 characters
                  </p>
                </Field>

                <button
                  onClick={handleSaveWelcome}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  Save Welcome Message
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// ─── Monetization Tab ─────────────────────────────────────────────────────────

function MonetizationTab({ email }: { email: string }) {
  const store = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [payoutAcct, setPayoutAcct] = useState<PayoutAccountView>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [wdType, setWdType] = useState<"standard" | "instant">("standard");
  const [submitting, setSubmitting] = useState(false);

  const isCreator = store.session?.role === "creator";

  const load = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const [dash, payout] = await Promise.all([
        getCreatorDashboard({ data: { creatorEmail: email } }),
        getPayoutSetup({ data: { creatorEmail: email } }).catch(() => ({ account: null })),
      ]);
      setData(dash);
      setPayoutAcct(payout.account);
      if (payout.account?.defaultWithdrawalType) {
        setWdType(payout.account.defaultWithdrawalType);
      }
    } catch {
      toast.error("Could not load financials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [email]);

  const handleWithdraw = async () => {
    if (!email) return;
    const amountCents = Math.round(parseFloat(amount.replace(/,/g, "")) * 100);
    if (!amountCents || amountCents <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!payoutAcct?.isPayoutReady) {
      toast.error("Please configure your payout account first.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestWithdrawal({
        data: { creatorEmail: email, amountCents, currency: "NGN", withdrawalType: wdType },
      });
      if (result.ok) {
        toast.success("Withdrawal requested successfully!");
        setAmount("");
        setWithdrawOpen(false);
        await load();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Withdrawal failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableCents = data?.earnings?.availableBalanceCents ?? 0;
  const grossCents = data?.earnings?.grossEarnedCents ?? 0;
  const withdrawnCents = data?.earnings?.totalWithdrawnCents ?? 0;
  const pendingCents = data?.earnings?.pendingCents ?? 0;
  const currency = data?.earnings?.currency ?? "NGN";
  const plan = data?.plan ?? "free";

  if (!isCreator) {
    return (
      <Panel title="Monetization" description="Available for Creators only.">
        <div className="text-sm text-muted-foreground py-2">
          Only Creators can setup and check earnings. Go to Onboarding or Profile to set your
          account role to Creator.
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="Earnings Dashboard"
        description="Track your earnings and handle creator payouts."
      >
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard
            label="Gross Revenue"
            value={formatCurrency(grossCents, currency)}
            sub="Lifetime sales"
          />
          <StatCard
            label="Available"
            value={formatCurrency(availableCents, currency)}
            sub="Ready to pay out"
            color="text-primary"
          />
          <StatCard
            label="Withdrawn"
            value={formatCurrency(withdrawnCents, currency)}
            sub="Sent to your account"
          />
          <StatCard
            label="Pending"
            value={formatCurrency(pendingCents, currency)}
            sub="Awaiting process"
            color="text-amber-600"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setWithdrawOpen(true)}
            disabled={availableCents <= 0 || !payoutAcct?.isPayoutReady}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Request Withdrawal
          </button>
          {!payoutAcct?.isPayoutReady && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5 bg-amber-50 rounded-lg p-2 flex-1 border border-amber-200">
              <AlertCircle size={14} className="shrink-0" /> Set up your bank details in the Payouts
              tab to enable withdrawals.
            </p>
          )}
        </div>
      </Panel>

      <AnimatePresence>
        {withdrawOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
            onClick={() => setWithdrawOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Withdraw Balance</h2>
                <button
                  onClick={() => setWithdrawOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                >
                  ✖
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Speed selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWdType("standard")}
                    className={`rounded-xl border py-2 text-xs font-semibold ${wdType === "standard" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"}`}
                  >
                    Standard (Free)
                  </button>
                  <button
                    onClick={() => setWdType("instant")}
                    disabled={plan !== "pro"}
                    className={`rounded-xl border py-2 text-xs font-semibold ${wdType === "instant" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"} disabled:opacity-40`}
                  >
                    ⚡ Instant (Fee)
                  </button>
                </div>

                {wdType === "instant" ? (
                  <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-700 leading-normal border border-amber-200">
                    <p className="font-bold flex items-center gap-1">
                      <Zap size={11} /> Withdrawal Fee Details
                    </p>
                    <p className="mt-0.5">
                      Instant speed carries a fixed withdrawal fee of ₦100 + 1% percentage fee.
                      Standard speed is free.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-blue-50 p-2.5 text-[11px] text-blue-700 leading-normal border border-blue-200">
                    <p className="font-bold">Standard Withdrawal Speed</p>
                    <p className="mt-0.5">
                      Standard speed is completely free, settling within 1-3 business days.
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Amount (NGN)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Minimum withdrawal is ₦5,000.
                  </p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={submitting || !amount || parseFloat(amount) <= 0}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {submitting ? "Processing…" : "Confirm Withdrawal"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Payouts Tab with Onboarding Wizard ───────────────────────────────────────

function PayoutsTab({ email }: { email: string }) {
  const store = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<PayoutAccountView>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Wizard Flow state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isEditing, setIsEditing] = useState(false);

  // Input states
  const [countryCode, setCountryCode] = useState("NG");
  const [method, setMethod] = useState<"bank" | "mobile_money">("bank");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [network, setNetwork] = useState("");
  const [mmNumber, setMmNumber] = useState("");

  const [selectedPlanId, setSelectedPlanId] = useState<"free" | "pro">("free");
  const [businessName, setBusinessName] = useState(store.session?.name || "");

  const [speed, setSpeed] = useState<"standard" | "instant">("standard");
  const [notify, setNotify] = useState(true);

  const country = getCountry(countryCode);

  const load = async () => {
    if (!email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [res, dash] = await Promise.all([
        getPayoutSetup({ data: { creatorEmail: email } }),
        getCreatorDashboard({ data: { creatorEmail: email } }).catch(() => null),
      ]);
      setAccount(res.account);
      setDashboard(dash);
      if (dash) {
        setSelectedPlanId(dash.plan === "pro" ? "pro" : "free");
      }
      if (res.account) {
        setCountryCode(res.account.country);
        setMethod(res.account.method);
        setAccountName(res.account.accountName ?? "");
        if (res.account.bankCode) setBankCode(res.account.bankCode);
        if (res.account.mobileMoneyNetwork) setNetwork(res.account.mobileMoneyNetwork);
        setSpeed(res.account.defaultWithdrawalType);
        setNotify(res.account.payoutNotifications);
      } else {
        const c = getCountry("NG");
        setBankCode(c.banks[0]?.code || "");
        setNetwork(c.mobileMoney[0] || "");
      }
    } catch {
      toast.error("Could not load payout configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [email]);

  const saveWizard = async () => {
    if (!email) return;
    setSaving(true);
    try {
      // 1. Update Display Name if changed
      if (businessName.trim() && businessName.trim() !== store.session?.name) {
        await store.updateProfile({ name: businessName.trim() });
      }

      // 2. Save Payout details
      const res = await savePayoutAccountFn({
        data: {
          creatorEmail: email,
          method,
          country: country.code,
          currency: country.currency,
          bankCode: method === "bank" ? bankCode : undefined,
          bankName:
            method === "bank" ? country.banks.find((b) => b.code === bankCode)?.name : undefined,
          accountNumber: method === "bank" ? accountNumber : undefined,
          accountName,
          mobileMoneyNetwork: method === "mobile_money" ? network : undefined,
          mobileMoneyNumber: method === "mobile_money" ? mmNumber : undefined,
        },
      });

      if (!res.ok) {
        toast.error(res.error);
        setSaving(false);
        return;
      }

      // 3. Subscription redirection trigger if plan choice doesn't match current plan
      const currentPlan = dashboard?.plan ?? "free";
      if (selectedPlanId === "pro" && currentPlan === "free") {
        toast.success("Payout saved! Redirecting to subscribe to Pro plan...");
        const init = await initializePayment({
          data: { payerEmail: email, paymentType: "pro_subscription", currency: "USD" },
        });
        if (!init.ok) {
          toast.error(init.error);
          setSaving(false);
          return;
        }

        await initiatePaystackPayment({
          email,
          amount: init.amountCents,
          currency: "USD",
          reference: init.reference,
          metadata: { transactionId: init.transactionId, type: "pro_subscription" },
          onSuccess: async (ref) => {
            const verify = await verifyAndRecordPayment({
              data: { reference: ref, transactionId: init.transactionId, userEmail: email },
            });
            if (verify.ok) {
              toast.success("🎉 Upgrade to Pro successful! Lower 3% platform fees active.");
              await load();
              setIsEditing(false);
            } else {
              toast.error(verify.error);
            }
          },
          onClose: () => {
            toast.info("Payment closed. Plan remains Free (7% fee) but payout details are saved.");
            load();
            setIsEditing(false);
          },
        });
      } else {
        toast.success("Payout setup complete and verified!");
        setAccount(res.account);
        setAccountNumber("");
        setMmNumber("");
        setIsEditing(false);
        await load();
      }
    } catch {
      toast.error("Could not complete the setup wizard.");
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async (next: {
    defaultWithdrawalType?: "standard" | "instant";
    payoutNotifications?: boolean;
  }) => {
    if (!email || !account) return;
    const res = await savePayoutPreferencesFn({ data: { creatorEmail: email, ...next } });
    if (!res.ok) toast.error(res.error ?? "Could not save preferences.");
  };

  const remove = async () => {
    if (!email) return;
    await removePayoutAccountFn({ data: { creatorEmail: email } });
    setAccount(null);
    setWizardStep(1);
    toast.success("Payout details removed.");
  };

  if (loading) {
    return (
      <Panel title="Payouts Configuration">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading payout options…
        </div>
      </Panel>
    );
  }

  // Define steps check conditions
  const isStep1Valid = !!countryCode;
  const isStep2Valid =
    method === "bank"
      ? !!bankCode && !!accountNumber && accountNumber.replace(/\s+/g, "").length >= 6 && !!accountName
      : !!network && !!mmNumber && mmNumber.replace(/\s+/g, "").length >= 7 && !!accountName;
  const isStep3Valid = !!selectedPlanId;
  const isStep4Valid = !!businessName.trim();

  const showWizard = !account || isEditing;

  return (
    <>
      {/* Connected Account Display Card */}
      {!showWizard && account && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border p-4 border-emerald-200 bg-emerald-50">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-emerald-800">
                Payout Destination Active
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {account.method === "bank"
                  ? `${account.bankName ?? "Bank"} · ${account.accountNumberMasked} · ${account.accountName}`
                  : `${account.mobileMoneyNetwork} · ${account.mobileMoneyNumberMasked} · ${account.accountName}`}
              </p>
            </div>
            <button
              onClick={() => {
                setBusinessName(store.session?.name || "");
                setAccountName(account.accountName ?? "");
                setAccountNumber("");
                setMmNumber("");
                setIsEditing(true);
                setWizardStep(1);
              }}
              className="text-xs font-semibold text-primary hover:underline bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
            >
              Update Destination
            </button>
          </div>

          {/* Preferences and defaults */}
          <Panel title="Withdrawal Speed Preference" description="Your default withdrawal speed and notification preferences.">
            <Field label="Default Withdrawal Speed">
              <div className="flex gap-2">
                {(["standard", "instant"] as const).map((s) => {
                  const allowed = s === "instant" ? dashboard?.plan === "pro" : true;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!allowed}
                      onClick={() => {
                        setSpeed(s);
                        savePrefs({ defaultWithdrawalType: s });
                        toast.success(`Default speed set to ${s}`);
                      }}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold capitalize disabled:opacity-40 ${
                        speed === s
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {s === "instant" && <Zap size={13} />}
                      {s === "instant" ? "⚡ Instant" : "Standard (Free)"}
                    </button>
                  );
                })}
              </div>
            </Field>
            {speed === "instant" && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                Instant speed settlements incur an additional fixed plus percentage withdrawal fee. Standard transfers are always free.
              </p>
            )}

            <div className="mt-4 border-t border-slate-100 pt-1">
              <Toggle
                checked={notify}
                onChange={(v) => {
                  setNotify(v);
                  savePrefs({ payoutNotifications: v });
                }}
                label="In-App Money alerts"
                hint="Notify me inside The Scenes whenever a payment settles or payouts process."
              />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={remove}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg"
              >
                Disconnect Payout Method
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* interactive Payout Setup Wizard */}
      {showWizard && (
        <Panel
          title={isEditing ? "Modify Payout Setup" : "Setup Your Payout Destination"}
          description="A quick, step-by-step wizard to connect bank transfers, select plans, and configure currency securely."
        >
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
              <span>Step {wizardStep} of 5</span>
              <span>
                {wizardStep === 1 && "Country & Currency"}
                {wizardStep === 2 && "Payment Details"}
                {wizardStep === 3 && "Plan & Fees Selection"}
                {wizardStep === 4 && "Business Profile"}
                {wizardStep === 5 && "Review & Complete"}
              </span>
            </div>
            <div className="flex gap-1 h-1.5 w-full bg-accent rounded-full overflow-hidden">
              {([1, 2, 3, 4, 5] as const).map((s) => (
                <div
                  key={s}
                  className={`flex-1 transition-all rounded-full ${wizardStep >= s ? "bg-primary" : "bg-slate-200"}`}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[220px]">
            {/* Step 1: Country & Currency */}
            {wizardStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Select Your Settlement Region</h3>
                  <p className="text-xs text-muted-foreground">
                    We adapt payment networks depending on provider availability in your region.
                  </p>
                </div>

                <Field label="Payout Region / Country">
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      const c = getCountry(e.target.value);
                      setCountryCode(c.code);
                      setBankCode(c.banks[0]?.code || "");
                      setNetwork(c.mobileMoney[0] ?? "");
                      if (c.mobileMoney.length === 0) setMethod("bank");
                    }}
                    className={inputCls}
                  >
                    {PAYOUT_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="rounded-xl bg-accent/50 p-4 border border-border">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Globe size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Region Capabilities</p>
                      <p className="mt-1">
                        Settling in <strong>{country.currency}</strong>. Includes local bank channels
                        {country.mobileMoney.length > 0 ? " and mobile money integrations." : " only."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Bank / Mobile Money Details */}
            {wizardStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1"> payout account Details</h3>
                  <p className="text-xs text-muted-foreground">
                    Earnings are credited to this destination securely.
                  </p>
                </div>

                {country.mobileMoney.length > 0 && (
                  <Field label="Payout network method">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMethod("bank")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold ${
                          method === "bank"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:bg-accent"
                        }`}
                      >
                        <Landmark size={13} /> Local Bank
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod("mobile_money")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold ${
                          method === "mobile_money"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:bg-accent"
                        }`}
                      >
                        <Smartphone size={13} /> Mobile money
                      </button>
                    </div>
                  </Field>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {method === "bank" ? (
                    <>
                      <Field label="Choose Bank">
                        <select
                          value={bankCode}
                          onChange={(e) => setBankCode(e.target.value)}
                          className={inputCls}
                        >
                          {country.banks.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Account Number">
                        <input
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
                          placeholder="e.g. 0123456789"
                          inputMode="numeric"
                          maxLength={20}
                          className={inputCls}
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Mobile Money Network">
                        <select
                          value={network}
                          onChange={(e) => setNetwork(e.target.value)}
                          className={inputCls}
                        >
                          {country.mobileMoney.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Mobile money number">
                        <input
                          value={mmNumber}
                          onChange={(e) => setMmNumber(e.target.value)}
                          placeholder="e.g. 055 123 4567"
                          inputMode="tel"
                          maxLength={20}
                          className={inputCls}
                        />
                      </Field>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <Field label="Account Holder Name">
                      <input
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Exactly as registered on your account"
                        maxLength={120}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Plan & Billing Choice */}
            {wizardStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Choose Platform Plan</h3>
                  <p className="text-xs text-muted-foreground">
                    Select the plan that fits your creator volume. Upgrade anytime to access lower transaction rates.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: "free" as const,
                      name: "Free",
                      fee: "7% Platform Fee",
                      sub: "Standard bank settlements. External embeds only.",
                      price: "Free",
                    },
                    {
                      id: "pro" as const,
                      name: "Pro Creator",
                      fee: "3% Platform Fee",
                      sub: "Unlocks 100GB hosted storage, Bunny.net streaming, instant payouts.",
                      price: "$49/mo",
                    },
                  ].map((p) => {
                    const selected = selectedPlanId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`text-left rounded-xl border p-4 transition-all relative ${
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-card hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-sm">{p.name}</span>
                          <span className="text-xs font-bold text-primary">{p.price}</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground mt-1.5">{p.fee}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-normal">{p.sub}</p>
                        {selected && (
                          <span className="absolute top-2 right-2 text-primary font-bold text-xs">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Profile Name */}
            {wizardStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Public Display &amp; Branding</h3>
                  <p className="text-xs text-muted-foreground">
                    Enter the display or business name displayed to learners on The Scenes.
                  </p>
                </div>

                <Field label="Business / Creator Name">
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech Academy"
                    maxLength={100}
                    className={inputCls}
                  />
                </Field>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="flex gap-2 text-xs text-blue-800 leading-normal">
                    <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Learner Trust</p>
                      <p className="mt-0.5">
                        This branding is shown on community checkout cards. Clear, recognizable display names improve conversion.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Summary & Confirm */}
            {wizardStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Review Details</h3>
                  <p className="text-xs text-muted-foreground">
                    Verify everything before finishing the setup.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-accent/40 divide-y divide-border text-xs">
                  <div className="flex justify-between p-3">
                    <span className="font-medium text-muted-foreground">Business Name</span>
                    <span className="font-semibold text-foreground">{businessName}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="font-medium text-muted-foreground">Settlement Region</span>
                    <span className="font-semibold text-foreground">{country.name} ({country.currency})</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="font-medium text-muted-foreground">Payout Destination</span>
                    <span className="font-semibold text-foreground">
                      {method === "bank"
                        ? `${country.banks.find((b) => b.code === bankCode)?.name ?? "Bank"} (Acc: ${accountNumber})`
                        : `${network} (Phone: ${mmNumber})`}
                    </span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="font-medium text-muted-foreground">Account Holder</span>
                    <span className="font-semibold text-foreground">{accountName}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="font-medium text-muted-foreground">Selected Plan</span>
                    <span className="font-bold text-primary capitalize">
                      {selectedPlanId} ({selectedPlanId === "pro" ? "3% fee" : "7% fee"})
                    </span>
                  </div>
                </div>

                {selectedPlanId === "pro" && (dashboard?.plan ?? "free") === "free" && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-200 leading-normal">
                    <strong>Note:</strong> Since you chose the <strong>Pro Creator</strong> plan, finishing will open Paystack to authorize your monthly $49.00 payment to unlock 3% fee structure and storage metrics.
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 flex justify-between border-t border-border pt-4">
            {wizardStep > 1 ? (
              <button
                type="button"
                onClick={() => setWizardStep((s) => (s - 1) as any)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Back
              </button>
            ) : isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                Cancel Edit
              </button>
            ) : (
              <div />
            )}

            {wizardStep < 5 ? (
              <button
                type="button"
                disabled={
                  (wizardStep === 1 && !isStep1Valid) ||
                  (wizardStep === 2 && !isStep2Valid) ||
                  (wizardStep === 3 && !isStep3Valid) ||
                  (wizardStep === 4 && !isStep4Valid)
                }
                onClick={() => setWizardStep((s) => (s + 1) as any)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={saveWizard}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Completing...
                  </>
                ) : (
                  <>
                    <CheckCheck size={13} /> Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}

// ─── Plan & Billing Tab ───────────────────────────────────────────────────────

function PlanAndBillingTab({ email }: { email: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const plan = (data?.plan ?? "free") as "free" | "pro";

  const load = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const dash = await getCreatorDashboard({ data: { creatorEmail: email } });
      setData(dash);
    } catch {
      toast.error("Could not load plan details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [email]);

  const handleUpgrade = async () => {
    if (!email) return;
    setUpgrading(true);
    try {
      const init = await initializePayment({
        data: { payerEmail: email, paymentType: "pro_subscription", currency: "USD" },
      });
      if (!init.ok) {
        toast.error(init.error);
        return;
      }

      await initiatePaystackPayment({
        email,
        amount: init.amountCents,
        currency: "USD",
        reference: init.reference,
        metadata: { transactionId: init.transactionId, type: "pro_subscription" },
        onSuccess: async (ref) => {
          const verify = await verifyAndRecordPayment({
            data: { reference: ref, transactionId: init.transactionId, userEmail: email },
          });
          if (verify.ok) {
            toast.success("🎉 Upgrade to Pro successful! Lower fees active.");
            load();
          } else {
            toast.error(verify.error);
          }
        },
        onClose: () => setUpgrading(false),
      });
    } catch (err) {
      toast.error("Subscription process failed.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Panel title="Plan & billing" description="Manage subscription tiers and lower platform fees.">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["free", "pro"] as const).map((id) => {
          const p = PLANS[id];
          const active = plan === id;
          return (
            <div
              key={id}
              className={`rounded-xl border p-4 relative ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              {active && (
                <span className="absolute top-3 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  Active
                </span>
              )}
              <div className="flex items-baseline justify-between pr-12">
                <span className="text-sm font-bold text-foreground">{p.name}</span>
                <span className="text-sm font-semibold text-foreground">
                  {p.priceUsdCents === 0 ? "Free" : `$${p.priceUsdCents / 100}/mo`}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>
                  Platform fee: <strong>{formatFeeBps(p.platformFeeBps)}</strong> (takes cut of
                  revenue)
                </li>
                <li>{formatStorageQuota(p.storageBytes)} file uploads</li>
                <li>
                  {p.features.instantWithdrawal
                    ? "Instant withdrawals allowed"
                    : "Standard withdrawals only"}
                </li>
              </ul>
            </div>
          );
        })}
      </div>

      {plan === "free" && (
        <div className="mt-5">
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {upgrading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Upgrade to Pro · $49/mo
          </button>
        </div>
      )}
    </Panel>
  );
}

// ─── Storage Tab ──────────────────────────────────────────────────────────────

function StorageTab({ email }: { email: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const plan = data?.plan ?? "free";

  useEffect(() => {
    const load = async () => {
      if (!email) return;
      try {
        const dash = await getCreatorDashboard({ data: { creatorEmail: email } });
        setData(dash);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [email]);

  if (loading) {
    return (
      <Panel title="Storage Quota">
        <p className="text-xs text-muted-foreground animate-pulse">Loading usage data…</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Hosted Storage & Limits"
      description="Displays media hosting usage for files and video streams."
    >
      {plan !== "pro" ? (
        <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl px-4">
          <HardDrive className="mx-auto text-slate-300 mb-2" size={24} />
          <h3 className="text-sm font-semibold text-foreground">File Hosting Requires Pro</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-normal">
            Free plan users use external embeds (YouTube, Loom, Vimeo) and resource links (Dropbox,
            Drive) without quota constraints. Upgrading unlocks high-speed hosting.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Overall quota usage</span>
              <span className="text-muted-foreground">
                {formatStorageQuota(data?.storage?.usedBytes ?? 0)} of{" "}
                {formatStorageQuota(data?.storage?.quotaBytes ?? 0)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-accent overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${data?.storage?.usedPercent ?? 0}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data?.storage?.usedPercent ?? 0}% used ·{" "}
              {formatStorageQuota(data?.storage?.availableBytes ?? 0)} available
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3">
            <strong>Capabilities unlocked:</strong> High speed MP4, WebM streaming via Bunny.net and
            document (PDF, ZIP) downloads via R2.
          </div>
        </div>
      )}
    </Panel>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <Panel
      title="Security & Protection"
      description="Manage access keys, password changes, and payment safeguards."
    >
      <ul className="divide-y divide-slate-100 text-sm">
        <li className="flex items-center justify-between gap-3 py-3">
          <div>
            <div className="font-medium text-foreground">Password Update</div>
            <div className="text-xs text-muted-foreground">Change password anytime on sign-in.</div>
          </div>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
          >
            Reset
          </Link>
        </li>
        <li className="flex items-center justify-between gap-3 py-3">
          <div>
            <div className="font-medium text-foreground">Safe Transfers Safeguard</div>
            <div className="text-xs text-muted-foreground">
              Server validates webhook signatures and balance idempotency for transfers.
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Active
          </span>
        </li>
      </ul>
    </Panel>
  );
}

// ─── Device / PWA Tab ─────────────────────────────────────────────────────────

function DeviceTab() {
  const [standalone, setStandalone] = useState(false);
  const [promptAvailable, setPromptAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      setStandalone(isStandalone);
      setPromptAvailable(hasInstallPrompt());

      const onAvailable = () => setPromptAvailable(true);
      window.addEventListener("pwa-install-available", onAvailable);
      return () => window.removeEventListener("pwa-install-available", onAvailable);
    }
  }, []);

  const handleInstall = async () => {
    hapticTap();
    const accepted = await triggerInstallPrompt();
    if (accepted) {
      toast.success("Welcome aboard The Scenes! App added.");
    }
  };

  return (
    <Panel
      title="Device & Offline Caching"
      description="View app shell status, cache metrics, and setup installable PWA."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Standalone App Shell</h3>
            <p className="text-xs text-muted-foreground">
              Provides a native, browser-chrome free window container.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${standalone ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
          >
            {standalone ? "ACTIVE STANDALONE" : "RUNNING IN BROWSER"}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Offline Caching</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            The Scenes runs a service worker cache. Static assets, logos, and course structures cache
            locally so the interface remains fast and browseable offline.
          </p>
        </div>

        {!standalone && promptAvailable && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">The Scenes is Installable</p>
              <p className="text-[11px] text-muted-foreground">
                Add The Scenes to your dock or home screen for offline access.
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 whitespace-nowrap"
            >
              Install App
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab() {
  const store = useAppStore();
  return (
    <>
      <Panel title="Account" description="Your sign-in identity.">
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">Email</div>
              <div className="text-xs text-muted-foreground">{store.session?.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">Role</div>
              <div className="text-xs capitalize text-muted-foreground">{store.session?.role}</div>
            </div>
          </div>
        </div>
      </Panel>
      <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-rose-700">Sign out</h2>
        <p className="mt-1 text-sm text-rose-600">You'll be redirected to the login page.</p>
        <button
          onClick={() => store.signOut()}
          className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Sign out
        </button>
      </section>
    </>
  );
}

// ─── Stat card helper ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1.5 text-xl font-extrabold tracking-tight ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}
