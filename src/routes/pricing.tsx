import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, HelpCircle, Minus, Plus, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge, Card, buttonClass } from "@/components/ui";
import { plans } from "@/data/seed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — The Scenes" }] }),
  component: PricingPage,
});

const faqs = [
  [
    "What do the paid plans cost?",
    "The approved monthly direction is Pro at $19 / GH₵300 and Pro Plus at $39 / GH₵620. Yearly pricing, checkout and payment providers are not yet approved or available.",
  ],
  [
    "Does the preview process payments?",
    "No. Payment providers, checkout, verification, refunds and payouts are later product phases. Every commercial action in this build is clearly simulated.",
  ],
  [
    "What do the platform fees mean?",
    "Pro and Pro Plus have an approved 3% platform fee. Free has an approved 7% platform fee. Processor fees are separate and payments remain on hold.",
  ],
  [
    "Is video hosting included?",
    "All launch plans use approved external video, file and live-session links. Native hosting and native live delivery are not included; adding them later would require a new provider, cost and quota decision.",
  ],
];

function PricingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <PublicShell active="/pricing">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <Badge tone="clay">
            <Sparkles className="h-3 w-3" /> Approved monthly direction
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Start free. Upgrade when your community grows.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Monthly plan prices are approved. Checkout and payment providers remain intentionally
            unavailable until the later payments phase.
          </p>
          <p className="mt-6 text-sm font-semibold text-slate-600">
            Monthly billing direction · yearly pricing not yet set
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col p-5 sm:p-6",
                plan.highlighted && "border-2 border-indigo-600 shadow-lg",
              )}
            >
              {plan.highlighted ? (
                <Badge tone="indigo" className="absolute -top-3 left-5">
                  Most complete
                </Badge>
              ) : null}
              <div className="border-b border-slate-200 pb-5">
                <h2 className="font-display text-2xl font-extrabold text-slate-900">{plan.name}</h2>
                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{plan.audience}</p>
                <p className="mt-5 font-display text-2xl font-extrabold tracking-tight text-slate-950">
                  {plan.priceLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">{plan.priceNote}</p>
                <Badge tone="outline" className="mt-3">
                  {plan.fee}
                </Badge>
              </div>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className={cn(
                      "flex gap-2.5 text-sm leading-5",
                      feature.included ? "text-slate-700" : "text-slate-500",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        feature.included === true
                          ? "bg-emerald-50 text-emerald-700"
                          : feature.included === "addon"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {feature.included === true ? (
                        <Check className="h-3 w-3" />
                      ) : feature.included === "addon" ? (
                        <Plus className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </span>
                    <span>
                      {feature.label}
                      {feature.included === "addon" ? (
                        <span className="ml-1 text-[10px] font-bold text-amber-700 uppercase">
                          Add-on
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.id === "free" ? "/register" : "/register?role=creator"}
                className={buttonClass(
                  plan.highlighted ? "primary" : "secondary",
                  "lg",
                  "mt-6 w-full",
                )}
              >
                {plan.id === "free" ? "Start free" : "Join the launch list"}
              </a>
            </Card>
          ))}
        </div>
        <Card className="mt-6 border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Commercial boundary:</strong> these are approved monthly plan directions, not an
          active offer. Checkout, processor selection, yearly prices, refunds, chargebacks,
          settlement timing and Ghana/international payment routes remain unavailable until the
          payments phase.
        </Card>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
              Plain answers
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">
              Pricing questions
            </h2>
          </div>
          <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {faqs.map(([question, answer], index) => (
              <div key={question}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
                  aria-expanded={openFaq === index}
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-indigo-700" />
                  <span className="flex-1 text-sm font-bold text-slate-900">{question}</span>
                  <Plus
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      openFaq === index && "rotate-45",
                    )}
                  />
                </button>
                {openFaq === index ? (
                  <p className="px-5 pb-5 pl-12 text-sm leading-6 text-slate-600">{answer}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-extrabold text-slate-900">
          Build the audience before the invoice.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Start a free preview account and explore the complete creator workspace with fixture data.
        </p>
        <a href="/register?role=creator" className={buttonClass("primary", "lg", "mt-6")}>
          Create preview account
        </a>
      </section>
    </PublicShell>
  );
}
