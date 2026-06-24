import { prisma } from "@/lib/db";

export interface TickerItem {
  user: string;
  side: string; // option label
  color: "yes" | "no" | "accent";
  market: string;
}

function sideColor(label: string): TickerItem["color"] {
  if (label === "כן" || label.toLowerCase() === "yes") return "yes";
  if (label === "לא" || label.toLowerCase() === "no") return "no";
  return "accent";
}

/** Recent bets across a group's markets, newest first, for the live ticker. */
export async function getGroupTicker(groupId: string, limit = 12): Promise<TickerItem[]> {
  const positions = await prisma.position.findMany({
    where: { market: { groupId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      user: { select: { displayName: true } },
      option: { select: { label: true } },
      market: { select: { title: true } },
    },
  });

  return positions.map((p) => ({
    user: p.user.displayName,
    side: p.option.label,
    color: sideColor(p.option.label),
    market: p.market.title,
  }));
}
