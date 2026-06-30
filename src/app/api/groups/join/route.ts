import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { verifyPassword } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { notificationMessage, notifLocale } from "@/lib/i18n/notify";

export async function POST(req: Request) {
  const { dict } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: dict.errors.notLoggedIn }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const password = String(body.password ?? "");

  const group = await prisma.group.findUnique({
    where: { code },
    include: { owner: { select: { locale: true } } },
  });
  if (!group) return NextResponse.json({ error: dict.errors.codeNotFound }, { status: 404 });

  const existing = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  });
  if (existing?.status === "ACTIVE")
    return NextResponse.json({ ok: true, status: "ACTIVE", groupId: group.id });
  if (existing?.status === "PENDING")
    return NextResponse.json({ ok: true, status: "PENDING", groupId: group.id });

  if (group.joinMode === "CODE") {
    if (group.passwordHash && !(await verifyPassword(password, group.passwordHash)))
      return NextResponse.json({ error: dict.errors.wrongGroupPassword }, { status: 401 });
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
      message: notificationMessage("joinRequest", notifLocale(group.owner.locale), {
        name: user.displayName,
        group: group.name,
      }),
    },
  });
  return NextResponse.json({ ok: true, status: "PENDING", groupId: group.id });
}
