import { prisma } from "@/lib/db";
import { marketProfits } from "@/lib/payout";
import { poolFor, sideKind, isBinaryMarket, displayLabel } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";
import { formatAgorot } from "@/lib/money";
import { timeUntil, shortDuration } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";

// Cross-group surfaces ("גלה" / "הפיד שלי") aggregate the user's ACTIVE groups
// into two account-level views that sit ABOVE any single group. Everything is
// precomputed to serializable primitives so it can cross the RSC boundary into
// the client view components (which only navigate to /g/[groupId]/bets/[id]).

export interface GroupChip {
  id: string;
  name: string;
  emoji: string | null;
}

/** The user's ACTIVE groups, oldest-joined first. */
async function activeGroups(userId: string): Promise<GroupChip[]> {
  const ms = await prisma.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { group: { select: { id: true, name: true, emoji: true } } },
    orderBy: { createdAt: "asc" },
  });
  return ms.map((m) => ({ id: m.group.id, name: m.group.name, emoji: m.group.emoji }));
}

// ===================== EXPLORE =====================

export interface ExploreOption {
  id: string;
  label: string;
  pct: number;
  kind: "yes" | "no" | "accent";
}

export interface ExploreMarket {
  id: string;
  groupId: string;
  group: GroupChip;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  isBinary: boolean;
  isScalar: boolean;
  scalarMin: number | null;
  scalarMax: number | null;
  scalarUnit: string | null;
  pot: number;
  potText: string;
  betCount: number;
  commentCount: number;
  closesAtMs: number;
  timeText: string; // "בעוד X"
  leftShort: string; // "X שע׳"
  options: ExploreOption[]; // sorted by pct desc
}

export interface ExploreData {
  groups: GroupChip[];
  markets: ExploreMarket[];
}

/**
 * All OPEN markets across the user's active groups, enriched with pool %, pot,
 * bet count and comment count. The client view derives the hero, "closing soon",
 * "biggest pots" and "most argued" sections (and does search/group filtering)
 * from this one list, so tab/filter switches are instant.
 */
