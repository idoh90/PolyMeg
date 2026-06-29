import { prisma } from "@/lib/db";
import { sideKind } from "@/lib/markets";
import { formatAgorot } from "@/lib/money";
import { groupReactions, type GroupedReaction } from "@/lib/social";

export type CommentBadge = { label: string; amount: string; kind: "yes" | "no" | "accent" };

export type CommentView = {
  id: string;
  body: string;
  ts: number;
  author: { id: string; name: string; avatarUrl: string | null };
  badge: CommentBadge | null;
  reactions: GroupedReaction[];
  mine: boolean;
  children: CommentView[];
};

/**
 * Load a market's comment thread (one reply level) with author info, grouped
 * emoji reactions, and each author's position-in-this-market badge.
 */
export async function getMarketComments(
  marketId: string,
  myId: string | null,
): Promise<CommentView[]> {
  const [rows, positions] = await Promise.all([
    prisma.comment.findMany({
      where: { marketId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    }),
    prisma.position.findMany({
      where: { marketId },
      select: { userId: true, amount: true, option: { select: { label: true } } },
    }),
  ]);

  // Each author's dominant side in this market: option they staked the most on.
  const byUser = new Map<string, Map<string, number>>();
  for (const p of positions) {
    const m = byUser.get(p.userId) ?? new Map<string, number>();
    m.set(p.option.label, (m.get(p.option.label) ?? 0) + p.amount);
    byUser.set(p.userId, m);
  }
  function badgeFor(userId: string): CommentBadge | null {
    const m = byUser.get(userId);
    if (!m || m.size === 0) return null;
    let bestLabel = "";
    let best = -1;
    for (const [label, amt] of m) {
      if (amt > best) {
        best = amt;
        bestLabel = label;
      }
    }
    return { label: bestLabel, amount: formatAgorot(best), kind: sideKind(bestLabel) };
  }

  const view = (r: (typeof rows)[number]): CommentView => ({
    id: r.id,
    body: r.body,
    ts: r.createdAt.getTime(),
    author: { id: r.user.id, name: r.user.displayName, avatarUrl: r.user.avatarUrl },
    badge: badgeFor(r.userId),
    reactions: groupReactions(r.reactions, myId),
    mine: r.userId === myId,
    children: [],
  });

  const map = new Map<string, CommentView>();
  const roots: CommentView[] = [];
  for (const r of rows) map.set(r.id, view(r));
  for (const r of rows) {
    const node = map.get(r.id)!;
    const parent = r.parentId ? map.get(r.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
