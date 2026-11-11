import { PlugZap } from "lucide-react";
import { Badge, Card } from "@/components/ui";

/**
 * Read-only view of the integration health report. Every value shown is a name or a state; no
 * credential, partial credential or provider response is ever rendered.
 */
export type IntegrationHealthItem = Readonly<{
  name: string;
  label: string;
  state: "ready" | "disabled" | "missing" | "misconfigured" | "unhealthy";
  detail: string;
  requiredVariables: readonly string[];
  missingVariables: readonly string[];
}>;

export type IntegrationsReportData = Readonly<{
  dataMode: string;
  generatedAt: string;
  ok: boolean;
  integrations: readonly IntegrationHealthItem[];
}>;

const STATE_TONE = {
  ready: "green",
  disabled: "slate",
  missing: "amber",
  misconfigured: "amber",
  unhealthy: "amber",
} as const;

const STATE_LABEL = {
  ready: "Ready",
  disabled: "Not enabled",
  missing: "Missing configuration",
  misconfigured: "Needs attention",
  unhealthy: "Unhealthy",
} as const;

export function IntegrationHealthCard({ report }: Readonly<{ report: IntegrationsReportData }>) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <PlugZap className="h-4 w-4 text-indigo-700" />
        <h2 className="font-display text-lg font-extrabold text-slate-900">Connected services</h2>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        What this deployment can reach right now, and the variable names it reads. Only names are
        shown — never a value.
      </p>

      <ul className="mt-4 space-y-3">
        {report.integrations.map((integration) => (
          <li
            key={integration.name}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{integration.label}</p>
              <Badge tone={STATE_TONE[integration.state]}>{STATE_LABEL[integration.state]}</Badge>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{integration.detail}</p>
            {integration.missingVariables.length > 0 ? (
              <p className="mt-2 font-mono text-[11px] leading-5 text-slate-700">
                {integration.missingVariables.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-slate-500">
        Mode: <span className="font-semibold">{report.dataMode}</span>. Checked at{" "}
        {report.generatedAt}.
      </p>
    </Card>
  );
}
