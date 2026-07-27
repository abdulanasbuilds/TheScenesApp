import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Check, Camera, User, Wallet, CreditCard, Bell, Shield, Plug, Loader2,
  Landmark, Smartphone, AlertCircle, CheckCircle2, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { PAYOUT_COUNTRIES, getCountry } from "@/lib/banks";
import { PLANS, formatFeeBps, formatStorageQuota } from "@/lib/plans";
import {
  getPayoutSetup, savePayoutAccountFn, savePayoutPreferencesFn, removePayoutAccountFn,
} from "@/lib/payouts.functions";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · SukaSpace" },
      { name: "description", content: "Manage your profile, payout account, billing, and notification preferences." },
    ],
  }),
  component: Settings,
});

type TabKey = "profile" | "account" | "payouts" | "billing" | "notifications" | "security" | "integrations";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile",       label: "Profile",       icon: User },
  { key: "account",       label: "Account",       icon: Shield },
  { key: "payouts",       label: "Payouts",       icon: Wallet },
  { key: "billing",       label: "Billing",       icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security",      label: "Security",      icon: Shield },
  { key: "integrations",  label: "Integrations",  icon: Plug },
];

type PayoutAccountView = Awaited<ReturnType<typeof getPayoutSetup>>["account"];

// ─── Shared bits ──────────────────────────────────────────────────────────────

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
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
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
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
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="mx-auto max-w-4xl p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, payouts, billing, and notifications.</p>

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
          {tab === "profile"       && <ProfileTab />}
          {tab === "account"       && <AccountTab />}
          {tab === "payouts"       && <PayoutsTab email={email} />}
          {tab === "billing"       && <BillingTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "security"      && <SecurityTab />}
          {tab === "integrations"  && <IntegrationsTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileTab() {
  const store = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(store.session?.photoUrl || "");
  const [photoSaved, setPhotoSaved] = useState(false);
  const [name, setName] = useState(store.session?.name || "");
  const [bio, setBio]   = useState(store.session?.bio || "");
  const initials = store.session?.name?.slice(0, 2).toUpperCase() || "YU";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Panel title="Profile" description="How you appear across communities and courses.">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Your profile" className="h-20 w-20 rounded-full border-2 border-border object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-foreground text-2xl font-bold text-white">{initials}</div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-foreground text-white shadow hover:bg-slate-700"
            title="Upload photo"
          >
            <Camera size={13} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-foreground">{store.session?.name}</div>
          <div className="text-xs capitalize text-muted-foreground">{store.session?.role} · {store.session?.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {photoUrl && (
              <button
                onClick={() => { setPhotoUrl(""); store.updateProfile({ photoUrl: "" }); }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >Remove</button>
            )}
            {photoUrl && photoUrl !== store.session?.photoUrl && (
              <button
                onClick={() => { store.updateProfile({ photoUrl }); setPhotoSaved(true); setTimeout(() => setPhotoSaved(false), 2000); }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >{photoSaved ? <><Check size={11} />Saved</> : "Save photo"}</button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">JPEG, PNG, or WebP · max 2 MB</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={80} />
        </Field>
        <Field label="Bio">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280}
            className={`${inputCls} resize-none`} placeholder="Tell members what you teach." />
        </Field>
        <div>
          <button
            onClick={() => { store.updateProfile({ name: name.trim(), bio: bio.trim() }); toast.success("Profile updated."); }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >Save changes</button>
        </div>
      </div>
    </Panel>
  );
}

// ─── Account ──────────────────────────────────────────────────────────────────

function AccountTab() {
  const store = useAppStore();
  return (
    <>
      <Panel title="Account" description="Your sign-in identity.">
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-3 py-3">
            <div><div className="text-sm font-medium text-foreground">Email</div>
              <div className="text-xs text-muted-foreground">{store.session?.email}</div></div>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div><div className="text-sm font-medium text-foreground">Role</div>
              <div className="text-xs capitalize text-muted-foreground">{store.session?.role}</div></div>
          </div>
        </div>
      </Panel>
      <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-rose-700">Sign out</h2>
        <p className="mt-1 text-sm text-rose-600">You'll be redirected to the login page.</p>
        <button onClick={() => store.signOut()} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          Sign out
        </button>
      </section>
    </>
  );
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

function PayoutsTab({ email }: { email: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [account, setAccount] = useState<PayoutAccountView>(null);

  const [countryCode, setCountryCode] = useState("NG");
  const [method, setMethod]           = useState<"bank" | "mobile_money">("bank");
  const [bankCode, setBankCode]       = useState(PAYOUT_COUNTRIES[0].banks[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName]     = useState("");
  const [network, setNetwork]             = useState("");
  const [mmNumber, setMmNumber]           = useState("");

  const [speed, setSpeed] = useState<"standard" | "instant">("standard");
  const [notify, setNotify] = useState(true);

  const country = getCountry(countryCode);

  const load = async () => {
    if (!email) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getPayoutSetup({ data: { creatorEmail: email } });
      setAccount(res.account);
      if (res.account) {
        setCountryCode(res.account.country);
        setMethod(res.account.method);
        setAccountName(res.account.accountName ?? "");
        if (res.account.bankCode) setBankCode(res.account.bankCode);
        if (res.account.mobileMoneyNetwork) setNetwork(res.account.mobileMoneyNetwork);
        setSpeed(res.account.defaultWithdrawalType);
        setNotify(res.account.payoutNotifications);
      }
    } catch {
      toast.error("Could not load your payout account.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [email]);

  const save = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const res = await savePayoutAccountFn({
        data: {
          creatorEmail: email,
          method,
          country: country.code,
          currency: country.currency,
          bankCode:  method === "bank" ? bankCode : undefined,
          bankName:  method === "bank" ? country.banks.find((b) => b.code === bankCode)?.name : undefined,
          accountNumber: method === "bank" ? accountNumber : undefined,
          accountName,
          mobileMoneyNetwork: method === "mobile_money" ? network : undefined,
          mobileMoneyNumber:  method === "mobile_money" ? mmNumber : undefined,
        },
      });
      if (!res.ok) { toast.error(res.error); return; }
      setAccount(res.account);
      setAccountNumber("");
      setMmNumber("");
      toast.success("Payout account saved.");
    } catch {
      toast.error("Could not save your payout account.");
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async (next: { defaultWithdrawalType?: "standard" | "instant"; payoutNotifications?: boolean }) => {
    if (!email || !account) return;
    const res = await savePayoutPreferencesFn({ data: { creatorEmail: email, ...next } });
    if (!res.ok) toast.error(res.error ?? "Could not save preferences.");
  };

  const remove = async () => {
    if (!email) return;
    await removePayoutAccountFn({ data: { creatorEmail: email } });
    setAccount(null);
    toast.success("Payout account removed.");
  };

  if (loading) {
    return (
      <Panel title="Payout account">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading payout details…
        </div>
      </Panel>
    );
  }

  return (
    <>
      {/* Status */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${
        account?.isPayoutReady ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      }`}>
        {account?.isPayoutReady
          ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          : <AlertCircle  size={18} className="mt-0.5 shrink-0 text-amber-600" />}
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${account?.isPayoutReady ? "text-emerald-800" : "text-amber-800"}`}>
            {account?.isPayoutReady ? "Payouts are ready" : "Add a payout account to withdraw"}
          </div>
          <p className={`text-xs ${account?.isPayoutReady ? "text-emerald-700" : "text-amber-700"}`}>
            {account?.isPayoutReady
              ? `${account.method === "bank" ? account.bankName ?? "Bank" : account.mobileMoneyNetwork} · ${account.accountNumberMasked ?? account.mobileMoneyNumberMasked} · ${account.accountName}`
              : "Earnings keep accruing in your balance until a payout destination is saved."}
          </p>
        </div>
      </div>

      <Panel title={account ? "Update payout account" : "Payout account"} description="Where SukaSpace sends your withdrawals.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country">
            <select
              value={countryCode}
              onChange={(e) => {
                const c = getCountry(e.target.value);
                setCountryCode(c.code);
                setBankCode(c.banks[0].code);
                setNetwork(c.mobileMoney[0] ?? "");
                if (c.mobileMoney.length === 0) setMethod("bank");
              }}
              className={inputCls}
            >
              {PAYOUT_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
            </select>
          </Field>

          <Field label="Payout method">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  method === "bank" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground"}`}
              ><Landmark size={13} /> Bank</button>
              <button
                type="button"
                disabled={country.mobileMoney.length === 0}
                onClick={() => setMethod("mobile_money")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
                  method === "mobile_money" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground"}`}
              ><Smartphone size={13} /> Mobile money</button>
            </div>
          </Field>

          {method === "bank" ? (
            <>
              <Field label="Bank">
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={inputCls}>
                  {country.banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Account number">
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={account?.accountNumberMasked ?? "0123456789"}
                  inputMode="numeric" maxLength={20} className={inputCls}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Network">
                <select value={network} onChange={(e) => setNetwork(e.target.value)} className={inputCls}>
                  {country.mobileMoney.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Mobile money number">
                <input
                  value={mmNumber}
                  onChange={(e) => setMmNumber(e.target.value)}
                  placeholder={account?.mobileMoneyNumberMasked ?? "+233 55 000 0000"}
                  inputMode="tel" maxLength={20} className={inputCls}
                />
              </Field>
            </>
          )}

          <div className="sm:col-span-2">
            <Field label="Account holder name">
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                placeholder="Exactly as it appears on the account" maxLength={120} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <>{account ? "Update account" : "Save payout account"}</>}
          </button>
          {account && (
            <button onClick={remove} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
              Remove
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Details are stored securely on the server and only shared with your payment provider when a withdrawal is processed.
        </p>
      </Panel>

      <Panel title="Withdrawal preferences" description="Applied by default when you request a withdrawal.">
        <Field label="Default withdrawal speed">
          <div className="flex gap-2">
            {(["standard", "instant"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={!account}
                onClick={() => { setSpeed(s); savePrefs({ defaultWithdrawalType: s }); }}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold capitalize disabled:opacity-40 ${
                  speed === s ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground"}`}
              >
                {s === "instant" && <Zap size={13} />}{s}
              </button>
            ))}
          </div>
        </Field>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Standard payouts are free and settle on the normal schedule. Instant payouts arrive right away, carry a fee, and require the Pro plan.
        </p>
        <div className="mt-2 border-t border-slate-100">
          <Toggle
            checked={notify}
            onChange={(v) => { setNotify(v); savePrefs({ payoutNotifications: v }); }}
            label="Notify me about payouts"
            hint="In-app alerts when a withdrawal is processed or fails."
          />
        </div>
      </Panel>
    </>
  );
}

// ─── Billing ──────────────────────────────────────────────────────────────────

function BillingTab() {
  return (
    <>
      <Panel title="Plan & billing" description="Your plan controls platform fees, storage, and instant payouts.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["free", "pro"] as const).map((id) => {
            const p = PLANS[id];
            return (
              <div key={id} className="rounded-xl border border-border p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-foreground">{p.name}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {p.priceUsdCents === 0 ? "Free" : `$${p.priceUsdCents / 100}/mo`}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>{formatFeeBps(p.platformFeeBps)} platform fee</li>
                  <li>{formatStorageQuota(p.storageBytes)}</li>
                  <li>{p.features.instantWithdrawal ? "Instant withdrawals" : "Standard withdrawals"}</li>
                </ul>
              </div>
            );
          })}
        </div>
        <Link to="/app/billing" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Open monetization dashboard
        </Link>
      </Panel>
      <Panel title="Payment methods" description="Used for your SukaSpace subscription.">
        <p className="text-sm text-muted-foreground">
          Subscription charges are handled by your payment provider at checkout — no card is stored by SukaSpace.
        </p>
      </Panel>
    </>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

const NOTIF_KEYS = [
  { key: "posts",    label: "New posts in my communities", hint: "In-app alerts for new activity." },
  { key: "dms",      label: "Direct messages",             hint: "Alerts when someone messages you." },
  { key: "comments", label: "Replies to my posts",         hint: "Alerts when someone replies." },
  { key: "sales",    label: "Sales & new members",         hint: "Alerts when someone joins or buys." },
] as const;

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return { posts: true, dms: true, comments: true, sales: true };
    try {
      return JSON.parse(localStorage.getItem("sukaspace_notif_prefs") ?? "") as Record<string, boolean>;
    } catch {
      return { posts: true, dms: true, comments: true, sales: true };
    }
  });

  const set = (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem("sukaspace_notif_prefs", JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <Panel title="Notifications" description="SukaSpace uses in-app notifications — email is reserved for critical account alerts.">
      <div className="divide-y divide-slate-100">
        {NOTIF_KEYS.map((n) => (
          <Toggle key={n.key} label={n.label} hint={n.hint} checked={prefs[n.key] !== false} onChange={(v) => set(n.key, v)} />
        ))}
      </div>
    </Panel>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <Panel title="Security" description="Keep your account and your earnings safe.">
      <ul className="divide-y divide-slate-100 text-sm">
        <li className="flex items-center justify-between gap-3 py-3">
          <div><div className="font-medium text-foreground">Password</div>
            <div className="text-xs text-muted-foreground">Reset from the sign-in screen.</div></div>
          <Link to="/auth" search={{ mode: "signin" }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">Reset</Link>
        </li>
        <li className="flex items-center justify-between gap-3 py-3">
          <div><div className="font-medium text-foreground">Withdrawal protection</div>
            <div className="text-xs text-muted-foreground">Every withdrawal is verified server-side against your balance and saved payout account.</div></div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Active</span>
        </li>
        <li className="flex items-center justify-between gap-3 py-3">
          <div><div className="font-medium text-foreground">Active sessions</div>
            <div className="text-xs text-muted-foreground">Sign out to end this session on this device.</div></div>
        </li>
      </ul>
    </Panel>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

function IntegrationsTab() {
  return (
    <Panel title="Integrations" description="Connected services powering your workspace.">
      <ul className="divide-y divide-slate-100 text-sm">
        <li className="flex items-center justify-between gap-3 py-3">
          <div><div className="font-medium text-foreground">Payments</div>
            <div className="text-xs text-muted-foreground">Paystack — checkout, subscriptions, and transfers.</div></div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Connected</span>
        </li>
        <li className="flex items-center justify-between gap-3 py-3">
          <div><div className="font-medium text-foreground">File & video hosting</div>
            <div className="text-xs text-muted-foreground">Available on the Pro plan; external embeds work on every plan.</div></div>
          <Link to="/app/billing" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">Manage</Link>
        </li>
      </ul>
    </Panel>
  );
}
