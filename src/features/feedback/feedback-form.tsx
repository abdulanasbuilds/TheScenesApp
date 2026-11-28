import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Loader2, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  FEEDBACK_AREAS,
  FEEDBACK_AREA_LABELS,
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  FEEDBACK_SUBJECT_MAX,
  FEEDBACK_SUBJECT_MIN,
  type FeedbackArea,
  type FeedbackCategory,
  type FeedbackDelivery,
} from "./contracts";
import { getFeedbackProviderStatus, sendFeedback } from "./feedback.functions";

/**
 * P4-S4 feedback form (ADR-049).
 *
 * A single, simple form that captures a category, a short subject, an optional platform area and the
 * description. The server validates it, rate-limits it and creates a GitHub Issue in the founder's
 * private feedback repository. The browser never learns the repository name, the token or any
 * issue-management detail.
 *
 * Integrity in the UI:
 * - `sending` locks the button so a double click cannot submit twice.
 * - `submissionId` is generated once per composed note and reused on retry, so a retry after a lost
 *   response does not create a second issue.
 * - Success is shown only when the server confirms it. A local-preview submission is labelled as a
 *   preview, never as delivered.
 * - A failure keeps the note in place and offers a retry.
 */

type ChannelStatus = Readonly<{
  state: "ready" | "disabled" | "missing" | "misconfigured" | "unhealthy";
  provider: "memory" | "github" | null;
  dataMode: string;
}>;

type Receipt = Readonly<{ delivery: FeedbackDelivery }>;

function newSubmissionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}

export function FeedbackForm({ route }: Readonly<{ route: string }>) {
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [subject, setSubject] = useState("");
  const [area, setArea] = useState<FeedbackArea>("other");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [channel, setChannel] = useState<ChannelStatus | null>(null);
  const submissionId = useRef<string>(newSubmissionId());

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

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  const resetForAnother = () => {
    submissionId.current = newSubmissionId();
    setReceipt(null);
    setSubject("");
    setMessage("");
    setCompany("");
    setCategory("general");
    setArea("other");
    setSubjectError("");
    setMessageError("");
    setFormError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;

    let valid = true;
    if (trimmedSubject.length < FEEDBACK_SUBJECT_MIN) {
      setSubjectError(`Add a short subject of at least ${FEEDBACK_SUBJECT_MIN} characters.`);
      valid = false;
    } else if (trimmedSubject.length > FEEDBACK_SUBJECT_MAX) {
      setSubjectError(`Keep the subject under ${FEEDBACK_SUBJECT_MAX} characters.`);
      valid = false;
    } else {
      setSubjectError("");
    }

    if (trimmedMessage.length < FEEDBACK_MESSAGE_MIN) {
      setMessageError(`Add at least ${FEEDBACK_MESSAGE_MIN} characters so the note is actionable.`);
      valid = false;
    } else if (trimmedMessage.length > FEEDBACK_MESSAGE_MAX) {
      setMessageError(`Keep the note under ${FEEDBACK_MESSAGE_MAX} characters.`);
      valid = false;
    } else {
      setMessageError("");
    }

    if (!valid) return;

    setFormError("");
    setSending(true);
    try {
      const result = await sendFeedback({
        data: {
          category,
          subject: trimmedSubject,
          message: trimmedMessage,
          area,
          route,
          submissionId: submissionId.current,
          company,
        },
      });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      setReceipt({ delivery: result.data.delivery });
      if (result.data.delivery === "provider") {
        // The note is safely delivered; clear the fields but keep the same id until a new note starts.
        setSubject("");
        setMessage("");
      }
    } catch {
      setFormError("Something went wrong. Your note is still here — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (receipt) {
    const delivered = receipt.delivery === "provider";
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          {delivered ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <TriangleAlert className="h-4 w-4 text-amber-600" />
          )}
          {delivered ? "Thanks — your note was delivered" : "Saved to the local preview"}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">
          {delivered
            ? "Your note reached the product team with the category, subject, area, the page you were on, the time and a reference — and nothing else."
            : "This deployment has no delivery channel connected yet, so nothing left the server. The note is kept in memory for local testing only."}
        </p>
        <div className="mt-4">
          <Button variant="secondary" onClick={resetForAnother}>
            Write another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
      <div className="flex flex-wrap items-center gap-2">
        {channel === null ? (
          <Badge tone="outline">Checking channel...</Badge>
        ) : channel.state === "ready" && channel.provider === "github" ? (
          <Badge tone="green">
            <ShieldCheck className="h-3 w-3" /> Live
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
          Sent with your note: the category, subject, area, this page&rsquo;s path and the time.
          Nothing else.
        </span>
      </div>

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

      <Field
        label="Subject"
        htmlFor="feedback-subject"
        error={subjectError}
        hint="A short summary, for example “Course enrollment problem”."
        required
      >
        <Input
          id="feedback-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          invalid={Boolean(subjectError)}
          maxLength={FEEDBACK_SUBJECT_MAX}
          placeholder="What is this about?"
        />
      </Field>

      <Field label="Where is this about?" htmlFor="feedback-area">
        <Select
          id="feedback-area"
          value={area}
          onChange={(event) => setArea(event.target.value as FeedbackArea)}
        >
          {FEEDBACK_AREAS.map((value) => (
            <option key={value} value={value}>
              {FEEDBACK_AREA_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="What should we know?" htmlFor="feedback-message" error={messageError} required>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-28"
          invalid={Boolean(messageError)}
          maxLength={FEEDBACK_MESSAGE_MAX}
          placeholder="Describe the friction, what you expected, and what happened instead."
        />
      </Field>
      <p className="text-right text-xs text-slate-400">
        {trimmedMessage.length}/{FEEDBACK_MESSAGE_MAX}
      </p>

      {/* Honeypot: hidden from people, tempting to bots. Any value fails server validation. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="feedback-company">Company</label>
        <input
          id="feedback-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500">
          Do not include passwords, card numbers or private personal information.
        </p>
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
