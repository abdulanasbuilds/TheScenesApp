import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Badge, Button, Field, Input, buttonClass } from "@/components/ui";

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

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email connected to your account. We will show you what the reset flow would do — and what is not connected in this preview."
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
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-amber-950">Reset link not sent</p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  The form validated, but no email provider is connected in this frontend preview.
                  No message was sent to <span className="font-semibold">{email}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> What production would do
            </p>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">
              {[
                "Send a single-use link to the verified email address.",
                "Expire the link after a short window and invalidate older requests.",
                "Change nothing until the link is opened and a new password is confirmed.",
                "Rate-limit requests and avoid revealing whether an account exists.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => setSent(false)}>
              Try another email
            </Button>
            <a href="/login" className={buttonClass("primary", "md")}>
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="flex items-center gap-2">
            <Badge tone="outline">
              <Mail className="h-3 w-3" /> Email reset
            </Badge>
            <Badge tone="amber">Delivery not connected</Badge>
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
              }}
              placeholder="you@example.com"
              invalid={Boolean(error)}
            />
          </Field>

          <Button type="submit" className="w-full" size="lg">
            <Mail className="h-4 w-4" /> Show reset flow
          </Button>

          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">Preview boundary</p>
            <p className="mt-1">
              No email is sent, no reset token is created and no password can be changed from this
              screen. Sign-in itself is a local demo session.
            </p>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
