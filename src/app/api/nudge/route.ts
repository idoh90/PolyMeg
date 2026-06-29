import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { formatAgorot } from "@/lib/money";
import { NotificationType } from "@/lib/constants";

// Settlement reminder: the creditor nudges a debtor about an outstanding balance.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const groupId = String(body?.groupId ?? "");
  const toUserId = String(body?.toUserId ?? "");
  const amount = Number(body?.amount);
  if (!toUserId || toUserId === user.id || !Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "בקשה שגויה." }, { status: 400 });

  const [mine, theirs] = await Promise.all([
    getMembership(user.id, groupId),
    getMembership(toUserId, groupId),
  ]);
  if (!mine || mine.status !== "ACTIVE") return NextResponse.json({ error: "אינך חבר בקבוצה." }, { status: 403 });
  if (!theirs || theirs.status !== "ACTIVE") return NextResponse.json({ error: "המשתמש אינו חבר." }, { status: 400 });

  await prisma.notification.create({
    data: {
      userId: toUserId,
      groupId,
      type: NotificationType.SETTLE_REMINDER,
      message: `${user.displayName} מזכיר: אתה חייב לו ${formatAgorot(amount)} מההתחשבנות. זמן לסגור 💸`,
    },
  });
  return NextResponse.json({ ok: true });
}
