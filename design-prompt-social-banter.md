# Design prompt — GruBet "Social & Banter Layer"

*Paste everything below the line into Claude (or your design tool). It's self-contained: product context, the exact existing design system, feature-by-feature briefs, the screens to produce, and sample data. Tweak the "What to deliver" block if you want fewer screens or a different format.*

---

You are a **senior product designer**. Design the **UI for the new "Social & Banter" layer** of an app called **GruBet** (working name; also referred to as GruMark). Produce **high-fidelity, mobile-first, interactive mockups as a single self-contained HTML file using Tailwind via CDN** (no build step, no external assets except Google Fonts + emoji). The mockups must look like they belong in the *existing* app — match the design system below exactly. Show **realistic Hebrew content and every important state**, not lorem ipsum.

## The product (context you must internalize)
GruBet is a **mobile prediction-market app for private friend groups**. Friends create a community, post yes/no or multi-option bets **about each other and their world** ("will Yanai show up late?", "will X and Y become a couple?", "who pays for pizza?"), stake **real shekels (₪)**, and an admin resolves the outcome. It's **parimutuel**: all stakes go into one pot and winners split it — there is no "share price." Money is settled **peer-to-peer off-app** (Splitwise-style "who owes whom").

The vibe is **irreverent, fast, funny, friend-group banter** — closer to a group chat than to a Bloomberg terminal. The whole reason this section exists is that *the conversation around a bet is the actual product*. Design for **laughs, roasts, and bragging rights.**

## Hard design-system constraints (match these precisely)
- **Mobile-first.** Frame everything in a phone-width column, **max-width 480px**, centered, app-like. Assume iOS/Android, no desktop chrome.
- **Language: Hebrew, fully RTL.** All layout mirrored right-to-left. Numbers/₪ and Latin names (Ido, Yanai) sit correctly within RTL text (`dir="auto"` behavior). Get RTL right — it's the #1 way to look wrong.
- **Font:** `Heebo` (Google Fonts), weights 400/600/700/800. Lots of bold.
- **Color tokens (light theme — also define a dark variant):**
  - `--bg:#f4f5f8` · `--surface:#ffffff` · `--surface-2:#f1f3f7` · `--border:#e9ebf1`
  - `--text:#0f1320` · `--muted:#737b8c` · `--faint:#9aa1b1`
  - `--accent:#2b6ef2` · `--accent-soft:#e9f0fe`
  - **Yes/win:** `--yes:#15b87a` on `--yes-b:#e6f6ef`
  - **No/lose:** `--no:#f0405a` on `--no-b:#fdebee`
- **Shape & feel:** cards radius ~18px, buttons/inputs radius ~14px, chips fully rounded (pills). Soft shadows (`0 1px 2px rgba(15,19,32,.03)`). Tactile press (active state scales to ~0.96). Hidden scrollbars. Bottom sheets **rise from the bottom** with a grab handle.
- **Existing components to stay consistent with:** market cards, a **bottom sheet** for placing bets, a bet-detail screen (big % + probability chart + activity list), a **bottom nav of 5 items with a center "+" FAB**, a horizontal **live ticker**, circular **avatars** showing a name initial on a colored fill, emoji "tiles," pill filter chips, segmented toggles.
- **Tone of copy:** Hebrew, casual and playful. Short. Banter-forward (e.g. a roast card, a "call your shot" prompt).

## Reuse, don't reinvent
These features live **inside existing screens** (mainly the **bet-detail** screen and the **News/activity feed**) plus a few new surfaces. Keep the existing visual language; you're adding a social layer, not redesigning the app.

---

## Build scope for THIS round (IMPORTANT — engineering has already started)
Engineering is building a **narrower** slice than the full 8 below, on these exact React components. **Design these, and name each screen/section after the real component** so design and code line up (full engineering spec is at the bottom of this file — where it differs from the briefs, the spec wins):

