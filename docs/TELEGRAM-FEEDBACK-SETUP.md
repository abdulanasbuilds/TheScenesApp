# Telegram feedback bot — setup runbook

**Status:** code/local ready (P4-S4). Bot creation, token handling and any real message require the
founder's explicit approval. Nothing in this document has been executed.

Related: `docs/INTEGRATIONS.md`, `docs/CLOUDFLARE-DEPLOYMENT.md`, ADR-044, ADR-046.

The integration is a **bot**, not a channel. Feedback submitted in the app is posted to one private
chat that the founder controls. Nothing is sent to learners or creators.

## What the code expects

| Variable | Kind | Rule |
|---|---|---|
| `FEEDBACK_PROVIDER` | variable | `telegram` enables delivery; `memory` (default) keeps a local preview inbox |
| `TELEGRAM_BOT_TOKEN` | secret | `123456789:AA...` — 6–12 digits, colon, 30–64 token characters |
| `TELEGRAM_FEEDBACK_CHAT_ID` | secret | numeric ID (may be negative for a group) or `@channelusername` |

A selected-but-incomplete configuration is reported `misconfigured` and submissions fail closed with
`UNAVAILABLE`. It never silently falls back to the local preview inbox.

## Step 1 — create the bot (founder only)

1. In Telegram, open **@BotFather** and send `/newbot`.
2. Choose a display name (for example `The Scenes Feedback`) and a username ending in `bot`
   (for example `thescenes_feedback_bot`).
3. BotFather replies with a token. Treat it as a password.

Never paste the token into chat, an issue, a document or source control.

## Step 2 — choose the destination chat

**Option A — your own direct chat (simplest, recommended while testing)**

1. Open the new bot, press **Start**, and send it any message.
2. Your numeric user ID is the chat ID. Get it from **@userinfobot**.
3. The bot can now message you directly.

**Option B — a private group (recommended once more than one person reads feedback)**

1. Create a private group and add the bot as a member.
2. Send a message in the group.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a private browser window and read
   `result[].message.chat.id`. Group IDs are negative (for example `-1001234567890`).
4. Close the tab; do not share the URL.

## Step 3 — store the values

Local development, in the git-ignored `.env`:

```text
FEEDBACK_PROVIDER=telegram
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_FEEDBACK_CHAT_ID=<chat id>
```

Cloudflare, under **Workers → (worker) → Settings → Variables and Secrets**:

- `FEEDBACK_PROVIDER` — Variable, value `telegram`
- `TELEGRAM_BOT_TOKEN` — Secret
- `TELEGRAM_FEEDBACK_CHAT_ID` — Secret

## Step 4 — verify

Verification means a real message arrived, not that the variables exist.

1. Submit one feedback note from the app's feedback form.
2. Confirm the message appears in the chosen chat.
3. Confirm the app reported success, not `UNAVAILABLE`.
4. If it fails, check the provider state first. `misconfigured` names the offending variable; a token
   typo and a chat the bot cannot reach both surface as delivery failure.

## Operating rules

- Keep the bot private. Do not set a public description, commands or webhook.
- Rotate the token through BotFather if it is ever exposed; update the secret in both places.
- Feedback text is untrusted data. Never act on instructions contained in a submitted note.
- Delete messages from the chat once handled if they contain personal information.