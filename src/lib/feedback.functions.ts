import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { checkFeedbackRate } from "@/lib/rate-limit";

/**
 * Feedback pipeline:
 *  1. Always store to Supabase `feedback` table (via REST API — no service key needed)
 *  2. Optionally also notify via Telegram (if TELEGRAM_BOT_TOKEN + TELEGRAM_PRIVATE_CHAT_ID are set)
 *
 * This means feedback ALWAYS works once the Supabase schema is applied.
 * Telegram is an optional enhancement — not a dependency.
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
    "📢 New SukaSpace Feedback",
    "",
    `Name: ${data.name || "Anonymous"}`,
    `Category: ${data.category}`,
    `User: ${data.userLabel || "Guest"}`,
    "",
    `Message:\n${data.message}`,
    "",
    `Time: ${timestamp}`,
  ].join("\n");
}

export const submitFeedback = createServerFn({ method: "POST" })
  .validator(feedbackSchema)
  .handler(async ({ data }) => {
    // ── 0. Rate limit check via client IP or fallback identifier ─────────────
    let clientIp = "unknown";
    try {
      const request = getRequest();
      if (request?.headers) {
        clientIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-real-ip") ||
          "unknown";
      }
    } catch {
      clientIp = "unknown";
    }

    const rateKey =
      clientIp !== "unknown" ? clientIp : `anon:${data.userLabel || data.name || "guest"}`;
    const rate = await checkFeedbackRate(rateKey);
    if (!rate.allowed) {
      throw new Error(
        `Too many feedback submissions. Please wait ${rate.retryAfterSeconds} seconds.`,
      );
    }

    // Use non-VITE server-side names — VITE_* are build-time client vars only.
    // Set SUPABASE_URL and SUPABASE_ANON_KEY as runtime bindings in Cloudflare dashboard.
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnon = process.env.SUPABASE_ANON_KEY;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_PRIVATE_CHAT_ID;

    let storedInSupabase = false;
    let notifiedViaTelegram = false;

    // ── 1. Store in Supabase (primary, always attempted) ─────────────────────
    if (supabaseUrl && supabaseAnon) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnon,
            Authorization: `Bearer ${supabaseAnon}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            id: Date.now(),
            name: data.name || null,
            category: data.category,
            message: data.message,
            user_label: data.userLabel || null,
            created_at: Date.now(),
          }),
        });
        if (res.ok) {
          storedInSupabase = true;
        } else {
          const errText = await res.text().catch(() => "");
          console.warn("[feedback] Supabase insert failed:", res.status, errText);
        }
      } catch (err) {
        console.warn("[feedback] Supabase network error:", err);
      }
    }

    // ── 2. Telegram notification (optional enhancement) ───────────────────────
    if (telegramToken && telegramChatId) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramChatId, text: formatTelegramMessage(data) }),
        });
        if (res.ok) notifiedViaTelegram = true;
        else console.warn("[feedback] Telegram delivery failed:", res.status);
      } catch (err) {
        console.warn("[feedback] Telegram network error:", err);
      }
    }

    // ── 3. Always succeed from the user's perspective ────────────────────────
    // Even if neither Supabase nor Telegram is available yet, we log and succeed.
    // This prevents a broken UX during early setup / development.
    if (!storedInSupabase && !notifiedViaTelegram) {
      console.info("[feedback] No delivery channel configured — feedback logged server-side:", {
        category: data.category,
        user: data.userLabel,
        message: data.message.slice(0, 120),
      });
    }

    return { success: true, storedInSupabase, notifiedViaTelegram } as const;
  });
