import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { NotificationType } from "@/lib/constants";
import { REACTION_EMOJI } from "@/lib/social";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const emoji = String(body?.emoji ?? "");
  const commentId = body?.commentId ? String(body.commentId) : null;
  const positionId = body?.positionId ? String(body.positionId) : null;

  if (!(REACTION_EMOJI as readonly string[]).includes(emoji))
    return NextResponse.json({ error: "אימוג'י לא תקין." }, { status: 400 });
  if (!commentId === !positionId)
    return NextResponse.json({ error: "בחר יעד אחד." }, { status: 400 });

  // Resolve target -> group, owner, and a message.
  let groupId: string;
  let ownerId: string;
  let notifType: string = NotificationType.POSITION_REACTION;
  let message = "";
  let marketId: string | null = null;

  if (commentId) {
    const c = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, marketId: true, market: { select: { groupId: true, title: true } } },
    });
    if (!c) return NextResponse.json({ error: "תגובה לא נמצאה." }, { status: 404 });
    groupId = c.market.groupId;
    ownerId = c.userId;
    marketId = c.marketId;
    notifType = NotificationType.COMMENT;
    message = `${user.displayName} הגיב ${emoji} לתגובה שלך · ${c.market.title}`;
  } else {
    const p = await prisma.position.findUnique({
      where: { id: positionId! },
      select: {
        userId: true,
        marketId: true,
        option: { select: { label: true } },
        market: { select: { groupId: true, title: true } },
      },
    });
    if (!p) return NextResponse.json({ error: "הימור לא נמצא." }, { status: 404 });
    groupId = p.market.groupId;
    ownerId = p.userId;
    marketId = p.marketId;
    message = `${user.displayName} הגיב ${emoji} על ${p.option.label} שלך · ${p.market.title}`;
  }

  const membership = await getMembership(user.id, groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: "אינך חבר בקבוצה." }, { status: 403 });

  // Toggle.
  const existing = await prisma.reaction.findFirst({
    where: { userId: user.id, emoji, commentId, positionId },
    select: { id: true },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ on: false });
  }

  await prisma.reaction.create({ data: { userId: user.id, emoji, commentId, positionId } });
  if (ownerId !== user.id) {
    await prisma.notification.create({
      data: { userId: ownerId, groupId, type: notifType, marketId, message },
    });
  }
  return NextResponse.json({ on: true });
}
