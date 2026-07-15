import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Lean feedback pipe: client -> this server function -> Telegram.
 * No database, no admin dashboard. TELEGRAM_BOT_TOKEN and
 * TELEGRAM_PRIVATE_CHAT_ID are read from server-side env vars only —
 * createServerFn strips this handler out of the client bundle, so the
 * token is never shipped to the browser.
 */

export const FEEDBACK_CATEGORIES = [
  "Bug Report",
  "Feature Request",
  "Improvement",
  "General Feedback",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

const feedbackSchema = z.object({
  name: z.string().trim().max(100).optional(),
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().trim().min(1, "Please write a message before sending.").max(2000),
  userLabel: z.string().trim().max(200).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

function formatTelegramMessage(data: FeedbackInput) {
  const timestamp = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return [
    "\uD83D\uDCE2 New Feedback",
    "",
    "Name:",
    data.name || "Anonymous",
    "",
    "Category:",
    data.category,
    "",
    "User:",
    data.userLabel || "Guest",
    "",
    "Message:",
    data.message,
    "",
    "Time:",
    timestamp,
  ].join("\n");
}

export const submitFeedback = createServerFn({ method: "POST" })
  .validator(feedbackSchema)
  .handler(async ({ data }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_PRIVATE_CHAT_ID;

    if (!token || !chatId) {
      console.error(
        "[feedback] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_PRIVATE_CHAT_ID env vars — feedback was not sent.",
      );
      throw new Error("Feedback service is not configured yet. Please try again later.");
    }

    let response: Response;
    try {
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatTelegramMessage(data),
        }),
      });
    } catch (err) {
      console.error("[feedback] Network error calling Telegram API:", err);
      throw new Error("Could not reach the feedback service. Please try again.");
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[feedback] Telegram API rejected the message:", response.status, errorBody);
      throw new Error("Could not deliver feedback right now. Please try again.");
    }

    return { success: true } as const;
  });
