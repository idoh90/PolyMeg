"use client";

import { useRouter } from "next/navigation";
import { useBetSheet, type SheetMarket } from "@/components/BetSheet";
import { sideKind, displayLabel } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import { interpolate } from "@/lib/i18n/interpolate";
import type { Dictionary } from "@/lib/i18n";

export interface MarketCardData {
  id: string;
  groupId: string;
  title: string;
  imageUrl: string | null;
  emoji: string | null;
  creatorName: string;
  status: string;
  minStake: number; // agorot
  fixedStake: number | null; // agorot, when the market locks the bet amount
  kind: string; // BINARY | MULTI | SCALAR
  scalarMin: number | null;
  scalarMax: number | null;
  scalarUnit: string | null;
  pot: number; // agorot
  potText: string;
  timeText: string;
  isBinary: boolean;
  options: { id: string; label: string; pct: number; total: number; isWinner: boolean }[];
}

function statusInfo(status: string, dict: Dictionary) {
  if (status === MarketStatus.OPEN) return { label: dict.market.statusOpen, cls: "bg-yes-b text-yes" };
  if (status === MarketStatus.CLOSED) return { label: dict.market.statusClosed, cls: "bg-surface-2 text-muted" };
  return { label: dict.market.statusResolved, cls: "bg-accent-soft text-accent" };
}

export default function MarketCard({ market }: { market: MarketCardData }) {
  const { dict } = useT();
  const router = useRouter();
  const { open } = useBetSheet();
  const st = statusInfo(market.status, dict);
  const isOpen = market.status === MarketStatus.OPEN;

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
      onClick={() => router.push(`/g/${market.groupId}/bets/${market.id}`)}
      className="pressable cursor-pointer rounded-[18px] border border-border bg-surface p-[15px] shadow-[0_1px_2px_rgba(15,19,32,.03)] transition hover:border-accent/40"
    >
      <div className="flex items-start gap-3">
        <Tile imageUrl={market.imageUrl} emoji={market.emoji} />
        <div className="min-w-0 flex-1">
          <div dir="auto" className="text-[15px] font-bold leading-tight">
            {market.title}
          </div>
          <div className="mt-1 text-xs font-semibold text-faint">{interpolate(dict.market.by, { name: market.creatorName })}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${st.cls}`}>
          {st.label}
        </span>
      </div>

      {market.kind === "SCALAR" ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open(sheet, market.options[0]?.id);
          }}
          disabled={!isOpen}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-accent-soft bg-accent-soft py-[11px] text-sm font-extrabold text-accent disabled:opacity-60"
        >
          🔢 {dict.market.guessNumber} · {market.scalarMin}–{market.scalarMax}
          {market.scalarUnit ? ` ${market.scalarUnit}` : ""}
        </button>
      ) : market.isBinary ? (
        <div className="mt-3 flex gap-2.5">
          <SideButton
            label={yes.label}
            display={displayLabel(yes.label, dict)}
            pct={yes.pct}
            disabled={!isOpen}
            onClick={(e) => {
              e.stopPropagation();
              open(sheet, yes.id);
            }}
          />
          <SideButton
            label={no.label}
            display={displayLabel(no.label, dict)}
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
                className="absolute inset-y-0 start-0"
                style={{
                  width: `${o.pct}%`,
                  background: o.isWinner ? "var(--yes-b)" : "var(--accent-soft)",
                }}
              />
              <div className="relative flex h-full items-center justify-between px-2.5 text-[13px] font-bold">
                <span>
                  {displayLabel(o.label, dict)}
                  {o.isWinner && " ✓"}
                </span>
                <span className="text-muted">{o.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-between text-xs font-semibold text-muted">
        <span>{dict.market.pot} {market.potText}</span>
        <span>{market.timeText}</span>
      </div>
    </div>
  );
}

function Tile({ imageUrl, emoji }: { imageUrl: string | null; emoji: string | null }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[23px]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        emoji ?? "🎲"
      )}
    </div>
  );
}

function SideButton({
  label,
  display,
  pct,
  disabled,
  onClick,
}: {
  label: string;
  display: string;
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
      {display} <span className="opacity-65">{pct}%</span>
    </button>
  );
}
