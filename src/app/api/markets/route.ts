import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { shekelsToAgorot } from "@/lib/money";
import { MarketStatus, NotificationType } from "@/lib/constants";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "בקשה שגויה" }, { status: 400 });

  const groupId = String(body.groupId ?? "");
  const membership = await getMembership(user.id, groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: "אינך חבר בקבוצה." }, { status: 403 });

  const title = String(body.title ?? "").trim();
  // Criteria is optional in the new create flow; fall back to the title.
  const criteria = String(body.criteria ?? "").trim() || title;
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.length > 0
      ? body.imageUrl
      : null;
  const minStakeShekels = Number(body.minStake);
  const closesAt = new Date(body.closesAt);
  const labels: string[] = Array.isArray(body.options)
    ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
    : [];
  // blocks[i] = userIds barred from option i (parallel to options).
  const blocks: string[][] = Array.isArray(body.blocks)
    ? body.blocks.map((arr: unknown) =>
        Array.isArray(arr) ? arr.map((u) => String(u)) : [],
      )
    : [];

  // Validation.
  if (!title) return bad("נא להוסיף כותרת.");
  if (!criteria) return bad("נא לתאר איך ההימור מוכרע.");
  if (labels.length < 2) return bad("הוסף לפחות שתי אפשרויות.");
  if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length)
    return bad("האפשרויות חייבות להיות שונות זו מזו.");
  if (!Number.isFinite(minStakeShekels) || minStakeShekels < 0)
    return bad("הסכום המינימלי אינו תקין.");
  if (isNaN(closesAt.getTime()) || closesAt.getTime() <= Date.now())
    return bad("מועד הסגירה חייב להיות בעתיד.");

  const market = await prisma.market.create({
    data: {
      groupId,
      creatorId: user.id,
      title,
      criteria,
      imageUrl,
      minStake: shekelsToAgorot(minStakeShekels),
      closesAt,
      status: MarketStatus.OPEN,
      options: {
        create: labels.map((label, i) => ({
          label,
          sortOrder: i,
          blockedUserIds: blocks[i] ?? [],
        })),
      },
    },
  });

  // Notify the rest of the group about the new bet.
  const others = await prisma.membership.findMany({
    where: { groupId, status: "ACTIVE", userId: { not: user.id } },
    select: { userId: true },
  });
  if (others.length > 0) {
    await prisma.notification.createMany({
      data: others.map((m) => ({
        userId: m.userId,
        groupId,
        type: NotificationType.NEW_MARKET,
        marketId: market.id,
        message: `${user.displayName} יצר הימור חדש: ${title}`,
      })),
    });
  }

  return NextResponse.json({ id: market.id });
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
