"use client";

import { useBetSheet, type SheetMarket } from "@/components/BetSheet";

// Opens the bet sheet for a numeric market (single synthetic option + guess).
export default function ScalarBet({ sheet }: { sheet: SheetMarket }) {
  const { open } = useBetSheet();
  return (
    <button
      onClick={() => open(sheet, sheet.options[0]?.id)}
      className="pressable flex w-full items-center justify-center gap-2 rounded-[14px] bg-accent py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_22px_-12px_var(--accent)]"
    >
      🔢 נחש מספר
    </button>
  );
}
