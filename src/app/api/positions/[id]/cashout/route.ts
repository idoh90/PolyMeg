import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { poolFor } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";

// Simplified cash-out: sell an open position back to the pool at its option's
// current share. value = stake × (currentPct / entryPct). The freed stake leaves
// the live pool; realized P/L is value - stake.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

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
  if (!pos) return NextResponse.json({ error: "הפוזיציה לא נמצאה." }, { status: 404 });
  if (pos.userId !== user.id) return NextResponse.json({ error: "לא הפוזיציה שלך." }, { status: 403 });

  const m = pos.market;
  if (m.kind === "SCALAR") return NextResponse.json({ error: "לא ניתן למכור בהימור מספרי." }, { status: 400 });
  if (!m.cashOutEnabled) return NextResponse.json({ error: "מכירה מוקדמת כבויה בהימור הזה." }, { status: 400 });
  if (m.status !== MarketStatus.OPEN) return NextResponse.json({ error: "ההימור סגור למכירה." }, { status: 400 });
  if (pos.soldAt) return NextResponse.json({ error: "הפוזיציה כבר נמכרה." }, { status: 400 });

  const membership = await getMembership(user.id, m.groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: "אינך חבר בקבוצה." }, { status: 403 });

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
