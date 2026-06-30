import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership } from "@/lib/membership";
import { isBinaryMarket } from "@/lib/markets";
import { shekelsToAgorot } from "@/lib/money";
import { MarketStatus, NotificationType } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";
import { notificationMessage, notifLocale } from "@/lib/i18n/notify";

export async function POST(req: Request) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: dict.errors.badRequest }, { status: 400 });

  const groupId = String(body.groupId ?? "");
  const membership = await getMembership(user.id, groupId);
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: dict.errors.notMember }, { status: 403 });

  const title = String(body.title ?? "").trim();
  // Criteria is optional in the new create flow; fall back to the title.
  const criteria = String(body.criteria ?? "").trim() || title;
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.length > 0
      ? body.imageUrl
      : null;
  const emoji = typeof body.emoji === "string" && body.emoji ? body.emoji.slice(0, 8) : null;
  const minStakeShekels = Number(body.minStake);
  const toAgPositive = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? shekelsToAgorot(n) : null;
  };
  const maxStake = toAgPositive(body.maxStake);
  const perUserCap = toAgPositive(body.perUserCap);
  const fixedStake = toAgPositive(body.fixedStake);
  const recurring = body.recurring === true;
  const recurrenceDays = recurring
    ? Math.max(1, Math.round(Number(body.recurrenceDays) || 7))
    : null;
  const cashOutEnabled = body.cashOutEnabled === true && body.kind !== "SCALAR";
  const closesAt = new Date(body.closesAt);
  let labels: string[] = Array.isArray(body.options)
    ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
    : [];
  // blocks[i] = userIds barred from option i (parallel to options).
  const blocks: string[][] = Array.isArray(body.blocks)
    ? body.blocks.map((arr: unknown) =>
        Array.isArray(arr) ? arr.map((u) => String(u)) : [],
      )
    : [];

  // Numeric (SCALAR) markets: no user options — one synthetic "guess" option
  // (canonical label "ניחוש", localized for display) holds the pot; each
  // position carries a numeric guess.
  const isScalar = body.kind === "SCALAR";
  let scalarMin: number | null = null;
  let scalarMax: number | null = null;
  let scalarUnit: string | null = null;
  if (isScalar) {
    scalarMin = Math.round(Number(body.scalarMin));
    scalarMax = Math.round(Number(body.scalarMax));
    scalarUnit =
      typeof body.scalarUnit === "string" && body.scalarUnit.trim()
        ? body.scalarUnit.trim().slice(0, 20)
        : null;
    labels = ["ניחוש"];
  }

  // Validation.
  if (!title) return bad(dict.errors.addTitle);
  if (!criteria) return bad(dict.errors.describeResolve);
  if (isScalar) {
    if (
      scalarMin === null ||
      scalarMax === null ||
      !Number.isFinite(scalarMin) ||
      !Number.isFinite(scalarMax) ||
      scalarMin >= scalarMax
    )
      return bad(dict.errors.invalidNumericRange);
  } else {
    if (labels.length < 2) return bad(dict.errors.atLeastTwoOptions);
    if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length)
      return bad(dict.errors.optionsMustDiffer);
  }
  if (!Number.isFinite(minStakeShekels) || minStakeShekels < 0)
    return bad(dict.errors.invalidMinStake);
  if (maxStake !== null && maxStake < shekelsToAgorot(minStakeShekels))
    return bad(dict.errors.maxAtLeastMin);
  if (perUserCap !== null && perUserCap < shekelsToAgorot(minStakeShekels))
    return bad(dict.errors.capAtLeastMin);
  if (isNaN(closesAt.getTime()) || closesAt.getTime() <= Date.now())
    return bad(dict.errors.closeMustBeFuture);

  const kind = isScalar
    ? "SCALAR"
    : isBinaryMarket(labels.map((l) => ({ label: l })))
      ? "BINARY"
      : "MULTI";

  const market = await prisma.market.create({
    data: {
      groupId,
      creatorId: user.id,
      title,
      criteria,
      imageUrl,
      emoji,
      kind,
      scalarMin,
      scalarMax,
      scalarUnit,
      minStake: shekelsToAgorot(minStakeShekels),
      maxStake: fixedStake ?? maxStake,
      perUserCap: fixedStake ? null : perUserCap,
      fixedStake,
      cashOutEnabled,
      recurring,
      recurrenceDays,
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

  // A recurring market anchors its own series so future instances link back.
  if (recurring) {
    await prisma.market.update({
      where: { id: market.id },
      data: { seriesId: market.id, seriesIndex: 1 },
    });
  }

  // Notify the rest of the group about the new bet.
  const others = await prisma.membership.findMany({
    where: { groupId, status: "ACTIVE", userId: { not: user.id } },
    select: { userId: true, user: { select: { locale: true } } },
  });
  if (others.length > 0) {
    await prisma.notification.createMany({
      data: others.map((m) => ({
        userId: m.userId,
        groupId,
        type: NotificationType.NEW_MARKET,
        marketId: market.id,
        message: notificationMessage("newMarket", notifLocale(m.user.locale), {
          name: user.displayName,
          title,
        }),
      })),
    });
  }

  return NextResponse.json({ id: market.id });
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
