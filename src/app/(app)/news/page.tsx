import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatAgorot } from "@/lib/money";
import { timeUntil } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";

type NewsItem = {
  ts: number;
  icon: string;
  text: string;
  marketId: string;
};

export default async function NewsPage() {
  const [positions, markets] = await Promise.all([
    prisma.position.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: { select: { name: true } },
        option: { select: { label: true } },
        market: { select: { id: true, title: true } },
      },
    }),
    prisma.market.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        creator: { select: { name: true } },
        options: { select: { id: true, label: true } },
      },
    }),
  ]);

  const items: NewsItem[] = [];

  for (const p of positions) {
    items.push({
      ts: p.createdAt.getTime(),
      icon: "💸",
      text: `${p.user.name} קנה ${p.option.label} ב-${formatAgorot(p.amount)} · ${p.market.title}`,
      marketId: p.market.id,
    });
  }

  for (const m of markets) {
    items.push({
      ts: m.createdAt.getTime(),
      icon: "🆕",
      text: `${m.creator.name} פתח הימור: ${m.title}`,
      marketId: m.id,
    });
    if (m.status === MarketStatus.RESOLVED && m.winningOptionId && m.resolvedAt) {
      const winner = m.options.find((o) => o.id === m.winningOptionId)?.label ?? "?";
      items.push({
        ts: m.resolvedAt.getTime(),
        icon: "🏁",
        text: `ההימור "${m.title}" הוכרע: ${winner} ניצח`,
        marketId: m.id,
      });
    }
  }

  items.sort((a, b) => b.ts - a.ts);
  const feed = items.slice(0, 60);

  return (
    <div className="px-[18px] pb-8 pt-3">
      <h1 className="mb-1 text-2xl font-extrabold">חדשות</h1>
      <p className="mb-4 text-sm text-muted">כל מה שקורה — מי קנה מה, מי ניצח, הימורים חדשים.</p>

      {feed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          עדיין אין תנועות.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {feed.map((it, i) => (
            <li key={i}>
              <Link
                href={`/bets/${it.marketId}`}
                className="pressable flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg">
                  {it.icon}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{it.text}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeUntil(new Date(it.ts))}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
