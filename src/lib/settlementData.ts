import { prisma } from "@/lib/db";
import { computePayouts } from "@/lib/payout";
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
export async function getSettlement(): Promise<{
  balances: UserBalance[];
  transfers: NamedTransfer[];
}> {
  const markets = await prisma.market.findMany({
    where: { status: MarketStatus.RESOLVED, winningOptionId: { not: null } },
    select: {
      winningOptionId: true,
      positions: { select: { userId: true, optionId: true, amount: true } },
    },
  });

  const profits: { userId: string; profit: number }[] = [];
  for (const m of markets) {
    const results = computePayouts(m.positions, m.winningOptionId!);
    for (const r of results) profits.push({ userId: r.userId, profit: r.profit });
  }

  const balances = netBalances(profits);
  const transfers = minimizeTransfers(balances);

  // Decorate with names/avatars for every user who has any net or any account.
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarUrl: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const namedBalances: UserBalance[] = balances
    .map((b) => ({
      userId: b.userId,
      name: byId.get(b.userId)?.name ?? "Unknown",
      avatarUrl: byId.get(b.userId)?.avatarUrl ?? null,
      net: b.net,
    }))
    .sort((a, b) => b.net - a.net);

  const namedTransfers: NamedTransfer[] = transfers.map((t) => ({
    fromUserId: t.fromUserId,
    fromName: byId.get(t.fromUserId)?.name ?? "Unknown",
    toUserId: t.toUserId,
    toName: byId.get(t.toUserId)?.name ?? "Unknown",
    amount: t.amount,
  }));

  return { balances: namedBalances, transfers: namedTransfers };
}
