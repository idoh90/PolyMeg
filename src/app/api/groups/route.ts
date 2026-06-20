import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { makeJoinCode } from "@/lib/membership";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim() || null;
  const imageUrl = typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;
  const joinMode = body.joinMode === "APPROVAL" ? "APPROVAL" : "CODE";
  const password = String(body.password ?? "");

  if (name.length < 2) return NextResponse.json({ error: "שם קבוצה קצר מדי." }, { status: 400 });

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
      joinMode,
      code,
      passwordHash: password ? await hashPassword(password) : null,
      ownerId: userId,
      members: { create: { userId, role: "OWNER", status: "ACTIVE" } },
    },
  });

  return NextResponse.json({ id: group.id, code: group.code });
}
