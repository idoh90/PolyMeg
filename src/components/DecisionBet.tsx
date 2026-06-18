"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: string; label: string };

export default function DecisionBet({
  marketId,
  options,
  closesAtISO,
  pendingWinnerOptionId,
}: {
  marketId: string;
  options: Opt[];
  closesAtISO: string;
  pendingWinnerOptionId: string | null;
}) {
  const router = useRouter();
  const closesAt = new Date(closesAtISO).getTime();
  const [now, setNow] = useState(() => Date.now());
  const [sel, setSel] = useState<string | null>(pendingWinnerOptionId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ended = now >= closesAt;

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ended]);

  const pendingLabel = options.find((o) => o.id === pendingWinnerOptionId)?.label;

  async function call(mode: "now" | "schedule", winningOptionId: string | null) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/markets/${marketId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, winningOptionId }),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "הפעולה נכשלה.");
    }
    setBusy(false);
  }

  function resolveNow() {
    if (!sel) return setError("בחר את האפשרות המנצחת.");
    if (!confirm("להכריע עכשיו ולחלק את הקופה? לא ניתן לבטל.")) return;
    call("now", sel);
  }

  function schedule() {
    if (!sel) return setError("בחר אפשרות.");
    call("schedule", sel);
  }

  return (
    <div className="rounded-[16px] border-[1.5px] border-accent-soft bg-surface p-4">
      <h3 className="mb-1 font-extrabold">החלטה</h3>
      <p className="mb-3 text-sm text-muted">
        {ended
          ? "הזמן נגמר — בחר מי ניצח כדי לחלק את הקופה."
          : "בחר מנצח: הכרע עכשיו, או קבע שייכנס לתוקף כשייגמר הזמן (ניתן לשנות עד אז)."}
      </p>

      {pendingWinnerOptionId && !ended && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-sm">
          <span className="font-bold text-accent">
            מתוכנן: {pendingLabel} — ייכנס לתוקף בסיום
          </span>
          <button
            onClick={() => call("schedule", null)}
            disabled={busy}
            className="text-xs font-bold text-no disabled:opacity-50"
          >
            בטל
          </button>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setSel(o.id)}
            className={`rounded-xl border px-3 py-2.5 text-right text-sm font-bold transition ${
              sel === o.id
                ? "border-yes bg-yes-b text-yes"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {o.label} ניצח
          </button>
        ))}
      </div>

      {error && <p className="mb-2 text-sm text-no">{error}</p>}

      <div className="flex flex-col gap-2">
        {!ended && (
          <button
            onClick={schedule}
            disabled={busy}
            className="w-full rounded-[13px] border border-accent bg-accent-soft py-2.5 font-bold text-accent disabled:opacity-50"
          >
            {busy ? "…" : "קבע לסיום הזמן"}
          </button>
        )}
        <button
          onClick={resolveNow}
          disabled={busy}
          className="w-full rounded-[13px] bg-yes py-3 font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "מכריע…" : "הכרע עכשיו וחלק את הקופה"}
        </button>
      </div>
    </div>
  );
}
