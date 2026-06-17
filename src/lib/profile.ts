import { prisma } from "@/lib/db";
import { computePayouts } from "@/lib/payout";
import { buildPortfolioSeries } from "@/lib/charts";
import { poolFor, sideKind } from "@/lib/markets";
import { nowMs } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";
import type { ChartSeries } from "@/components/LineChart";

export interface OpenPosition {
  marketId: string;
  title: string;
  imageUrl: string | null;
  sideLabel: string;
  sideKind: "yes" | "no" | "accent";
  stake: number; // agorot
  toWin: number; // agorot (parimutuel estimate at current pool)
}

export interface HistoryItem {
  marketId: string;
  title: string;
  imageUrl: string | null;
  sideLabel: string;
  won: boolean;
  profit: number; // agorot, signed
}

export interface ProfileData {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    isAdmin: boolean;
    createdAt: Date;
  };
  stats: {
    realizedNet: number;
    totalStaked: number;
    openCount: number;
    betsEntered: number;
    betsCreated: number;
    won: number;
    lost: number;
    winRate: number | null;
  };
  portfolio: ChartSeries;
  openPositions: OpenPosition[];
  history: HistoryItem[];
}

export async function getProfile(userId: string): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [positions, betsCreated] = await Promise.all([
    prisma.position.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        option: { select: { label: true } },
        market: {
          select: { id: true, status: true, winningOptionId: true },
        },
      },
    }),
    prisma.market.count({ where: { creatorId: userId } }),
  ]);

  const totalStaked = positions.reduce((s, p) => s + p.amount, 0);
  const betsEntered = new Set(positions.map((p) => p.market.id)).size;

  // Markets the user participated in, fully loaded, to compute pools & payouts.
  const marketIds = [...new Set(positions.map((p) => p.market.id))];
  const markets = await prisma.market.findMany({
    where: { id: { in: marketIds } },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      positions: { select: { userId: true, optionId: true, amount: true } },
    },
  });
  const marketById = new Map(markets.map((m) => [m.id, m]));

  // ---- Open positions (with parimutuel toWin estimate) ----
  const openPositions: OpenPosition[] = [];
  for (const p of positions) {
    const m = marketById.get(p.market.id);
    if (!m || m.status !== MarketStatus.OPEN) continue;
    const { options, totalPot } = poolFor(m.options, m.positions, m.winningOptionId);
    const opt = options.find((o) => o.id === p.optionId);
    const toWin = opt && opt.total > 0 ? Math.round((p.amount / opt.total) * totalPot) : p.amount;
    openPositions.push({
      marketId: m.id,
      title: m.title,
      imageUrl: m.imageUrl,
      sideLabel: p.option.label,
      sideKind: sideKind(p.option.label),
      stake: p.amount,
      toWin,
    });
  }

  // ---- Resolved markets: profit, win/loss, history, portfolio series ----
  const profitEntries: { resolvedAt: Date; profit: number }[] = [];
  const history: HistoryItem[] = [];
  let realizedNet = 0;
  let won = 0;
  let lost = 0;

  const resolvedMine = markets
    .filter((m) => m.status === MarketStatus.RESOLVED && m.winningOptionId)
    .sort((a, b) => (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0));

  for (const m of resolvedMine) {
    const mine = computePayouts(m.positions, m.winningOptionId!).find((r) => r.userId === userId);
    if (!mine) continue;
    realizedNet += mine.profit;
    const isWin = mine.profit > 0;
    if (mine.profit > 0) won++;
    else if (mine.profit < 0) lost++;
    profitEntries.push({ resolvedAt: m.resolvedAt ?? new Date(), profit: mine.profit });

    // The user's main side in this market (largest stake).
    const mineHere = m.positions.filter((p) => p.userId === userId);
    const byOpt = new Map<string, number>();
    for (const p of mineHere) byOpt.set(p.optionId, (byOpt.get(p.optionId) ?? 0) + p.amount);
    const topOptId = [...byOpt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const sideLabel = m.options.find((o) => o.id === topOptId)?.label ?? "";

    history.push({
      marketId: m.id,
      title: m.title,
      imageUrl: m.imageUrl,
      sideLabel,
      won: isWin,
      profit: mine.profit,
    });
  }

  const decided = won + lost;

  return {
    user: {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
    stats: {
      realizedNet,
      totalStaked,
      openCount: openPositions.length,
      betsEntered,
      betsCreated,
      won,
      lost,
      winRate: decided > 0 ? won / decided : null,
    },
    portfolio: buildPortfolioSeries(profitEntries, user.createdAt, nowMs()),
    openPositions,
    history,
  };
}
