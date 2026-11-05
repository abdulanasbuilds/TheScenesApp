import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — The Scenes" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { signInDemo } = useApp();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("ama@example.com");
  const [password, setPassword] = useState("preview123");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    window.setTimeout(() => {
      signInDemo(email);
      toast(
        "Signed in to the preview",
        remember
          ? "Your local session is active for this page load."
          : "No persistent session was stored.",
      );
      void router.navigate({ href: "/home" });
    }, 500);
  };

  return (
    <AuthShell
      title="Welcome back."
      description="Use the prefilled demo details or any valid-looking email. This form validates locally and never sends a password."
      footer={
        <>
          New to The Scenes?{" "}
          <a href="/register" className="font-bold text-indigo-700 hover:text-indigo-900">
            Create an account
          </a>
        </>
      }
    >
      <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs leading-5 text-indigo-950">
        <strong>Preview credentials are prefilled.</strong> Any syntactically valid email and
        non-empty password opens the same deterministic demo session.
      </div>
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
          <Checkbox
            id="remember"
            checked={remember}
            onChange={setRemember}
            label="Remember this preview"
          />
          <a
            href="/forgot-password"
            className="shrink-0 text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            Forgot password?
          </a>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            "Log in to preview"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
