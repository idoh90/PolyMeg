import { prisma } from "@/lib/db";
import { MarketStatus } from "@/lib/constants";

export interface MyGroup {
  id: string;
  name: string;
  imageUrl: string | null;
  role: string;
  memberCount: number;
  openCount: number;
}

/** Active groups + pending join requests for an account, with light stats. */
export async function getMyGroups(userId: string): Promise<{
  groups: MyGroup[];
  pending: { id: string; name: string; imageUrl: string | null }[];
}> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { group: { include: { _count: { select: { members: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const activeIds = memberships.filter((m) => m.status === "ACTIVE").map((m) => m.groupId);
  const openByGroup = new Map<string, number>();
  if (activeIds.length) {
    const grouped = await prisma.market.groupBy({
      by: ["groupId"],
      where: { groupId: { in: activeIds }, status: MarketStatus.OPEN },
      _count: { _all: true },
    });
    for (const g of grouped) openByGroup.set(g.groupId, g._count._all);
  }

  const groups: MyGroup[] = memberships
    .filter((m) => m.status === "ACTIVE")
    .map((m) => ({
      id: m.groupId,
      name: m.group.name,
      imageUrl: m.group.imageUrl,
      role: m.role,
      memberCount: m.group._count.members,
      openCount: openByGroup.get(m.groupId) ?? 0,
    }));

  const pending = memberships
    .filter((m) => m.status === "PENDING")
    .map((m) => ({ id: m.groupId, name: m.group.name, imageUrl: m.group.imageUrl }));

  return { groups, pending };
}
