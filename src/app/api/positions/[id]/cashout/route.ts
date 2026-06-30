import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { poolFor } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";

// Simplified cash-out: sell an open position back to the pool at its option's
// current share. value = stake × (currentPct / entryPct). The freed stake leaves
// the live pool; realized P/L is value - stake.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const pos = await prisma.position.findUnique({
    where: { id },
    select: {
      userId: true,
      optionId: true,
      amount: true,
      entryPct: true,
      soldAt: true,
      market: {
        select: {
          status: true,
          kind: true,
          cashOutEnabled: true,
          groupId: true,
          winningOptionId: true,
          options: { select: { id: true, label: true } },
          positions: { where: { soldAt: null }, select: { optionId: true, amount: true } },
        },
      },
    },
  });
  if (!pos) return NextResponse.json({ error: dict.errors.positionNotFound }, { status: 404 });
  if (pos.userId !== user.id) return NextResponse.json({ error: dict.errors.notYourPosition }, { status: 403 });

  const m = pos.market;
  if (m.kind === "SCALAR") return NextResponse.json({ error: dict.errors.cantSellScalar }, { status: 400 });
  if (!m.cashOutEnabled) return NextResponse.json({ error: dict.errors.cashOutDisabled }, { status: 400 });
  if (m.status !== MarketStatus.OPEN) return NextResponse.json({ error: dict.errors.betClosedForSale }, { status: 400 });
  if (pos.soldAt) return NextResponse.json({ error: dict.errors.alreadySold }, { status: 400 });

  const membership = await getMembership(user.id, m.groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: dict.errors.notMember }, { status: 403 });

  const { options } = poolFor(m.options, m.positions, m.winningOptionId);
  const curPct = options.find((o) => o.id === pos.optionId)?.pct ?? 0;
  const entry = pos.entryPct && pos.entryPct > 0 ? pos.entryPct : curPct || 1;
  const value = Math.max(0, Math.round(pos.amount * (curPct / entry)));

  await prisma.position.update({
    where: { id },
    data: { soldAt: new Date(), soldValue: value },
  });
  return NextResponse.json({ value });
}
