import { prisma } from "@/lib/db";
import { marketProfits } from "@/lib/payout";
import { netBalances, minimizeTransfers } from "@/lib/settlement";
import { MarketStatus } from "@/lib/constants";

export interface UserBalance {
  userId: string;
  name: string;
  avatarUrl: string | null;
  net: number; // agorot
}

export interface NamedTransfer {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

/**
 * Aggregate profit/loss across all RESOLVED bets and compute the global
 * net balance per user plus the minimal set of "who pays whom" transfers.
 */
export async function getSettlement(groupId: string): Promise<{
  balances: UserBalance[];
  transfers: NamedTransfer[];
  oldestResolvedAt: Date | null;
}> {
  const [markets, sold] = await Promise.all([
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
        resolvedAt: true,
        positions: { select: { userId: true, optionId: true, amount: true, guess: true, soldAt: true, soldValue: true } },
      },
    }),
    prisma.position.findMany({
      where: { market: { groupId }, soldAt: { not: null } },
      select: { userId: true, amount: true, soldValue: true },
    }),
  ]);

  const profits: { userId: string; profit: number }[] = [];
  for (const m of markets) {
    for (const r of marketProfits(m)) profits.push({ userId: r.userId, profit: r.profit });
  }
  for (const s of sold) {
    profits.push({ userId: s.userId, profit: (s.soldValue ?? s.amount) - s.amount });
  }

  const balances = netBalances(profits);
  const transfers = minimizeTransfers(balances);

  // Decorate with names/avatars (group members).
  const members = await prisma.membership.findMany({
    where: { groupId },
    select: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
  });
  const byId = new Map(members.map((m) => [m.user.id, m.user]));

  const namedBalances: UserBalance[] = balances
    .map((b) => ({
      userId: b.userId,
      name: byId.get(b.userId)?.displayName ?? "Unknown",
      avatarUrl: byId.get(b.userId)?.avatarUrl ?? null,
      net: b.net,
    }))
    .sort((a, b) => b.net - a.net);

  const namedTransfers: NamedTransfer[] = transfers.map((t) => ({
    fromUserId: t.fromUserId,
    fromName: byId.get(t.fromUserId)?.displayName ?? "Unknown",
    toUserId: t.toUserId,
    toName: byId.get(t.toUserId)?.displayName ?? "Unknown",
    amount: t.amount,
  }));

  let oldestResolvedAt: Date | null = null;
  for (const m of markets) {
    if (m.resolvedAt && (!oldestResolvedAt || m.resolvedAt < oldestResolvedAt)) oldestResolvedAt = m.resolvedAt;
  }

  return { balances: namedBalances, transfers: namedTransfers, oldestResolvedAt };
}
