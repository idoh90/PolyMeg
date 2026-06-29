import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { userId: true, market: { select: { groupId: true } } },
  });
  if (!comment) return NextResponse.json({ error: "תגובה לא נמצאה." }, { status: 404 });

  const membership = await getMembership(user.id, comment.market.groupId);
  if (comment.userId !== user.id && !isAdminRole(membership?.role))
    return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });

  // children + reactions cascade via schema relations
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
