import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { shekelsToAgorot, formatAgorot } from "@/lib/money";
import { MarketStatus, NotificationType } from "@/lib/constants";
import { MAX_SHOUT_LEN } from "@/lib/social";
import { displayLabel } from "@/lib/markets";
import { getI18n } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { notificationMessage, notifLocale } from "@/lib/i18n/notify";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict, t } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  let optionId = String(body?.optionId ?? "");
  const amountShekels = Number(body?.amount);
  const shout =
    typeof body?.shout === "string" && body.shout.trim()
      ? body.shout.trim().slice(0, MAX_SHOUT_LEN)
      : null;

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { select: { id: true, label: true, blockedUserIds: true } } },
  });
  if (!market) return NextResponse.json({ error: dict.errors.betNotFound }, { status: 404 });

  const membership = await getMembership(user.id, market.groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: dict.errors.notMember }, { status: 403 });

  // Numeric markets: the bet is a guess on the single synthetic option.
  let guess: number | null = null;
  if (market.kind === "SCALAR") {
    optionId = market.options[0]?.id ?? "";
    guess = Number(body?.guess);
    if (!Number.isFinite(guess))
      return NextResponse.json({ error: dict.errors.enterNumericGuess }, { status: 400 });
    if (
      market.scalarMin != null &&
      market.scalarMax != null &&
      (guess < market.scalarMin || guess > market.scalarMax)
    )
      return NextResponse.json(
        { error: t(dict.errors.guessRange, { min: market.scalarMin, max: market.scalarMax }) },
        { status: 400 },
      );
  }

  const chosen = market.options.find((o) => o.id === optionId);
  if (chosen?.blockedUserIds.includes(user.id)) {
    return NextResponse.json(
      { error: dict.errors.blockedFromOption },
      { status: 403 },
    );
  }

  if (
    market.status !== MarketStatus.OPEN ||
    market.closesAt.getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: dict.errors.betClosedToEntries },
      { status: 400 },
    );
  }
  if (!market.options.some((o) => o.id === optionId)) {
    return NextResponse.json({ error: dict.errors.invalidOption }, { status: 400 });
  }
  if (!Number.isFinite(amountShekels) || amountShekels <= 0) {
    return NextResponse.json({ error: dict.errors.enterValidAmount }, { status: 400 });
  }
  const amount = shekelsToAgorot(amountShekels);
  if (market.fixedStake !== null && amount !== market.fixedStake) {
    return NextResponse.json(
      { error: t(dict.errors.exactStake, { amount: formatAgorot(market.fixedStake) }) },
      { status: 400 },
    );
  }
  if (amount < market.minStake) {
    return NextResponse.json(
      { error: t(dict.errors.minStakeIs, { amount: formatAgorot(market.minStake) }) },
      { status: 400 },
    );
  }
  if (market.maxStake !== null && amount > market.maxStake) {
    return NextResponse.json(
      { error: t(dict.errors.maxStakeIs, { amount: formatAgorot(market.maxStake) }) },
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
        { error: t(dict.errors.perUserCapExceeded, { amount: formatAgorot(market.perUserCap) }) },
        { status: 400 },
      );
    }
  }
  // Price you bought at — the option's pool share now (for cash-out valuation).
  const entryPct = pot > 0 ? (optTotal / pot) * 100 : 100 / market.options.length;

  await prisma.position.create({
    data: {
      marketId: id,
      optionId,
      userId: user.id,
      amount,
      shout,
      guess,
      entryPct: market.kind === "SCALAR" ? null : entryPct,
    },
  });

  const optLabel = market.options.find((o) => o.id === optionId)?.label ?? "";

  // Members already holding a *different* option are opponents → they get a
  // pointed "bet against you" notice; everyone else gets the generic buy notice.
  const [others, opponents] = await Promise.all([
    prisma.membership.findMany({
      where: { groupId: market.groupId, status: "ACTIVE", userId: { not: user.id } },
      select: { userId: true, user: { select: { locale: true } } },
    }),
    prisma.position.findMany({
      where: { marketId: id, optionId: { not: optionId }, userId: { not: user.id } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  const opponentIds = new Set(opponents.map((o) => o.userId));
  const amountText = formatAgorot(amount);

  // Build each notice in the RECIPIENT's locale (side label + shout wrapper too).
  const notifs = others.map((m) => {
    const loc = notifLocale(m.user.locale);
    const vars = {
      name: user.displayName,
      side: displayLabel(optLabel, getDictionary(loc)),
      amount: amountText,
      market: market.title,
      shout: shout ? notificationMessage("shoutSuffix", loc, { shout }) : "",
    };
    const against = opponentIds.has(m.userId);
    return {
      userId: m.userId,
      groupId: market.groupId,
      type: against ? NotificationType.BET_AGAINST : NotificationType.BET_PLACED,
      marketId: id,
      message: notificationMessage(against ? "betAgainst" : "betPlaced", loc, vars),
    };
  });
  if (notifs.length > 0) await prisma.notification.createMany({ data: notifs });

  return NextResponse.json({ ok: true });
}
