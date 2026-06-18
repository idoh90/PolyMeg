import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { MarketStatus } from "@/lib/constants";
import { resolveMarket } from "@/lib/markets";

// Creator-only decision endpoint.
//   mode "now"      -> resolve immediately (any time, even before close)
//   mode "schedule" -> set/clear the winner that applies when the date ends
//                      (editable only while the timer hasn't hit 0)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const mode = body?.mode === "schedule" ? "schedule" : "now";
  const winningOptionId =
    body?.winningOptionId == null ? null : String(body.winningOptionId);

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { select: { id: true } } },
  });
  if (!market) return NextResponse.json({ error: "ההימור לא נמצא" }, { status: 404 });
  if (market.creatorId !== user.id && !user.isAdmin)
    return NextResponse.json({ error: "רק יוצר ההימור יכול להכריע." }, { status: 403 });
  if (market.status === MarketStatus.RESOLVED)
    return NextResponse.json({ error: "ההימור כבר הוכרע." }, { status: 400 });

  const valid = (oid: string) => market.options.some((o) => o.id === oid);

  if (mode === "schedule") {
    if (market.closesAt.getTime() <= Date.now())
      return NextResponse.json(
        { error: "הזמן נגמר — אפשר רק להכריע עכשיו." },
        { status: 400 },
      );
    if (winningOptionId !== null && !valid(winningOptionId))
      return NextResponse.json({ error: "בחר אפשרות." }, { status: 400 });
    await prisma.market.update({
      where: { id },
      data: { pendingWinnerOptionId: winningOptionId },
    });
    return NextResponse.json({ ok: true });
  }

  // mode "now"
  if (!winningOptionId || !valid(winningOptionId))
    return NextResponse.json({ error: "בחר את האפשרות המנצחת." }, { status: 400 });
  await resolveMarket(id, winningOptionId);
  return NextResponse.json({ ok: true });
}
