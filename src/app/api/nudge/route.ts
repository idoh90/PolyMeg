import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { formatAgorot } from "@/lib/money";
import { NotificationType } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";
import { notificationMessage, notifLocale } from "@/lib/i18n/notify";

// Settlement reminder: the creditor nudges a debtor about an outstanding balance.
export async function POST(req: Request) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const body = await req.json().catch(() => null);
  const groupId = String(body?.groupId ?? "");
  const toUserId = String(body?.toUserId ?? "");
  const amount = Number(body?.amount);
  if (!toUserId || toUserId === user.id || !Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: dict.errors.badRequest }, { status: 400 });

  const [mine, theirs, recipient] = await Promise.all([
    getMembership(user.id, groupId),
    getMembership(toUserId, groupId),
    prisma.user.findUnique({ where: { id: toUserId }, select: { locale: true } }),
  ]);
  if (!mine || mine.status !== "ACTIVE") return NextResponse.json({ error: dict.errors.notMember }, { status: 403 });
  if (!theirs || theirs.status !== "ACTIVE") return NextResponse.json({ error: dict.errors.userNotMember }, { status: 400 });

  await prisma.notification.create({
    data: {
      userId: toUserId,
      groupId,
      type: NotificationType.SETTLE_REMINDER,
      message: notificationMessage("nudge", notifLocale(recipient?.locale), {
        name: user.displayName,
        amount: formatAgorot(amount),
      }),
    },
  });
  return NextResponse.json({ ok: true });
}
