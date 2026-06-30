import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { getI18n } from "@/lib/i18n/server";

export async function POST() {
  const { dict } = await getI18n();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: dict.errors.unauthorized }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
