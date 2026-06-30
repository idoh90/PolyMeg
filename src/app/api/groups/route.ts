import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { makeJoinCode } from "@/lib/membership";
import { getI18n } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const { dict } = await getI18n();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: dict.errors.notLoggedIn }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim() || null;
  const imageUrl = typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;
  const emoji = typeof body.emoji === "string" && body.emoji ? body.emoji.slice(0, 8) : null;
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim().slice(0, 30) : null;
  const joinMode = body.joinMode === "APPROVAL" ? "APPROVAL" : "CODE";
  const password = String(body.password ?? "");

  if (name.length < 2) return NextResponse.json({ error: dict.errors.groupNameShort }, { status: 400 });

  // unique code (retry a few times)
  let code = makeJoinCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.group.findUnique({ where: { code } });
    if (!clash) break;
    code = makeJoinCode();
  }

  const group = await prisma.group.create({
    data: {
      name,
      description,
      imageUrl,
      emoji,
      category,
      joinMode,
      code,
      passwordHash: password ? await hashPassword(password) : null,
      ownerId: userId,
      members: { create: { userId, role: "OWNER", status: "ACTIVE" } },
    },
  });

  return NextResponse.json({ id: group.id, code: group.code });
}
