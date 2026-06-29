"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Creator/admin resolve for a numeric (SCALAR) market: enter the actual value.
export default function ScalarDecision({
  marketId,
  unit,
}: {
  marketId: string;
  unit: string | null;
}) {
  const router = useRouter();
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function resolve() {
    if (val === "") return;
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/markets/${marketId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "now", value: Number(val) }),
    });
    if (r.ok) {
      router.refresh();
    } else {
      const d = await r.json().catch(() => ({}));
      setErr(d.error ?? "שגיאה בהכרעה.");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-[16px] border border-border bg-surface p-4">
      <div className="mb-2.5 text-[13px] font-extrabold text-muted">הכרעה — מה הייתה התוצאה?</div>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={unit ? `מספר (${unit})` : "מספר"}
          className="flex-1 rounded-[12px] border-[1.5px] border-border bg-surface px-3 py-3 text-[15px] font-bold outline-none focus:border-accent"
        />
        <button
          onClick={resolve}
          disabled={busy || val === ""}
          className="rounded-[12px] bg-[var(--text)] px-5 text-[14px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "…" : "הכרע"}
        </button>
      </div>
      <div className="mt-2 text-[11.5px] font-semibold text-faint">הניחוש הקרוב ביותר יזכה בקופה.</div>
      {err && <div className="mt-2 text-[12px] font-bold text-no">{err}</div>}
    </div>
  );
}
