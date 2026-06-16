# Polymeg

A private, Polymarket-style prediction-market app for you and your friends.
Create bets, buy into Yes/No (or multiple-choice) options with shekels, and when
a bet resolves the app works out **who owes whom**. No real money lives in the
app — you settle up between yourselves.

## How it works

- **Log in** by tapping your profile avatar and entering your 4-digit PIN.
- **Dashboard** shows every bet as a card with live pool percentages.
- **Create a bet**: title, resolution criteria, picture, options, minimum stake
  (₪), and a closing time.
- **Buy in**: pick an option and stake an amount (≥ the minimum).
- When the closing time passes the bet locks. The **creator resolves** it by
  picking the winning option.
- **Payout is parimutuel**: all stakes form one pot; winners split the pot in
  proportion to how much they staked on the winning option.
- **Settlement** nets every resolved bet into one balance per person and shows
  the minimal list of "X pays Y ₪" transfers.
- **Admin** (you) creates friends' accounts and their PINs.

## Tech

Next.js (App Router) · React · TypeScript · Tailwind CSS · Prisma · iron-session.
SQLite for local development, Postgres (Supabase) for production.

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

## Notes / possible next steps

- Images are stored as compact data URLs in the database — fine for a small
  group. Swap to Supabase Storage if you want larger images.
- Notifications are an in-app feed/bell. Supabase Realtime or web push could make
  them live.
