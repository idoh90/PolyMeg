import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { MarketStatus } from "@/lib/constants";

// Admin-only debug tool: undo a resolution. Clears the winner and reopens the
// bet (OPEN if still before close time, otherwise CLOSED) so payouts/standings
// recompute and the win/loss is reset.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "למנהלים בלבד" }, { status: 403 });

  const { id } = await params;
  const market = await prisma.market.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });

  const status =
    market.closesAt.getTime() > Date.now() ? MarketStatus.OPEN : MarketStatus.CLOSED;
  await prisma.market.update({
    where: { id },
    data: { status, winningOptionId: null, resolvedAt: null },
  });
  return NextResponse.json({ ok: true });
}
