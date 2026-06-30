import { prisma } from "@/lib/db";
import { marketProfits } from "@/lib/payout";
import { buildPortfolioSeries } from "@/lib/charts";
import { poolFor, sideKind, displayLabel } from "@/lib/markets";
import { nowMs } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";
import type { ChartSeries } from "@/components/LineChart";
import type { Dictionary } from "@/lib/i18n";

export interface OpenPosition {
  marketId: string;
  title: string;
  imageUrl: string | null;
  sideLabel: string;
  sideKind: "yes" | "no" | "accent";
  stake: number; // agorot
  toWin: number; // agorot (parimutuel estimate at current pool)
}

export interface HistoryItem {
  marketId: string;
  title: string;
  imageUrl: string | null;
  sideLabel: string;
  won: boolean;
  profit: number; // agorot, signed
}

export interface ProfileData {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string; // membership role in this group
    createdAt: Date;
  };
  stats: {
    realizedNet: number;
    totalStaked: number;
    openCount: number;
    betsEntered: number;
    betsCreated: number;
    won: number;
    lost: number;
    winRate: number | null;
    dayStreak: number; // consecutive days with at least one bet
    winStreak: number; // current "called it" run (consecutive recent wins)
  };
  portfolio: ChartSeries;
  openPositions: OpenPosition[];
  history: HistoryItem[];
}

export async function getProfile(
  userId: string,
  groupId: string,
  dict: Dictionary,
): Promise<ProfileData | null> {
  const [user, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.membership.findUnique({ where: { userId_groupId: { userId, groupId } } }),
  ]);
  if (!user) return null;

  const [positions, betsCreated] = await Promise.all([
    prisma.position.findMany({
      where: { userId, market: { groupId } },
      orderBy: { createdAt: "desc" },
      include: {
        option: { select: { label: true } },
        market: {
          select: { id: true, status: true, winningOptionId: true },
        },
      },
    }),
    prisma.market.count({ where: { creatorId: userId, groupId } }),
  ]);

  const totalStaked = positions.reduce((s, p) => s + p.amount, 0);
  const betsEntered = new Set(positions.map((p) => p.market.id)).size;

  // Markets the user participated in, fully loaded, to compute pools & payouts.
  const marketIds = [...new Set(positions.map((p) => p.market.id))];
  const markets = await prisma.market.findMany({
    where: { id: { in: marketIds } },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      positions: { select: { userId: true, optionId: true, amount: true, guess: true, soldAt: true, soldValue: true } },
    },
  });
  const marketById = new Map(markets.map((m) => [m.id, m]));

  // ---- Open positions (with parimutuel toWin estimate) ----
  const openPositions: OpenPosition[] = [];
  for (const p of positions) {
    if (p.soldAt) continue; // cashed-out — no longer an open position
    const m = marketById.get(p.market.id);
    if (!m || m.status !== MarketStatus.OPEN) continue;
    const { options, totalPot } = poolFor(
      m.options,
      m.positions.filter((q) => !q.soldAt),
      m.winningOptionId,
    );
    const opt = options.find((o) => o.id === p.optionId);
    const toWin = opt && opt.total > 0 ? Math.round((p.amount / opt.total) * totalPot) : p.amount;
    const isScalar = m.kind === "SCALAR";
    openPositions.push({
      marketId: m.id,
      title: m.title,
      imageUrl: m.imageUrl,
      sideLabel: isScalar
        ? `${dict.market.guess} ${p.guess ?? ""}`.trim()
        : displayLabel(p.option.label, dict),
      sideKind: isScalar ? "accent" : sideKind(p.option.label),
      stake: p.amount,
      toWin,
    });
  }

  // ---- Resolved markets: profit, win/loss, history, portfolio series ----
  const profitEntries: { resolvedAt: Date; profit: number }[] = [];
  const history: HistoryItem[] = [];
  let realizedNet = 0;
  let won = 0;
  let lost = 0;

  const resolvedMine = markets
    .filter(
      (m) =>
        m.status === MarketStatus.RESOLVED &&
        (m.winningOptionId || (m.kind === "SCALAR" && m.resolvedValue != null)),
    )
    .sort((a, b) => (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0));

  for (const m of resolvedMine) {
    const mine = marketProfits(m).find((r) => r.userId === userId);
    if (!mine) continue;
    realizedNet += mine.profit;
    const isWin = mine.profit > 0;
    if (mine.profit > 0) won++;
    else if (mine.profit < 0) lost++;
    profitEntries.push({ resolvedAt: m.resolvedAt ?? new Date(), profit: mine.profit });

    // The user's main side in this market (largest stake).
    const mineHere = m.positions.filter((p) => p.userId === userId);
    let sideLabel: string;
    if (m.kind === "SCALAR") {
      sideLabel = `${dict.market.guess} ${mineHere[0]?.guess ?? ""}`.trim();
    } else {
      const byOpt = new Map<string, number>();
      for (const p of mineHere) byOpt.set(p.optionId, (byOpt.get(p.optionId) ?? 0) + p.amount);
      const topOptId = [...byOpt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      sideLabel = displayLabel(m.options.find((o) => o.id === topOptId)?.label ?? "", dict);
    }

    history.push({
      marketId: m.id,
      title: m.title,
      imageUrl: m.imageUrl,
      sideLabel,
      won: isWin,
      profit: mine.profit,
    });
  }

  // Cashed-out positions realize P/L immediately, regardless of resolution.
  for (const p of positions) {
    if (!p.soldAt) continue;
    const profit = (p.soldValue ?? p.amount) - p.amount;
    realizedNet += profit;
    if (profit > 0) won++;
    else if (profit < 0) lost++;
    profitEntries.push({ resolvedAt: p.soldAt, profit });
    const mk = marketById.get(p.market.id);
    history.push({
      marketId: p.market.id,
      title: mk?.title ?? "",
      imageUrl: mk?.imageUrl ?? null,
      sideLabel: `${displayLabel(p.option.label, dict)} · ${dict.market.sold}`,
      won: profit > 0,
      profit,
    });
  }

  // ---- Streaks ----
  const dk = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const dayKeys = new Set(positions.map((p) => dk(p.createdAt)));
  let dayStreak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  if (!dayKeys.has(dk(cur))) cur.setDate(cur.getDate() - 1); // grace: today optional
  while (dayKeys.has(dk(cur))) {
    dayStreak++;
    cur.setDate(cur.getDate() - 1);
  }
  let winStreak = 0;
  for (const m of resolvedMine) {
    const r = marketProfits(m).find((x) => x.userId === userId);
    if (!r) continue;
    if (r.profit > 0) winStreak++;
    else break;
  }

  const decided = won + lost;

  return {
    user: {
      id: user.id,
      name: user.displayName,
      avatarUrl: user.avatarUrl,
      role: membership?.role ?? "MEMBER",
      createdAt: user.createdAt,
    },
    stats: {
      realizedNet,
      totalStaked,
      openCount: openPositions.length,
      betsEntered,
      betsCreated,
      won,
      lost,
      winRate: decided > 0 ? won / decided : null,
      dayStreak,
      winStreak,
    },
    portfolio: buildPortfolioSeries(profitEntries, user.createdAt, nowMs(), dict.market.profitLoss),
    openPositions,
    history,
  };
}
