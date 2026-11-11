import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { signInWithPassword } from "@/features/auth/auth.functions";
import { normalizeAuthNext } from "@/features/auth/redirects";
import { signInSchema } from "@/features/auth/schemas";
import { dataMode } from "@/lib/data-mode";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    confirmation:
      search.confirmation === "complete" || search.confirmation === "error"
        ? search.confirmation
        : undefined,
    reset: search.reset === "complete" ? ("complete" as const) : undefined,
    next: normalizeAuthNext(search.next),
  }),
  head: () => ({ meta: [{ title: "Log in — The Scenes" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { confirmation, next, reset } = Route.useSearch();
  const { signInDemo } = useApp();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(dataMode === "fixtures" ? "ama@example.com" : "");
  const [password, setPassword] = useState(dataMode === "fixtures" ? "preview123" : "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      if (fields.email?.[0]) next.email = fields.email[0];
      if (fields.password?.[0]) next.password = fields.password[0];
    }
    setErrors(next);
    if (Object.keys(next).length || !parsed.success) return;
    setLoading(true);
    if (dataMode === "fixtures") {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      signInDemo(email);
      toast(
        "Signed in to the preview",
        remember
          ? "Your local session is active for this page load."
          : "No persistent session was stored.",
      );
      void router.navigate({ href: "/home" });
      return;
    }
    const result = await signInWithPassword({ data: parsed.data });
    setLoading(false);
    if (!result.ok) {
      setErrors({ form: result.error.message });
      return;
    }
    await router.invalidate();
    toast("Signed in", "Your connected session is active.");
    await router.navigate({ href: normalizeAuthNext(next) });
  };

  return (
    <AuthShell
      title="Welcome back."
      description={
        dataMode === "fixtures"
          ? "Use the prefilled demo details or any valid-looking email. This form validates locally and never sends a password."
          : dataMode === "supabase-staging"
            ? "Sign in to the pre-production environment after confirming your email. No payment or production deployment is connected."
            : "Sign in to the isolated local learning environment. No production service is connected."
      }
      footer={
        <>
          New to The Scenes?{" "}
          <a href="/register" className="font-bold text-indigo-700 hover:text-indigo-900">
            Create an account
          </a>
        </>
      }
    >
      {dataMode === "fixtures" ? (
        <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs leading-5 text-indigo-950">
          <strong>Preview credentials are prefilled.</strong> Any syntactically valid email and
          non-empty password opens the same deterministic demo session.
        </div>
      ) : null}
      {confirmation ? (
        <div
          role="status"
          className={`mb-5 rounded-lg border p-3 text-xs leading-5 ${
            confirmation === "complete"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <strong>
            {confirmation === "complete"
              ? "Email confirmation processed."
              : "That confirmation link could not be used."}
          </strong>{" "}
          {confirmation === "complete"
            ? "Sign in with your password to continue."
            : "Request a new confirmation email or try registering again."}
        </div>
      ) : null}
      {reset === "complete" ? (
        <div
          role="status"
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"
        >
          <strong>Password updated.</strong> Sign in with your new password.
        </div>
      ) : null}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="login-email" error={errors.email} required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Password" htmlFor="login-password" error={errors.password} required>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
        <div className="flex items-center justify-between gap-3">
          {dataMode === "fixtures" ? (
            <Checkbox
              id="remember"
              checked={remember}
              onChange={setRemember}
              label="Remember this preview"
            />
          ) : (
            <span className="text-xs text-slate-500">Secure connected session</span>
          )}
          <a
            href="/forgot-password"
            className="shrink-0 text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            Forgot password?
          </a>
        </div>
        {errors.form ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {errors.form}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : dataMode === "fixtures" ? (
            "Log in to preview"
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
