# GRUbet — UI/UX Design Brief

> Hand this whole file to a design-focused Claude (or any designer). It is self-contained: it defines the brand, the design language, the full screen inventory, and every flow. Build **mobile-first** (390–480px frame), **RTL Hebrew**, light theme. The **in-group screens already exist and are approved** — re-skin them only for the GRUbet brand. Spend the design effort on the **new shell screens** (auth, groups dashboard, create/join, manage, account).

---

## 0. What GRUbet is

GRUbet is a multi-tenant prediction-market app for friend groups and communities. Anyone signs up, lands on a **dashboard of bet groups**, and creates or joins groups. Inside a group is a Polymarket-style experience — markets, a bet sheet, price charts, news, leaderboard, settlement — scoped to that group's members. **No real money moves through the app**; settlement just shows who owes whom, and people pay each other in real life.

One global identity (display name + avatar) is shown in every group; **stats are per-group**. A group is joined by a **code** (instant) or by **request → owner approval**. Think: a Valorant clan, a poker night, a dorm floor — each runs its own private market.

Brand stance: clearly evokes Polymarket's polish, but its own name, mark, colors, and copy. Never reuse Polymarket logos or wording.

---

## 1. Design language (keep consistent across ALL screens)

**Theme — light.** Tokens (already in `globals.css`):

| Token | Value | Use |
|---|---|---|
| bg | `#f4f5f8` | app background |
| surface | `#ffffff` | cards, sheets |
| surface-2 | `#f1f3f7` | insets, toggles, chips |
| border | `#e9ebf1` | hairlines, input borders |
| text / ink | `#0f1320` | primary text |
| muted | `#737b8c` | secondary text |
| faint | `#9aa1b1` | tertiary / placeholders |
| accent | `#2b6ef2` | primary actions, links |
| accent-soft | `#e9f0fe` | accent tint backgrounds |
| yes | `#15b87a` (soft `#e6f6ef`) | positive / "כן" / wins |
| no | `#f0405a` (soft `#fdebee`) | negative / "לא" / losses |
| gold | `#ffd24a → #f0a93a` | trophies, leaderboard top-3 |

**Type.** Heebo (Google Fonts), Hebrew + Latin subsets. Headings 700–900, body 500–600, captions 600. Numbers feel tabular/bold for odds and money.

**Shape.** Cards 16–22px radius, inputs 14px, pills/chips 999px. Avatars circular.

**Depth.** Resting shadow `0 1px 2px rgba(15,19,32,.03)`; hover/press lift `0 6px 18px -10px rgba(15,19,32,.18)`. Dark "hero" cards use `linear-gradient(135deg,#1f2a4d,#0f1320)` for previews/portfolio headers.

**Motion — tactile, iOS-like.** Every button/card scales `0.96–0.98` on press with a bouncy cubic-bezier (e.g. `cubic-bezier(.34,1.56,.64,1)`). Sheets slide up; success states use a brief confetti/checkmark. Inputs: 1.5px border, focus ring `0 0 0 4px var(--accent-soft)` + accent border.

**RTL rules.** `dir="rtl"`, `lang="he"`. Use logical CSS only: `ms-/me-/ps-/pe-`, `text-start/text-end`, `inset-inline-*`. Chevrons/back-arrows mirror (point right for "back"). Never hardcode `left/right/ml/mr`.

**Brand mark.** Design a simple GRUbet wordmark + glyph in accent — e.g. stacked chart-bars or a die. It appears top-right on shell screens (RTL leading edge). Do **not** reuse Polymarket's marks.

**Bottom nav + FAB.** Exists **inside a group only** (not on shell screens). 4 tabs + a center "+" FAB. Top-left (RTL trailing edge) holds the avatar → account / group switcher.

---

## 2. Information architecture & navigation map

Two zones:

**Account shell** (no group context):
```
/login            (public)
/signup           (public)
/groups           dashboard — the home after login
/groups/new       create a group
/groups/join      join by code / request
/account          global profile + settings + logout
```

**Group-scoped** (`/g/[groupId]/…`, requires active membership):
```
/g/[id]               markets home (feed)
/g/[id]/bets/new      3-step create-bet flow
/g/[id]/bets/[betId]  bet detail + chart + buy
/g/[id]/bets/[betId]/edit
/g/[id]/news          "מה חדש" activity, grouped by day
/g/[id]/leaderboard   podium + ranked net P/L
/g/[id]/settlement    "התחשבנות" who-pays-whom
/g/[id]/notifications bell feed
/g/[id]/u/[userId]    member profile + portfolio
/g/[id]/manage        owner/admin: settings, members, requests
```

