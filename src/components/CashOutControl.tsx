"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Sell an open position back to the pool at its current value.
export default function CashOutControl({ positionId }: { positionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function sell() {
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/positions/${positionId}/cashout`, { method: "POST" });
    if (r.ok) {
      router.refresh();
    } else {
      const d = await r.json().catch(() => ({}));
      setErr(d.error ?? "שגיאה");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={sell}
      disabled={busy}
      title={err || "מכירה לפי השווי הנוכחי"}
      className="pressable flex-none rounded-full border border-accent-soft bg-accent-soft px-2.5 py-1 text-[11px] font-extrabold text-accent disabled:opacity-50"
    >
      {busy ? "…" : "מכור"}
    </button>
  );
}
