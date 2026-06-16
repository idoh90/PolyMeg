import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { autoCloseExpired, poolFor } from "@/lib/markets";
import { computePayouts } from "@/lib/payout";
import { formatAgorot } from "@/lib/money";
import { formatDateTime, timeUntil, nowMs } from "@/lib/format";
import { buildPriceHistory } from "@/lib/charts";
import { MarketStatus } from "@/lib/constants";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import PlaceBet from "@/components/PlaceBet";
import ResolveBet from "@/components/ResolveBet";
import PriceChart from "@/components/PriceChart";

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

  const { options, totalPot } = poolFor(
    market.options,
    market.positions,
    market.winningOptionId,
  );
  const optionLabel = (oid: string) =>
    market.options.find((o) => o.id === oid)?.label ?? "?";

  // autoCloseExpired() above has already flipped any past-close OPEN bets to
  // CLOSED, so we can derive everything from status.
  const isOpen = market.status === MarketStatus.OPEN;
  const isResolved = market.status === MarketStatus.RESOLVED;
  const canResolve =
    market.status === MarketStatus.CLOSED &&
    (market.creatorId === user.id || user.isAdmin);

  // Per-user payout breakdown once resolved.
  const payouts = isResolved
    ? computePayouts(
        market.positions.map((p) => ({
          userId: p.userId,
          optionId: p.optionId,
          amount: p.amount,
        })),
        market.winningOptionId!,
      )
    : [];
  const nameById = new Map(market.positions.map((p) => [p.userId, p.user]));

  // Price (odds) history for the chart.
  const endTime = market.resolvedAt ? market.resolvedAt.getTime() : nowMs();
  const priceSeries = buildPriceHistory(market.options, market.positions, endTime);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        {market.imageUrl ? (
          <Image
            src={market.imageUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">
            🎲
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight">{market.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Link
              href={`/profile/${market.creator.id}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Avatar
                name={market.creator.name}
                src={market.creator.avatarUrl}
                size={20}
              />
              <span>{market.creator.name}</span>
            </Link>
            <span>•</span>
            <span>
              {isOpen
                ? `נסגר ${timeUntil(market.closesAt)} (${formatDateTime(market.closesAt)})`
                : `נסגר ב-${formatDateTime(market.closesAt)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-1 text-sm font-semibold text-muted">
          תנאי הכרעה
        </h2>
        <p className="whitespace-pre-wrap text-sm">{market.criteria}</p>
      </div>

      {/* Pool / options */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">קופה</h2>
          <span className="text-sm text-muted">סה״כ {formatAgorot(totalPot)}</span>
        </div>
        <div className="flex flex-col gap-2">
          {options.map((o) => (
            <div key={o.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={o.isWinner ? "font-semibold text-yes" : ""}>
                  {o.label}
                  {o.isWinner && " ✓ מנצח"}
                </span>
                <span className="text-muted">
                  {formatAgorot(o.total)} · {o.pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full ${o.isWinner ? "bg-yes" : "bg-accent"}`}
                  style={{ width: `${o.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price history chart */}
      {market.positions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">היסטוריית מחירים</h2>
          <PriceChart series={priceSeries} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {priceSeries.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-muted">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action: place / resolve / result */}
      {isOpen && (
        <PlaceBet
          marketId={market.id}
          options={market.options.map((o) => ({ id: o.id, label: o.label }))}
          minStake={market.minStake}
        />
      )}
      {canResolve && (
        <ResolveBet
          marketId={market.id}
          options={market.options.map((o) => ({ id: o.id, label: o.label }))}
        />
      )}
      {!isOpen && !canResolve && !isResolved && (
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          ההימור נסגר וממתין ש{market.creator.name} יקבע את התוצאה.
        </div>
      )}

      {/* Resolved payouts */}
      {isResolved && payouts.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">תוצאות</h2>
          <div className="flex flex-col gap-2">
            {payouts
              .slice()
              .sort((a, b) => b.profit - a.profit)
              .map((r) => {
                const u = nameById.get(r.userId);
                return (
                  <div
                    key={r.userId}
                    className="flex items-center gap-3 border-b border-border/60 pb-2 last:border-0"
                  >
                    <Link
                      href={`/profile/${r.userId}`}
                      className="flex flex-1 items-center gap-3 hover:underline"
                    >
                      <Avatar name={u?.name ?? "?"} src={u?.avatarUrl} size={28} />
                      <span className="text-sm">{u?.name ?? "?"}</span>
                    </Link>
                    <span className="text-xs text-muted">
                      הימר {formatAgorot(r.staked)}
                    </span>
                    <span
                      className={`w-20 text-right font-semibold ${
                        r.profit > 0
                          ? "text-yes"
                          : r.profit < 0
                            ? "text-no"
                            : "text-muted"
                      }`}
                    >
                      {r.profit > 0 ? "+" : ""}
                      {formatAgorot(r.profit)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Participants */}
      {market.positions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">
            כניסות ({market.positions.length})
          </h2>
          <div className="flex flex-col gap-2">
            {market.positions.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <Link
                  href={`/profile/${p.userId}`}
                  className="flex flex-1 items-center gap-3 hover:underline"
                >
                  <Avatar name={p.user.name} src={p.user.avatarUrl} size={24} />
                  <span>{p.user.name}</span>
                </Link>
                <span className="text-muted">{optionLabel(p.optionId)}</span>
                <span className="w-20 text-right font-medium">
                  {formatAgorot(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
