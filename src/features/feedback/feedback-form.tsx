import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Badge, Button, Field, Select, Textarea } from "@/components/ui";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  type FeedbackCategory,
  type FeedbackDelivery,
} from "./contracts";
import { getFeedbackProviderStatus, sendFeedback } from "./feedback.functions";
import { buildFeedbackWhatsAppLink, normalizeWhatsAppNumber } from "./whatsapp";

type ChannelStatus = Readonly<{
  state: "ready" | "disabled" | "missing" | "misconfigured" | "unhealthy";
  provider: "memory" | "whatsapp" | null;
  whatsappNumber: string | null;
  dataMode: string;
}>;

type Receipt = Readonly<{ delivery: FeedbackDelivery; reference: string | null }>;

export type FeedbackViewer = Readonly<{
  id: string;
  name: string;
  email: string;
}>;

const STARTER_MESSAGE = "Hi, I would like to share feedback about The Scenes.";

function senderLabel(viewer: FeedbackViewer | null): string | null {
  if (!viewer) return null;
  const name = viewer.name.trim();
  const email = viewer.email.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || null;
}

/**
 * P4-S4 feedback form (ADR-048).
 *
 * Two honest paths, one form:
 * 1. "Chat with the founder on WhatsApp" builds a `https://wa.me` deep link in the browser. On a
 *    phone it opens the WhatsApp app; on desktop it opens WhatsApp Web. The text is pre-filled and
 *    the sender still presses Send inside WhatsApp.
 * 2. The in-app submit is rate-limited and validated by the server. When the WhatsApp channel is
 *    selected the server returns a prepared handoff link instead of claiming delivery.
 *
 * A local-preview submission is never presented as a delivered message, and a provider failure keeps
 * the text and offers a retry.
 */
export function FeedbackForm({
  route,
  viewer = null,
}: Readonly<{ route: string; viewer?: FeedbackViewer | null }>) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [channel, setChannel] = useState<ChannelStatus | null>(null);
  // The absolute URL only exists in the browser. `useSyncExternalStore` keeps server rendering and
  // hydration honest without a setState-in-effect cascade.
  const pageUrl = useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => null,
  );

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

  const whatsappNumber = useMemo(
    () => normalizeWhatsAppNumber(channel?.whatsappNumber ?? null),
    [channel?.whatsappNumber],
  );

  const trimmed = message.trim();
  const isWhatsApp = channel?.provider === "whatsapp";

  const directLink = useMemo(() => {
    if (!whatsappNumber) return null;
    const body = trimmed.length >= FEEDBACK_MESSAGE_MIN ? trimmed : STARTER_MESSAGE;
    return buildFeedbackWhatsAppLink(whatsappNumber, {
      category,
      message: body,
      route,
      pageUrl,
      senderLabel: senderLabel(viewer),
      userId: viewer?.id ?? null,
      signedIn: viewer !== null,
      // Refreshed whenever the note changes, so the founder sees roughly when it was composed.
      occurredAt: new Date().toISOString(),
    });
  }, [whatsappNumber, trimmed, category, route, pageUrl, viewer]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
      const result = await sendFeedback({ data: { message: trimmed, route, category } });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      setReceipt({ delivery: result.data.delivery, reference: result.data.reference });
      if (result.data.delivery === "provider") setMessage("");
    } catch {
      setFormError("Something went wrong. Your note is still here — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (receipt) {
    const delivered = receipt.delivery === "provider";
    const handoff = receipt.delivery === "handoff";
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          {delivered ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <TriangleAlert className="h-4 w-4 text-amber-600" />
          )}
          {delivered
            ? "Sent to the founder"
            : handoff
              ? "Your note is ready in WhatsApp"
              : "Saved to the local preview inbox"}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">
          {delivered
            ? "Thanks — your note reached the founder. It included your message, the page you were on, the time and a request reference, and nothing else."
            : handoff
              ? "Nothing has been sent yet. Open WhatsApp, check the prepared message and press Send. It goes straight to the founder's direct message."
              : "This deployment has no delivery channel connected yet, so nothing left the server. The note is kept in memory for local testing only."}
        </p>
        {handoff && receipt.reference ? (
          <a
            href={receipt.reference}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> Open WhatsApp
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setReceipt(null)}>
            Write another
          </Button>
          {handoff ? (
            <Button variant="ghost" onClick={() => setReceipt(null)}>
              Edit this note
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
      <div className="flex flex-wrap items-center gap-2">
        {channel === null ? (
          <Badge tone="outline">Checking channel…</Badge>
        ) : channel.state === "ready" && isWhatsApp ? (
          <Badge tone="green">
            <ShieldCheck className="h-3 w-3" /> WhatsApp direct
          </Badge>
        ) : channel.state === "ready" ? (
          <Badge tone="amber">
            <TriangleAlert className="h-3 w-3" /> Local preview
          </Badge>
        ) : (
          <Badge tone="amber">
            <TriangleAlert className="h-3 w-3" /> Channel unavailable
          </Badge>
        )}
        <span className="text-xs text-slate-500">
          Sent with your message: this page&rsquo;s path, the time and a reference. Nothing else.
        </span>
      </div>

      {whatsappNumber || channel?.state === "misconfigured" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <MessageCircle className="h-4 w-4" /> Chat with the founder on WhatsApp
          </p>
          <p className="mt-1.5 text-xs leading-5 text-emerald-900/80">
            Fastest route. The message below is pre-filled with this page, your category and, if you
            are signed in, your account name and email. You review it and press Send inside
            WhatsApp. On a phone it opens the app; on desktop it opens WhatsApp Web.
          </p>
          <a
            href={directLink ?? "#feedback-message"}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={directLink ? undefined : true}
            className={
              directLink
                ? "mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                : "pointer-events-none mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
            }
          >
            <MessageCircle className="h-4 w-4" /> Open WhatsApp directly
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {directLink ? null : (
            <p className="mt-2 text-xs text-emerald-900/70">
              The founder&rsquo;s WhatsApp number is not configured in this deployment yet.
            </p>
          )}
        </div>
      ) : null}

      <Field label="Category" htmlFor="feedback-category">
        <Select
          id="feedback-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
        >
          {FEEDBACK_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {FEEDBACK_CATEGORY_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

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
        {trimmed.length}/{FEEDBACK_MESSAGE_MAX}
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
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isWhatsApp ? (
            <MessageCircle className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {sending ? "Preparing…" : isWhatsApp ? "Send to founder via WhatsApp" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
