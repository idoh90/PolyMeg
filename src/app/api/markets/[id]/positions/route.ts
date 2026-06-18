import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { shekelsToAgorot, formatAgorot } from "@/lib/money";
import { MarketStatus, NotificationType } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const optionId = String(body?.optionId ?? "");
  const amountShekels = Number(body?.amount);

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { select: { id: true, label: true, blockedUserIds: true } } },
  });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });

  const chosen = market.options.find((o) => o.id === optionId);
  if (chosen?.blockedUserIds.includes(user.id)) {
    return NextResponse.json(
      { error: "אינך יכול להמר על האפשרות הזו." },
      { status: 403 },
    );
  }

  if (
    market.status !== MarketStatus.OPEN ||
    market.closesAt.getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: "ההימור סגור לכניסות חדשות." },
      { status: 400 },
    );
  }
  if (!market.options.some((o) => o.id === optionId)) {
    return NextResponse.json({ error: "אפשרות לא תקינה." }, { status: 400 });
  }
  if (!Number.isFinite(amountShekels) || amountShekels <= 0) {
    return NextResponse.json({ error: "הזן סכום תקין." }, { status: 400 });
  }
  const amount = shekelsToAgorot(amountShekels);
  if (amount < market.minStake) {
    return NextResponse.json(
      { error: `הסכום המינימלי הוא ${formatAgorot(market.minStake)}.` },
      { status: 400 },
    );
  }

  await prisma.position.create({
    data: { marketId: id, optionId, userId: user.id, amount },
  });

  // Notify everyone else about the buy.
  const optLabel = market.options.find((o) => o.id === optionId)?.label ?? "";
  const others = await prisma.user.findMany({
    where: { id: { not: user.id } },
    select: { id: true },
  });
  if (others.length > 0) {
    await prisma.notification.createMany({
      data: others.map((u) => ({
        userId: u.id,
        type: NotificationType.BET_PLACED,
        marketId: id,
        message: `${user.name} קנה ${optLabel} ב-${formatAgorot(amount)} · ${market.title}`,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
