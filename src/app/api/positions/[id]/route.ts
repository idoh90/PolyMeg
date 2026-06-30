import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";
import { MarketStatus } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";

export const DELETE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

// Delete a placed bet (position). Owner may delete within 6h of placing while
// the market is still open. Admin may delete any position any time.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const pos = await prisma.position.findUnique({
    where: { id },
    include: { market: { select: { status: true, groupId: true } } },
  });
  if (!pos) return NextResponse.json({ error: dict.errors.betNotFound }, { status: 404 });

  const membership = await getMembership(user.id, pos.market.groupId);
  if (!isAdminRole(membership?.role)) {
    if (pos.userId !== user.id)
      return NextResponse.json({ error: dict.errors.notYourBet }, { status: 403 });
    if (pos.market.status !== MarketStatus.OPEN)
      return NextResponse.json({ error: dict.errors.betAlreadyClosed }, { status: 400 });
    if (Date.now() - pos.createdAt.getTime() > DELETE_WINDOW_MS)
      return NextResponse.json(
        { error: dict.errors.deleteWindowPassed },
        { status: 400 },
      );
  }

  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
