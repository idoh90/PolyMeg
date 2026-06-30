import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";
import { MarketStatus } from "@/lib/constants";
import { resolveMarket, resolveScalarMarket } from "@/lib/markets";
import { getI18n } from "@/lib/i18n/server";

// Creator-only decision endpoint.
//   mode "now"      -> resolve immediately (any time, even before close)
//   mode "schedule" -> set/clear the winner that applies when the date ends
//                      (editable only while the timer hasn't hit 0)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const mode = body?.mode === "schedule" ? "schedule" : "now";
  const winningOptionId =
    body?.winningOptionId == null ? null : String(body.winningOptionId);

  const market = await prisma.market.findUnique({
    where: { id },
    select: { id: true, groupId: true, creatorId: true, status: true, kind: true, scalarMin: true, scalarMax: true, closesAt: true, options: { select: { id: true } } },
  });
  if (!market) return NextResponse.json({ error: dict.errors.betNotFound }, { status: 404 });
  const membership = await getMembership(user.id, market.groupId);
  if (market.creatorId !== user.id && !isAdminRole(membership?.role))
    return NextResponse.json({ error: dict.errors.onlyCreatorResolve }, { status: 403 });
  if (market.status === MarketStatus.RESOLVED)
    return NextResponse.json({ error: dict.errors.alreadyResolved }, { status: 400 });

  // Numeric markets resolve to a value, not an option.
  if (market.kind === "SCALAR") {
    const value = Number(body?.value);
    if (!Number.isFinite(value)) return NextResponse.json({ error: dict.errors.enterNumericResult }, { status: 400 });
    await resolveScalarMarket(id, value);
    return NextResponse.json({ ok: true });
  }

  const valid = (oid: string) => market.options.some((o) => o.id === oid);

  if (mode === "schedule") {
    if (market.closesAt.getTime() <= Date.now())
      return NextResponse.json(
        { error: dict.errors.timeUpResolveNow },
        { status: 400 },
      );
    if (winningOptionId !== null && !valid(winningOptionId))
      return NextResponse.json({ error: dict.errors.pickOption }, { status: 400 });
    await prisma.market.update({
      where: { id },
      data: { pendingWinnerOptionId: winningOptionId },
    });
    return NextResponse.json({ ok: true });
  }

  // mode "now"
  if (!winningOptionId || !valid(winningOptionId))
    return NextResponse.json({ error: dict.errors.pickWinner }, { status: 400 });
  await resolveMarket(id, winningOptionId);
  return NextResponse.json({ ok: true });
}
