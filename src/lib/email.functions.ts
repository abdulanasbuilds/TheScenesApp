import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Transactional email via Resend.
 * Set RESEND_API_KEY (server-only) and optionally RESEND_FROM_EMAIL.
 * All handlers silently log and continue when the key is absent —
 * email is best-effort, never blocking.
 */

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured — skipping email to", to);
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "SukaSpace <noreply@sukaspace.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend API error:", res.status, body);
    }
  } catch (err) {
    console.error("[email] Network error sending email:", err);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #1D4ED8; padding: 28px 32px; }
  .logo { color: #fff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .body { padding: 28px 32px; color: #1e293b; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #0f172a; }
  p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #475569; }
  .btn { display: inline-block; background: #1D4ED8; color: #fff; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 8px 0 20px; }
  .badge { display: inline-block; background: #eff6ff; color: #1D4ED8; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 100px; }
  .footer { padding: 16px 32px 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
</style></head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">SukaSpace</div></div>
  <div class="body">${content}</div>
  <div class="footer">You're receiving this because you have an account on SukaSpace. &copy; 2025 SukaSpace.</div>
</div>
</body>
</html>`;
}

// ─── Server Functions ──────────────────────────────────────────────────────────

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), name: z.string() }))
  .handler(async ({ data }) => {
    await sendEmail(
      data.email,
      "Welcome to SukaSpace 🎉",
      base(`
        <h1>Hey ${data.name}, welcome aboard!</h1>
        <p>You're now part of SukaSpace — the platform where tech creators build communities, publish courses, and grow their audience.</p>
        <p>Here's what you can do right now:</p>
        <ul style="padding-left:20px;color:#475569;line-height:2">
          <li>Discover and join communities in your niche</li>
          <li>Enroll in courses from expert creators</li>
          <li>Launch your own community and start earning</li>
        </ul>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/discover" class="btn">Explore communities →</a>
        <p style="font-size:13px;color:#94a3b8">Questions? Reply to this email — we're always around.</p>
      `),
    );
    return { sent: true } as const;
  });

export const sendWithdrawalFailedEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      amountDisplay: z.string(),
      reason: z.string(),
      withdrawalId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await sendEmail(
      data.email,
      `⚠️ Withdrawal Settlement Failed — Action Required`,
      base(`
        <h1>Withdrawal failed</h1>
        <p>Your withdrawal request of <strong>${data.amountDisplay}</strong> (ID: ${data.withdrawalId}) could not be completed by our payment processor.</p>
        <div style="background:#fff1f2; border:1px solid #fecdd3; padding:16px; border-radius:8px; margin:16px 0; color:#9f1239;">
          <strong>Reason reported:</strong> ${data.reason}
        </div>
        <p>Your withdrawal amount has been fully restored to your available earnings balance. Please verify your banking details in settings and try again.</p>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/app/settings" class="btn">Update payout settings →</a>
      `),
    );
    return { sent: true } as const;
  });

export const sendSubscriptionPastDueEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      planName: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await sendEmail(
      data.email,
      `⚠️ Payment Past Due — SukaSpace Pro Subscription`,
      base(`
        <h1>Your subscription payment failed</h1>
        <p>Our payment system was unable to process your renewal payment for your <strong>SukaSpace ${data.planName}</strong> plan.</p>
        <p>Please update your billing card details as soon as possible to avoid losing access to high-speed R2 hosted file downloads, video streaming features, and 3% lower platform commission fees.</p>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/app/settings" class="btn">Update Billing Details →</a>
      `),
    );
    return { sent: true } as const;
  });

export const sendStorageQuotaWarningEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      usedPercent: z.number(),
      usedDisplay: z.string(),
      quotaDisplay: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await sendEmail(
      data.email,
      `⚠️ Storage Quota Warning — SukaSpace`,
      base(`
        <h1>You are running out of storage space</h1>
        <p>This is an automated warning that your hosted creator storage is currently at <strong>${data.usedPercent}% capacity</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:8px 0;color:#64748b">Storage Used</td><td style="padding:8px 0;text-align:right;font-weight:600">${data.usedDisplay}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Total Quota</td><td style="padding:8px 0;text-align:right;font-weight:600">${data.quotaDisplay}</td></tr>
        </table>
        <p>If you reach 100% capacity, learners will still be able to access existing files, but you will not be able to upload any new resource PDFs or stream videos until you free up space or contact us to expand your custom quota.</p>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/app/settings" class="btn">Manage Storage settings →</a>
      `),
    );
    return { sent: true } as const;
  });

export const sendEnrollmentEmail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), name: z.string(), courseTitle: z.string() }))
  .handler(async ({ data }) => {
    await sendEmail(
      data.email,
      `You're enrolled in "${data.courseTitle}" 🎓`,
      base(`
        <h1>Enrollment confirmed!</h1>
        <p>Hey ${data.name}, you're now enrolled in:</p>
        <p><span class="badge">${data.courseTitle}</span></p>
        <p>Head to your Classroom to start learning at your own pace. Your progress is saved automatically.</p>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/app/classroom" class="btn">Open Classroom →</a>
        <p style="font-size:13px;color:#94a3b8">You'll receive a summary when you complete the course.</p>
      `),
    );
    return { sent: true } as const;
  });

export const sendCommunityJoinEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      name: z.string(),
      communityTitle: z.string(),
      communityTag: z.enum(["FREE", "PAID"]),
    }),
  )
  .handler(async ({ data }) => {
    const tagLine =
      data.communityTag === "PAID"
        ? "Your payment was confirmed and your access is now active."
        : "Access is free — you're all set.";
    await sendEmail(
      data.email,
      `You joined "${data.communityTitle}" on SukaSpace`,
      base(`
        <h1>You're in! 🚀</h1>
        <p>Hey ${data.name}, you've just joined <strong>${data.communityTitle}</strong>.</p>
        <p>${tagLine}</p>
        <p>Check out the community feed, introduce yourself, and connect with other members.</p>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/app/feed" class="btn">Go to community →</a>
      `),
    );
    return { sent: true } as const;
  });

export const sendPaymentReceiptEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      name: z.string(),
      communityTitle: z.string(),
      amountDisplay: z.string(),
      reference: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await sendEmail(
      data.email,
      `Payment confirmed — ${data.communityTitle}`,
      base(`
        <h1>Payment confirmed ✅</h1>
        <p>Hey ${data.name}, your payment for <strong>${data.communityTitle}</strong> was successful.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:8px 0;color:#64748b">Community</td><td style="padding:8px 0;text-align:right;font-weight:600">${data.communityTitle}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Amount</td><td style="padding:8px 0;text-align:right;font-weight:600">${data.amountDisplay}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Reference</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px">${data.reference}</td></tr>
        </table>
        <a href="${process.env.APP_URL || "https://sukaspace.com"}/app/feed" class="btn">Go to community →</a>
      `),
    );
    return { sent: true } as const;
  });
