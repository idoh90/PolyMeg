import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

// Admin-only: delete a bet (cascades options + positions) and its notifications.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "למנהלים בלבד" }, { status: 403 });

  const { id } = await params;
  await prisma.notification.deleteMany({ where: { marketId: id } });
  await prisma.market.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
