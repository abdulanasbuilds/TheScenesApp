import type { PricingModel } from "@/data/types";
import { formatMoney } from "@/lib/utils";

/**
 * Early Access presentation switch.
 *
 * The Scenes has no live payment provider yet — payments are on HOLD in the project
 * contract. Until one is connected and approved, **no public surface may show a price,
 * plan tier, platform fee or checkout teaser**. Everything is presented as free for
 * early members and creators.
 *
 * The commercial model itself is intentionally preserved, not deleted:
 * - `src/data/seed.ts` → `plans` (Free / Creator / Studio) still exists;
 * - community `pricing`, course `price` and product `price` fields are untouched;
 * - the database schema and the monetization specs under `docs/` are untouched.
 *
 * This switch only controls the presentation. Flip `SHOW_PAID_PLANS` to `true` (and
 * connect an approved payment provider) to restore the original paid-plan UI.
 */
export const SHOW_PAID_PLANS = false;

/** Convenience inverse used across public components. */
export const IS_EARLY_ACCESS = !SHOW_PAID_PLANS;

export const EARLY_ACCESS = {
  /** Short badge used on cards and listings. */
  label: "Free for Early Access",
  /** The one-word price shown anywhere a number used to appear. */
  shortLabel: "Free",
  /** Member-facing badge. */
  memberBadge: "Early Access Member",
  /** Creator-facing badge. */
  creatorBadge: "Early Access Creator",
  /** Primary learner calls to action. */
  joinLabel: "Join Free Community",
  enrollLabel: "Enrol for Free",
  /** Creator promise. Keep this sentence consistent everywhere it appears. */
  creatorPromise:
    "Publish for free, build your audience, and pay zero platform fees during launch.",
  /** Headline for the /pricing route, which is now a free-access manifesto. */
  manifestoHeadline: "The Scenes is free while we build it.",
  manifestoBody:
    "The Scenes is currently free to join, learn, and teach. No plans to compare, no fees to calculate, no checkout to clear — just the work and the people doing it.",
} as const;

/**
 * Community membership label.
 *
 * During early access every community reads as `Free`. When paid plans return, the
 * original amount is displayed again from the untouched `pricing` data.
 */
export function communityAccessLabel(pricing: PricingModel, options: { compact?: boolean } = {}) {
  if (IS_EARLY_ACCESS || pricing.type === "free") return EARLY_ACCESS.shortLabel;
  return options.compact
    ? `${formatMoney(pricing.amount)}/mo`
    : `${formatMoney(pricing.amount)} / month`;
}

/**
 * Course access label. Every course is free during early access, whether it was
 * previously `included` with a membership or sold as a one-time purchase.
 */
export function courseAccessLabel(price: number | "included") {
  if (IS_EARLY_ACCESS) return EARLY_ACCESS.shortLabel;
  return price === "included" ? "Included" : formatMoney(price);
}

/** Marketplace resource label. */
export function productAccessLabel(price: number) {
  if (IS_EARLY_ACCESS) return EARLY_ACCESS.shortLabel;
  return formatMoney(price);
}
