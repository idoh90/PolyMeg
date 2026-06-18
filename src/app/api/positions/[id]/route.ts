import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { MarketStatus } from "@/lib/constants";

export const DELETE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

// Delete a placed bet (position). Owner may delete within 6h of placing while
// the market is still open. Admin may delete any position any time.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const pos = await prisma.position.findUnique({
    where: { id },
    include: { market: { select: { status: true } } },
  });
  if (!pos) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });

  if (!user.isAdmin) {
    if (pos.userId !== user.id)
      return NextResponse.json({ error: "לא ההימור שלך" }, { status: 403 });
    if (pos.market.status !== MarketStatus.OPEN)
      return NextResponse.json({ error: "ההימור כבר נסגר." }, { status: 400 });
    if (Date.now() - pos.createdAt.getTime() > DELETE_WINDOW_MS)
      return NextResponse.json(
        { error: "עברו 6 שעות — לא ניתן למחוק יותר." },
        { status: 400 },
      );
  }

  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
