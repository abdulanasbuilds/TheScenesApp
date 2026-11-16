import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Link2,
  Percent,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Stat,
  buttonClass,
} from "@/components/ui";
import { members } from "@/data/seed";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/referrals")({
  head: () => ({ meta: [{ title: "Referrals — Creator workspace" }] }),
  component: ReferralsPage,
});

const rewardTiers = [
  {
    label: "1 qualified referral",
    reward: "One extra publishing slot",
    detail:
      "A qualified referral is a member who completes onboarding and stays active for 30 days.",
  },
  {
    label: "3 qualified referrals",
    reward: "Creator analytics access",
    detail: "Unlocks audience, retention and conversion views for the community.",
  },
  {
    label: "5 qualified referrals",
    reward: "Custom branding controls",
    detail: "Accent colour and cover treatment for the community page.",
  },
];

const referredMembers = [
  { name: "Kofi Mensah", joined: "2 days ago", status: "Onboarding" },
  { name: "Sara Owusu", joined: "1 week ago", status: "Active" },
  { name: "Lindi Ndlovu", joined: "2 weeks ago", status: "Active" },
  { name: "Tobi Adeyemi", joined: "3 weeks ago", status: "Qualified" },
];

const affiliates = [
  { name: "Nana Adjei", code: "NANA10", clicks: 412, signups: 38, conversions: 21, earned: 189.0 },
  { name: "Ama Boateng", code: "AMA25", clicks: 268, signups: 24, conversions: 11, earned: 99.0 },
  { name: "Kofi Asante", code: "KOFI33", clicks: 143, signups: 12, conversions: 5, earned: 45.0 },
  { name: "Sara Nwosu", code: "SARA12", clicks: 88, signups: 7, conversions: 3, earned: 27.0 },
];

type Invite = {
  id: string;
  label: string;
  access: "Member" | "VIP" | "Moderator";
  trialDays: number;
  coupon: string;
  uses: number;
  limit: number;
};

const seedInvites: Invite[] = [
  {
    id: "inv-1",
    label: "Founding members",
    access: "VIP",
    trialDays: 14,
    coupon: "FOUNDER20",
    uses: 9,
    limit: 25,
  },
  {
    id: "inv-2",
    label: "Newsletter readers",
    access: "Member",
    trialDays: 7,
    coupon: "NEWS7",
    uses: 31,
    limit: 100,
  },
];

