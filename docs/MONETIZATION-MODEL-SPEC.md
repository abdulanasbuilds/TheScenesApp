# The Scenes — Monetization Model Specification

> **STATUS: v2 — reflects founder decisions of 19 November 2026**
>
> This revision incorporates three explicit founder decisions that supersede earlier proposals:
>
> 1. The ADR-030 price ladder ($19/$39, 7%/3%) is **retired**. The approved ladder is
>    **Free 10% · Creator $29/5% · Studio $99/2%**.
> 2. **Transaction fees are borne by the buyer**, not the creator and not the platform.
> 3. **USD is the base currency.** Creators choose their preferred pricing currency, and the app
>    auto-detects the buyer's country currency. There is no single permanent display currency.
>
> ADR-030 is superseded by ADR-047. ADR-029 (external media only), ADR-031 (instant-withdrawal fee)
> and ADR-034 (payments on hold) remain in force.
>
> No payment provider, account, key, checkout, payout or hosted migration is authorized by this
> document.

Prepared: 18 November 2026 · Revised: 19 November 2026
Evidence: repository documents + live provider pricing fetched 18 November 2026.

---

## 1. The model in one page

| | Free | Creator | Studio |
|---|---|---|---|
| Monthly price | **$0** | **$29** | **$99** |
| Platform fee on creator sales | **10%** | **5%** | **2%** |
| Buyer-paid processing fee | Yes | Yes | Yes |
| Native media hosting | No (ADR-029) | No (ADR-029) | No (ADR-029) |
| Currency | USD base; creator picks pricing currency; buyer sees local equivalent | | |

Three rules make the model work:

1. **The platform never pays the processor.** The buyer pays a processing fee at checkout that
   exactly covers the provider's collection cost.
2. **The platform never converts money for free.** Local prices are derived from the price of record
   with an upward rounding buffer; the price of record is authoritative.
3. **Every fee is disclosed before payment.** No hidden spread, no silent FX markup.

---

## 2. Why the ladder changed

The retired ladder charged $19 for Pro at 3%. With a buyer-paid processing fee, that 3% would have
been pure margin — but it under-priced the platform relative to the value delivered and left no room
between tiers.

The approved ladder creates three distinct economics:

| Upgrade | Break-even monthly sales | Formula |
|---|---|---|
| Free → Creator | **$580** | $29 ÷ (10% − 5%) |
| Creator → Studio | **$2,333** | $70 ÷ (5% − 2%) |
| Free → Studio | **$1,238** | $99 ÷ (10% − 2%) |

**What this means in plain English:** a creator earning under $580/month is better off staying Free.
Between $580 and $2,333, Creator is the correct plan. Above $2,333, Studio pays for itself through
the lower commission alone.

### 2.1 Honest cost comparison with the retired ladder

| Creator monthly sales | Retired ladder (Pro 3%) | Approved ladder (Creator 5%) | Change |
|---|---|---|---|
| $200 | $19 + $6 = **$25** | $29 + $10 = **$39** | +56% |
| $500 | $19 + $15 = **$34** | $29 + $25 = **$54** | +59% |
| $1,000 | $49 | **$79** | +61% |
| $5,000 | $169 | **$279** | +65% |
| $10,000 | $319 | **$529** | +66% |

The approved ladder costs creators roughly **55–65% more** than the retired one across the range.
That is a deliberate decision, not an accident, and it should be reflected in positioning: The Scenes
is no longer the cheapest paid option for small creators — it is the cheapest option that includes a
free tier and no hosting tax.

Free-plan creators also pay more: 10% instead of 7%, which is **+43%** at any sales level.

### 2.2 Where the ladder is still competitive

| Comparison | Crossover monthly sales | Reading |
|---|---|---|
| Free vs Skool Hobby ($9 + 10%) | **never** | Scenes Free is always $9/month cheaper |
| Free vs Skool Pro ($99 + 2.9%) | **$1,394** | Below this, Scenes Free is cheaper |
| Free vs Circle Professional ($89 + 2%) | **$1,113** | Below this, Scenes Free is cheaper |
| Creator vs Skool Hobby | **$400** | Below $400, Skool Hobby is cheaper |
| Creator vs Skool Pro | **$3,333** | Below this, Scenes Creator is cheaper |
| Creator vs Circle Professional | **$2,000** | Below this, Scenes Creator is cheaper |
| Studio vs Skool Pro | **never** | Studio is always cheaper (same $99, lower fee) |
| Studio vs Circle Business ($199 + 1%) | **$10,000** | Below this, Scenes Studio is cheaper |

