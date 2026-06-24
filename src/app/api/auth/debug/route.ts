import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// DEBUG BACKDOOR — passwordless login for development.
// Gated by ALLOW_DEBUG_LOGIN: enabled unless explicitly set to "false".
// Used by the login screen shortcuts: 1234 -> admin (ido), 0000 -> friend picker.
function debugAllowed() {
  return process.env.ALLOW_DEBUG_LOGIN !== "false";
}

export async function POST(req: Request) {
  if (!debugAllowed())
    return NextResponse.json({ error: "debug login disabled" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "");
  const userId = body.userId ? String(body.userId) : null;

  let user = null;
  if (mode === "admin") {
    // Ensure the admin account exists even on a fresh DB so 1234 always works.
    user = await prisma.user.upsert({
      where: { username: "ido" },
      update: {},
      create: {
        username: "ido",
        displayName: "Ido",
        passwordHash: await bcrypt.hash(randomUUID(), 10),
      },
    });
  } else if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }

  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  return NextResponse.json({ ok: true, id: user.id });
}
