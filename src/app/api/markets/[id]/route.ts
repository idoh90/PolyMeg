import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";
import { shekelsToAgorot } from "@/lib/money";
import { getI18n } from "@/lib/i18n/server";

// Edit a bet (creator or admin): title, criteria, image, close time, min stake,
// and per-option blocked users. Option labels are not changed here.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { select: { id: true } } },
  });
  if (!market) return NextResponse.json({ error: dict.errors.betNotFound }, { status: 404 });
  const membership = await getMembership(user.id, market.groupId);
  if (market.creatorId !== user.id && !isAdminRole(membership?.role))
    return NextResponse.json({ error: dict.errors.onlyCreatorEdit }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: dict.errors.badRequest }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    if (!body.title.trim()) return NextResponse.json({ error: dict.errors.addTitle }, { status: 400 });
    data.title = body.title.trim();
  }
  if (typeof body.criteria === "string") {
    if (!body.criteria.trim()) return NextResponse.json({ error: dict.errors.describeResolve }, { status: 400 });
    data.criteria = body.criteria.trim();
  }
  if ("imageUrl" in body) data.imageUrl = body.imageUrl || null;
  if (body.minStake !== undefined) {
    const n = Number(body.minStake);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: dict.errors.invalidMinStake }, { status: 400 });
    data.minStake = shekelsToAgorot(n);
  }
  if (body.closesAt) {
    const d = new Date(body.closesAt);
    if (isNaN(d.getTime())) return NextResponse.json({ error: dict.errors.invalidDate }, { status: 400 });
    data.closesAt = d;
  }

  await prisma.market.update({ where: { id }, data });

  // Per-option blocked users: { [optionId]: string[] }
  if (body.blocks && typeof body.blocks === "object") {
    const valid = new Set(market.options.map((o) => o.id));
    for (const [optId, ids] of Object.entries(body.blocks)) {
      if (!valid.has(optId)) continue;
      await prisma.option.update({
        where: { id: optId },
        data: { blockedUserIds: Array.isArray(ids) ? ids.map(String) : [] },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// Delete a bet (creator or group admin) — cascades options + positions.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  const { id } = await params;
  const market = await prisma.market.findUnique({ where: { id }, select: { creatorId: true, groupId: true } });
  if (!market) return NextResponse.json({ error: dict.errors.betNotFound }, { status: 404 });
  const membership = await getMembership(user.id, market.groupId);
  if (market.creatorId !== user.id && !isAdminRole(membership?.role))
    return NextResponse.json({ error: dict.errors.noPermission }, { status: 403 });

  await prisma.notification.deleteMany({ where: { marketId: id } });
  await prisma.market.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