The weak point is clear: **below $400/month, Skool Hobby is cheaper than Scenes Creator.** The Free
plan is the answer to that segment, and it must stay genuinely usable.

---

## 3. Buyer-paid transaction fees

### 3.1 The rule

The platform is not responsible for any transaction fee. The person buying bears it.

This applies to **both** kinds of purchase:

- a buyer purchasing a creator's course, product, membership or event;
- a creator purchasing a platform subscription (Creator or Studio).

### 3.2 How the amount is calculated

Let:

- `P` = the listed price (the price of record, in the creator's or platform's currency);
- `r` = the payment provider's collection rate (verified Paystack Ghana: **1.95%**);
- `F` = the buyer-paid processing fee.

The fee must fully cover the provider's deduction, so:

```
F = P × r ÷ (1 − r)
Buyer pays = P + F
Provider deducts = r × (P + F) = F
Platform receives exactly P
```

Worked example, `P = $100`, `r = 1.95%`:

```
F = 100 × 0.0195 ÷ 0.9805 = 1.9888 → round up → $1.99
Buyer pays $101.99
Provider deducts $1.989
Platform receives $100.00
```

`F` is always rounded **up** to the currency's minor unit. The sub-cent surplus is a rounding gain,
never revenue.

### 3.3 What the fee must cover

| Component | Covered by |
|---|---|
| Provider collection fee (1.95%) | Buyer-paid processing fee |
| Provider FX spread on cross-currency collection | Buyer-paid processing fee |
| Provider payout/transfer fee | Creator, per ADR-031 |
| Platform commission | Creator, per plan |

The processing fee is a **pass-through**, not platform revenue. It must never appear in GMV,
revenue, or creator earnings.

### 3.4 Legal caveat

Some jurisdictions restrict surcharging card payments (the UK and EU generally prohibit it; several
US states have rules). Where a separate surcharge is not permitted, the fee must be **included in the
displayed price** rather than added at checkout. The buyer still bears it economically; only the
presentation changes. This is Decision Register item **FD-14**. It must be resolved per market before
checkout goes live.

---

## 4. Currency model

### 4.1 Three different currencies, deliberately separated

| Layer | What it is | Who controls it |
|---|---|---|
| **Base currency** | USD — platform accounting, plan catalogue, reporting | The Scenes |
| **Price-of-record currency** | The currency a creator prices their product in | The creator |
| **Display currency** | The local currency the buyer sees | Auto-detected, with manual override |

These are not the same thing, and conflating them is how platforms lose money on FX.

### 4.2 Rules

1. **USD is the default.** Platform plans are denominated in USD.
2. **Creators choose their pricing currency** from a supported list, per product or per membership.
3. **The buyer's currency is auto-detected** from country (Cloudflare `CF-IPCountry` at the edge,
   `Accept-Language` as fallback, manual switcher persisted in the session).
4. **The price of record is authoritative.** A displayed local price is an estimate derived from it.
5. **The checkout currency must be one the provider can actually charge.** If the detected currency
   is unsupported, charge the price-of-record currency and say so plainly before payment.
6. **Never recompute a stored charge from a later rate.** Every order stores the rate it used.
7. **Local display prices round up** to a currency-appropriate increment (whole cedi for GHS, cents
   for USD/EUR/GBP). The upward rounding is the FX buffer.
8. **Country detection is not tax residency.** Never infer tax status from it.

### 4.3 What every order must store

| Field | Example |
|---|---|
| `price_of_record_amount_minor` | 10000 |
| `price_of_record_currency` | USD |
| `charge_amount_minor` | 10199 |
| `charge_currency` | GHS |
| `processing_fee_minor` | 199 |
| `fx_rate` | 11.778354 |
| `fx_source` | exchangerate-api |
| `fx_captured_at` | 2026-11-19T00:02:31Z |
| `fx_buffer_bps` | 200 |

