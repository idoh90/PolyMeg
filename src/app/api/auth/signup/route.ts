import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword, isValidUsername, isValidPassword } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const { dict } = await getI18n();
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim();
  const avatarUrl =
    typeof body.avatarUrl === "string" && body.avatarUrl ? body.avatarUrl : null;

  if (!isValidUsername(username))
    return NextResponse.json({ error: dict.errors.usernameRule }, { status: 400 });
  if (!displayName)
    return NextResponse.json({ error: dict.errors.enterDisplayName }, { status: 400 });
  if (!isValidPassword(password))
    return NextResponse.json({ error: dict.errors.passwordRule }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists)
    return NextResponse.json({ error: dict.errors.usernameTaken }, { status: 400 });

  const user = await prisma.user.create({
    data: { username, displayName, avatarUrl, passwordHash: await hashPassword(password) },
  });

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  return NextResponse.json({ ok: true });
}
