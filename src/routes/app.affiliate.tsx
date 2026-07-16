import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, CheckCircle2, Globe, Users, Wallet, ArrowUpRight, Link2, Info, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/BrowserFrame";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/app/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate Program · SukaSpace" },
      { name: "description", content: "Set up and manage your affiliate program — earn commissions from referrals to your community." },
    ],
  }),
  component: AffiliatePage,
});

// ─── Affiliate settings persistence ──────────────────────────────────────────

interface AffiliateSettings {
  enabled: boolean;
  commissionRate: number;
  commissionType: "recurring" | "one-time";
  cookieDays: 30 | 60 | 90;
  referralCode: string;
}

const DEFAULTS: AffiliateSettings = {
  enabled: false, commissionRate: 20, commissionType: "recurring", cookieDays: 30, referralCode: "",
};

function load(communityId: number): AffiliateSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(`sukaspace_aff_${communityId}`);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

function persist(communityId: number, s: AffiliateSettings) {
  localStorage.setItem(`sukaspace_aff_${communityId}`, JSON.stringify(s));
}

function makeCode(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${slug}${Math.random().toString(36).slice(2, 6)}`;
}

const MOCK_AFFILIATES = [
  { id: 1, name: "Kwame Asante",  avatar: "KA", link: "Shared via Twitter",    referrals: 8,  conversions: 5, pendingUsd: 180, status: "active"  },
  { id: 2, name: "Amara Osei",    avatar: "AO", link: "Blog post",             referrals: 12, conversions: 9, pendingUsd: 324, status: "active"  },
  { id: 3, name: "Jonas Weiss",   avatar: "JW", link: "LinkedIn post",         referrals: 3,  conversions: 2, pendingUsd: 72,  status: "pending" },
  { id: 4, name: "Priya Nair",    avatar: "PN", link: "Email newsletter",      referrals: 6,  conversions: 4, pendingUsd: 144, status: "active"  },
  { id: 5, name: "Marcus Bell",   avatar: "MB", link: "Discord share",         referrals: 1,  conversions: 0, pendingUsd: 0,   status: "pending" },
  { id: 6, name: "Elena Rostova", avatar: "ER", link: "YouTube description",  referrals: 19, conversions: 14, pendingUsd: 504, status: "active"  },
];

// ─── Main component ───────────────────────────────────────────────────────────

function AffiliatePage() {
  const store = useAppStore();
  const myCommunities = store.communities.filter(c => c.creatorEmail === store.session?.email);
  const isCreator = myCommunities.length > 0;

  const [selectedId, setSelectedId] = useState<number>(() => myCommunities[0]?.id ?? -1);
  const community = myCommunities.find(c => c.id === selectedId) ?? myCommunities[0];
  const [aff, setAff] = useState<AffiliateSettings>(() => (community ? load(community.id) : DEFAULTS));
  const [rate, setRate] = useState(aff.commissionRate.toString());
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandFaq, setExpandFaq] = useState<number | null>(null);

  const referralLink = aff.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : "https://sukaspace.com"}/ref/${aff.referralCode}`
    : "";

  const stats = useMemo(() => ({
    affiliates: MOCK_AFFILIATES.length,
    referrals:  MOCK_AFFILIATES.reduce((s, a) => s + a.referrals, 0),
    conversions: MOCK_AFFILIATES.reduce((s, a) => s + a.conversions, 0),
    pending:    MOCK_AFFILIATES.reduce((s, a) => s + a.pendingUsd, 0),
  }), []);

  const switchCommunity = (id: number) => {
    setSelectedId(id);
    const s = load(id);
    setAff(s);
    setRate(s.commissionRate.toString());
  };

  const toggle = () => {
    if (!community) return;
    const next: AffiliateSettings = {
      ...aff,
      enabled: !aff.enabled,
      referralCode: !aff.enabled && !aff.referralCode ? makeCode(community.title) : aff.referralCode,
    };
    setAff(next);
    persist(community.id, next);
    toast.success(next.enabled ? "Affiliate program enabled!" : "Affiliate program disabled.");
  };

  const save = () => {
    if (!community) return;
    const parsed = Math.min(50, Math.max(5, parseInt(rate) || 20));
    const next = { ...aff, commissionRate: parsed };
    setRate(parsed.toString());
    setAff(next);
    persist(community.id, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Settings saved!");
  };

  const update = (patch: Partial<AffiliateSettings>) => {
    if (!community) return;
    const next = { ...aff, ...patch };
    setAff(next);
    persist(community.id, next);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const FAQS = [
    { q: "When do affiliates get paid?", a: "Payouts are processed automatically at the end of each billing cycle via Paystack. Affiliates need a Paystack or bank account set up." },
    { q: "Can I set different rates per plan?", a: "Per-plan rates are on the roadmap. Currently, one rate applies to all subscriptions for this community." },
    { q: "How are referrals tracked?", a: "Each affiliate gets a unique referral link with a cookie that lasts as long as your attribution window. Any purchase within that window is credited to them." },
    { q: "Can I remove an affiliate?", a: "Yes. From the affiliates table, click the member's name and select Remove. Pending earnings up to that point are still paid out." },
  ];

  if (!isCreator) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center p-8 text-center">
        <Share2 size={28} className="text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Affiliate program is for creators</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">Create a community first, then come back here to set up your affiliate marketing program.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Share2 size={20} className="text-primary" /> Affiliate Program
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let members and fans earn commissions for referring new subscribers. You control the rate — they do the promotion.
          </p>
        </div>
        {/* Community selector */}
        {myCommunities.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {myCommunities.map(c => (
              <button
                key={c.id}
                onClick={() => switchCommunity(c.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${c.id === selectedId ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Enable/disable card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-5 overflow-hidden rounded-xl border shadow-sm transition-colors ${aff.enabled ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
      >
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <span className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${aff.enabled ? "bg-primary text-white" : "bg-accent text-muted-foreground"}`}>
              <Share2 size={20} />
            </span>
            <div>
              <div className="text-base font-semibold text-foreground">
                {community?.title ?? "Your Community"}
              </div>
              <div className="text-xs text-muted-foreground">
                {aff.enabled
                  ? `Active · ${aff.commissionRate}% ${aff.commissionType} · ${aff.cookieDays}-day cookie`
                  : "Disabled — click to activate affiliate marketing"}
              </div>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${aff.enabled ? "bg-primary" : "bg-slate-200"}`}
            aria-label="Toggle affiliate program"
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${aff.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {aff.enabled && (
          <div className="border-t border-border p-5 space-y-5">
            {/* Commission rate */}
            <div>
              <label className="text-sm font-semibold text-foreground">Commission rate (%)</label>
              <p className="mt-0.5 text-xs text-muted-foreground">The percentage of each subscription payment your affiliates earn. You keep the rest.</p>
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="range" min={5} max={50} step={5}
                  value={parseInt(rate) || 20}
                  onChange={e => setRate(e.target.value)}
                  className="flex-1 accent-primary h-2 cursor-pointer"
                />
                <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2">
                  <input
                    type="number" min={5} max={50}
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    className="w-10 bg-transparent text-center text-lg font-bold text-foreground outline-none"
                  />
                  <span className="text-base font-semibold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">5% minimum</span>
                <span className="font-semibold text-primary">
                  {rate}% per conversion
                  {aff.commissionType === "recurring" ? " · every month" : " · one-time"}
                </span>
                <span className="text-muted-foreground">50% maximum</span>
              </div>
            </div>

            {/* Commission type */}
            <div>
              <label className="text-sm font-semibold text-foreground">Commission type</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["recurring", "one-time"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => update({ commissionType: t })}
                    className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${aff.commissionType === t ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="text-sm font-semibold text-foreground capitalize">{t}</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {t === "recurring"
                        ? "Affiliates earn every month for as long as the referral stays subscribed. Best for retention."
                        : "A single payment per new subscriber, regardless of how long they stay. Simpler to model."}
                    </div>
                    {aff.commissionType === t && (
                      <CheckCircle2 size={13} className="mt-2 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Attribution window */}
            <div>
              <label className="text-sm font-semibold text-foreground">Attribution window</label>
              <p className="mt-0.5 text-xs text-muted-foreground">How long after clicking the referral link a conversion counts toward the affiliate.</p>
              <div className="mt-2 flex gap-2">
                {([30, 60, 90] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => update({ cookieDays: d })}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${aff.cookieDays === d ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"}`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              {saved ? <><CheckCircle2 size={14} /> Settings saved!</> : "Save settings"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Referral link */}
      {aff.enabled && referralLink && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Link2 size={14} className="text-primary" /> Your affiliate landing link
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this with your affiliate partners. When someone uses their personal referral link (which appends their code to this URL) and subscribes, they earn their commission.
          </p>
          <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-background p-3">
            <Globe size={14} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate font-mono text-xs text-foreground">{referralLink}</span>
            <button
              onClick={copyLink}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${copied ? "bg-emerald-100 text-emerald-700" : "bg-primary text-white hover:bg-primary/90"}`}
            >
              {copied ? <><CheckCircle2 size={11} /> Copied</> : <><Copy size={11} /> Copy link</>}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Referral code: <code className="font-mono font-semibold text-foreground">{aff.referralCode}</code>
          </p>
        </div>
      )}

      {/* Stats */}
      {aff.enabled && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total affiliates",  value: stats.affiliates.toString(),  icon: Users,         color: "text-primary bg-sky-50"         },
              { label: "Total referrals",   value: stats.referrals.toString(),   icon: Share2,        color: "text-violet-600 bg-violet-50"   },
              { label: "Conversions",       value: stats.conversions.toString(), icon: CheckCircle2,  color: "text-emerald-600 bg-emerald-50" },
              { label: "Pending payouts",   value: `$${stats.pending}`,         icon: Wallet,        color: "text-amber-600 bg-amber-50"     },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${s.color}`}><s.icon size={14} /></div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Affiliates table */}
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Active affiliates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">People promoting your community and their performance metrics.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-accent/50 text-[10px] font-semibold uppercase text-muted-foreground">
                  <th className="py-2.5 px-4 text-left">Affiliate</th>
                  <th className="py-2.5 px-3 text-left hidden sm:table-cell">Source</th>
                  <th className="py-2.5 px-3 text-left hidden md:table-cell">Referrals</th>
                  <th className="py-2.5 px-3 text-left hidden md:table-cell">Conv.</th>
                  <th className="py-2.5 px-3 text-left hidden sm:table-cell">Status</th>
                  <th className="py-2.5 px-4 text-right">Pending ($)</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_AFFILIATES.map(a => (
                    <tr key={a.id} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={a.avatar} size={28} />
                          <span className="font-medium text-foreground">{a.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell text-xs text-muted-foreground">{a.link}</td>
                      <td className="py-3 px-3 hidden md:table-cell text-muted-foreground">{a.referrals}</td>
                      <td className="py-3 px-3 hidden md:table-cell font-semibold text-foreground">{a.conversions}</td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {a.pendingUsd > 0 ? `$${a.pendingUsd}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* How it works (shown when disabled) */}
      {!aff.enabled && (
        <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">How creator-managed affiliate marketing works</h2>
          <ol className="mt-3 space-y-3">
            {[
              { n: "1", title: "You set the rate",         desc: "Choose your commission percentage (5–50%) and whether it's recurring or a one-time payment per subscriber." },
              { n: "2", title: "Affiliates get their link", desc: "Members, fans, or partners request access and receive a unique referral link with your community's campaign code." },
              { n: "3", title: "They share it",            desc: "Affiliates promote your community on social media, blogs, newsletters, or anywhere their audience is." },
              { n: "4", title: "You grow, they earn",      desc: "When someone subscribes through their link within your attribution window, they earn the commission automatically." },
            ].map(s => (
              <li key={s.n} className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">{s.n}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={toggle}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Enable affiliate program
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-1.5"><Info size={14} className="text-primary" /> Common questions</h2>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border">
              <button onClick={() => setExpandFaq(expandFaq === i ? null : i)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-accent transition-colors">
                {f.q}
                {expandFaq === i ? <ChevronUp size={14} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={14} className="shrink-0 text-muted-foreground" />}
              </button>
              {expandFaq === i && (
                <div className="border-t border-border bg-accent/20 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