Without these, a refund, dispute or audit six months later is unanswerable.

### 4.4 Proposed launch currency list

USD, GHS, NGN, KES, ZAR, GBP, EUR.

This list is **provider-dependent** and must be reduced to what the chosen provider can actually
charge and settle. Do not advertise a currency the provider cannot collect in. (FD-16)

### 4.5 The retired GH₵ pairs

GH₵300 and GH₵620 are gone. They were fixed pairs that drifted 34–35% away from their USD partners at
the verified rate of 11.778354. The new model removes the problem entirely: USD is the anchor and the
cedi figure is derived and refreshed.

---

## 5. Revenue and margin

Because the buyer pays processing, the platform's commission is **not reduced by provider fees**.

| Plan | Commission | Platform keeps | Share of GMV |
|---|---|---|---|
| Free | 10% | 10.00% | Full |
| Creator | 5% | 5.00% | Full |
| Studio | 2% | 2.00% | Full |

The 70% margin rule now applies almost entirely to **infrastructure and support**, not to
transactions. That is the correct place for it.

### 5.1 Correct margin formula

```
Price = Total variable cost ÷ (1 − target gross margin)
```

Worked check: cost $2.00, target 70% → 2.00 ÷ 0.30 = **$6.67**; (6.67 − 2.00) ÷ 6.67 = 70.0%. Correct.

`docs/PRICING-MONETIZATION.md` line 320 uses `Cost ÷ 0.30` while calling the cost "infrastructure" and
then adding support as a percentage of price — a circular calculation. That formula is superseded by
the one above.

Report three separate margins, never a bare "70%":

- **Provider margin** — commission revenue versus provider fees (now 100%, since buyers pay).
- **Infrastructure margin** — revenue versus hosting/compute/email/storage.
- **Contribution margin** — the above minus attributable support.

---

## 6. Cost model

### 6.1 Scenario (ESTIMATED, stated so it can be challenged)

- 1,000 creators; 50 members each = 50,000 end users
- 25% paid: 200 Creator, 50 Studio, 750 Free
- Average creator sales: **$500/month**
- Hosting: external links only, per ADR-029

### 6.2 Monthly revenue

| Stream | Calculation | Amount |
|---|---|---|
| Creator subscriptions | 200 × $29 | $5,800 |
| Studio subscriptions | 50 × $99 | $4,950 |
| Free commission | 750 × $500 × 10% | $37,500 |
| Creator commission | 200 × $500 × 5% | $5,000 |
| Studio commission | 50 × $500 × 2% | $500 |
| **Total** | | **$53,750** |

No provider fee is deducted: buyers paid it.

Mix: **80% commission, 20% subscription.**

### 6.3 Monthly infrastructure

| Item | Basis | Cost |
|---|---|---|
| Supabase Pro | within 100k MAU / 250 GB egress / 8 GB disk | $25 |
| Resend Pro | 50,000 emails | $20 |
| Upstash Redis | small PAYG overage | ~$5 |
| Cloudflare | free tier per ADR-032 | $0 |
| R2 | link metadata only | ~$1 |
| **Total** | | **≈ $51** (range $51–$110) |

**Gross margin: 99.9%.** Adding $1.10 per creator of support cost ($1,100) leaves a **97.9%**
contribution margin.

### 6.4 Scale sensitivity

| Creators | Revenue/mo | Infra | Note |
|---|---|---|---|
| 10 Free, $0 GMV | $0 | $51 | Pure acquisition cost |
| 100, $200 GMV, 20% paid | ≈ $2,230 | $51 | Profitable |
| 1,000, $500 GMV, 25% paid | $53,750 | $51 | Profitable |

**Platform break-even:** one Free creator selling $500/month generates $50 commission, which covers
all infrastructure. Unit economics are not the constraint. Distribution and support are.

### 6.5 Native media, if ever approved

ADR-029 stands. Verified inputs if it is reopened:

