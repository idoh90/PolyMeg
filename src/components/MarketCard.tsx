"use client";

import { useRouter } from "next/navigation";
import { useBetSheet, type SheetMarket } from "@/components/BetSheet";
import { sideKind } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";

export interface MarketCardData {
  id: string;
  title: string;
  imageUrl: string | null;
  creatorName: string;
  status: string;
  minStake: number; // agorot
  pot: number; // agorot
  potText: string;
  timeText: string;
  isBinary: boolean;
  options: { id: string; label: string; pct: number; total: number; isWinner: boolean }[];
}

function statusInfo(status: string) {
  if (status === MarketStatus.OPEN) return { label: "פתוח", cls: "bg-yes-b text-yes" };
  if (status === MarketStatus.CLOSED) return { label: "ממתין", cls: "bg-surface-2 text-muted" };
  return { label: "הוכרע", cls: "bg-accent-soft text-accent" };
}

export default function MarketCard({ market }: { market: MarketCardData }) {
  const router = useRouter();
  const { open } = useBetSheet();
  const st = statusInfo(market.status);
  const isOpen = market.status === MarketStatus.OPEN;

  const sheet: SheetMarket = {
    id: market.id,
    title: market.title,
    imageUrl: market.imageUrl,
    minStake: market.minStake,
    pot: market.pot,
    options: market.options.map((o) => ({
      id: o.id,
      label: o.label,
      total: o.total,
      pct: o.pct,
    })),
  };

  const yes = market.options[0];
  const no = market.options[1];

  return (
    <div
      onClick={() => router.push(`/bets/${market.id}`)}
      className="cursor-pointer rounded-[18px] border border-border bg-surface p-[15px] shadow-[0_1px_2px_rgba(15,19,32,.03)] transition hover:border-accent/40"
    >
      <div className="flex items-start gap-3">
        <Tile imageUrl={market.imageUrl} />
        <div className="min-w-0 flex-1">
          <div dir="auto" className="text-[15px] font-bold leading-tight">
            {market.title}
          </div>
          <div className="mt-1 text-xs font-semibold text-faint">מאת {market.creatorName}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${st.cls}`}>
          {st.label}
        </span>
      </div>

      {market.isBinary ? (
        <div className="mt-3 flex gap-2.5">
          <SideButton
            label={yes.label}
            pct={yes.pct}
            disabled={!isOpen}
            onClick={(e) => {
              e.stopPropagation();
              open(sheet, yes.id);
            }}
          />
          <SideButton
            label={no.label}
            pct={no.pct}
            disabled={!isOpen}
            onClick={(e) => {
              e.stopPropagation();
              open(sheet, no.id);
            }}
          />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-[7px]">
          {market.options.map((o) => (
            <div key={o.id} className="relative h-[30px] overflow-hidden rounded-[9px] bg-surface-2">
              <div
                className="absolute inset-y-0 right-0"
                style={{
                  width: `${o.pct}%`,
                  background: o.isWinner ? "var(--yes-b)" : "var(--accent-soft)",
                }}
              />
              <div className="relative flex h-full items-center justify-between px-2.5 text-[13px] font-bold">
                <span>
                  {o.label}
                  {o.isWinner && " ✓"}
                </span>
                <span className="text-muted">{o.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-between text-xs font-semibold text-muted">
        <span>קופה {market.potText}</span>
        <span>{market.timeText}</span>
      </div>
    </div>
  );
}

function Tile({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[23px]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        "🎲"
      )}
    </div>
  );
}

function SideButton({
  label,
  pct,
  disabled,
  onClick,
}: {
  label: string;
  pct: number;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const k = sideKind(label);
  const cls =
    k === "no"
      ? "border-no-b bg-no-b text-no"
      : k === "yes"
        ? "border-yes-b bg-yes-b text-yes"
        : "border-accent-soft bg-accent-soft text-accent";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-[11px] text-sm font-extrabold disabled:opacity-60 ${cls}`}
    >
      {label} <span className="opacity-65">{pct}¢</span>
    </button>
  );
}
