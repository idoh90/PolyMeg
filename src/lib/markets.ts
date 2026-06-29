import { prisma } from "@/lib/db";
import { MarketStatus, NotificationType } from "@/lib/constants";

/**
 * Resolve a market to a winning option: mark RESOLVED, set winner + resolvedAt,
 * and notify participants. Used by manual "resolve now" and by scheduled
 * auto-resolution at close. Money split is derived from this on read.
 */
export async function resolveMarket(marketId: string, winningOptionId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { options: { select: { id: true, label: true } } },
  });
  if (!market || market.status === MarketStatus.RESOLVED) return;
  const winner = market.options.find((o) => o.id === winningOptionId);
  if (!winner) return;

  await prisma.market.update({
    where: { id: marketId },
    data: {
      status: MarketStatus.RESOLVED,
      winningOptionId,
      resolvedAt: new Date(),
      pendingWinnerOptionId: null,
    },
  });

  const participants = await prisma.position.findMany({
    where: { marketId },
    distinct: ["userId"],
    select: { userId: true },
  });
  if (participants.length > 0) {
    await prisma.notification.createMany({
      data: participants.map((p) => ({
        userId: p.userId,
        groupId: market.groupId,
        type: NotificationType.MARKET_RESOLVED,
        marketId,
        message: `ההימור "${market.title}" הוכרע: ${winner.label} ניצח. בדוק את ההתחשבנות שלך.`,
      })),
    });
  }

  await spawnNextInstance(marketId);
}

/**
 * When a recurring market resolves, open the next instance in its series
 * (same setup, fresh pool, closes one cadence from now). No-op for one-off
 * markets, and guarded so it never double-spawns.
 */
export async function spawnNextInstance(marketId: string) {
  const m = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      options: { orderBy: { sortOrder: "asc" }, select: { label: true, sortOrder: true, blockedUserIds: true } },
    },
  });
  if (!m || !m.recurring || !m.recurrenceDays || !m.seriesId) return;

  const newest = await prisma.market.aggregate({
    where: { seriesId: m.seriesId },
    _max: { seriesIndex: true },
  });
  const latest = newest._max.seriesIndex ?? 1;
  // Only the current latest instance spawns the next one.
  if ((m.seriesIndex ?? 1) < latest) return;

  await prisma.market.create({
    data: {
      groupId: m.groupId,
      creatorId: m.creatorId,
      title: m.title,
      criteria: m.criteria,
      imageUrl: m.imageUrl,
      emoji: m.emoji,
      kind: m.kind,
      minStake: m.minStake,
      maxStake: m.maxStake,
      perUserCap: m.perUserCap,
      cashOutEnabled: m.cashOutEnabled,
      scalarMin: m.scalarMin,
      scalarMax: m.scalarMax,
      scalarUnit: m.scalarUnit,
      recurring: true,
      recurrenceDays: m.recurrenceDays,
      seriesId: m.seriesId,
      seriesIndex: latest + 1,
      closesAt: new Date(Date.now() + m.recurrenceDays * 86400000),
      status: MarketStatus.OPEN,
      options: {
        create: m.options.map((o) => ({
          label: o.label,
          sortOrder: o.sortOrder,
          blockedUserIds: o.blockedUserIds,
        })),
      },
    },
  });
}

/**
 * Resolve a numeric (SCALAR) market to its actual value. Closest guess(es) win;
 * payouts are derived on read via marketProfits/computeScalarPayouts.
 */
export async function resolveScalarMarket(marketId: string, value: number) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, groupId: true, title: true, status: true, kind: true },
  });
  if (!market || market.kind !== "SCALAR" || market.status === MarketStatus.RESOLVED) return;

  await prisma.market.update({
    where: { id: marketId },
    data: {
      status: MarketStatus.RESOLVED,
      resolvedValue: value,
      resolvedAt: new Date(),
      pendingWinnerOptionId: null,
    },
  });

  const participants = await prisma.position.findMany({
    where: { marketId },
    distinct: ["userId"],
    select: { userId: true },
  });
  if (participants.length > 0) {
    await prisma.notification.createMany({
      data: participants.map((p) => ({
        userId: p.userId,
        groupId: market.groupId,
        type: NotificationType.MARKET_RESOLVED,
        marketId,
        message: `ההימור "${market.title}" הוכרע: התוצאה ${value}. בדוק את ההתחשבנות שלך.`,
      })),
    });
  }

  await spawnNextInstance(marketId);
}

/**
 * Lazy cron: handle markets whose close time passed. If the creator scheduled a
 * winner, auto-resolve to it; otherwise just flip OPEN -> CLOSED.
 */
export async function autoCloseExpired() {
  const expired = await prisma.market.findMany({
    where: { status: MarketStatus.OPEN, closesAt: { lt: new Date() } },
    select: { id: true, pendingWinnerOptionId: true },
  });
  for (const m of expired) {
    if (m.pendingWinnerOptionId) {
      await resolveMarket(m.id, m.pendingWinnerOptionId);
    } else {
      await prisma.market.update({
        where: { id: m.id },
        data: { status: MarketStatus.CLOSED },
      });
    }
  }
}

export interface OptionPool {
  id: string;
  label: string;
  total: number; // agorot staked on this option
  pct: number; // share of the total pot, 0-100
  isWinner: boolean;
}

/** Compute per-option pools and the total pot for a market. */
export function poolFor(
  options: { id: string; label: string }[],
  positions: { optionId: string; amount: number }[],
  winningOptionId: string | null,
): { options: OptionPool[]; totalPot: number } {
  const totals = new Map<string, number>();
  let totalPot = 0;
  for (const p of positions) {
    totals.set(p.optionId, (totals.get(p.optionId) ?? 0) + p.amount);
    totalPot += p.amount;
  }
  const opts = options.map((o) => {
    const total = totals.get(o.id) ?? 0;
    return {
      id: o.id,
      label: o.label,
      total,
      pct: totalPot > 0 ? Math.round((total / totalPot) * 100) : 0,
      isWinner: o.id === winningOptionId,
    };
  });
  return { options: opts, totalPot };
}

/** A market is "binary" when it has exactly Yes/No (כן/לא) options. */
export function isBinaryMarket(options: { label: string }[]): boolean {
  if (options.length !== 2) return false;
  const s = new Set(options.map((o) => o.label));
  return (s.has("כן") && s.has("לא")) || (s.has("Yes") && s.has("No"));
}

/** Semantic color kind for an option label: yes/no get themed, else accent. */
export function sideKind(label: string): "yes" | "no" | "accent" {
  if (label === "כן" || label === "Yes") return "yes";
  if (label === "לא" || label === "No") return "no";
  return "accent";
}