| Component | Cost |
|---|---|
| 100 GB delivered via Bunny, Middle East & Africa | **$6.00/month** |
| 100 GB stored on Cloudflare R2 | **$1.50/month**, zero egress |
| 100 GB stored on Bunny | $1.00/month, delivery billed separately |

| Architecture | Variable cost | Price at 70% margin |
|---|---|---|
| R2 storage + free egress (files) | $1.50 | **$5.00** |
| Bunny MEA storage + delivery (video) | ~$7–8 | **$23–$27** |

A file pack is viable at ~$5. An African video pack cannot be sold at the researched $20 and hold
70%. Live delivery is **not priced** — no provider has been evaluated. (FD-11)

---

## 7. Payouts

ADR-031 is unchanged: instant withdrawal is **1% + flat fee**, with the provider transfer fee passed
to the creator. Only the currency handling needs generalisation.

### 7.1 Verified constraints

- Paystack settles **T+1**.
- Transfers: **GH₵1** to Mobile Money, **GH₵8** to bank.
- Bank payout minimum **GH₵50**; MoMo has none.

### 7.2 Recommended structure

| Feature | Setting |
|---|---|
| Default payout | Automatic **weekly batch**, free, Mobile Money |
| Instant payout | Opt-in, **1% + flat**, plus provider transfer fee (ADR-031) |
| Standard minimum | **GH₵50** or local equivalent |
| Instant minimum | **GH₵100** or local equivalent |
| Availability | Sale + **7 days** (refund/chargeback window) |
| Default rail | Mobile Money |
| Bank rail | Opt-in, provider fee passed through |

### 7.3 Cost to the creator (unchanged from v1)

| Withdrawal | Platform fee | MoMo transfer | Creator pays | Effective |
|---|---|---|---|---|
| GH₵50 | GH₵1.50 | GH₵1 | GH₵2.50 | 5.0% |
| GH₵500 | GH₵6.00 | GH₵1 | GH₵7.00 | 1.4% |
| GH₵1,000 | GH₵11.00 | GH₵1 | GH₵12.00 | 1.2% |
| GH₵1,000 bank | GH₵11.00 | GH₵8 | GH₵19.00 | 1.9% |

**Currency issue:** ADR-031's flat component is written as GH₵1. Under a USD base with creator-chosen
currencies, the flat fee must be defined per payout currency (for example, $0.10 or the rounded local
equivalent). This is **FD-17**, not a change to the 1% component.

### 7.4 Float

Between T+1 collection and weekly payout the platform holds creator money. That money is a
**liability**. It must sit in a per-creator sub-ledger, never be spent on operations, and be
reconciled daily. Confirm the regulatory position before Phase 7. Not verified here.

---

## 8. Internal financial ledger

### 8.1 Rules

1. Double-entry: debits equal credits in every transaction.
2. Append-only: no `UPDATE`, no `DELETE`; corrections are reversing entries.
3. Idempotent: unique `(provider, provider_event_id)`.
4. Integer minor units plus ISO currency. Never floats.
5. Fee snapshot on every order: `fee_rate_bps`, `fee_amount_minor`, `fx_rate`, `fx_captured_at`.
6. Balances derived from the ledger, never stored mutably.
7. UTC timestamps.
8. Every entry references its cause.

### 8.2 Chart of accounts

| Code | Account | Type |
|---|---|---|
| 1000 | Provider clearing | Asset |
| 1100 | Provider receivable (in transit) | Asset |
| 2000 | Creator payable (per-creator sub-ledger) | Liability |
| 2100 | Platform revenue — subscriptions | Revenue |
| 2110 | Platform revenue — commission | Revenue |
| 2120 | Platform revenue — instant payout fees | Revenue |
| 2150 | **Buyer-paid processing fee (pass-through)** | Liability |
| 2200 | Tax payable | Liability |
| 4000 | Provider fees expense | Expense |
| 4100 | Refunds and chargebacks | Expense |
| 4200 | FX gain/loss | Expense |
| 4300 | Rounding gain/loss | Expense |

`2150` must always net to zero. If it does not, the pass-through is leaking and the platform is
absorbing a fee it said it would not absorb.

