import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Button, Field, Textarea } from "@/components/ui";
import { FEEDBACK_MESSAGE_MAX, FEEDBACK_MESSAGE_MIN } from "./contracts";
import { getFeedbackProviderStatus, sendFeedback } from "./feedback.functions";

type ChannelStatus = Readonly<{
  state: "ready" | "disabled" | "missing" | "misconfigured" | "unhealthy";
  provider: "memory" | "telegram" | null;
  dataMode: string;
}>;

type Receipt = Readonly<{ delivery: "provider" | "local-preview" }>;

/**
 * P4-S4 feedback form.
 *
 * The copy states exactly where a note goes. A local-preview submission is never presented as a
 * delivered message, and a provider failure keeps the text and offers a retry.
 */
export function FeedbackForm({ route }: Readonly<{ route: string }>) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [channel, setChannel] = useState<ChannelStatus | null>(null);

  useEffect(() => {
    let active = true;
    void getFeedbackProviderStatus({ data: undefined })
      .then((result) => {
        if (active && result.ok) setChannel(result.data as ChannelStatus);
      })
      .catch(() => {
        // A status read is best-effort; submission still reports the real outcome.
      });
    return () => {
      active = false;
    };
  }, []);

  const deliveredToTeam = channel?.provider === "telegram";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < FEEDBACK_MESSAGE_MIN) {
      setError(`Add at least ${FEEDBACK_MESSAGE_MIN} characters so the note is actionable.`);
      return;
    }
    if (trimmed.length > FEEDBACK_MESSAGE_MAX) {
      setError(`Keep the note under ${FEEDBACK_MESSAGE_MAX} characters.`);
      return;
    }
    setError("");
    setFormError("");
    setSending(true);
    try {
      const result = await sendFeedback({ data: { message: trimmed, route } });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      setReceipt({ delivery: result.data.delivery });
      setMessage("");
    } catch {
      setFormError("Something went wrong. Your note is still here — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (receipt) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          {receipt.delivery === "provider" ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <TriangleAlert className="h-4 w-4 text-amber-600" />
          )}
          {receipt.delivery === "provider"
            ? "Sent to the internal channel"
            : "Saved to the local preview inbox"}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">
          {receipt.delivery === "provider"
            ? "Thanks — your note reached the team. It included your message, the page you were on, the time and a request reference, and nothing else."
            : "This deployment has no delivery channel connected yet, so nothing left the server. The note is kept in memory for local testing only."}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => setReceipt(null)}>
          Write another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
      <div className="flex flex-wrap items-center gap-2">
        {channel === null ? (
          <Badge tone="outline">Checking channel…</Badge>
        ) : deliveredToTeam ? (
          <Badge tone="green">
            <ShieldCheck className="h-3 w-3" /> Internal channel
          </Badge>
        ) : (
          <Badge tone="amber">
            <TriangleAlert className="h-3 w-3" /> Local preview
          </Badge>
        )}
        <span className="text-xs text-slate-500">
          Sent with your message: this page&rsquo;s path, the time and a reference. Nothing else.
        </span>
      </div>

      <Field label="What should we know?" htmlFor="feedback-message" error={error} required>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-28"
          invalid={Boolean(error)}
          maxLength={FEEDBACK_MESSAGE_MAX}
          placeholder="Describe the friction, what you expected, and what happened instead."
        />
      </Field>
      <p className="text-right text-xs text-slate-400">
        {message.trim().length}/{FEEDBACK_MESSAGE_MAX}
      </p>

      {formError ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500">
          Do not include passwords, keys or private personal information.
        </p>
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