function ReferralsPage() {
  const { toast } = useToast();
  const referralLink = "https://thescenes.example/join?ref=nanaadjei";
  const [commission, setCommission] = useState(30);
  const [invites, setInvites] = useState<Invite[]>(seedInvites);
  const [inviteDraft, setInviteDraft] = useState({
    label: "",
    access: "Member" as Invite["access"],
    trialDays: "7",
    coupon: "",
  });
  const [inviteError, setInviteError] = useState("");

  const addInvite = (event: FormEvent) => {
    event.preventDefault();
    if (inviteDraft.label.trim().length < 3) {
      setInviteError("Give the invitation a name of at least 3 characters.");
      return;
    }
    setInvites((current) => [
      ...current,
      {
        id: `inv-local-${current.length + 1}`,
        label: inviteDraft.label.trim(),
        access: inviteDraft.access,
        trialDays: Number(inviteDraft.trialDays) || 0,
        coupon: inviteDraft.coupon.trim().toUpperCase(),
        uses: 0,
        limit: 50,
      },
    ]);
    setInviteDraft({ label: "", access: "Member", trialDays: "7", coupon: "" });
    setInviteError("");
    toast(
      "Invitation link created locally",
      "Access level, trial and coupon are saved for this preview. Checkout is coming soon.",
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast("Referral link copied", referralLink);
    } catch {
      toast("Copy unavailable", `Copy this address manually: ${referralLink}`);
    }
  };

  return (
    <CreatorShell active="referrals">
      <section className="border-b border-indigo-800 bg-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/12 text-indigo-50 ring-1 ring-white/20">
                  Demo workspace
                </Badge>
                <span className="text-xs text-indigo-200">Affiliate payouts coming soon</span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Referrals &amp; entitlements
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                Invite practitioners you trust. Rewards unlock platform access — not guaranteed
                storage, live capacity or provider resources.
              </p>
            </div>
            <a
              href="/dashboard/creator"
              className={buttonClass(
                "secondary",
                "md",
                "border-white/25 bg-white/10 text-white hover:bg-white/15",
              )}
            >
              Back to overview <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Invited" value="18" hint="Fixture referral links shared" />
          <Stat label="Joined" value="9" hint="Members who accepted" />
          <Stat label="Qualified" value="5" hint="Completed onboarding · 30 days active" />
          <Stat label="Entitlements earned" value="2" hint="Publishing slot · analytics" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-indigo-700" />
                <h2 className="font-display text-lg font-extrabold text-slate-900">
                  Your referral link
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Membership is recorded in this preview. External tracking is coming soon.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
                  {referralLink}
                </code>
                <Button variant="secondary" onClick={() => void copyLink()}>
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                <ShieldCheck className="mr-1 inline h-4 w-4 align-[-2px]" />
                Referral rewards are entitlements, not guaranteed provider capacity. Storage and
                live-session rewards remain unapproved until a later hosting and quota decision
                (ADR-029).
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Referred members
                  </h2>
                  <p className="text-xs text-slate-500">Sample activity for this preview</p>
                </div>
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <div className="divide-y divide-slate-100">
                {referredMembers.map((member, index) => (
                  <div
                    key={member.name}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3"
                  >
                    <Avatar name={member.name} size={34} online={index < 2} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">Joined {member.joined}</p>
                    </div>
                    <Badge
                      tone={
                        member.status === "Qualified"
                          ? "green"
                          : member.status === "Active"
                            ? "indigo"
                            : "outline"
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-indigo-700" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Affiliate commission
                  </h2>
                </div>
                <Badge tone="outline">10% – 50% range</Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Set the share of a referred member&apos;s payments that an affiliate earns. The
                range matches the platform ceiling; anything above it must be rejected by the
                server.
              </p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={commission}
                  onChange={(event) => setCommission(Number(event.target.value))}
                  aria-label="Affiliate commission rate"
                  className="h-2 flex-1 cursor-pointer accent-indigo-600"
                />
                <span className="w-16 shrink-0 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center font-display text-lg font-extrabold text-slate-900">
                  {commission}%
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Payouts, tax handling and currency conversion are coming soon.
                </p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast(
                      `Commission set to ${commission}% locally`,
                      "Saved for this preview. Live affiliate payouts are coming soon.",
                    )
                  }
                >
                  Save commission
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Affiliate performance
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sample tracking · live attribution and payouts are coming soon
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-500 uppercase">
                      <th scope="col" className="px-5 py-2.5 font-bold">
                        Affiliate
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-bold">
                        Code
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-bold">
                        Clicks
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-bold">
                        Signups
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-bold">
                        Paid
                      </th>
                      <th scope="col" className="px-5 py-2.5 text-right font-bold">
                        Earned
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {affiliates.map((affiliate) => (
                      <tr key={affiliate.code}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={affiliate.name} size={30} />
                            <span className="font-semibold text-slate-900">{affiliate.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                            {affiliate.code}
                          </code>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">{affiliate.clicks}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{affiliate.signups}</td>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {affiliate.conversions}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">
                          ${affiliate.earned.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-indigo-700" />
                <h2 className="font-display text-lg font-extrabold text-slate-900">
                  Invitation links
                </h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Create a link that grants a specific access level, a free-trial length and an
                optional coupon. Limit each link to a number of uses.
              </p>
              <ul className="mt-4 space-y-2">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{invite.label}</span>
                        <Badge
                          tone={
                            invite.access === "VIP"
                              ? "indigo"
                              : invite.access === "Moderator"
                                ? "amber"
                                : "outline"
                          }
                        >
                          {invite.access}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {invite.trialDays}-day trial
                        {invite.coupon ? ` · coupon ${invite.coupon}` : ""} · {invite.uses}/
                        {invite.limit} uses
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        const link = `https://thescenes.example/join?invite=${invite.id}`;
                        try {
                          await navigator.clipboard.writeText(link);
                          toast("Invitation link copied", link);
                        } catch {
                          toast("Copy unavailable", link);
                        }
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </li>
                ))}
              </ul>
              <form onSubmit={addInvite} className="mt-4 border-t border-slate-200 pt-4" noValidate>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Link name"
                    htmlFor="invite-label"
                    error={inviteError}
                    required
                    className="sm:col-span-2"
                  >
                    <Input
                      id="invite-label"
                      value={inviteDraft.label}
                      onChange={(event) => {
                        setInviteDraft({ ...inviteDraft, label: event.target.value });
                        if (inviteError) setInviteError("");
                      }}
                      placeholder="e.g. Pilot cohort"
                      invalid={Boolean(inviteError)}
                    />
                  </Field>
                  <Field label="Access level" htmlFor="invite-access">
                    <Select
                      id="invite-access"
                      value={inviteDraft.access}
                      onChange={(event) =>
                        setInviteDraft({
                          ...inviteDraft,
                          access: event.target.value as Invite["access"],
                        })
                      }
                    >
                      <option value="Member">Member</option>
                      <option value="VIP">VIP</option>
                      <option value="Moderator">Moderator</option>
                    </Select>
                  </Field>
                  <Field label="Trial days" htmlFor="invite-trial">
                    <Input
                      id="invite-trial"
                      type="number"
                      min={0}
                      max={90}
                      value={inviteDraft.trialDays}
                      onChange={(event) =>
                        setInviteDraft({ ...inviteDraft, trialDays: event.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label="Coupon code (optional)"
                    htmlFor="invite-coupon"
                    hint="Saved in uppercase."
                    className="sm:col-span-2"
                  >
                    <Input
                      id="invite-coupon"
                      value={inviteDraft.coupon}
                      onChange={(event) =>
                        setInviteDraft({ ...inviteDraft, coupon: event.target.value })
                      }
                      placeholder="LAUNCH20"
                      spellCheck={false}
                    />
                  </Field>
                </div>
                <Button type="submit" variant="secondary" className="mt-3">
                  <Plus className="h-4 w-4" /> Create invitation link
                </Button>
              </form>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Reward tiers
                  </p>
                  <h2 className="mt-1 font-display text-lg font-extrabold text-slate-900">
                    What referrals unlock
                  </h2>
                </div>
                <Gift className="h-5 w-5 text-indigo-700" />
              </div>
              <ol className="mt-4 space-y-3">
                {rewardTiers.map((tier) => (
                  <li key={tier.label} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-700">{tier.label}</span>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{tier.reward}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{tier.detail}</p>
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-clay-600" />
                <h2 className="text-sm font-bold text-slate-900">Share where your audience is</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Discovery brings some members, but direct channels stay reliable. Share the link in
                your newsletter, at the end of a build log or after a live session.
              </p>
              <a
                href="/c/ai-builders-guild/posts/new"
                className={buttonClass("primary", "md", "mt-3 w-full")}
              >
                Draft an invite post <ArrowRight className="h-4 w-4" />
              </a>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Payout status</h2>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-[11px] tracking-wide text-slate-500 uppercase">
                    Available balance
                  </p>
                  <p className="font-display text-2xl font-extrabold text-slate-900">$0.00</p>
                </div>
                <Badge tone="amber">Coming soon</Badge>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
                <li>· Payout accounts will connect to a payment provider.</li>
                <li>· Commission, tax and currency rules will be handled automatically.</li>
                <li>· Balances shown here are samples, not real money.</li>
              </ul>
              <Button variant="secondary" className="mt-3 w-full" disabled>
                Payouts coming soon
              </Button>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900">Members in the room</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {members.length} members in this preview. Live referral attribution is coming soon.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </CreatorShell>
  );
}
