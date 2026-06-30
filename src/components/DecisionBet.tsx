"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { interpolate } from "@/lib/i18n/interpolate";
import { displayLabel } from "@/lib/markets";

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
  const { dict } = useT();
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
      setError(d.error ?? dict.decision.actionFailed);
    }
    setBusy(false);
  }

  function resolveNow() {
    if (!sel) return setError(dict.decision.chooseWinner);
    if (!confirm(dict.decision.confirmResolve)) return;
    call("now", sel);
  }

  function schedule() {
    if (!sel) return setError(dict.betSheet.chooseOption);
    call("schedule", sel);
  }

  return (
    <div className="rounded-[16px] border-[1.5px] border-accent-soft bg-surface p-4">
      <h3 className="mb-1 font-extrabold">{dict.decision.title}</h3>
      <p className="mb-3 text-sm text-muted">
        {ended ? dict.decision.endedHint : dict.decision.openHint}
      </p>

      {pendingWinnerOptionId && !ended && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-sm">
          <span className="font-bold text-accent">
            {interpolate(dict.decision.scheduled, { label: displayLabel(pendingLabel ?? "", dict) })}
          </span>
          <button
            onClick={() => call("schedule", null)}
            disabled={busy}
            className="text-xs font-bold text-no disabled:opacity-50"
          >
            {dict.common.cancel}
          </button>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setSel(o.id)}
            className={`rounded-xl border px-3 py-2.5 text-start text-sm font-bold transition ${
              sel === o.id
                ? "border-yes bg-yes-b text-yes"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {displayLabel(o.label, dict)} {dict.decision.won}
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
            {busy ? "…" : dict.decision.scheduleForClose}
          </button>
        )}
        <button
          onClick={resolveNow}
          disabled={busy}
          className="w-full rounded-[13px] bg-yes py-3 font-extrabold text-white disabled:opacity-50"
        >
          {busy ? dict.decision.resolving : dict.decision.resolveNowSplit}
        </button>
      </div>
    </div>
  );
}
