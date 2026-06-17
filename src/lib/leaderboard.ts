import { prisma } from "@/lib/db";
import { computePayouts } from "@/lib/payout";
import { MarketStatus } from "@/lib/constants";

export interface LeaderRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  net: number; // agorot, realized P/L across resolved bets
  wins: number; // resolved bets with positive profit
  bets: number; // resolved bets participated in
}

/** Per-user net P/L, wins and bet counts from all resolved markets, ranked. */
export async function getLeaderboard(): Promise<LeaderRow[]> {
  const [users, markets] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, avatarUrl: true },
    }),
    prisma.market.findMany({
      where: { status: MarketStatus.RESOLVED, winningOptionId: { not: null } },
      select: {
        winningOptionId: true,
        positions: { select: { userId: true, optionId: true, amount: true } },
      },
    }),
  ]);

  const net = new Map<string, number>();
  const wins = new Map<string, number>();
  const bets = new Map<string, number>();

  for (const m of markets) {
    for (const r of computePayouts(m.positions, m.winningOptionId!)) {
      net.set(r.userId, (net.get(r.userId) ?? 0) + r.profit);
      bets.set(r.userId, (bets.get(r.userId) ?? 0) + 1);
      if (r.profit > 0) wins.set(r.userId, (wins.get(r.userId) ?? 0) + 1);
    }
  }

  return users
    .map((u) => ({
      userId: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      net: net.get(u.id) ?? 0,
      wins: wins.get(u.id) ?? 0,
      bets: bets.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.net - a.net || b.wins - a.wins || a.name.localeCompare(b.name));
}
