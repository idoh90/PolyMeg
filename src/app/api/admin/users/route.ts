import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { hashPin, isValidPin } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return user;
}

// Create a friend's account.
export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "למנהלים בלבד" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const pin = String(body?.pin ?? "");
  const isAdmin = Boolean(body?.isAdmin);
  const avatarUrl =
    typeof body?.avatarUrl === "string" && body.avatarUrl ? body.avatarUrl : null;

  if (!name) return NextResponse.json({ error: "נדרש שם." }, { status: 400 });
  if (!isValidPin(pin))
    return NextResponse.json({ error: "הקוד חייב להיות בן 4 ספרות." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing)
    return NextResponse.json({ error: "השם הזה כבר תפוס." }, { status: 400 });

  await prisma.user.create({
    data: { name, pinHash: await hashPin(pin), isAdmin, avatarUrl },
  });
  return NextResponse.json({ ok: true });
}

// Reset a user's PIN.
export async function PATCH(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "למנהלים בלבד" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "");
  const pin = String(body?.pin ?? "");
  if (!isValidPin(pin))
    return NextResponse.json({ error: "הקוד חייב להיות בן 4 ספרות." }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { pinHash: await hashPin(pin) },
  });
  return NextResponse.json({ ok: true });
}
