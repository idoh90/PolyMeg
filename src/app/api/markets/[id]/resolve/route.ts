import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { MarketStatus, NotificationType } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const winningOptionId = String(body?.winningOptionId ?? "");

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { select: { id: true, label: true } } },
  });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });

  // Only the creator (or an admin) may resolve.
  if (market.creatorId !== user.id && !user.isAdmin) {
    return NextResponse.json(
      { error: "רק יוצר ההימור יכול להכריע אותו." },
      { status: 403 },
    );
  }
  if (market.status === MarketStatus.RESOLVED) {
    return NextResponse.json(
      { error: "ההימור כבר הוכרע." },
      { status: 400 },
    );
  }
  if (market.closesAt.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "אפשר להכריע הימור רק אחרי שהוא נסגר." },
      { status: 400 },
    );
  }
  const winning = market.options.find((o) => o.id === winningOptionId);
  if (!winning) {
    return NextResponse.json({ error: "בחר את האפשרות המנצחת." }, { status: 400 });
  }

  await prisma.market.update({
    where: { id },
    data: {
      status: MarketStatus.RESOLVED,
      winningOptionId,
      resolvedAt: new Date(),
    },
  });

  // Notify everyone who placed a position (other than the resolver).
  const participants = await prisma.position.findMany({
    where: { marketId: id, userId: { not: user.id } },
    distinct: ["userId"],
    select: { userId: true },
  });
  if (participants.length > 0) {
    await prisma.notification.createMany({
      data: participants.map((p) => ({
        userId: p.userId,
        type: NotificationType.MARKET_RESOLVED,
        marketId: id,
        message: `ההימור "${market.title}" הוכרע: ${winning.label} ניצח. בדוק את ההתחשבנות שלך.`,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