### 8.3 Worked example — $100 sale, Creator plan, buyer pays fee

`P = $100`, `F = $1.99`, buyer pays `$101.99`, provider takes `$1.99`, `$100.00` settles.

**On charge:**

| Account | Debit | Credit |
|---|---|---|
| 1100 Provider receivable | 101.99 | |
| 2150 Buyer-paid processing fee | | 1.99 |
| 2000 Creator payable | | 100.00 |

**On settlement:**

| Account | Debit | Credit |
|---|---|---|
| 2150 Buyer-paid processing fee | 1.99 | |
| 1100 Provider receivable | | 1.99 |
| 1000 Provider clearing | 100.00 | |
| 1100 Provider receivable | | 100.00 |

**On commission:**

| Account | Debit | Credit |
|---|---|---|
| 2000 Creator payable | 5.00 | |
| 2110 Commission revenue | | 5.00 |

Creator payable ends at **$95.00**. Commission revenue **$5.00**. `2150` nets to **zero**. Provider
fees never touch profit and loss.

### 8.4 Reconciliation

- Daily: `SUM(1000)` versus the provider's reported balance.
- Daily: `SUM(2150)` must be zero.
- Monthly: close the period and lock it.
- Any variance is an incident, not a rounding note.

---

## 9. Usage metering (future only)

Not needed at launch under ADR-029.

- `usage_events` — append-only: `creator_id`, `metric`, `quantity`, `unit`, `occurred_at`, `source`,
  `idempotency_key`.
- `usage_periods` — aggregated per creator per period.
- **Average billable storage** is time-weighted: `Σ(bytes × duration) ÷ period_length`, matching R2's
  own billing basis.
- **Delivery** is measured per request, not estimated from storage.
- Entitlement, usage and provider capacity remain three independent gates.

Never bill from a number the platform cannot verify against provider records.

---

## 10. Data model (proposed, not implemented)

| Table | Purpose | Key constraints |
|---|---|---|
| `plans` | Plan catalogue | `code` unique; versioned |
| `plan_prices` | Price per currency and interval | `(plan_id, currency, interval, effective_from)` unique |
| `fee_policies` | Commission rate history | `(plan_id, effective_from)` unique |
| `subscriptions` | Creator subscription state | `provider_ref` unique |
| `orders` | A sale | stores price-of-record, charge, fee and FX fields |
| `charges` | Provider collection attempt | `(provider, provider_event_id)` unique |
| `ledger_entries` | Double-entry rows | append-only, balanced per `transaction_id` |
| `payouts` | Withdrawals | status, rail, currency, timestamps |
| `payout_items` | Payout ↔ ledger links | prevents double payment |
| `refunds` | Refunds | reversing entries |
| `disputes` | Chargebacks | liability owner recorded |
| `usage_events` / `usage_periods` | Future metering | append-only |
| `entitlement_grants` | Referral rewards | separate from usage/capacity |
| `fx_rates` | Rate per transaction | `(pair, captured_at)` unique |
| `currency_settings` | Supported currencies and rounding increments | unique `currency` |

Secrets never live in application data. No `api_credentials JSONB`.

---

## 11. Subscription lifecycle

```
(none) → active → past_due → canceled → expired
             ↘ refunded
```

- `past_due`: 7-day grace, then read-only.
- `canceled`: full access until period end.
- `expired`: read-only, nothing deleted.
- `refunded`: plan revoked, ledger reversed.
- Commission follows the plan **at the time of sale**, read from the fee snapshot.

Never delete content on downgrade. Never auto-charge after cancellation.

---

## 12. Decision Register

### 12.1 Resolved by the founder on 19 November 2026

| ID | Decision | Resolution |
|---|---|---|
| FD-01 | Which ladder ships | **Free 10% · Creator $29/5% · Studio $99/2%.** ADR-030 retired. |
| FD-02 | Who pays the processor fee | **The buyer.** Not the creator, not the platform. |
| FD-03 | Currency anchor | **USD base.** Creators choose pricing currency; buyers get auto-detected local currency. |

### 12.2 Still open

| ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| FD-04 | Promote Studio at launch? | Publish all three; promote Creator | Go-to-market |
| FD-05 | Payout schedule | Weekly default + paid instant | Phase 7 |
| FD-06 | Default payout rail | Mobile Money | Phase 7 |
| FD-07 | Withdrawal minimums | GH₵50 / GH₵100 instant | Phase 7 |
| FD-08 | Availability hold | 7 days | Phase 7 |
| FD-09 | Refund / chargeback liability | Creator, with evidence and appeal | **Phase 7** |
| FD-10 | Enterprise timing | Phase 10 | Roadmap |
| FD-11 | Native media add-on | Defer; files-only if reopened | Roadmap |
| FD-12 | Corrected `/pricing` copy | Applied in this revision — confirm | Public copy |
| FD-13 | Margin definition + FX review trigger | Adopt section 5.1 and 5% drift rule | Finance |
| FD-14 | Buyer-fee presentation | Separate line; included in price where surcharging is banned | **Checkout** |
| FD-15 | FX buffer and rounding increments | 2% buffer, round up, per-currency increment | Checkout |
| FD-16 | Launch currency list | USD, GHS, NGN, KES, ZAR, GBP, EUR (provider-dependent) | Checkout |
| FD-17 | Payout flat fee in non-GHS currencies | Local equivalent, rounded up | Phase 7 |
| FD-18 | Free-plan member cap | Keep 100, or remove the cap | Product |

---

## 13. Public copy (applied to the preview)

`/pricing` now states Free $0 / 10%, Creator $29 / 5%, Studio $99 / 2%, that prices are in USD with
local currency shown before payment, and that processing is paid by the buyer. The page still says
checkout is unavailable, per ADR-034.

Still not claimed anywhere:

- native hosting or unlimited video;
- Enterprise or organization plans;
- instant payouts as live;
- any specific local-currency amount as final.

---

## 14. Build now vs wait

### Safe now

- Fee calculator and gross-up function, with unit tests.
- Multi-currency price/rounding helpers.
- Ledger schema and balance-invariant tests.
- Migration drafts (not applied).
- Metering schema (empty).
- Copy corrections (done in this revision).

### Wait for Phase 7

- Provider selection, accounts, keys, webhooks.
- Checkout, KYC, payouts, refunds, disputes.
- Tax registration and invoicing.
- Hosted migrations.
- Any live price offer.

`SEC-076` and ADR-034 remain in force.

---

## 15. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Buyer-paid fee is a surcharge in some markets | **High** | FD-14; include in price where banned |
| Higher take rate slows creator acquisition | **High** | Free tier remains the entry point; measure |
| Cross-currency FX loss | Medium | Upward rounding buffer; store rate per order |
| Creator prices in one currency, pays out in another | Medium | Disclose conversion at payout; FD-17 |
| Holding creator funds | **High** | Sub-ledger, daily reconciliation, legal review |
| Chargeback liability unassigned | **High** | FD-09 before Phase 7 |
| Native video economics in Africa | **High** | Stay on ADR-029 |
| Ghana tax/levy treatment | **High** | Accountant confirmation; not verified here |
| No capacity evidence (ADR-041) | Medium | Blocks launch claims, not this model |

### Unverified

- Paystack volume-discount threshold.
- Whether creator balances require segregated accounts.
- Live-streaming provider cost.
- Ghana VAT and levy treatment.

---

## 16. What changed in this revision

| Item | v1 | v2 |
|---|---|---|
| Ladder | $19/$39, 7%/3% | **Free 10%, Creator $29/5%, Studio $99/2%** |
| Processing fee | Creator or platform (open) | **Buyer** |
| Currency | USD/GH₵ pairs | **USD base, creator choice, auto-detect** |
| Code | Not touched | `types.ts`, `seed.ts`, `pricing.tsx`, `help.tsx`, `creator.tsx`, `commerce.tsx` updated |
| ADR | Proposed | **ADR-047, superseding ADR-030** |

Verification performed: `npm run typecheck` passes; no remaining `3%`, `7%`, `$19`, `$39`, `GH₵300`,
`GH₵620`, `Pro Plus` or `pro-plus` references remain in `src/`.