Root `/` redirects to `/groups` if logged in, else `/login`.

**Group bottom nav (5 slots):** הימורים · חדשות · **[ + ]** · התיק (settlement) · חשבון. The avatar/switcher lives top-left so users hop communities fast.

---

## 3. Shell screens (NEW — focus design effort here)

### A. Signup — `/signup`
- Centered card on plain bg. GRUbet wordmark + one-line tagline ("שוק הניבויים של החבר׳ה שלך").
- Fields: **display name**, **username**, **password** (with show/hide eye). Username rule: 3–20 chars, `a–z 0–9 _ .`.
- Big primary button "צור חשבון". Secondary link: "כבר יש לי חשבון → התחבר".
- Inline error states under the relevant field: "שם המשתמש כבר תפוס", "סיסמה קצרה מדי" (min 4). Disable submit while pending; show spinner.
- Success → `/groups`.

### B. Login — `/login`
- Wordmark, **username** + **password**, primary "התחבר", link "אין לך חשבון? הרשמה".
- Single error line on failure: "שם משתמש או סיסמה שגויים".

### C. Groups dashboard — `/groups` (the new home)
- **Top bar:** wordmark (trailing/right), avatar button → `/account` (leading/left), greeting "היי, {displayName}".
- **Primary action row:** two big tappable cards side by side — **"➕ קבוצה חדשה"** (→ `/groups/new`) and **"🔑 הצטרפות לקבוצה"** (→ `/groups/join`).
- **"הקבוצות שלי":** vertical list of **group cards**. Each card: group avatar/emoji, name, member count, one live stat (e.g. "3 הימורים פתוחים" and/or your net in that group, colored yes/no), chevron. Whole card pressable → `/g/[id]`. Show a small unread/notification dot per group when there's new activity.
- **"בקשות בהמתנה"** (only if any): groups you've requested to join, status pill "ממתין לאישור".
- **Empty state:** friendly illustration + "עוד אין לך קבוצות — צור אחת או הצטרף עם קוד" + the two action cards.

### D. Create group — `/groups/new`
- Single form (or short wizard). Fields: **group name**, optional **description**, optional **image/emoji**.
- **Join-mode toggle** (segmented): **"קוד פתוח"** (instant via code) vs **"באישור בעלים"** (request → approve).
- If "קוד פתוח": optional **group password** field; show the auto-generated **join code** big with a copy button ("שתפו את הקוד: ABC123").
- Primary "צור קבוצה" → **success screen** showing the shareable code + "העתק / שתף" + "כניסה לקבוצה" → `/g/[id]`.

### E. Join group — `/groups/join`
- Large/segmented **join-code** input; optional **password** field (only if the group requires one).
- Button "הצטרף". Two outcomes:
  - **CODE group →** instant "נכנסת! 🎉" → `/g/[id]`.
  - **APPROVAL group →** "הבקשה נשלחה — ממתין לאישור הבעלים" state (stay on shell).
- Errors: "קוד לא תקין", "סיסמה שגויה", "כבר חבר בקבוצה".

### H. Account — `/account` (global)
- Editable **avatar** + **display name**; **username** read-only; **change password** (current + new); **log out** (destructive style).
- Optional: a short list "קבוצות שאני מנהל/בעלים".
- Keep it calm and simple.

---

## 4. Manage group — `/g/[id]/manage` (owner/admin only)

