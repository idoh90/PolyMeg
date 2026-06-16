import Link from "next/link";
import Image from "next/image";
import { formatAgorot } from "@/lib/money";
import { timeUntil } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";
import type { OptionPool } from "@/lib/markets";

export interface MarketCardData {
  id: string;
  title: string;
  imageUrl: string | null;
  status: string;
  closesAt: Date;
  creatorName: string;
  totalPot: number;
  options: OptionPool[];
}

const STATUS_LABEL: Record<string, string> = {
  [MarketStatus.OPEN]: "פתוח",
  [MarketStatus.CLOSED]: "ממתין לתוצאה",
  [MarketStatus.RESOLVED]: "הוכרע",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    [MarketStatus.OPEN]: "bg-yes-dim text-yes",
    [MarketStatus.CLOSED]: "bg-surface-2 text-muted",
    [MarketStatus.RESOLVED]: "bg-surface-2 text-accent",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
        map[status] ?? "bg-surface-2 text-muted"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function MarketCard({ market }: { market: MarketCardData }) {
  return (
    <Link
      href={`/bets/${market.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/60"
    >
      <div className="flex items-start gap-3">
        {market.imageUrl ? (
          <Image
            src={market.imageUrl}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xl">
            🎲
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug">
            {market.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted">מאת {market.creatorName}</p>
        </div>
        <StatusBadge status={market.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        {market.options.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-2">
              <div
                className={`absolute inset-y-0 left-0 ${
                  o.isWinner ? "bg-yes/30" : "bg-accent/20"
                }`}
                style={{ width: `${o.pct}%` }}
              />
              <div className="relative flex h-full items-center justify-between px-2 text-sm">
                <span className="truncate">
                  {o.label}
                  {o.isWinner && " ✓"}
                </span>
                <span className="font-semibold text-muted">{o.pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>קופה {formatAgorot(market.totalPot)}</span>
        <span>
          {market.status === MarketStatus.OPEN
            ? `נסגר ${timeUntil(market.closesAt)}`
            : market.status === MarketStatus.CLOSED
              ? "ממתין לתוצאה"
              : "הוכרע"}
        </span>
      </div>
    </Link>
  );
}