export async function getExploreData(userId: string, dict: Dictionary): Promise<ExploreData> {
  const groups = await activeGroups(userId);
  const ids = groups.map((g) => g.id);
  const chipById = new Map(groups.map((g) => [g.id, g]));
  if (ids.length === 0) return { groups, markets: [] };

  const rel = (d: Date) => shortDuration(d, dict.time);

  const rows = await prisma.market.findMany({
    where: { groupId: { in: ids }, status: MarketStatus.OPEN },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      positions: { where: { soldAt: null }, select: { optionId: true, amount: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const markets: ExploreMarket[] = rows.map((m) => {
    const { options, totalPot } = poolFor(m.options, m.positions, m.winningOptionId);
    const ranked = [...options]
      .sort((a, b) => b.pct - a.pct)
      .map((o) => ({ id: o.id, label: displayLabel(o.label, dict), pct: o.pct, kind: sideKind(o.label) }));
    const closesAt = m.closesAt;
    return {
      id: m.id,
      groupId: m.groupId,
      group: chipById.get(m.groupId)!,
      title: m.title,
      emoji: m.emoji,
      imageUrl: m.imageUrl,
      isBinary: isBinaryMarket(m.options),
      isScalar: m.kind === "SCALAR",
      scalarMin: m.scalarMin,
      scalarMax: m.scalarMax,
      scalarUnit: m.scalarUnit,
      pot: totalPot,
      potText: formatAgorot(totalPot),
      betCount: m.positions.length,
      commentCount: m._count.comments,
      closesAtMs: closesAt.getTime(),
      timeText: timeUntil(closesAt, dict.time),
      leftShort: rel(closesAt),
      options: ranked,
    };
  });

  return { groups, markets };
}

// ===================== FEED =====================

export interface ForYouResolved {
  kind: "resolved";
  id: string;
  marketId: string;
  groupId: string;
  group: GroupChip;
  title: string;
  sideLabel: string;
  won: boolean;
  profitText: string;
}

export interface ForYouMoved {
  kind: "moved";
  id: string;
  marketId: string;
  groupId: string;
  group: GroupChip;
  title: string;
  sideLabel: string;
  stakeText: string;
  fromPct: number;
  toPct: number;
  deltaText: string; // "+6"
  up: boolean;
}

export type ForYouItem = ForYouResolved | ForYouMoved;

export type ActivityItem =
  | {
      kind: "bet";
      id: string;
      ts: number;
      timeText: string;
      isNew: boolean;
      actor: { name: string; avatarUrl: string | null };
      sideLabel: string;
      sideKind: "yes" | "no" | "accent";
      amountText: string;
      marketId: string;
      groupId: string;
      group: GroupChip;
      marketTitle: string;
      marketEmoji: string | null;
    }
  | {
      kind: "open";
      id: string;
      ts: number;
      timeText: string;
      isNew: boolean;
      actor: { name: string; avatarUrl: string | null };
      marketId: string;
      groupId: string;
      group: GroupChip;
      marketTitle: string;
      marketEmoji: string | null;
    }
  | {
      kind: "resolved";
      id: string;
      ts: number;
      timeText: string;
      isNew: boolean;
      winnerLabel: string;
      winnerKind: "yes" | "no" | "accent";
      marketId: string;
      groupId: string;
      group: GroupChip;
      marketTitle: string;
      marketEmoji: string | null;
    };

export interface MyPositionItem {
  marketId: string;
  groupId: string;
  group: GroupChip;
  title: string;
  emoji: string | null;
  sideLabel: string;
  sideKind: "yes" | "no" | "accent";
  stakeText: string;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  pct: number | null; // current pool % of the chosen side (OPEN only)
  plText: string | null; // unrealized ± (OPEN only)
  plKind: "yes" | "no" | "muted";
}

export interface FeedData {
  forYou: ForYouItem[];
  activity: ActivityItem[];
  positions: {
    items: MyPositionItem[];
    openStakeText: string;
    unrealizedText: string;
    unrealizedKind: "yes" | "no" | "muted";
    count: number;
  };
}

const NEW_WINDOW_MS = 10 * 60 * 1000;

export async function getFeedData(userId: string, dict: Dictionary): Promise<FeedData> {
  const groups = await activeGroups(userId);
  const ids = groups.map((g) => g.id);
  const chipById = new Map(groups.map((g) => [g.id, g]));
  const rel = (d: Date) => shortDuration(d, dict.time);
  if (ids.length === 0) {
    return {
      forYou: [],
      activity: [],
      positions: { items: [], openStakeText: "₪0", unrealizedText: "₪0", unrealizedKind: "muted", count: 0 },
    };
  }

  const [myPositions, recentBets, recentMarkets] = await Promise.all([
    // Every position the user holds (live + sold) — drives "שלי" + "בשבילך".
    prisma.position.findMany({
      where: { userId, market: { groupId: { in: ids } } },
      orderBy: { createdAt: "desc" },
      include: {
        option: { select: { label: true } },
        market: { select: { id: true, title: true, emoji: true, groupId: true } },
      },
    }),
    // Cross-group "bet placed" activity.
    prisma.position.findMany({
      where: { market: { groupId: { in: ids } }, soldAt: null },
      orderBy: { createdAt: "desc" },
      take: 16,
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
        option: { select: { label: true } },
        market: { select: { id: true, title: true, emoji: true, groupId: true } },
      },
    }),
    // Markets across groups — drives "opened" + "resolved" activity rows.
    prisma.market.findMany({
      where: { groupId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        creator: { select: { displayName: true, avatarUrl: true } },
        options: { select: { id: true, label: true } },
      },
    }),
  ]);

  // Fully load the markets the user has a position in, to compute pools/payouts.
  const myMarketIds = [...new Set(myPositions.map((p) => p.market.id))];
  const fullMarkets = myMarketIds.length
    ? await prisma.market.findMany({
        where: { id: { in: myMarketIds } },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
          positions: { select: { userId: true, optionId: true, amount: true, guess: true, soldAt: true, soldValue: true } },
        },
      })
    : [];
  const fullById = new Map(fullMarkets.map((m) => [m.id, m]));

  // ---- "שלי" — open positions across groups + portfolio totals ----
  const items: MyPositionItem[] = [];
  let openStake = 0;
  let openToWin = 0;
  const movers: ForYouMoved[] = [];

  for (const p of myPositions) {
    if (p.soldAt) continue;
    const m = fullById.get(p.market.id);
    if (!m || m.status === MarketStatus.RESOLVED) continue;
    const isScalar = m.kind === "SCALAR";
    const sLabel = isScalar
      ? `${dict.market.guess} ${p.guess ?? ""}`.trim()
      : displayLabel(p.option.label, dict);
    const sKind = isScalar ? "accent" : sideKind(p.option.label);
    const group = chipById.get(m.groupId)!;

    if (m.status === MarketStatus.OPEN) {
      const { options, totalPot } = poolFor(m.options, m.positions.filter((q) => !q.soldAt), m.winningOptionId);
      const opt = options.find((o) => o.id === p.optionId);
      const toWin = opt && opt.total > 0 ? Math.round((p.amount / opt.total) * totalPot) : p.amount;
      const pl = toWin - p.amount;
      openStake += p.amount;
      openToWin += toWin;
      items.push({
        marketId: m.id,
        groupId: m.groupId,
        group,
        title: m.title,
        emoji: m.emoji,
        sideLabel: sLabel,
        sideKind: sKind,
        stakeText: formatAgorot(p.amount),
        status: "OPEN",
        pct: isScalar ? null : opt?.pct ?? null,
        plText: pl === 0 ? "₪0" : `${pl > 0 ? "+" : "−"}${formatAgorot(Math.abs(pl))}`,
        plKind: pl > 0 ? "yes" : pl < 0 ? "no" : "muted",
      });

      // "בשבילך": did this position's % move since entry?
      if (!isScalar && p.entryPct != null && opt) {
        const delta = Math.round(opt.pct - p.entryPct);
        if (Math.abs(delta) >= 3) {
          movers.push({
            kind: "moved",
            id: `mv-${p.id}`,
            marketId: m.id,
            groupId: m.groupId,
            group,
            title: m.title,
            sideLabel: sLabel,
            stakeText: formatAgorot(p.amount),
            fromPct: Math.round(p.entryPct),
            toPct: opt.pct,
            deltaText: `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`,
            up: delta > 0,
          });
        }
      }
    } else {
      // CLOSED — awaiting the creator's call.
      items.push({
        marketId: m.id,
        groupId: m.groupId,
        group,
        title: m.title,
        emoji: m.emoji,
        sideLabel: sLabel,
        sideKind: sKind,
        stakeText: formatAgorot(p.amount),
        status: "CLOSED",
        pct: null,
        plText: null,
        plKind: "muted",
      });
    }
  }

  const unrealized = openToWin - openStake;
  movers.sort((a, b) => Math.abs(b.toPct - b.fromPct) - Math.abs(a.toPct - a.fromPct));

  // ---- "בשבילך" — recent resolved bets the user was in ----
  const resolvedMine = fullMarkets
    .filter(
      (m) =>
        m.status === MarketStatus.RESOLVED &&
        (m.winningOptionId || (m.kind === "SCALAR" && m.resolvedValue != null)),
    )
    .sort((a, b) => (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0));

  const forYouResolved: ForYouResolved[] = [];
  for (const m of resolvedMine.slice(0, 6)) {
    const mine = marketProfits(m).find((r) => r.userId === userId);
    if (!mine) continue;
    const mineHere = m.positions.filter((p) => p.userId === userId && !p.soldAt);
    let sideLabel: string;
    if (m.kind === "SCALAR") {
      sideLabel = `${dict.market.guess} ${mineHere[0]?.guess ?? ""}`.trim();
    } else {
      const byOpt = new Map<string, number>();
      for (const p of mineHere) byOpt.set(p.optionId, (byOpt.get(p.optionId) ?? 0) + p.amount);
      const topOptId = [...byOpt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      sideLabel = displayLabel(m.options.find((o) => o.id === topOptId)?.label ?? "", dict);
    }
    forYouResolved.push({
      kind: "resolved",
      id: `rs-${m.id}`,
      marketId: m.id,
      groupId: m.groupId,
      group: chipById.get(m.groupId)!,
      title: m.title,
      sideLabel,
      won: mine.profit > 0,
      profitText: `${mine.profit > 0 ? "+" : mine.profit < 0 ? "−" : ""}${formatAgorot(Math.abs(mine.profit))}`,
    });
  }

  const forYou: ForYouItem[] = [...movers.slice(0, 2), ...forYouResolved.slice(0, 3)];

  // ---- "מכל הקבוצות" — unified activity stream ----
  const activity: ActivityItem[] = [];
  const now = Date.now();

  for (const p of recentBets) {
    const isScalar = !p.option; // defensive
    activity.push({
      kind: "bet",
      id: `bet-${p.id}`,
      ts: p.createdAt.getTime(),
      timeText: rel(p.createdAt),
      isNew: now - p.createdAt.getTime() < NEW_WINDOW_MS,
      actor: { name: p.user.displayName, avatarUrl: p.user.avatarUrl },
      sideLabel: isScalar ? dict.market.guess : displayLabel(p.option.label, dict),
      sideKind: isScalar ? "accent" : sideKind(p.option.label),
      amountText: formatAgorot(p.amount),
      marketId: p.market.id,
      groupId: p.market.groupId,
      group: chipById.get(p.market.groupId)!,
      marketTitle: p.market.title,
      marketEmoji: p.market.emoji,
    });
  }

  for (const m of recentMarkets) {
    activity.push({
      kind: "open",
      id: `open-${m.id}`,
      ts: m.createdAt.getTime(),
      timeText: rel(m.createdAt),
      isNew: now - m.createdAt.getTime() < NEW_WINDOW_MS,
      actor: { name: m.creator.displayName, avatarUrl: m.creator.avatarUrl },
      marketId: m.id,
      groupId: m.groupId,
      group: chipById.get(m.groupId)!,
      marketTitle: m.title,
      marketEmoji: m.emoji,
    });
    if (m.status === MarketStatus.RESOLVED && m.resolvedAt && m.winningOptionId) {
      const win = m.options.find((o) => o.id === m.winningOptionId);
      activity.push({
        kind: "resolved",
        id: `res-${m.id}`,
        ts: m.resolvedAt.getTime(),
        timeText: rel(m.resolvedAt),
        isNew: now - m.resolvedAt.getTime() < NEW_WINDOW_MS,
        winnerLabel: displayLabel(win?.label ?? "", dict),
        winnerKind: sideKind(win?.label ?? ""),
        marketId: m.id,
        groupId: m.groupId,
        group: chipById.get(m.groupId)!,
        marketTitle: m.title,
        marketEmoji: m.emoji,
      });
    }
  }

  activity.sort((a, b) => b.ts - a.ts);
  const trimmed = activity.slice(0, 18);

  return {
    forYou,
    activity: trimmed,
    positions: {
      items,
      openStakeText: formatAgorot(openStake),
      unrealizedText: `${unrealized > 0 ? "+" : unrealized < 0 ? "−" : ""}${formatAgorot(Math.abs(unrealized))}`,
      unrealizedKind: unrealized > 0 ? "yes" : unrealized < 0 ? "no" : "muted",
      count: items.length,
    },
  };
}