- **Settings card:** edit name/description/image; join-mode toggle; group password (placeholder notes if one is set: "מוגדרת — הקלד כדי לשנות"); **rotate join code** with copy/share.
- **Requests** (APPROVAL groups, only if pending): list of pending join requests, each with **אשר** / **דחה**. Show a count badge here and on the manage nav affordance.
- **Members:** list with avatar/name/role pill (בעלים/מנהל); per-row actions — promote to admin / demote, remove. Owner row has no actions (can't be removed). (Transfer-ownership is a later addition.)
- **Danger zone:** "מחק קבוצה" with a confirm ("למחוק את הקבוצה לצמיתות? כל ההימורים יימחקו.").

---

## 5. In-group screens (ALREADY BUILT — reuse, just brand + add group chrome)

These match the existing Polymeg build. Re-skin to GRUbet; don't redesign the interaction.

### E. Group home (markets feed) — `/g/[id]`
- **Add a group header** above the feed: group avatar + name + a **switcher** (tap → sheet/dropdown of your other groups + "כל הקבוצות" → `/groups`).
- Everything else stays: live ticker, search bar, filter chips, **featured card**, **market cards** (implied %, two buy buttons), and the **leaderboard hub card**.
- **Bottom nav** (group-scoped) + center **"+"** FAB opens the 3-step create flow.

### Bet detail — `/g/[id]/bets/[betId]`
- Header (title + image), big implied-% , **finance-style line chart** (straight segments between points — no bezier overshoot — gradient fill under the line, 50% dashed midline, end dot), buy buttons, criteria, recent activity.
- **Creator decision panel:** resolve now / schedule winner for close time. **Owner/admin** get override controls (resolve/edit/delete any market). Members get these only on their own markets.

### Create bet (3-step) — `/g/[id]/bets/new`
1. **Title** with a rotating generic-prompt placeholder + 💡/🎲 buttons + optional image.
2. **Yes/No** vs **multiple-choice** (add/remove options).
3. **Dark preview card** + min-stake + close-time chips (יום / 3 ימים / שבוע / חודש) → confetti success.
- Prompts must stay **generic/community-neutral** (see §7).

### Bet sheet (slide-up)
- Pick side, enter amount + quick chips, see **parimutuel** payout estimate, confirm → success.

### News — `/g/[id]/news` ("מה חדש")
- Grouped by day; colored avatars; side pills (כן/לא); trophy icon on resolutions; "חדש" badge on fresh items.

### Leaderboard — `/g/[id]/leaderboard`
- Top-3 **podium** (gold accents) + ranked list of net P/L. **Per group.**

### Settlement — `/g/[id]/settlement` ("התחשבנות")
- "Your settle-up" summary, who-pays-whom rows, net standings. **Per group.** This is the "התיק" bottom-nav tab.

### Notifications — `/g/[id]/notifications`
- Per-group bell feed (new bets, resolutions, your wins/losses, join events for admins).

### Member profile — `/g/[id]/u/[userId]`
- Avatar, net P/L, portfolio chart, win-rate / staked / #bets stats, trophies placeholder, open positions, history — all that **group's** data only.

---

## 6. Key flows (happy paths)

1. **New user:** `/signup` → `/groups` (empty) → "קבוצה חדשה" → fill form → success w/ code → `/g/[id]` (empty feed) → "+" → create first bet.
2. **Invited friend (code group):** `/signup` → `/groups/join` → enter code → "נכנסת! 🎉" → `/g/[id]`.
3. **Invited friend (approval group):** join → "ממתין לאישור" → (owner approves in `/manage`) → notification "הבקשה אושרה" → group appears on `/groups`.
4. **Bet lifecycle:** create → members place bets via sheet → creator/admin resolves → news + notifications fire → leaderboard & settlement update.
5. **Multi-group:** user in several groups uses the **switcher** (in-group header) or `/groups` to hop; each group shows its own stats and unread dot.

---

## 7. Cross-cutting notes

- **Group switcher** is a persistent affordance (header chip inside a group) so hopping communities is one tap. Show per-group unread dots on `/groups`.
- **Generalize all copy.** No Israeli-friend inside jokes. The create-bet prompt suggestions are already a **generic template set** (~23 neutral Hebrew prompts: "מי ישלם על הפיצה?", "ננצח את המשחק הקרוב?", "ירד גשם בסופ״ש?"…). Keep them broad so any community fits; gaming-friendly ones are welcome ("נעלה שלב?", "ננצח את הטורניר?").
- **Communities angle.** Group image + description + optional category/emoji let a community brand itself (e.g. a Valorant clan). Consider a category chip on the group card.
- **Hebrew now; flag English later.** UI is Hebrew/RTL for v1. If broad/international audience becomes a goal, raise i18n as a separate effort — don't half-translate.
- **Light theme everywhere.** In-group screens stay light to match the existing build. You may provide optional dark variants for the **new shell screens** only, but light is the default.
- **Money is display-only.** Never imply in-app payments. Settlement language is "מי חייב למי", and amounts are informational.

---

## 8. Out of scope for v1 (note, don't design yet)

Real-money payments, email / password reset, push notifications, public group discovery/search, full i18n, transfer-ownership UI. Flag these if a screen seems to need them.
