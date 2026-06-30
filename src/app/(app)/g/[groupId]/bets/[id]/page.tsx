import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";
import { autoCloseExpired, poolFor, sideKind, displayLabel } from "@/lib/markets";
import { buildPriceHistory } from "@/lib/charts";
import { formatAgorot } from "@/lib/money";
import { timeUntil, nowMs } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/interpolate";
import Avatar from "@/components/Avatar";
import BackChevron from "@/components/BackChevron";
import PriceChart from "@/components/PriceChart";
import BuyOptionList from "@/components/BuyOptionList";
import DecisionBet from "@/components/DecisionBet";
import ScalarBet from "@/components/ScalarBet";
import ScalarDecision from "@/components/ScalarDecision";
import AdminBetControls from "@/components/AdminBetControls";
import PositionDeleteControl from "@/components/PositionDeleteControl";
import CashOutControl from "@/components/CashOutControl";
import ShareBet from "@/components/ShareBet";
import ReactionBar from "@/components/ReactionBar";
import CommentThread from "@/components/CommentThread";
import CalledItCard from "@/components/CalledItCard";
import { getMarketComments } from "@/lib/comments";
import { getReceipt } from "@/lib/receipts";
import { groupReactions } from "@/lib/social";
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
  params: Promise<{ groupId: string; id: string }>;
}) {
  await autoCloseExpired();
  const { groupId, id } = await params;
  const base = `/g/${groupId}`;
  const user = await getCurrentUser();
  if (!user) notFound();
  const { dict } = await getI18n();

  const [market, membership, comments, receipt, memberRows] = await Promise.all([
    prisma.market.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        options: { orderBy: { sortOrder: "asc" } },
        positions: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
            reactions: { select: { emoji: true, userId: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getMembership(user.id, groupId),
    getMarketComments(id, user.id),
    getReceipt(id),
    prisma.membership.findMany({
      where: { groupId, status: "ACTIVE" },
      select: { user: { select: { id: true, username: true, displayName: true } } },
    }),
  ]);
  if (!market || market.groupId !== groupId) notFound();

  const isAdmin = isAdminRole(membership?.role);
  const members = memberRows.map((m) => m.user);
  // live pool excludes cashed-out stakes
  const livePositions = market.positions.filter((p) => !p.soldAt);
  const { options, totalPot } = poolFor(market.options, livePositions, market.winningOptionId);
  const isOpen = market.status === MarketStatus.OPEN;
  const isResolved = market.status === MarketStatus.RESOLVED;
  const canDecide = !isResolved && (market.creatorId === user.id || isAdmin);

  const ranked = [...options].sort((a, b) => b.pct - a.pct);
  const top = ranked[0];
  const topKind = sideKind(top.label);
  const topColor = SIDE_HEX[topKind];

  // Price history + 24h change for the leading option.
  const endTime = market.resolvedAt ? market.resolvedAt.getTime() : nowMs();
  const priceSeries = buildPriceHistory(market.options, market.positions, endTime);
  const topSeries = priceSeries.find((s) => s.label === top.label);
  const change =
    topSeries && topSeries.points.length > 0
      ? Math.round(
          topSeries.points[topSeries.points.length - 1].y -
            valueAt(topSeries.points, endTime - 86400000),
        )
      : 0;

  const isScalar = market.kind === "SCALAR";
  const sheet: SheetMarket = {
    id: market.id,
    title: market.title,
    imageUrl: market.imageUrl,
    emoji: market.emoji,
    minStake: market.minStake,
    fixedStake: market.fixedStake,
    kind: market.kind,
    scalarMin: market.scalarMin,
    scalarMax: market.scalarMax,
    scalarUnit: market.scalarUnit,
    pot: totalPot,
    options: options.map((o) => ({ id: o.id, label: o.label, total: o.total, pct: o.pct })),
  };

  const activity = [...market.positions].reverse();

  return (
    <div className="pb-8">
      {/* top bar */}
      <div className="flex items-center gap-3 px-[18px] pb-3.5 pt-1.5">
        <Link
          href={base}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface"
        >
          <BackChevron />
        </Link>
        <span className="text-[15px] font-extrabold text-muted">{dict.betDetail.title}</span>
        <div className="ms-auto flex items-center gap-2">
          <ShareBet id={market.id} title={market.title} />
          {(market.creatorId === user.id || isAdmin) && (
            <Link
              href={`${base}/bets/${market.id}/edit`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-bold"
            >
              {dict.betDetail.edit}
            </Link>
          )}
        </div>
      </div>

      <div className="px-[18px]">
        {/* header */}
        <div className="mb-[18px] flex items-start gap-3">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-surface-2 text-[28px]">
            {market.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={market.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              market.emoji ?? "🎲"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div dir="auto" className="text-xl font-extrabold leading-tight">
              {market.title}
            </div>
            <Link
              href={`${base}/u/${market.creator.id}`}
              className="mt-1 block text-[12.5px] font-semibold text-faint hover:underline"
            >
              {interpolate(dict.market.by, { name: market.creator.displayName })} · {dict.market.pot} {formatAgorot(totalPot)}
            </Link>
            {market.recurring && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-extrabold text-accent">
                {interpolate(dict.betDetail.recurring, { n: market.seriesIndex ?? 1 })}
              </span>
            )}
          </div>
        </div>

        {/* called-it receipts */}
        {isResolved && receipt && <CalledItCard receipt={receipt} />}

        {isScalar ? (
          /* numeric market summary */
          <div className="mb-5 rounded-[18px] border border-border bg-surface p-4">
            <div className="text-[13px] font-extrabold text-muted">{dict.betDetail.guessRange}</div>
            <div className="mt-1 text-[28px] font-black leading-none">
              {market.scalarMin}–{market.scalarMax}
              {market.scalarUnit ? <span className="ms-1.5 text-[15px] font-bold text-faint">{market.scalarUnit}</span> : null}
            </div>
            {isResolved && market.resolvedValue != null ? (
              <div className="mt-2.5 text-[14px] font-extrabold text-yes">
                {dict.betDetail.resultLabel} {market.resolvedValue}
                {market.scalarUnit ? ` ${market.scalarUnit}` : ""} · {dict.betDetail.closestWon}
              </div>
            ) : (
              <div className="mt-2 text-[12.5px] font-semibold text-faint">
                {interpolate(dict.betDetail.guessesCount, { n: market.positions.length })} · {dict.betDetail.closestTakesPot}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* big price */}
            <div className="mb-1 flex items-baseline gap-2.5">
              <span className="text-[44px] font-black leading-none" style={{ color: topColor }}>
                {top.pct}
                <span className="text-[22px]">%</span>
              </span>
              <span className="text-[15px] font-bold text-faint">{displayLabel(top.label, dict)}</span>
              <span
                className="me-auto text-sm font-extrabold"
                style={{ color: isResolved ? "var(--muted)" : change >= 0 ? "var(--yes)" : "var(--no)" }}
              >
                {isResolved ? dict.market.statusResolved : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% ${dict.betDetail.today}`}
              </span>
            </div>
            <div className="mb-3 text-[13px] font-semibold text-muted">{dict.betDetail.impliedFromPot}</div>

            {/* chart — leading option's probability trend */}
            {market.positions.length > 0 && topSeries ? (
              <div className="mb-5 rounded-[18px] border border-border bg-surface p-3 shadow-[0_1px_2px_rgba(15,19,32,.03)]">
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className="text-[11.5px] font-extrabold text-muted">{dict.betDetail.probabilityTrend} · {displayLabel(top.label, dict)}</span>
                  <span className="text-[13px] font-extrabold" style={{ color: topColor }}>{top.pct}%</span>
                </div>
                <PriceChart series={[{ ...topSeries, color: topColor }]} />
              </div>
            ) : (
              <div className="mb-5 rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted">
                {dict.betDetail.noBetsBeFirst}
              </div>
            )}
          </>
        )}

        {/* buy / results */}
        <div className="mb-2.5 text-[15px] font-extrabold">{isOpen ? (isScalar ? dict.market.guessNumber : dict.betDetail.buyOption) : dict.betDetail.results}</div>
        <div className="mb-5">
          {isScalar ? (
            isOpen ? (
              <ScalarBet sheet={sheet} />
            ) : (
              <div className="rounded-[14px] border border-border bg-surface p-4 text-center text-sm font-semibold text-muted">
                {isResolved ? dict.betDetail.betResolved : dict.betDetail.closedToGuesses}
              </div>
            )
          ) : (
            <BuyOptionList sheet={sheet} isOpen={isOpen} winningOptionId={market.winningOptionId} />
          )}
        </div>

        {/* decision (creator/admin) */}
        {canDecide && (
          <div className="mb-5">
            {isScalar ? (
              <ScalarDecision marketId={market.id} unit={market.scalarUnit} />
            ) : (
              <DecisionBet
                marketId={market.id}
                options={market.options.map((o) => ({ id: o.id, label: o.label }))}
                closesAtISO={market.closesAt.toISOString()}
                pendingWinnerOptionId={market.pendingWinnerOptionId}
              />
            )}
          </div>
        )}
        {!isOpen && !canDecide && !isResolved && (
          <div className="mb-5 rounded-[16px] border border-border bg-surface p-4 text-sm text-muted">
            {interpolate(dict.betDetail.awaitingDecision, { name: market.creator.displayName })}
          </div>
        )}

        {/* admin debug controls */}
        {isAdmin && (
          <AdminBetControls marketId={market.id} isResolved={isResolved} />
        )}

        {/* criteria */}
        <div className="mb-5 rounded-[16px] border border-border bg-surface p-[15px]">
          <div className="mb-1.5 text-[13px] font-extrabold text-muted">{dict.betDetail.howItResolves}</div>
          <div dir="auto" className="whitespace-pre-wrap text-sm leading-relaxed">
            {market.criteria}
          </div>
        </div>

        {/* activity */}
        <div className="mb-2.5 text-[15px] font-extrabold">{dict.betDetail.recentActivity}</div>
        <div className="mb-6 flex flex-col gap-1">
          {activity.map((p) => {
            const opt = market.options.find((o) => o.id === p.optionId);
            const k = sideKind(opt?.label ?? "");
            return (
              <div key={p.id} className="border-b border-border py-2.5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`${base}/u/${p.userId}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <Avatar name={p.user.displayName} src={p.user.avatarUrl} size={34} />
                    <div className="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight">
                      <span className="font-extrabold">{p.user.displayName}</span>{" "}
                      {isScalar ? (
                        <>
                          {dict.betDetail.guessed} <span className="font-extrabold text-accent">{p.guess}</span>
                        </>
                      ) : (
                        <>
                          {dict.group.bought}{" "}
                          <span className="font-extrabold" style={{ color: SIDE_HEX[k] }}>
                            {displayLabel(opt?.label ?? "", dict)}
                          </span>
                        </>
                      )}
                      <div className="text-xs font-semibold text-faint">{timeUntil(p.createdAt, dict.time)}</div>
                    </div>
                  </Link>
                  <span className="text-sm font-extrabold">{formatAgorot(p.amount)}</span>
                  {p.soldAt ? (
                    <span className="flex-none rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-extrabold text-faint">
                      {dict.market.sold} · {formatAgorot(p.soldValue ?? 0)}
                    </span>
                  ) : market.cashOutEnabled && isOpen && !isScalar && p.userId === user.id ? (
                    <CashOutControl positionId={p.id} />
                  ) : null}
                  <PositionDeleteControl
                    positionId={p.id}
                    createdAtMs={p.createdAt.getTime()}
                    mine={p.userId === user.id}
                    isAdmin={isAdmin}
                    marketOpen={isOpen && !p.soldAt}
                  />
                </div>
                {p.shout && (
                  <div dir="auto" className="ms-[44px] mt-1.5 inline-block rounded-[10px] bg-surface-2 px-2.5 py-1 text-[12.5px] font-bold text-muted">
                    {interpolate(dict.betDetail.shoutQuote, { shout: p.shout })}
                  </div>
                )}
                <div className="ms-[44px] mt-1.5">
                  <ReactionBar positionId={p.id} initial={groupReactions(p.reactions, user.id)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* comments */}
        <CommentThread
          marketId={market.id}
          isAdmin={isAdmin}
          members={members}
          comments={comments}
        />
      </div>
    </div>
  );
}
