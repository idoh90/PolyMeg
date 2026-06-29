import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { NotificationType } from "@/lib/constants";
import { parseMentions, MAX_COMMENT_LEN } from "@/lib/social";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  let parentId = body?.parentId ? String(body.parentId) : null;

  const market = await prisma.market.findUnique({
    where: { id },
    select: { id: true, groupId: true, creatorId: true, title: true },
  });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });

  const membership = await getMembership(user.id, market.groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: "אינך חבר בקבוצה." }, { status: 403 });

  if (!text) return NextResponse.json({ error: "אין מה לשלוח." }, { status: 400 });
  if (text.length > MAX_COMMENT_LEN)
    return NextResponse.json({ error: "התגובה ארוכה מדי." }, { status: 400 });

  // Flatten threads to one level: replying to a reply attaches to its parent.
  let parentAuthorId: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, marketId: true, parentId: true, userId: true },
    });
    if (!parent || parent.marketId !== id)
      return NextResponse.json({ error: "תגובה לא נמצאה." }, { status: 400 });
    parentId = parent.parentId ?? parent.id;
    parentAuthorId = parent.userId;
  }

  // Resolve @mentions against active group members.
  const members = (
    await prisma.membership.findMany({
      where: { groupId: market.groupId, status: "ACTIVE" },
      select: { user: { select: { id: true, username: true, displayName: true } } },
    })
  ).map((m) => m.user);
  const mentions = parseMentions(text, members).filter((uid) => uid !== user.id);

  const comment = await prisma.comment.create({
    data: { marketId: id, userId: user.id, parentId, body: text, mentions },
  });

  // Notification fan-out, deduped per recipient (MENTION > reply > comment).
  const recip = new Map<string, { type: string; message: string }>();
  const put = (uid: string | null, type: string, message: string) => {
    if (!uid || uid === user.id) return;
    if (!recip.has(uid)) recip.set(uid, { type, message });
  };
  for (const uid of mentions) put(uid, NotificationType.MENTION, `${user.displayName} תייג אותך · ${market.title}`);
  put(parentAuthorId, NotificationType.COMMENT, `${user.displayName} הגיב לך · ${market.title}`);
  put(market.creatorId, NotificationType.COMMENT, `${user.displayName} הגיב על ההימור שלך · ${market.title}`);

  if (recip.size > 0) {
    await prisma.notification.createMany({
      data: [...recip.entries()].map(([userId, n]) => ({
        userId,
        groupId: market.groupId,
        type: n.type,
        marketId: id,
        message: n.message,
      })),
    });
  }

  return NextResponse.json({ id: comment.id });
}
