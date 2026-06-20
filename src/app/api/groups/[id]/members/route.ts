import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { getMembership, isAdminRole } from "@/lib/membership";

// List a group's members (active members visible to any member; pending requests
// only to admins). Used by block-pickers and the manage screen.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  const { id: groupId } = await params;
  const me = await getMembership(userId, groupId);
  if (!me || me.status !== "ACTIVE")
    return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });

  const rows = await prisma.membership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  const map = (m: (typeof rows)[number]) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    status: m.status,
  });
  const members = rows.filter((m) => m.status === "ACTIVE").map(map);
  const pending = isAdminRole(me.role) ? rows.filter((m) => m.status === "PENDING").map(map) : [];
  return NextResponse.json({ members, pending });
}

// Owner/admin member management: approve | deny | remove | role.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  const { id: groupId } = await params;
  const me = await getMembership(userId, groupId);
  if (!isAdminRole(me?.role))
    return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const targetUserId = String(body.targetUserId ?? "");
  if (!targetUserId) return NextResponse.json({ error: "חסר משתמש." }, { status: 400 });

  const target = await getMembership(targetUserId, groupId);
  if (!target) return NextResponse.json({ error: "המשתמש אינו בקבוצה." }, { status: 404 });
  if (target.role === "OWNER")
    return NextResponse.json({ error: "לא ניתן לשנות את הבעלים." }, { status: 400 });

  if (action === "approve") {
    await prisma.membership.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        groupId,
        type: "REQUEST_APPROVED",
        message: `הבקשה שלך להצטרף ל${g?.name ?? "קבוצה"} אושרה! 🎉`,
      },
    });
  } else if (action === "deny" || action === "remove") {
    await prisma.membership.delete({ where: { id: target.id } });
  } else if (action === "role") {
    const role = body.role === "ADMIN" ? "ADMIN" : "MEMBER";
    await prisma.membership.update({ where: { id: target.id }, data: { role } });
  } else {
    return NextResponse.json({ error: "פעולה לא תקינה." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
