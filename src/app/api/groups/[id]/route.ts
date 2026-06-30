import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { getMembership, isAdminRole, makeJoinCode } from "@/lib/membership";
import { hashPassword } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: dict.errors.notLoggedIn }, { status: 401 });
  const { id } = await params;
  const m = await getMembership(userId, id);
  if (!isAdminRole(m?.role))
    return NextResponse.json({ error: dict.errors.noPermission }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if ("description" in body) data.description = String(body.description ?? "").trim() || null;
  if ("imageUrl" in body) data.imageUrl = body.imageUrl || null;
  if (body.joinMode === "CODE" || body.joinMode === "APPROVAL") data.joinMode = body.joinMode;
  if (body.rotateCode) data.code = makeJoinCode();
  if (typeof body.password === "string")
    data.passwordHash = body.password ? await hashPassword(body.password) : null;

  const group = await prisma.group.update({ where: { id }, data });
  return NextResponse.json({ ok: true, code: group.code });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { dict } = await getI18n();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: dict.errors.notLoggedIn }, { status: 401 });
  const { id } = await params;
  const m = await getMembership(userId, id);
  if (m?.role !== "OWNER")
    return NextResponse.json({ error: dict.errors.onlyOwnerDelete }, { status: 403 });

  await prisma.group.delete({ where: { id } }); // cascades memberships + markets
  return NextResponse.json({ ok: true });
}
