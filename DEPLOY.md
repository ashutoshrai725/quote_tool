# Deploying Manuverse SpotOn

A step-by-step, crash-proof guide. Follow top to bottom.

> **Already done for you:**
> - ✅ Favicons added (`app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`) — auto-wired by Next.js.
> - ✅ Secret scrubbed from `.env.local.example` (so your token can't leak to GitHub).
> - ✅ Production build verified locally (`npm run build` passes).

---

## Step 1 — Verify the build locally (2 min)

If your dev server is running, stop it first (**Ctrl + C** in that terminal), then:

```bash
npm run build
```

You want it to end with **`✓ Compiled successfully`** and a route table. If it errors, the
message tells you the file/line — fix that before deploying. (It currently passes.)

Optional — preview the real production build:

```bash
npm start
```

Open http://localhost:3000, click through a quote, then **Ctrl + C** to stop.

---

## Step 2 — Push to GitHub

Make sure you have a [GitHub account](https://github.com) and [git installed](https://git-scm.com/downloads).

1. In the project folder (`C:\ff-tool`):

   ```bash
   git init
   git add .
   git commit -m "Manuverse SpotOn quote tool"
   ```

2. **Safety check** — confirm your secret file is NOT staged:

   ```bash
   git status
   ```

   You should **NOT** see `.env.local` in the list. (It's gitignored — good. You *will*
   see `.env.local.example`, which only has placeholders. That's fine.)

3. On github.com, click **New repository**. Name it (e.g. `manuverse-spoton`).
   **Do not** add a README, .gitignore, or license (keep it empty). Click **Create**.

4. Connect and push (copy the URL GitHub shows you):

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/manuverse-spoton.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3 — Deploy on Vercel (the easy part)

1. Go to [vercel.com](https://vercel.com) and **Sign in with GitHub**.
2. Click **Add New… → Project**.
3. Find your repo in the list and click **Import**.
4. Vercel auto-detects **Next.js** — leave all build settings as default.
5. **Before clicking Deploy**, expand **Environment Variables** and add these two
   (copy the values from your local `.env.local`):

   | Name | Value |
   | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | *(your bot token)* |
   | `TELEGRAM_CHAT_ID` | *(your chat id)* |

6. Click **Deploy**. Wait ~1–2 minutes.
7. You'll get a live URL like `https://manuverse-spoton.vercel.app`. 🎉

> From now on, every `git push` to `main` auto-deploys. No manual steps.

---

## Step 4 — Test the live site

1. Open your Vercel URL.
2. Submit a test quote.
3. Check Telegram — the enquiry should arrive from your bot within seconds.
4. Confirm the favicon shows in the browser tab.

**If the form submits but no Telegram message arrives:**
- Vercel → your project → **Settings → Environment Variables** — confirm both are set
  and spelled exactly right.
- After any env-var change you **must redeploy**: Vercel → **Deployments** →
  latest → **⋯ → Redeploy**.
- Check logs: Vercel → **Deployments** → latest → **Functions** tab → look at
  `/api/quote` for errors.

---

## Step 5 — Custom domain (optional)

Vercel → your project → **Settings → Domains** → add your domain and follow the DNS
instructions. HTTPS is automatic.

---

## "Nothing crashes" checklist

- ✅ `npm run build` passes locally before you push.
- ✅ `.env.local` is gitignored — never commit real tokens.
- ✅ Env vars are set **in Vercel** (the local `.env.local` is not uploaded).
- ✅ Env-var changes require a **redeploy** to take effect.
- ✅ `public/ports.json` is committed (the port autocomplete needs it).
- ✅ Node version: Vercel uses a modern Node automatically — compatible with this app.

---

## Recommended: rotate your bot token

Your token has been typed into chats/files during setup. To be safe, regenerate it:
**@BotFather → `/token` → pick your bot**. Then update it in **two** places — your local
`.env.local` and **Vercel → Settings → Environment Variables** — and redeploy.

---

## Regenerating data/icons (only if you change them)

These are committed, so you don't need to rerun them to deploy. Only if you update the
source files:

```bash
# Rebuild ports list from a new Excel:
npm i xlsx --no-save && node scripts/build-ports.mjs

# Rebuild favicons from app/icon.svg:
npm i sharp png-to-ico --no-save && node scripts/gen-icons.mjs
```
