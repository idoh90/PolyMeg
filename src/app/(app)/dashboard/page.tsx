import Link from "next/link";
import { prisma } from "@/lib/db";
import { autoCloseExpired, poolFor } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";
import MarketCard, { type MarketCardData } from "@/components/MarketCard";

const FILTERS = [
  { key: "all", label: "הכול" },
  { key: "open", label: "פתוחים" },
  { key: "closed", label: "ממתינים לתוצאה" },
  { key: "resolved", label: "הוכרעו" },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await autoCloseExpired();

  const { filter = "all" } = await searchParams;
  const statusFilter =
    filter === "open"
      ? MarketStatus.OPEN
      : filter === "closed"
        ? MarketStatus.CLOSED
        : filter === "resolved"
          ? MarketStatus.RESOLVED
          : undefined;

  const markets = await prisma.market.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true } },
      options: { orderBy: { sortOrder: "asc" } },
      positions: { select: { optionId: true, amount: true } },
    },
  });

  const cards: MarketCardData[] = markets.map((m) => {
    const { options, totalPot } = poolFor(
      m.options,
      m.positions,
      m.winningOptionId,
    );
    return {
      id: m.id,
      title: m.title,
      imageUrl: m.imageUrl,
      status: m.status,
      closesAt: m.closesAt,
      creatorName: m.creator.name,
      totalPot,
      options,
    };
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key || (f.key === "all" && !filter);
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/dashboard" : `/dashboard?filter=${f.key}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-accent bg-surface-2 text-text"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
          <p className="mb-3">אין כאן הימורים עדיין.</p>
          <Link
            href="/bets/new"
            className="inline-block rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            צור את ההימור הראשון
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </div>
  );
}
