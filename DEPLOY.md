# GRUbet — production cutover checklist

Goal: replace the live **Polymeg** app with **GRUbet**. The code is ready on the
`grubet` branch; everything below is dashboard/browser work (do it with cowork).
Do the steps **in order** — set env + DB first, flip the branch last, so prod
never boots without its config.

## 0. Decisions (locked)
- **Name**: **GruBet** (done in code).
- **Database**: reuse the existing Supabase project's **`grubet` schema**. Test
  data already wiped (groups/markets/bets/comments/notifications gone; the
  seeded `ido` + friends accounts kept — see step 4).
- **Cutover**: **flip the Vercel Production Branch to `grubet`** (method A). The
  old Polymeg stays on `main` + `public` schema and remains reachable (step 5).
- **Domain**: point the current domain at the GruBet project/branch.
- **Entry**: `/` redirects to `/login` (no marketing landing for now).

## 1. Google OAuth (console.cloud.google.com → APIs & Services → Credentials)
- Open the OAuth client (or create one, Web application).
- **Authorized JavaScript origins**: `https://<PROD_DOMAIN>`
- **Authorized redirect URIs**: `https://<PROD_DOMAIN>/api/auth/callback/google`
- Copy the Client ID + Client secret for step 3.

## 2. Supabase (the production database)
- Confirm the `grubet` schema exists and is exposed. Tables are created by
  `prisma db push` against the prod `DATABASE_URL` (run from a terminal that has
  that env, once, before launch).
- Use the **pooled** connection string (port 6543, `?pgbouncer=true`) and append
  `&schema=grubet`.

## 3. Vercel → Project → Settings → Environment Variables (Production)
Set these for **Production** (and Preview if you want a staging copy):
- `DATABASE_URL` = grubet pooled string, `…?pgbouncer=true&schema=grubet`
- `SESSION_SECRET` = 32+ char random
- `AUTH_SECRET` = 32+ char random
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` = from step 1
- `NEXT_PUBLIC_SITE_URL` = `https://<PROD_DOMAIN>` (needed for share/OG links)
- **Do NOT set** `ALLOW_DEBUG_LOGIN` (must stay off → 1234/0000 disabled publicly)

## 4. Launch data — already wiped
Test groups/markets/bets/comments/notifications were deleted from the `grubet`
schema. The seeded `ido` + friends accounts remain (used by the preview debug
picker; harmless in prod — they're in no group). Real users sign up via Google or
username. Nothing to do here unless you also want the seed accounts gone.

## 5. Flip production to GruBet (the switch — method A)
- Vercel → Settings → Git → **Production Branch** → change `main` → `grubet`,
  then redeploy.
- Roll back anytime by switching it back to `main`.
- Old Polymeg keeps living on `main` + the `public` schema (data untouched). To
  keep it reachable, leave `main` deployments on (its branch/preview URL still
  serves Polymeg); flipping the production branch only changes what the
  production domain serves.

## 6. Domain
If a custom domain points at this project it now serves GRUbet automatically.
Otherwise the prod URL is unchanged. Make sure it matches `NEXT_PUBLIC_SITE_URL`
and the Google redirect URI.

## 7. Smoke test prod
- `/` → `/login`. Sign up (username) and Google sign-in both work.
- Create a group → create a bet → place a bet.
- Open a bet → **שתף**; paste the `/b/<id>` link in WhatsApp → rich card shows.
- Settlement nudge, notifications, leaderboard all load. No 500s.

## Notes
- Env reference: see `.env.example`.
- Schema isolation is via `?schema=grubet` in `DATABASE_URL` only — no schema name
  is hardcoded, so pointing at a different DB/schema "just works".
- `npm run db:push` syncs the Prisma schema; `npm run db:seed:debug` seeds the
  debug roster (local/preview only).
