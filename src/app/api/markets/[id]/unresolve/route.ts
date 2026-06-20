import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";
import { MarketStatus } from "@/lib/constants";

// Undo a resolution (creator or group admin). Clears the winner and reopens the
// bet (OPEN if still before close time, otherwise CLOSED) so payouts/standings
// recompute and the win/loss is reset.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const market = await prisma.market.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });
  const membership = await getMembership(user.id, market.groupId);
  if (market.creatorId !== user.id && !isAdminRole(membership?.role))
    return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });

  const status =
    market.closesAt.getTime() > Date.now() ? MarketStatus.OPEN : MarketStatus.CLOSED;
  await prisma.market.update({
    where: { id },
    data: { status, winningOptionId: null, resolvedAt: null },
  });
  return NextResponse.json({ ok: true });
}
