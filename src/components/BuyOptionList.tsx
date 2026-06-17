"use client";

import { useBetSheet, type SheetMarket } from "@/components/BetSheet";
import { sideKind } from "@/lib/markets";

const SOFT = { yes: "var(--yes-b)", no: "var(--no-b)", accent: "var(--accent-soft)" };
const SOLID = { yes: "var(--yes)", no: "var(--no)", accent: "var(--accent)" };

export default function BuyOptionList({
  sheet,
  isOpen,
  winningOptionId,
}: {
  sheet: SheetMarket;
  isOpen: boolean;
  winningOptionId: string | null;
}) {
  const { open } = useBetSheet();

  return (
    <div className="flex flex-col gap-2.5">
      {sheet.options.map((o) => {
        const k = sideKind(o.label);
        const isWinner = o.id === winningOptionId;
        return (
          <button
            key={o.id}
            onClick={() => isOpen && open(sheet, o.id)}
            disabled={!isOpen}
            className="relative overflow-hidden rounded-[14px] border border-border bg-surface text-right disabled:cursor-default"
          >
            <div
              className="absolute inset-y-0 right-0"
              style={{ width: `${o.pct}%`, background: isWinner ? SOFT.yes : SOFT[k] }}
            />
            <div className="relative flex items-center justify-between px-[15px] py-3.5">
              <span className="text-[15px] font-bold">
                {o.label}
                {isWinner && <span className="text-yes"> ✓ זוכה</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-base font-extrabold" style={{ color: SOLID[k] }}>
                  {o.pct}¢
                </span>
                {isOpen && (
                  <span
                    className="rounded-[9px] px-3.5 py-[7px] text-xs font-extrabold text-white"
                    style={{ background: SOLID[k] }}
                  >
                    קנה
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