| Design this | Real component / file | Notes |
|---|---|---|
| Comments thread + composer + `@mention` | `CommentThread.tsx` (rendered in `bets/[id]/page.tsx`) | one reply level deep |
| Position badge on each comment | inside `CommentThread.tsx` | exact format **`עידו · ₪20 · לא`**, colored by side |
| Reactions 🔥😂💀🤡 on comments | inside `CommentThread.tsx` | toggle pills + add-reaction popover |
| Reactions on a specific stake | `PositionReactions.tsx` (in detail activity rows) | same 4 emoji only |
| Trash-talk bar (emoji + preset Hebrew lines) | `TrashTalkBar.tsx` (inside `BetSheet.tsx` place step) | **no GIFs**; the `shout` rides with the position and shows as a chip in the activity list |
| "Called it" + roast receipt cards | `CalledItCard.tsx` (top of a RESOLVED detail) | in-app card + **native share (text + link)**, **no PNG export** |
| Social notifications | `notifications/page.tsx` | new types: COMMENT 💬, MENTION @, POSITION_REACTION 🔥, BET_AGAINST ⚔️ |

**The reaction set is exactly 🔥 😂 💀 🤡.** Comments are **per-market threads only**.

**Deferred — do NOT design this round:** 1v1 head-to-head duels, group-wide chat tab, GIF picker, downloadable/PNG image receipts, and the "market about you" consent card.

The 8 briefs below remain as design reference. Apply the scope above to them: design only the **per-market comment thread** part of #7, **drop the GIF picker** from #4, **drop PNG export** from #5, and **skip #6 (duels)** and the consent card in #8 entirely.

## The features to design (reference briefs — apply the scope above)

**1. Comments on every market (threaded + reactions).**
- Lives at the bottom of the **bet-detail** screen and as a standalone expanded thread.
- Show: a comment composer (avatar + input + emoji button + send), sort toggle (newest / top), comment rows with avatar, name, time-ago, body, a heart/like count, an emoji-reaction row, and a "reply" affordance with nested replies (1 level deep).
- States: empty ("be the first to talk trash"), a lively thread, a long thread with collapsed replies, your own comment (editable), a deleted/removed comment.

**2. Position badges on comments.**
- Next to each commenter's name, a small badge showing **their actual stake on this market**, e.g. `עידו · ₪20 על לא` (Ido · ₪20 on "No"), color-coded with the yes/no/accent palette. People with no position show nothing (or a subtle "צופה" / watching tag).
- Make it glanceable so you instantly see who's *talking their book*. Show a yes-holder and a no-holder arguing in the sample thread.

**3. Reactions / emoji on bets and on specific stakes.**
- Two levels: react to the **market** itself, and react to **a specific person's position** in the activity list (e.g. tap Yanai's "₪50 on himself" → 🔥😂💀🤡 fly up).
- Design the reaction picker (quick bar of 4–6 emoji + "more"), the reaction count chips that accumulate, and the "+1" animation moment.

**4. Trash-talk prompts & GIFs ("call your shot").**
- Right after someone places a bet (in the bet-success state of the bottom sheet), show a **"call your shot" quick-reaction bar**: a few one-tap trash-talk phrases in Hebrew + an optional **GIF picker**.
- Design: the post-bet sheet with the prompt, the phrase chips, the GIF picker grid, and how the resulting "shot" appears in the thread/feed.

**5. "Called it" receipts (auto-generated share cards).**
- When a market resolves, auto-generate **two shareable cards**: a **winner/"called it" card** ("עידו צדק — ‎+₪20 🎯") and a **roast card** for whoever was most wrong ("ינאי הימר ₪50 על עצמו… וטעה 💀").
- Design these as **beautiful, share-ready cards** (think WhatsApp/Instagram-story friendly), plus the in-app moment that offers "share" / "save image." Use the dark gradient style the app already uses for hero/preview cards.

