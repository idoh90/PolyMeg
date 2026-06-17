import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { autoCloseExpired, poolFor, sideKind } from "@/lib/markets";
import { buildPriceHistory } from "@/lib/charts";
import { formatAgorot } from "@/lib/money";
import { timeUntil, nowMs } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";
import Avatar from "@/components/Avatar";
import PriceChart from "@/components/PriceChart";
import BuyOptionList from "@/components/BuyOptionList";
import ResolveBet from "@/components/ResolveBet";
import type { SheetMarket } from "@/components/BetSheet";

const SIDE_HEX = { yes: "#15b87a", no: "#f0405a", accent: "#2b6ef2" };

function valueAt(points: { x: number; y: number }[], t: number): number {
  if (!points.length) return 0;
  let v = points[0].y;
  for (const p of points) {
    if (p.x <= t) v = p.y;
    else break;
  }
  return v;
}

export default async function BetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await autoCloseExpired();
  const { id } = await params;
  const user = await getCurrentUser();

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      options: { orderBy: { sortOrder: "asc" } },
      positions: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!market || !user) notFound();

  const { options, totalPot } = poolFor(market.options, market.positions, market.winningOptionId);
  const isOpen = market.status === MarketStatus.OPEN;
  const isResolved = market.status === MarketStatus.RESOLVED;
  const canResolve =
    market.status === MarketStatus.CLOSED &&
    (market.creatorId === user.id || user.isAdmin);

  const ranked = [...options].sort((a, b) => b.pct - a.pct);
  const top = ranked[0];
  const topKind = sideKind(top.label);
  const topColor = SIDE_HEX[topKind];

  // Price history + 24h change for the leading option.
  const endTime = market.resolvedAt ? market.resolvedAt.getTime() : nowMs();
  const priceSeries = buildPriceHistory(market.options, market.positions, endTime);
  const topSeries = priceSeries.find((s) => s.label === top.label);
  const change = topSeries
    ? Math.round(
        topSeries.points[topSeries.points.length - 1].y - valueAt(topSeries.points, endTime - 86400000),
      )
    : 0;

  const sheet: SheetMarket = {
    id: market.id,
    title: market.title,
    imageUrl: market.imageUrl,
    minStake: market.minStake,
    pot: totalPot,
    options: options.map((o) => ({ id: o.id, label: o.label, total: o.total, pct: o.pct })),
  };

  const activity = [...market.positions].reverse();

  return (
    <div className="pb-8">
      {/* top bar */}
      <div className="flex items-center gap-3 px-[18px] pb-3.5 pt-1.5">
        <Link
          href="/dashboard"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-[15px] font-extrabold text-muted">פרטי הימור</span>
      </div>

      <div className="px-[18px]">
        {/* header */}
        <div className="mb-[18px] flex items-start gap-3">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-surface-2 text-[28px]">
            {market.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={market.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              "🎲"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div dir="auto" className="text-xl font-extrabold leading-tight">
              {market.title}
            </div>
            <Link
              href={`/profile/${market.creator.id}`}
              className="mt-1 block text-[12.5px] font-semibold text-faint hover:underline"
            >
              מאת {market.creator.name} · קופה {formatAgorot(totalPot)}
            </Link>
          </div>
        </div>

        {/* big price */}
        <div className="mb-1 flex items-baseline gap-2.5">
          <span className="text-[44px] font-black leading-none" style={{ color: topColor }}>
            {top.pct}
            <span className="text-[22px]">%</span>
          </span>
          <span className="text-[15px] font-bold text-faint">{top.label}</span>
          <span
            className="me-auto text-sm font-extrabold"
            style={{ color: isResolved ? "var(--muted)" : change >= 0 ? "var(--yes)" : "var(--no)" }}
          >
            {isResolved ? "הוכרע" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% היום`}
          </span>
        </div>
        <div className="mb-3 text-[13px] font-semibold text-muted">סיכוי משתמע מתוך הקופה</div>

        {/* chart */}
        {market.positions.length > 0 ? (
          <div className="mb-5 rounded-[18px] border border-border bg-surface p-2">
            <PriceChart series={priceSeries} />
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-2 pb-1">
              {priceSeries.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted">{s.label}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted">
            עדיין אין הימורים — היה הראשון!
          </div>
        )}

        {/* buy / results */}
        <div className="mb-2.5 text-[15px] font-extrabold">{isOpen ? "קנה אפשרות" : "תוצאות"}</div>
        <div className="mb-5">
          <BuyOptionList sheet={sheet} isOpen={isOpen} winningOptionId={market.winningOptionId} />
        </div>

        {/* resolve (creator/admin) */}
        {canResolve && (
          <div className="mb-5">
            <ResolveBet
              marketId={market.id}
              options={market.options.map((o) => ({ id: o.id, label: o.label }))}
            />
          </div>
        )}
        {!isOpen && !canResolve && !isResolved && (
          <div className="mb-5 rounded-[16px] border border-border bg-surface p-4 text-sm text-muted">
            ההימור נסגר וממתין ש{market.creator.name} יקבע את התוצאה.
          </div>
        )}

        {/* criteria */}
        <div className="mb-5 rounded-[16px] border border-border bg-surface p-[15px]">
          <div className="mb-1.5 text-[13px] font-extrabold text-muted">איך זה נסגר</div>
          <div dir="auto" className="whitespace-pre-wrap text-sm leading-relaxed">
            {market.criteria}
          </div>
        </div>

        {/* activity */}
        <div className="mb-2.5 text-[15px] font-extrabold">פעילות אחרונה</div>
        <div className="flex flex-col">
          {activity.map((p) => {
            const opt = market.options.find((o) => o.id === p.optionId);
            const k = sideKind(opt?.label ?? "");
            return (
              <Link
                href={`/profile/${p.userId}`}
                key={p.id}
                className="flex items-center gap-2.5 py-2.5"
              >
                <Avatar name={p.user.name} src={p.user.avatarUrl} size={34} />
                <div className="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight">
                  <span className="font-extrabold">{p.user.name}</span> קנה{" "}
                  <span className="font-extrabold" style={{ color: SIDE_HEX[k] }}>
                    {opt?.label}
                  </span>
                  <div className="text-xs font-semibold text-faint">{timeUntil(p.createdAt)}</div>
                </div>
                <span className="text-sm font-extrabold">{formatAgorot(p.amount)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
