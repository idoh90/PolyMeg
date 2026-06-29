import { prisma } from "@/lib/db";
import { marketProfits } from "@/lib/payout";
import { MarketStatus } from "@/lib/constants";

export interface LeaderRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  net: number; // agorot, realized P/L across resolved bets
  wins: number; // resolved bets with positive profit
  bets: number; // resolved bets participated in
}

/** Per-member net P/L, wins and bet counts from a group's resolved markets. */
export async function getLeaderboard(groupId: string): Promise<LeaderRow[]> {
  const [members, markets] = await Promise.all([
    prisma.membership.findMany({
      where: { groupId, status: "ACTIVE" },
      select: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    }),
    prisma.market.findMany({
      where: {
        groupId,
        status: MarketStatus.RESOLVED,
        OR: [{ winningOptionId: { not: null } }, { kind: "SCALAR", resolvedValue: { not: null } }],
      },
      select: {
        kind: true,
        winningOptionId: true,
        resolvedValue: true,
        positions: { select: { userId: true, optionId: true, amount: true, guess: true } },
      },
    }),
  ]);
  const users = members.map((m) => m.user);

  const net = new Map<string, number>();
  const wins = new Map<string, number>();
  const bets = new Map<string, number>();

  for (const m of markets) {
    for (const r of marketProfits(m)) {
      net.set(r.userId, (net.get(r.userId) ?? 0) + r.profit);
      bets.set(r.userId, (bets.get(r.userId) ?? 0) + 1);
      if (r.profit > 0) wins.set(r.userId, (wins.get(r.userId) ?? 0) + 1);
    }
  }

  return users
    .map((u) => ({
      userId: u.id,
      name: u.displayName,
      avatarUrl: u.avatarUrl,
      net: net.get(u.id) ?? 0,
      wins: wins.get(u.id) ?? 0,
      bets: bets.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.net - a.net || b.wins - a.wins || a.name.localeCompare(b.name));
}
