import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { hashPassword, verifyPassword, isValidPassword } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.displayName === "string" && body.displayName.trim())
    data.displayName = body.displayName.trim();
  if ("avatarUrl" in body) data.avatarUrl = body.avatarUrl || null;

  if (body.newPassword) {
    if (!isValidPassword(body.newPassword))
      return NextResponse.json({ error: "סיסמה קצרה מדי." }, { status: 400 });
    if (!(await verifyPassword(String(body.currentPassword ?? ""), user.passwordHash)))
      return NextResponse.json({ error: "הסיסמה הנוכחית שגויה." }, { status: 401 });
    data.passwordHash = await hashPassword(String(body.newPassword));
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
