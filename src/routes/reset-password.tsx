import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Badge, Button, Field, Input, buttonClass } from "@/components/ui";
import {
  completeAccountPasswordRecovery,
  updateRecoveredAccountPassword,
} from "@/features/auth/auth.functions";
import { RECOVERY_ACKNOWLEDGEMENT, readRecoveryLink } from "@/features/auth/recovery";
import { recoveredPasswordSchema } from "@/features/auth/schemas";
import { useDataMode } from "@/store/app-store";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Choose a new password — The Scenes" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPasswordPage,
});

type Phase = "checking" | "ready" | "invalid" | "unsupported" | "updated";

function ResetPasswordPage() {
  const router = useRouter();
  const dataMode = useDataMode();
  const started = useRef(false);
  const codeRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>("checking");
  const [loadError, setLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const consume = useCallback(async () => {
    if (!codeRef.current) {
      setPhase("invalid");
      return;
    }
    setLoadError("");
    setPhase("checking");
    const result = await completeAccountPasswordRecovery({ data: { code: codeRef.current } });
    if (!result.ok) {
      setLoadError(result.error.message);
      setPhase("invalid");
      return;
    }
    if (result.data.status === "ready") setPhase("ready");
    else if (result.data.status === "unsupported") setPhase("unsupported");
    else setPhase("invalid");
  }, []);

  useEffect(() => {
    if (started.current || typeof window === "undefined") return;
    started.current = true;

    const prepareTimer = window.setTimeout(() => {
      const { state, cleanPath } = readRecoveryLink(window.location.search);
      // Remove the code or provider error from the visible URL before any network call.
      window.history.replaceState({}, "", cleanPath);

      if (dataMode === "fixtures") {
        setPhase("unsupported");
        return;
      }
      if (state.kind !== "code") {
        setPhase("invalid");
        return;
      }
      codeRef.current = state.code;
      void consume();
    }, 0);

    return () => window.clearTimeout(prepareTimer);
  }, [consume, dataMode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = recoveredPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      setFieldError("Use a password between 8 and 128 characters.");
      return;
    }
    if (password !== confirm) {
      setFieldError("The passwords do not match.");
      return;
    }
    setFieldError("");
    setFormError("");
    setSubmitting(true);
    try {
      const result = await updateRecoveredAccountPassword({ data: parsed.data });
      if (!result.ok) {
        setFormError(result.error.message);
        if (result.error.code === "UNAUTHENTICATED") setPhase("invalid");
        return;
      }
      codeRef.current = null;
      setPassword("");
      setConfirm("");
      setPhase("updated");
      await router.invalidate();
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "checking") {
    return (
      <AuthShell
        title="Checking your reset link"
        description="We are verifying the single-use link with Supabase Auth. This only takes a moment."
        footer={
          <a href="/login" className="font-bold text-indigo-700">
            Back to sign in
          </a>
        }
      >
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700"
        >
          <Loader2 className="h-5 w-5 animate-spin text-indigo-700" />
          Verifying your recovery link...
        </div>
      </AuthShell>
    );
  }

  if (phase === "unsupported") {
    return (
      <ResetNotice
        title="Recovery is not connected in this preview"
        description="Password reset needs a connected Supabase Auth environment and an approved email provider. This preview has neither, so no password can be changed here."
        tone="amber"
      />
    );
  }

  if (phase === "invalid") {
    return (
      <ResetNotice
        title="This reset link cannot be used"
        description={
          loadError ||
          "The link is missing, has expired, has already been used, or was opened in a different browser."
        }
        tone="amber"
      />
    );
  }

  if (phase === "updated") {
    return (
      <AuthShell
        title="Password updated"
        description="Your password has changed and every other session has been signed out."
        footer={
          <a href="/login" className="font-bold text-indigo-700">
            Back to sign in
          </a>
        }
      >
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-950">You can sign in now.</p>
              <p className="mt-1 text-sm leading-6 text-emerald-900">
                Use the new password on the sign-in page. The old password and other sessions no
                longer work.
              </p>
            </div>
          </div>
          <a href="/login?reset=complete" className={buttonClass("primary", "md", "mt-4 w-full")}>
            <ArrowLeft className="h-4 w-4" /> Go to sign in
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Your recovery link is verified. Set a new password for your account."
      footer={
        <p>
          Changed your mind?{" "}
          <a href="/login" className="font-bold text-indigo-700">
            Back to sign in
          </a>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Badge tone="outline">
          <ShieldCheck className="h-3 w-3" /> Recovery session
        </Badge>
        <Field
          label="New password"
          htmlFor="new-password"
          hint="At least 8 characters"
          error={fieldError}
          required
        >
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldError) setFieldError("");
              }}
              invalid={Boolean(fieldError)}
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
        <Field label="Confirm new password" htmlFor="confirm-password" required>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              if (fieldError) setFieldError("");
            }}
            invalid={Boolean(fieldError)}
          />
        </Field>
        {formError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Updating password...
            </>
          ) : (
            "Update password"
          )}
        </Button>
        <p className="text-xs leading-5 text-slate-500">
          Updating your password signs out every other session. The reset link can only be used
          once.
        </p>
      </form>
    </AuthShell>
  );
}

function ResetNotice({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "amber";
}) {
  return (
    <AuthShell
      title={title}
      description="Recovery links are single-use and time-limited for safety."
      footer={
        <a href="/login" className="font-bold text-indigo-700">
          Back to sign in
        </a>
      }
    >
      <div className="space-y-4">
        <div
          role="alert"
          className={
            tone === "amber"
              ? "rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
              : "rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700"
          }
        >
          {description}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href="/forgot-password" className={buttonClass("primary", "md")}>
            <Mail className="h-4 w-4" /> Request a new link
          </a>
          <a href="/login" className={buttonClass("secondary", "md")}>
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </a>
        </div>
        <p className="text-xs leading-5 text-slate-500">{RECOVERY_ACKNOWLEDGEMENT}</p>
      </div>
    </AuthShell>
  );
}
