import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "creator" ? ("creator" as const) : ("learner" as const),
  }),
  head: () => ({ meta: [{ title: "Create your account — The Scenes" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { role } = Route.useSearch();
  const { signInDemo } = useApp();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "Enter a valid email address.";
    if (values.password.length < 8) next.password = "Use at least 8 characters.";
    if (!agreed) next.agreed = "Accept the preview terms to continue.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    window.setTimeout(() => {
      signInDemo(values.email);
      setLoading(false);
      setSuccess(true);
      toast("Preview account ready", "No server account was created. Continue to onboarding.");
    }, 500);
  };

  if (success) {
    return (
      <AuthShell
        title={
          role === "creator" ? "Your creator preview is ready." : "Your preview account is ready."
        }
        description="The account exists only in this browser session. Continue to personalise the fixture experience."
        footer={
          <a href="/login" className="font-bold text-indigo-700">
            Use a different account
          </a>
        }
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-bold text-emerald-950">Welcome, {values.name.trim()}.</p>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            Your local demo session is active. Nothing was sent to a backend.
          </p>
          <a
            href={`/onboarding?role=${role}`}
            className="mt-5 flex h-11 items-center justify-center rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            Continue to onboarding
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={role === "creator" ? "Create your creator preview." : "Create your account."}
      description={
        role === "creator"
          ? "Preview the teaching and community workspace. No production creator account or payout profile is created."
          : "Start with a local preview profile. Production authentication will connect only after the frontend phase is accepted."
      }
      footer={
        <>
          Already have an account?{" "}
          <a href="/login" className="font-bold text-indigo-700 hover:text-indigo-900">
            Log in
          </a>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name} required>
          <Input
            id="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label="Email address" htmlFor="email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
            invalid={Boolean(errors.email)}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters"
          error={errors.password}
          required
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => setValues({ ...values, password: event.target.value })}
              invalid={Boolean(errors.password)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Checkbox
          id="terms"
          checked={agreed}
          onChange={setAgreed}
          label="I agree to the preview terms"
          description="This is simulated auth; no production account or payment method is created."
        />
        {errors.agreed ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {errors.agreed}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating preview…
            </>
          ) : (
            "Create preview account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
