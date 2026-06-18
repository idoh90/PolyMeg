import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

// Basic roster for block-pickers etc. Auth required.
export async function GET() {
  if (!(await getCurrentUserId()))
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ users });
}
