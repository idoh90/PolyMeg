import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { NotificationType } from "@/lib/constants";
import { parseMentions, MAX_COMMENT_LEN } from "@/lib/social";
import { getI18n } from "@/lib/i18n/server";
import { notificationMessage, notifLocale, type NotifKey } from "@/lib/i18n/notify";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  let parentId = body?.parentId ? String(body.parentId) : null;

  const market = await prisma.market.findUnique({
    where: { id },
    select: { id: true, groupId: true, creatorId: true, title: true },
  });
  if (!market) return NextResponse.json({ error: dict.errors.betNotFound }, { status: 404 });

  const membership = await getMembership(user.id, market.groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: dict.errors.notMember }, { status: 403 });

  if (!text) return NextResponse.json({ error: dict.errors.nothingToSend }, { status: 400 });
  if (text.length > MAX_COMMENT_LEN)
    return NextResponse.json({ error: dict.errors.commentTooLong }, { status: 400 });

  // Flatten threads to one level: replying to a reply attaches to its parent.
  let parentAuthorId: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, marketId: true, parentId: true, userId: true },
    });
    if (!parent || parent.marketId !== id)
      return NextResponse.json({ error: dict.errors.commentNotFound }, { status: 400 });
    parentId = parent.parentId ?? parent.id;
    parentAuthorId = parent.userId;
  }

  // Resolve @mentions against active group members.
  const members = (
    await prisma.membership.findMany({
      where: { groupId: market.groupId, status: "ACTIVE" },
      select: { user: { select: { id: true, username: true, displayName: true, locale: true } } },
    })
  ).map((m) => m.user);
  const mentions = parseMentions(text, members).filter((uid) => uid !== user.id);
  const localeByUser = new Map(members.map((m) => [m.id, m.locale]));

  const comment = await prisma.comment.create({
    data: { marketId: id, userId: user.id, parentId, body: text, mentions },
  });

  // Notification fan-out, deduped per recipient (MENTION > reply > comment).
  // The message is built per recipient in their own locale.
  const recip = new Map<string, { type: string; key: NotifKey }>();
  const put = (uid: string | null, type: string, key: NotifKey) => {
    if (!uid || uid === user.id) return;
    if (!recip.has(uid)) recip.set(uid, { type, key });
  };
  for (const uid of mentions) put(uid, NotificationType.MENTION, "mention");
  put(parentAuthorId, NotificationType.COMMENT, "commentReply");
  put(market.creatorId, NotificationType.COMMENT, "commentOnBet");

  if (recip.size > 0) {
    await prisma.notification.createMany({
      data: [...recip.entries()].map(([userId, n]) => ({
        userId,
        groupId: market.groupId,
        type: n.type,
        marketId: id,
        message: notificationMessage(n.key, notifLocale(localeByUser.get(userId)), {
          name: user.displayName,
          market: market.title,
        }),
      })),
    });
  }

  return NextResponse.json({ id: comment.id });
}