**6. Head-to-head challenges (1v1 duels).**
- A direct bet between two people that **doesn't need a pool**: "אני מהמר איתך ₪50 שלא תלך לחדר כושר 5 פעמים השבוע."
- Design: a **create-duel flow** (pick a friend, the claim, the stake, the deadline), the **duel card** (two avatars vs. each other, the wager, accept/decline), the **pending/accepted/active/resolved** states, and a **head-to-head record** ("עידו 3 — 1 ינאי").

**7. Group chat / per-market chat.**
- A lightweight chat so banter stays in-app instead of WhatsApp. Two contexts: a **per-market thread** (tab on bet-detail) and a **group-wide chat** surface.
- Design: a clean chat view (bubbles, RTL, avatars, timestamps, system messages like "ינאי הימר ₪10 על כן" inline), composer with emoji/GIF, and how a bet/market can be **shared into chat as a rich card**.

**8. @mentions + notifications + "consent" heads-up for markets about a member.**
- **@mention** autocomplete in composers; mentioned user gets notified.
- Design the **notifications list** with social types: "ינאי הימר נגדך", "תויגת בהימור", "הגיבו לך", plus a **"market about you" heads-up**: when a market names a member, that member gets a friendly card — "נפתח הימור עליך 👀" — with a one-tap **react** (😎 / 😅 / 🙄) instead of a takedown. Show this as a turn-privacy-into-engagement moment, not a warning.

---

## What to deliver
A single HTML file rendering these screens as a **scrollable gallery of phone frames** (each ~390–430px wide), labeled in Hebrew, in this order (named after the real components):

1. **`bets/[id]` detail with `CommentThread`** (lively state) — threaded comments, position badges (`עידו · ₪20 · לא`), comment reactions 🔥😂💀🤡
2. **`CommentThread` composer close-up** — `@mention` autocomplete from group members, reaction popover, reply, delete (own/admin)
3. **`PositionReactions` on an activity row** — 🔥😂💀🤡 toggle on a specific stake, with the `shout` chip shown next to the position
4. **`TrashTalkBar` inside `BetSheet`** — emoji + preset Hebrew lines ("קראתי את זה", "קל") at the place step, no GIF; show how the chosen `shout` then appears in activity
5. **`CalledItCard`** — winner card (accent/green) + roast card (red) for a resolved market, each with a native **share** button (text + link)
6. **`notifications/page` social types** — COMMENT 💬, MENTION @, POSITION_REACTION 🔥, BET_AGAINST ⚔️ (deep-link to the market)

Also include a **light + dark** version of at least the `CommentThread` screen and the `CalledItCard`.

### Realistic sample data to use
- Group: **"גיימרים ערב"** (Gamers Night). Members: **עידו, ינאי, עומרי, אופק, אייל, אלעד, ליעד**.
- Example market: **"מי ישכב עם השותפה שלו לדירה?"** (multi-option) and a binary **"נצא למסיבה בסופ״ש?"**, pot **₪80**, 7 bettors.
- Example positions/comments showing a `כן` holder and a `לא` holder roasting each other; one person who bet **on themselves**; one **resolved** market for the receipt cards.
- Currency is **₪**, times in Hebrew relative form ("לפני 5 דק׳", "לפני שעה").

## Principles & guardrails
- **RTL-correct and Hebrew-native** everywhere; mirror icons/arrows.
- **Banter-forward but not mean by default** — make the roast playful; include the consent/react path.
- **Glanceable position badges** are the signature detail — make them unmistakable.
- **Reuse existing patterns** (bottom sheets, pills, avatars, dark gradient hero cards, tactile press). Don't introduce a new visual language.
- **Dark-mode-ready** token usage from the start.
- Keep it **fast and thumb-reachable** — primary actions in the bottom third.
- Annotate each frame with a one-line note on the interaction/animation intent.

Return the complete HTML in one code block, ready to open in a browser.

