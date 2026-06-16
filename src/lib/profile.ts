import { prisma } from "@/lib/db";
import { computePayouts } from "@/lib/payout";
import { buildPortfolioSeries } from "@/lib/charts";
import { poolFor } from "@/lib/markets";
import { nowMs } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";
import type { ChartSeries } from "@/components/LineChart";
import type { MarketCardData } from "@/components/MarketCard";

export interface ProfileActivity {
  positionId: string;
  marketId: string;
  title: string;
  optionLabel: string;
  amount: number;
  outcome: "won" | "lost" | "pending";
  createdAt: Date;
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
    realizedNet: number; // agorot
    totalStaked: number; // agorot
    betsEntered: number;
    betsCreated: number;
    won: number;
    lost: number;
    winRate: number | null; // 0-1
  };
  portfolio: ChartSeries;
  created: MarketCardData[];
  activity: ProfileActivity[];
}

export async function getProfile(userId: string): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Everything this user staked, with market + option context.
  const positions = await prisma.position.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      option: { select: { label: true } },
      market: {
        select: {
          id: true,
          title: true,
          status: true,
          winningOptionId: true,
          resolvedAt: true,
        },
      },
    },
  });

  // Markets this user created (for the "Bets created" list).
  const createdRaw = await prisma.market.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      positions: { select: { optionId: true, amount: true } },
    },
  });
  const created: MarketCardData[] = createdRaw.map((m) => {
    const { options, totalPot } = poolFor(m.options, m.positions, m.winningOptionId);
    return {
      id: m.id,
      title: m.title,
      imageUrl: m.imageUrl,
      status: m.status,
      closesAt: m.closesAt,
      creatorName: user.name,
      totalPot,
      options,
    };
  });

  // Realized P/L: recompute each resolved market the user took part in.
  const resolvedIds = [
    ...new Set(
      positions
        .filter((p) => p.market.status === MarketStatus.RESOLVED && p.market.winningOptionId)
        .map((p) => p.market.id),
    ),
  ];
  const resolvedMarkets = await prisma.market.findMany({
    where: { id: { in: resolvedIds } },
    select: {
      id: true,
      winningOptionId: true,
      resolvedAt: true,
      positions: { select: { userId: true, optionId: true, amount: true } },
    },
  });

  const profitEntries: { resolvedAt: Date; profit: number }[] = [];
  let realizedNet = 0;
  let won = 0;
  let lost = 0;
  for (const m of resolvedMarkets) {
    const mine = computePayouts(m.positions, m.winningOptionId!).find(
      (r) => r.userId === userId,
    );
    if (!mine) continue;
    realizedNet += mine.profit;
    if (mine.profit > 0) won++;
    else if (mine.profit < 0) lost++;
    profitEntries.push({
      resolvedAt: m.resolvedAt ?? new Date(),
      profit: mine.profit,
    });
  }

  const totalStaked = positions.reduce((s, p) => s + p.amount, 0);
  const betsEntered = new Set(positions.map((p) => p.market.id)).size;
  const decided = won + lost;

  const activity: ProfileActivity[] = positions.map((p) => {
    let outcome: ProfileActivity["outcome"] = "pending";
    if (p.market.status === MarketStatus.RESOLVED && p.market.winningOptionId) {
      outcome = p.optionId === p.market.winningOptionId ? "won" : "lost";
    }
    return {
      positionId: p.id,
      marketId: p.market.id,
      title: p.market.title,
      optionLabel: p.option.label,
      amount: p.amount,
      outcome,
      createdAt: p.createdAt,
    };
  });

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
      betsEntered,
      betsCreated: createdRaw.length,
      won,
      lost,
      winRate: decided > 0 ? won / decided : null,
    },
    portfolio: buildPortfolioSeries(profitEntries, user.createdAt, nowMs()),
    created,
    activity,
  };
}
