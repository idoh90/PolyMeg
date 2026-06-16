import { prisma } from "@/lib/db";
import { MarketStatus } from "@/lib/constants";

/** Flip any OPEN markets whose close time has passed to CLOSED. Lazy cron. */
export async function autoCloseExpired() {
  await prisma.market.updateMany({
    where: { status: MarketStatus.OPEN, closesAt: { lt: new Date() } },
    data: { status: MarketStatus.CLOSED },
  });
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