---

# Engineering spec (SOURCE OF TRUTH — what code is building right now)
*Added so the design's component names, data fields, and scope match the in-progress implementation. Where the design briefs above and this spec disagree, **this wins.** Component names to design against: `CommentThread.tsx`, `PositionReactions.tsx`, `TrashTalkBar.tsx`, `CalledItCard.tsx`, plus additions to `bets/[id]/page.tsx`, `BetSheet.tsx`, and `notifications/page.tsx`.*

# GRUbet — social & banter layer (feature set A)
## Context
GRUbet works (multi-tenant betting groups, full prototype UI, Google + debug auth). The conversation today lives in WhatsApp, not the app. Feature set A adds the **social/banter layer** that keeps friends arguing inside GRUbet — the moat. The prototype has **no** social UI, so this is net-new, built in the existing GRUbet visual language (Tailwind arbitrary values, CSS-var tokens, RTL logical props, `pressable`/`pm-*` animations) on the isolated **grubet** Postgres schema only.
**Confirmed scope (this round):** core social loop **+ "Called it" receipts**.
- Comments: **per-market threads only** (no separate group-chat tab).
- Trash-talk: **emoji + preset Hebrew lines**, no GIFs / no external service.
- Receipts: **in-app card + native share** (`navigator.share` text+link), no PNG export.
- **Deferred to later phases:** 1v1 head-to-head duels, group-wide chat tab, GIF picker, downloadable image receipts.
## What ships
1. **Threaded comments** on each market (one reply level), with author + time.
2. **Position badges on comments** — next to each commenter, their stake in *this* market ("עידו · ₪20 · לא"), colored by side.
3. **Reactions** (🔥😂💀🤡) on comments **and** on a specific position/stake in the activity list.
4. **Trash-talk bar** in the bet sheet — emoji + canned lines ("קראתי את זה", "קל"); the chosen `shout` rides along with the position and shows in activity.
5. **@mentions** in comments (autocomplete from group members) + the notification web: comment-on-your-market, reply-to-you, mention, reaction-on-your-stake, **bet-against-you**.
6. **"Called it" receipts** — on a resolved market, an in-app card for the biggest winner + a roast card for the most-wrong, each with a native **share** button.
## Schema (`prisma/schema.prisma`, grubet schema → `prisma db push` + generate)
- **Comment**: `id, marketId (→Market, cascade), userId (→User), parentId String?` (self-relation, one level), `body String`, `mentions String[] @default([])` (userIds), `createdAt`. `@@index([marketId])`.
- **Reaction**: `id, userId, emoji String, commentId String?` (→Comment, cascade), `positionId String?` (→Position, cascade), `createdAt`. Two uniques: `@@unique([userId, commentId, emoji])`, `@@unique([userId, positionId, emoji])` (the null-bearing one never false-blocks the other target). Toggling handled in the API.
- **Position** += `shout String?` (trash-talk line/emoji attached at placement).
- Back-relations on `User` (`comments`, `reactions`), `Market` (`comments`), `Position` (`reactions`), `Comment` (`reactions`, `children`/`parent`).
- **No native enums** — extend `NotificationType` in `src/lib/constants.ts`: `COMMENT`, `MENTION`, `POSITION_REACTION`, `BET_AGAINST` (keep existing).
## APIs (mirror existing route style: `getCurrentUser` + `getMembership` ACTIVE check, Hebrew errors)
- `POST /api/markets/[id]/comments` — `{ body, parentId? }`. Validate membership + body length. Parse `@handle` mentions against group members (username/displayName) → `mentions[]`. Create comment; fan out notifications: market creator (COMMENT, if not self), parent author (COMMENT/reply, if not self), each mentioned user (MENTION). Reuse the `prisma.notification.createMany` pattern already in `api/markets/[id]/positions/route.ts`.
- `DELETE /api/comments/[id]` — author or group admin (`isAdminRole`).
- `POST /api/reactions` — `{ commentId? | positionId?, emoji }`. Toggle (delete if the unique row exists, else create). Notify the target's owner (POSITION_REACTION for a stake, comment-reaction for a comment) when not self. Emoji must be in an allowlist.
- Extend `POST /api/markets/[id]/positions` — accept optional `shout` (≤40 chars, from preset list or trimmed freeform) → store on `Position`. Add a **BET_AGAINST** notification to users holding a *different* option in that market ("X הימר נגדך"), alongside the existing BET_PLACED fan-out.
## Libs
- New `src/lib/comments.ts` — `getMarketComments(marketId)`: comments + author, grouped reactions (`{emoji,count,mine}`), threaded (parent→children), and each author's **position-in-this-market** badge (side label + amount) derived from `market.positions`. Reuse `sideKind` (`lib/markets.ts`), `formatAgorot` (`lib/money.ts`), `timeUntil` (`lib/format.ts`).
- New `src/lib/social.ts` — `parseMentions(body, members)`, `REACTION_EMOJI` + `TRASH_TALK_LINES` constants, `groupReactions(rows, myId)`.
- New `src/lib/receipts.ts` — `getReceipt(marketId)`: from resolved market positions + payouts (reuse `poolFor`/`computePayouts` already used by leaderboard) compute biggest winner (max profit) + most-wrong (biggest loss on the losing side). Returns names, amounts, side labels.
## UI (all in existing style; client islands where interactive)
- **`bets/[id]/page.tsx`** (detail): add a **Comments** section below activity — render `CommentThread`. Add per-position **reaction bar** + `shout` chip in the existing activity rows. When `status === RESOLVED`, render the **CalledItCard(s)** near the top.
- New **`CommentThread.tsx`** (client): thread list + composer with `@mention` autocomplete (members passed from server), optimistic add, reaction pills + add-reaction popover, position badge per author, reply + delete (own/admin). Reuse `Avatar`.
- New **`PositionReactions.tsx`** (client): 🔥😂💀🤡 toggle bar on a position row (used in detail activity); calls `/api/reactions`.
- New **`TrashTalkBar.tsx`**: inside `BetSheet.tsx` place step — emoji + preset-line chips; selected value sent as `shout` with the position.
- New **`CalledItCard.tsx`** (client): win card (accent/green) + roast card (red), `navigator.share` button (fallback: copy text). Pure presentational over `getReceipt` data.
- **`notifications/page.tsx`**: add icon tiles for new types — COMMENT 💬, MENTION (@ glyph), POSITION_REACTION 🔥, BET_AGAINST ⚔️ (extend the existing `NOTIF` map).
- Detail comment notifications deep-link via existing `marketId` → `/g/[groupId]/bets/[marketId]`.
## Permissions / scoping
ACTIVE membership required to comment/react (reuse `getMembership`). Everything stays group-scoped through `marketId → market.groupId`. Reactions/comments cascade-delete with their market/comment/position.
## Verification
- `prisma validate` + `db push` (grubet only; confirm `public` untouched) + `tsc --noEmit` + `npm run build` + lint + `vitest` green.
- Preview (debug auth): `1234`→ido; create group + market; use `/login/quick` to switch between seeded friends and place opposing bets (with trash-talk shouts). Then: comment + `@mention` a friend, reply, react on a comment and on a stake; confirm **position badges**, **shout chips**, and the four new **notifications** (COMMENT/MENTION/POSITION_REACTION/BET_AGAINST) land for the right users. Resolve the market → **Called it** win + roast cards render; share button opens the share sheet (or copies). No console errors.
- Commit to `grubet`; Vercel preview auto-deploys.
## Out of scope (next phases)
1v1 head-to-head duels (own `Challenge` model + accept/decline, no pool); group-wide chat tab; Giphy/Tenor GIFs; PNG/image export of receipts.
