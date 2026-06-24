import { prisma } from "@/lib/db";
import { computePayouts } from "@/lib/payout";
import { MarketStatus } from "@/lib/constants";

export interface MyGroup {
  id: string;
  name: string;
  imageUrl: string | null;
  emoji: string | null;
  category: string | null;
  role: string;
  memberCount: number;
  openCount: number;
  net: number; // this account's realized P/L in the group (agorot)
  unread: number; // unread notifications in the group
}

/** Active groups + pending join requests for an account, with light stats. */
export async function getMyGroups(userId: string): Promise<{
  groups: MyGroup[];
  pending: { id: string; name: string; imageUrl: string | null; emoji: string | null; category: string | null }[];
}> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { group: { include: { _count: { select: { members: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const activeIds = memberships.filter((m) => m.status === "ACTIVE").map((m) => m.groupId);

  const openByGroup = new Map<string, number>();
  const netByGroup = new Map<string, number>();
  const unreadByGroup = new Map<string, number>();

  if (activeIds.length) {
    const [openGrouped, resolved, unreadGrouped] = await Promise.all([
      prisma.market.groupBy({
        by: ["groupId"],
        where: { groupId: { in: activeIds }, status: MarketStatus.OPEN },
        _count: { _all: true },
      }),
      prisma.market.findMany({
        where: { groupId: { in: activeIds }, status: MarketStatus.RESOLVED, winningOptionId: { not: null } },
        select: {
          groupId: true,
          winningOptionId: true,
          positions: { select: { userId: true, optionId: true, amount: true } },
        },
      }),
      prisma.notification.groupBy({
        by: ["groupId"],
        where: { userId, groupId: { in: activeIds }, read: false },
        _count: { _all: true },
      }),
    ]);

    for (const g of openGrouped) openByGroup.set(g.groupId, g._count._all);
    for (const g of unreadGrouped) if (g.groupId) unreadByGroup.set(g.groupId, g._count._all);
    for (const m of resolved) {
      const mine = computePayouts(m.positions, m.winningOptionId!).find((r) => r.userId === userId);
      if (mine) netByGroup.set(m.groupId, (netByGroup.get(m.groupId) ?? 0) + mine.profit);
    }
  }

  const groups: MyGroup[] = memberships
    .filter((m) => m.status === "ACTIVE")
    .map((m) => ({
      id: m.groupId,
      name: m.group.name,
      imageUrl: m.group.imageUrl,
      emoji: m.group.emoji,
      category: m.group.category,
      role: m.role,
      memberCount: m.group._count.members,
      openCount: openByGroup.get(m.groupId) ?? 0,
      net: netByGroup.get(m.groupId) ?? 0,
      unread: unreadByGroup.get(m.groupId) ?? 0,
    }));

  const pending = memberships
    .filter((m) => m.status === "PENDING")
    .map((m) => ({
      id: m.groupId,
      name: m.group.name,
      imageUrl: m.group.imageUrl,
      emoji: m.group.emoji,
      category: m.group.category,
    }));

  return { groups, pending };
}
