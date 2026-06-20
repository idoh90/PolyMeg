import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const password = String(body.password ?? "");

  const group = await prisma.group.findUnique({ where: { code } });
  if (!group) return NextResponse.json({ error: "קוד לא קיים." }, { status: 404 });

  const existing = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  });
  if (existing?.status === "ACTIVE")
    return NextResponse.json({ ok: true, status: "ACTIVE", groupId: group.id });
  if (existing?.status === "PENDING")
    return NextResponse.json({ ok: true, status: "PENDING", groupId: group.id });

  if (group.joinMode === "CODE") {
    if (group.passwordHash && !(await verifyPassword(password, group.passwordHash)))
      return NextResponse.json({ error: "סיסמת הקבוצה שגויה." }, { status: 401 });
    await prisma.membership.create({
      data: { userId: user.id, groupId: group.id, role: "MEMBER", status: "ACTIVE" },
    });
    return NextResponse.json({ ok: true, status: "ACTIVE", groupId: group.id });
  }

  // APPROVAL: create a pending request + notify the owner.
  await prisma.membership.create({
    data: { userId: user.id, groupId: group.id, role: "MEMBER", status: "PENDING" },
  });
  await prisma.notification.create({
    data: {
      userId: group.ownerId,
      groupId: group.id,
      type: "JOIN_REQUEST",
      message: `${user.displayName} ביקש להצטרף לקבוצה ${group.name}`,
    },
  });
  return NextResponse.json({ ok: true, status: "PENDING", groupId: group.id });
}
