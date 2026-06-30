"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

// Sends a settlement reminder to a debtor.
export default function NudgeButton({
  groupId,
  toUserId,
  amount,
}: {
  groupId: string;
  toUserId: string;
  amount: number;
}) {
  const { dict } = useT();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function nudge() {
    setBusy(true);
    const r = await fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, toUserId, amount }),
    });
    if (r.ok) setSent(true);
    setBusy(false);
  }

  return (
    <button
      onClick={nudge}
      disabled={busy || sent}
      className="pressable flex-none rounded-full bg-no px-3 py-1.5 text-[12px] font-extrabold text-white disabled:opacity-60"
    >
      {sent ? dict.nudge.sent : busy ? "…" : dict.nudge.remind}
    </button>
  );
}
