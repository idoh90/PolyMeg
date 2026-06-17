# Polymeg

A private, Polymarket-style prediction-market app for you and your friends.
Hebrew, right-to-left, mobile-first. Create bets, buy into Yes/No (or
multiple-choice) options with shekels, and when a bet resolves the app works out
**who owes whom**. No real money lives in the app — you settle up between
yourselves.

## How it works

- **Log in** by tapping your profile avatar and entering your 4-digit PIN.
- **הימורים (Markets)** — a feed of bet cards with a live ticker, a featured
  bet, search and filters; odds are shown Polymarket-style in ¢.
- **Place a bet** from the slide-up sheet: pick a side, type an amount (or use a
  quick chip), and see your potential payout before confirming.
- **Bet detail** — a big implied-probability number, a price-history chart, and
  buy buttons per option.
- **טבלה (Leaderboard)** — podium + ranked net P/L across resolved bets.
- **התיק (Portfolio)** — your net P/L, a value-over-time chart, open positions,
  history, and a trophies placeholder.
- **חשבון (Settlement)** — nets every resolved bet into one balance per person
  and shows the minimal list of "X pays Y ₪" transfers.
- The **creator resolves** a bet once it closes. **Payout is parimutuel**: all
  stakes form one pot; winners split it in proportion to their winning stake.
- **Admin** (you) creates friends' accounts and their PINs.

Bottom nav: Markets · Leaderboard · ( + new bet ) · Portfolio · Settlement.

## Tech

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Prisma ·
iron-session · Heebo font. SQLite for local development, Postgres (Supabase) for
production.

## Run it locally

```bash
npm install
cp .env.example .env        # then edit .env (a SESSION_SECRET is required)
npm run db:push             # create the SQLite database from the schema
npm run db:seed             # create the first admin account (Ido / PIN 1234)
npm run dev                 # http://localhost:3000
```

Log in as **Ido** (PIN **1234**), open **Admin**, and add your friends.

### Tests

```bash
npm test        # unit tests for the payout + settlement math
```

The money logic is in `src/lib/payout.ts` (parimutuel) and
`src/lib/settlement.ts` (who-pays-whom), each covered by unit tests, plus an
end-to-end script at `scripts/e2e.mjs` that drives the real API.

## Deploy (Supabase + Vercel)

You only need two free accounts: **Supabase** (database) and **Vercel** (hosting).

1. **Create a Supabase project.** In the dashboard go to *Project Settings →
   Database → Connection string → URI* and copy it (it looks like
   `postgresql://postgres:...@...supabase.com:5432/postgres`).

2. **Switch the schema to Postgres.** In `prisma/schema.prisma` change:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Push the schema to Supabase** (run locally with the Supabase URL):
   ```bash
   DATABASE_URL="<your-supabase-uri>" npx prisma db push
   DATABASE_URL="<your-supabase-uri>" npm run db:seed
   ```

4. **Deploy to Vercel.** Import the repo at vercel.com, and add two
   Environment Variables:
   - `DATABASE_URL` = your Supabase connection string
   - `SESSION_SECRET` = a long random string (≥ 32 chars)

   Deploy. Open the URL on your phone, log in, and add your friends from Admin.

## Demo / sample data

- `node scripts/demo-data.mjs` — fills the DB with sample bets so you can explore
  the UI (uses placeholder English content).
- `node scripts/clear-data.mjs` — wipes all bets/positions/notifications but
  keeps the user accounts. Run this before going live so you start clean.

## Notes / possible next steps

- Images are stored as compact data URLs in the database — fine for a small
  group. Swap to Supabase Storage if you want larger images.
- Notifications are an in-app feed/bell. Supabase Realtime or web push could make
  them live.
- The trophies section on the profile is a visual placeholder — the
  special-events/awards flow isn't wired up yet.
- Search and the chart timeframe controls are visual for now.
