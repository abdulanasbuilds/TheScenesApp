# ADR-047 — Monetization model

> **ACCEPTED 19 November 2026.**
>
> The canonical decision text is recorded in `docs/DECISIONS.md` under **ADR-047**. That entry
> supersedes **ADR-030**. This file is retained as the review record and must not diverge from the
> register; if the two disagree, `docs/DECISIONS.md` wins.
>
> Full analysis, arithmetic, cost model, ledger design and open items:
> `docs/MONETIZATION-MODEL-SPEC.md`.

---

## What was proposed, and what was accepted

| Item | Earlier proposal | Founder decision (19 Nov 2026) |
|---|---|---|
| Ladder | Keep ADR-030 ($19/$39, 7%/3%) | **Replaced**: Free 10% · Creator $29/5% · Studio $99/2% |
| Processing fee | Creator bears it (recommended) | **Buyer bears it** |
| Currency | USD anchor with GH₵ pairs | **USD base, creator-chosen currency, buyer currency auto-detected** |
| Studio/Pro Plus | Feature tier with no fee advantage | **Studio at 2%** — the fee gap is now real |
| Media hosting | No change (ADR-029) | **No change** |
| Payouts | Weekly default + paid instant | **No change to ADR-031**; operating settings still open |
| Enterprise | Phase 10 | **No change** |

## Summary of the accepted model

1. **Free** — $0/month, 10% platform fee on sales.
2. **Creator** — $29/month, 5% platform fee on sales.
3. **Studio** — $99/month, 2% platform fee on sales.
4. **The buyer pays the payment-processing fee.** The platform absorbs nothing and the creator is not
   charged it. The fee is grossed up so the provider's deduction is exactly covered:
   `F = P × 1.95% ÷ (1 − 1.95%)`, rounded up.
5. **USD is the base currency.** Creators pick their pricing currency; buyers see an auto-detected
   local equivalent; the price of record is authoritative and the FX rate is stored per order.
6. **ADR-029 stands.** No native hosting in any plan.
7. **ADR-031 stands.** Instant withdrawal is 1% plus a flat per-currency fee, with the provider
   transfer fee passed to the creator.
8. **ADR-034 stands.** No provider, checkout, payout or hosted change is authorized.

## Consequences to keep in view

- Creator cost rises roughly 55–65% against the retired ladder.
- Below $400/month of sales, Skool Hobby is cheaper than Creator; Free is the entry answer.
- Buyer-paid fees must be presented inside the price where separate surcharges are prohibited.
- Holding creator funds between T+1 collection and weekly payout is a liability, not revenue.
- Chargeback liability and payout currency settings remain undecided (FD-09, FD-17).

## Not authorized by this ADR

Payment-provider selection, accounts, keys, webhooks, checkout, KYC, payouts, refunds, tax
registration, hosted migrations, deployment, or publication of a live commercial offer.

## Implementation status at the time of acceptance

- `src/data/types.ts` — plan ids renamed to `free | creator | studio`.
- `src/data/seed.ts` — plans and sample order fees updated to the new ladder.
- `src/routes/pricing.tsx` — prices, fees and currency copy updated.
- `src/routes/help.tsx`, `src/routes/dashboard/creator.tsx`,
  `src/routes/dashboard/commerce.tsx` — fee references updated.
- `npm run typecheck` passes.
- No payment code, provider connection, migration or hosted change was made.