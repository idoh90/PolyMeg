import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { shekelsToAgorot, formatAgorot } from "@/lib/money";
import { MarketStatus, NotificationType } from "@/lib/constants";
import { MAX_SHOUT_LEN } from "@/lib/social";

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
  const shout =
    typeof body?.shout === "string" && body.shout.trim()
      ? body.shout.trim().slice(0, MAX_SHOUT_LEN)
      : null;

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { select: { id: true, label: true, blockedUserIds: true } } },
  });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });

  const membership = await getMembership(user.id, market.groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: "אינך חבר בקבוצה." }, { status: 403 });

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
  if (market.maxStake !== null && amount > market.maxStake) {
    return NextResponse.json(
      { error: `המקסימום להימור הוא ${formatAgorot(market.maxStake)}.` },
      { status: 400 },
    );
  }

  // Live (non-cashed-out) pools: drives the per-user cap and the entry price.
  const agg = await prisma.position.groupBy({
    by: ["optionId"],
    where: { marketId: id, soldAt: null },
    _sum: { amount: true },
  });
  let pot = 0;
  let optTotal = 0;
  for (const a of agg) {
    const s = a._sum.amount ?? 0;
    pot += s;
    if (a.optionId === optionId) optTotal += s;
  }
  if (market.perUserCap !== null) {
    const mine = await prisma.position.aggregate({
      where: { marketId: id, userId: user.id, soldAt: null },
      _sum: { amount: true },
    });
    if ((mine._sum.amount ?? 0) + amount > market.perUserCap) {
      return NextResponse.json(
        { error: `חרגת מהתקרה למשתתף (${formatAgorot(market.perUserCap)}).` },
        { status: 400 },
      );
    }
  }
  // Price you bought at — the option's pool share now (for cash-out valuation).
  const entryPct = pot > 0 ? (optTotal / pot) * 100 : 100 / market.options.length;

  await prisma.position.create({
    data: { marketId: id, optionId, userId: user.id, amount, shout, entryPct },
  });

  const optLabel = market.options.find((o) => o.id === optionId)?.label ?? "";

  // Members already holding a *different* option are opponents → they get a
  // pointed "bet against you" notice; everyone else gets the generic buy notice.
  const [others, opponents] = await Promise.all([
    prisma.membership.findMany({
      where: { groupId: market.groupId, status: "ACTIVE", userId: { not: user.id } },
      select: { userId: true },
    }),
    prisma.position.findMany({
      where: { marketId: id, optionId: { not: optionId }, userId: { not: user.id } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  const opponentIds = new Set(opponents.map((o) => o.userId));
  const shoutSuffix = shout ? ` — ״${shout}״` : "";

  const notifs = others.map((m) =>
    opponentIds.has(m.userId)
      ? {
          userId: m.userId,
          groupId: market.groupId,
          type: NotificationType.BET_AGAINST,
          marketId: id,
          message: `${user.displayName} הימר נגדך: ${optLabel} ב-${formatAgorot(amount)} · ${market.title}${shoutSuffix}`,
        }
      : {
          userId: m.userId,
          groupId: market.groupId,
          type: NotificationType.BET_PLACED,
          marketId: id,
          message: `${user.displayName} קנה ${optLabel} ב-${formatAgorot(amount)} · ${market.title}${shoutSuffix}`,
        },
  );
  if (notifs.length > 0) await prisma.notification.createMany({ data: notifs });

  return NextResponse.json({ ok: true });
}
