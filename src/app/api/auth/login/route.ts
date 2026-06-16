import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, isValidPin } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const { userId, pin } = await req.json().catch(() => ({}));

  if (typeof userId !== "string" || !isValidPin(pin ?? "")) {
    return NextResponse.json({ error: "קלט לא תקין." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPin(pin, user.pinHash))) {
    return NextResponse.json(
      { error: "קוד שגוי. נסה שוב." },
      { status: 401 },
    );
  }

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.isAdmin = user.isAdmin;
  await session.save();

  return NextResponse.json({ ok: true });
}
