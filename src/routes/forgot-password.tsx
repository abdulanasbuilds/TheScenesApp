import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Badge, Button, Field, Input, buttonClass } from "@/components/ui";
import { requestAccountPasswordRecovery } from "@/features/auth/auth.functions";
import type {
  AuthEmailSetupView,
  PasswordRecoveryAcknowledgement,
} from "@/features/auth/contracts";
import { RECOVERY_ACKNOWLEDGEMENT } from "@/features/auth/recovery";
import { passwordRecoveryRequestSchema } from "@/features/auth/schemas";
import { getAuthEmailSetupStatus } from "@/features/shared/setup.functions";
import { dataMode } from "@/lib/data-mode";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — The Scenes" },
      {
        name: "description",
        content: "Request a password reset link for your The Scenes account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

const NOT_CONFIGURED_COPY =
  "This preview has no email provider connected, so no reset email was sent. In the connected environment, this same message is returned whether or not an account exists.";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<PasswordRecoveryAcknowledgement | null>(
    null,
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = passwordRecoveryRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setFormError("");
    setLoading(true);
    try {
      const result = await requestAccountPasswordRecovery({ data: parsed.data });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      setAcknowledgement(result.data);
    } finally {
      setLoading(false);
    }
  };

  if (acknowledgement) {
    return (
      <AuthShell
        title="Check your inbox"
        description="For your privacy, this page gives the same answer whether or not an account exists."
        footer={
          <p>
            Remembered it?{" "}
            <a href="/login" className="font-bold text-indigo-700 hover:text-indigo-900">
              Back to sign in
            </a>
          </p>
        }
      >
        <div className="space-y-4">
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-950">{RECOVERY_ACKNOWLEDGEMENT}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  {acknowledgement.delivery === "not-configured"
                    ? NOT_CONFIGURED_COPY
                    : "Open the link in the email on this device. It expires quickly and can be used once. We have not confirmed delivery, so check your spam folder if it does not arrive."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> What happens next
            </p>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">
              {[
                "Supabase Auth creates and verifies the single-use recovery token.",
                "The link returns to the recovery-only page on this site.",
                "Your password changes only after you confirm a new one.",
                "All other sessions are signed out after the change.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => setAcknowledgement(null)}>
              <RefreshCw className="h-4 w-4" /> Try another email
            </Button>
            <a href="/login" className={buttonClass("primary", "md")}>
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </a>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description={
        dataMode === "fixtures"
          ? "This preview validates the recovery request but has no email provider connected."
          : "Enter the email connected to your account. We give the same answer whether or not an account exists."
      }
      footer={
        <p>
          Remembered it?{" "}
          <a href="/login" className="font-bold text-indigo-700 hover:text-indigo-900">
            Back to sign in
          </a>
          {" · "}
          <a href="/register" className="font-bold text-indigo-700 hover:text-indigo-900">
            Create an account
          </a>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">
            <Mail className="h-3 w-3" /> Email reset
          </Badge>
          {dataMode === "fixtures" ? <Badge tone="amber">Delivery not connected</Badge> : null}
        </div>

        <Field label="Email address" htmlFor="reset-email" error={error} required>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError("");
              if (formError) setFormError("");
            }}
            placeholder="you@example.com"
            invalid={Boolean(error)}
          />
        </Field>

        {formError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Requesting reset link...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" /> Send reset link
            </>
          )}
        </Button>

        {dataMode === "fixtures" ? (
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">Preview boundary</p>
            <p className="mt-1">
              No email is sent, no reset token is created and no password can be changed from this
              preview.
            </p>
          </div>
        ) : null}

        <EmailSetupChecker />
      </form>
    </AuthShell>
  );
}

function zodEmailMessage(issues: readonly { path: PropertyKey[] }[]): string {
  return issues.length ? "Enter a valid email address." : "Enter a valid email address.";
}

function EmailSetupChecker() {
  const [status, setStatus] = useState<AuthEmailSetupView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAuthEmailSetupStatus({ data: undefined });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setStatus(result.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-slate-800">
        Operator: check account-email setup
      </summary>
      <p className="mt-2 leading-5">
        Reports configuration names and state only. The application never reads or prints an SMTP,
        domain or API secret.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={check}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5" /> Run setup check
          </>
        )}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 font-medium text-red-600">
          {error}
        </p>
      ) : null}
      {status ? (
        <div role="status" aria-live="polite" className="mt-3 space-y-2">
          <p className="font-semibold text-slate-800">
            {status.provider} · {status.state.replaceAll("-", " ")} · mode {status.dataMode}
          </p>
          <ul className="space-y-1">
            {status.checks.map((item) => (
              <li key={item.name} className="flex items-start justify-between gap-3">
                <span>{item.name}</span>
                <span className="shrink-0 font-semibold text-slate-700">
                  {item.state.replaceAll("-", " ")}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-1.5 text-slate-500">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {status.notes[0]}
          </p>
        </div>
      ) : null}
    </details>
  );
}
