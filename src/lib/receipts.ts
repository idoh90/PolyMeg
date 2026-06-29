import { prisma } from "@/lib/db";
import { computePayouts } from "@/lib/payout";
import { formatAgorot } from "@/lib/money";
import { MarketStatus } from "@/lib/constants";

export type ReceiptPerson = {
  name: string;
  avatarUrl: string | null;
  amount: string; // formatted, signed
  sideLabel: string; // the option they backed
};

export type Receipt = {
  marketTitle: string;
  emoji: string | null;
  winningLabel: string;
  winner: ReceiptPerson | null; // biggest profit
  loser: ReceiptPerson | null; // biggest loss (the roast)
};

/** Build the "Called it" winner + roast for a resolved market, or null. */
export async function getReceipt(marketId: string): Promise<Receipt | null> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: {
      title: true,
      emoji: true,
      status: true,
      winningOptionId: true,
      options: { select: { id: true, label: true } },
      positions: {
        select: {
          userId: true,
          optionId: true,
          amount: true,
          user: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!market || market.status !== MarketStatus.RESOLVED || !market.winningOptionId)
    return null;

  const labelOf = (oid: string) => market.options.find((o) => o.id === oid)?.label ?? "";
  const winningLabel = labelOf(market.winningOptionId);

  // Per-user identity + dominant option (most staked).
  const info = new Map<string, { name: string; avatarUrl: string | null; topOpt: string; topAmt: number }>();
  const perOpt = new Map<string, number>(); // `${userId}:${optionId}` -> total
  for (const p of market.positions) {
    const cur = info.get(p.userId) ?? {
      name: p.user.displayName,
      avatarUrl: p.user.avatarUrl,
      topOpt: p.optionId,
      topAmt: 0,
    };
    const key = `${p.userId}:${p.optionId}`;
    const t = (perOpt.get(key) ?? 0) + p.amount;
    perOpt.set(key, t);
    if (t > cur.topAmt) {
      cur.topAmt = t;
      cur.topOpt = p.optionId;
    }
    info.set(p.userId, cur);
  }

  const payouts = computePayouts(
    market.positions.map((p) => ({ userId: p.userId, optionId: p.optionId, amount: p.amount })),
    market.winningOptionId,
  );

  let topWin: (typeof payouts)[number] | null = null;
  let topLoss: (typeof payouts)[number] | null = null;
  for (const r of payouts) {
    if (r.profit > 0 && (!topWin || r.profit > topWin.profit)) topWin = r;
    if (r.profit < 0 && (!topLoss || r.profit < topLoss.profit)) topLoss = r;
  }

  const person = (r: (typeof payouts)[number] | null): ReceiptPerson | null => {
    if (!r) return null;
    const i = info.get(r.userId);
    if (!i) return null;
    return {
      name: i.name,
      avatarUrl: i.avatarUrl,
      amount: `${r.profit > 0 ? "+" : ""}${formatAgorot(r.profit)}`,
      sideLabel: labelOf(i.topOpt),
    };
  };

  return {
    marketTitle: market.title,
    emoji: market.emoji,
    winningLabel,
    winner: person(topWin),
    loser: person(topLoss),
  };
}
