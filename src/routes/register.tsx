import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { signUpWithPassword } from "@/features/auth/auth.functions";
import { signUpSchema } from "@/features/auth/schemas";
import { dataMode } from "@/lib/data-mode";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "creator" ? ("creator" as const) : ("learner" as const),
  }),
  head: () => ({ meta: [{ title: "Create your account — The Scenes" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const { role } = Route.useSearch();
  const { signInDemo } = useApp();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [values, setValues] = useState({ name: "", handle: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isHostedPreProduction = dataMode === "supabase-staging";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const parsed = signUpSchema.safeParse({
      displayName: values.name,
      handle: values.handle,
      email: values.email,
      password: values.password,
    });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      if (fields.displayName?.[0]) next.name = fields.displayName[0];
      if (fields.handle?.[0]) next.handle = fields.handle[0];
      if (fields.email?.[0]) next.email = fields.email[0];
      if (fields.password?.[0]) next.password = fields.password[0];
    }
    if (!agreed) next.agreed = "Accept the preview terms to continue.";
    setErrors(next);
    if (Object.keys(next).length || !parsed.success) return;
    setLoading(true);
    if (dataMode === "fixtures") {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      signInDemo(values.email);
      setLoading(false);
      setSuccess(true);
      toast("Preview account ready", "No server account was created. Continue to onboarding.");
      return;
    }
    const result = await signUpWithPassword({ data: parsed.data });
    setLoading(false);
    if (!result.ok) {
      const fieldErrors = result.error.fieldErrors ?? {};
      setErrors({
        ...(fieldErrors.displayName?.[0] ? { name: fieldErrors.displayName[0] } : {}),
        ...(fieldErrors.handle?.[0] ? { handle: fieldErrors.handle[0] } : {}),
        ...(fieldErrors.email?.[0] ? { email: fieldErrors.email[0] } : {}),
        ...(fieldErrors.password?.[0] ? { password: fieldErrors.password[0] } : {}),
        form: result.error.message,
      });
      return;
    }
    await router.invalidate();
    setConfirmationRequired(result.data.confirmationRequired);
    setSuccess(true);
    toast(
      result.data.confirmationRequired ? "Check your email" : "Account ready",
      result.data.confirmationRequired
        ? "Confirm your email address before signing in."
        : "Your account and profile were created securely.",
    );
  };

  if (success) {
    return (
      <AuthShell
        title={
          confirmationRequired
            ? "Check your email to continue."
            : role === "creator"
              ? "Your creator preview is ready."
              : "Your preview account is ready."
        }
        description={
          confirmationRequired
            ? "We sent a confirmation link to your email address. Confirm it, then return to log in."
            : dataMode === "fixtures"
              ? "The account exists only in this browser session. Continue to personalise the fixture experience."
              : "Your connected account is ready. Continue to review your profile and learning preferences."
        }
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
            {confirmationRequired
              ? "Your profile is reserved, but no session will start until your email is confirmed."
              : dataMode === "fixtures"
                ? "Your local demo session is active. Nothing was sent to a backend."
                : isHostedPreProduction
                  ? "Your test account and profile are saved in the pre-production environment."
                  : "Your account and profile are saved in the isolated local learning environment."}
          </p>
          <a
            href={confirmationRequired ? "/login" : `/onboarding?role=${role}`}
            className="mt-5 flex h-11 items-center justify-center rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            {confirmationRequired ? "Return to login" : "Continue to onboarding"}
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        role === "creator" && dataMode === "fixtures"
          ? "Create your creator preview."
          : "Create your account."
      }
      description={
        dataMode !== "fixtures"
          ? isHostedPreProduction
            ? "Create a pre-production test account. Email confirmation is required; no payment or production deployment is connected."
            : "Create a local account for the connected learning proof. No email provider, payment method or production service is used."
          : role === "creator"
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
        <Field label="Profile handle" htmlFor="handle" error={errors.handle} required>
          <Input
            id="handle"
            autoComplete="username"
            value={values.handle}
            onChange={(event) => setValues({ ...values, handle: event.target.value })}
            invalid={Boolean(errors.handle)}
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
          label={
            dataMode === "fixtures"
              ? "I agree to the preview terms"
              : isHostedPreProduction
                ? "I agree to the pre-production test terms"
                : "I agree to the local proof terms"
          }
          description={
            dataMode === "fixtures"
              ? "This is simulated auth; no production account or payment method is created."
              : isHostedPreProduction
                ? "This creates a test account in the pre-production project. No payment method is collected."
                : "This creates only an isolated local account. No email or payment provider is contacted."
          }
        />
        {errors.agreed ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {errors.agreed}
          </p>
        ) : null}
        {errors.form ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {errors.form}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : dataMode === "fixtures" ? (
            "Create preview account"
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
