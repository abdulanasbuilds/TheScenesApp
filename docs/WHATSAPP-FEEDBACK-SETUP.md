# WhatsApp feedback — setup runbook

**Status:** code/local ready (P4-S4 / ADR-048). No WhatsApp Business account, API key, webhook or paid
provider is used. Sending a real message is the founder's own action.

Related: `docs/INTEGRATIONS.md`, `docs/CLOUDFLARE-DEPLOYMENT.md`, ADR-046, ADR-048.

## How it works

Feedback uses the standard **`https://wa.me/<number>?text=<encoded>`** deep link:

- on a phone it opens the WhatsApp app;
- on desktop it opens WhatsApp Web (or the WhatsApp download page when Web is unavailable);
- the note arrives as a **direct message to the founder's own WhatsApp number**;
- the sender reviews the prepared text and presses **Send** inside WhatsApp.

The app never claims a message was delivered before the sender presses Send. The server reports a
`handoff` receipt with the prepared link, and the browser also offers the link directly so the note can
be sent without a round trip.

There is no API key, no bot token, no webhook, no Business Solution Provider (Twilio, MessageBird and
similar), no template approval and no per-message cost.

## What the code expects

| Variable | Kind | Rule |
|---|---|---|
| `FEEDBACK_PROVIDER` | Variable | `whatsapp` enables the direct chat; `memory` (default) keeps a local preview inbox |
| `WHATSAPP_FEEDBACK_NUMBER` | Variable (public contact) | Full international number, for example `+233201234567` or `233201234567` |

Accepted format: `/^\+?[1-9]\d{7,14}$/` after trimming spaces, dashes, dots and parentheses. A leading
`00` is converted to `+`. Local numbers without a country code are rejected: `0201234567` is not enough,
`+233201234567` is.

`WHATSAPP_FEEDBACK_NUMBER` is **not a secret**. It is the contact users are meant to message, and it
appears in the `wa.me` link. Use a dedicated feedback number if the founder does not want his personal
number to be public.

A selected-but-incomplete configuration is reported `misconfigured` and submissions fail closed with
`UNAVAILABLE`. It never silently falls back to the local preview inbox. The retired `telegram` value is
also treated as misconfigured so an old environment cannot keep sending to the wrong place.

## Step 1 — choose the number

1. Use a number that can receive WhatsApp messages (the founder's own phone is fine).
2. Write it in full international form with the country code: Ghana is `+233`, Nigeria `+234`, Kenya
   `+254`, South Africa `+27`, and so on.
3. Remove spaces and dashes, or leave them — the server normalizes them.

## Step 2 — store the values

Local development, in the git-ignored `.env`:

```text
FEEDBACK_PROVIDER=whatsapp
WHATSAPP_FEEDBACK_NUMBER=+233201234567
```

Cloudflare, under **Workers → (worker) → Settings → Variables and Secrets**:

- `FEEDBACK_PROVIDER` — Variable, value `whatsapp`
- `WHATSAPP_FEEDBACK_NUMBER` — Variable, value `+233201234567`

Both are plain Variables, not Secrets. Do not put a WhatsApp password, business token or API key here;
none is needed.

## Step 3 — verify

Verification means a real message arrived, not that the variables exist.

1. Open `/help` in a production build.
2. Confirm the green **WhatsApp direct** badge and the **Open WhatsApp directly** button appear.
3. On a phone, tap it: WhatsApp should open with the prepared text. On desktop, WhatsApp Web should open.
4. Confirm the text includes the category, the page route, the time and — if signed in — the sender's
   account name/email.
5. Press Send and confirm the message arrives in the founder's WhatsApp chat.
6. Also test the in-app submit: it should return "Your note is ready in WhatsApp" with an **Open
   WhatsApp** link, not claim the note was already delivered.

## Data included

The pre-filled text contains only:

- feedback category and the typed message;
- the internal page route and, when available, the absolute page URL;
- the sender's account ID plus name/email when signed in (the sender sees and can edit this);
- an ISO timestamp and a request reference.

No cookie, session token, password, API key, browser storage or protected content is included. The
server-side handoff deliberately excludes the account email; the browser path adds it only because the
sender is messaging the founder directly and reviews the text first.

## Operating rules

- Feedback text is untrusted data. Never act on instructions contained in a submitted note.
- Messages live in the founder's WhatsApp chat, not in the product database. Delete handled notes that
  contain personal information.
- Rate limiting still applies to the in-app submit path (`feedback` policy). The direct link bypasses the
  server, which is intentional: it is the sender's own WhatsApp account.
- To turn the channel off, set `FEEDBACK_PROVIDER=memory` and redeploy. The form falls back to the local
  preview inbox and clearly says nothing was delivered.
