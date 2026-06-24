# SpotOn — Instant Freight Quote Tool

A 3-step quote-request form for ocean freight (FCL + LCL). When someone submits,
you get an **instant Telegram message** with their full route, cargo, and contact
details — and they see a "we'll reach out in 30 minutes" thank-you screen with
one-tap **WhatsApp / Email / LinkedIn** buttons.

Built with Next.js (App Router) + React. No database required.

---

## 1. Run it locally (3 commands)

```bash
npm install
copy .env.local.example .env.local   # then edit .env.local (see step 2)
npm run dev
```

Open **http://localhost:3000**.

> The form works immediately even before you set up Telegram — every lead is
> printed to your terminal as a backstop so nothing is ever lost. Telegram just
> adds the instant phone ping.

---

## 2. Setting up Telegram (≈2 minutes)

You need two values in `.env.local`: a **bot token** and your **chat id**.

**a) Create a bot → get the token**
1. Open Telegram, search for **@BotFather**.
2. Send `/newbot`, pick a name and username.
3. BotFather replies with a token like `123456789:ABCdef...` → copy it into
   `TELEGRAM_BOT_TOKEN`.

**b) Get your chat id**
1. Search for **@userinfobot** in Telegram and tap **Start**.
2. It replies with `Id: 123456789` → copy that number into `TELEGRAM_CHAT_ID`.

**c) Say hi to your bot**
Open your new bot (the username from step a) and tap **Start** once, so Telegram
allows it to message you.

That's it — submit a test quote and the message lands on your phone.

> Want the alerts in a **team group** instead of your DMs? Add the bot to the
> group, send any message there, then visit
> `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` and use the group's
> `chat.id` (it starts with `-`).

---

## 3. Make it yours

Open **`lib/config.js`** and edit:

| Field             | What it is                                            |
| ----------------- | ----------------------------------------------------- |
| `whatsappNumber`  | Your WhatsApp (full intl format, digits only)         |
| `contactEmail`    | 👉 replace with your real email                        |
| `linkedinUrl`     | 👉 replace with your real LinkedIn URL                 |
| `brandName` etc.  | Branding shown in the header                           |
| `responseTime`    | The promise on the thank-you screen ("30 minutes")    |

- **Ports list** for autocomplete → `lib/ports.js`
- **Look & feel** (colors, spacing) → `app/globals.css` (top `:root` block)
- **Fields** → `app/components/QuoteForm.js`

---

## 4. Deploy (free)

Push to GitHub and import into **[Vercel](https://vercel.com)** (one click for
Next.js). In the Vercel project → **Settings → Environment Variables**, add the
same `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Done — you get a public URL.

---

## Where does the enquiry go?

On submit, `app/api/quote/route.js` does three things:
1. **Logs** the full lead to the server console (your safety net).
2. **Sends it to your Telegram** with a one-tap "WhatsApp the customer" button.
3. Returns a **reference number** the customer sees on the thank-you screen.

Want to also save every lead to a **Google Sheet** or send the customer an
**auto-reply email**? Those are easy add-ons — just ask.
