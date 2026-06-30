"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { interpolate } from "@/lib/i18n/interpolate";

const WINDOW_MS = 6 * 60 * 60 * 1000;

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function PositionDeleteControl({
  positionId,
  createdAtMs,
  mine,
  isAdmin,
  marketOpen,
}: {
  positionId: string;
  createdAtMs: number;
  mine: boolean;
  isAdmin: boolean;
  marketOpen: boolean;
}) {
  const { dict } = useT();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  const left = createdAtMs + WINDOW_MS - now;
  const selfOk = mine && marketOpen && left > 0;

  useEffect(() => {
    if (!selfOk) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [selfOk]);

  if (!mine && !isAdmin) return null;

  async function del() {
    if (!confirm(dict.posDelete.confirm)) return;
    setBusy(true);
    const r = await fetch(`/api/positions/${positionId}`, { method: "DELETE" });
    if (r.ok) {
      router.refresh();
    } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error ?? dict.posDelete.deleteFailed);
      setBusy(false);
    }
  }

  const canDelete = selfOk || isAdmin;

  return (
    <div className="flex shrink-0 flex-col items-start gap-0.5">
      {canDelete && (
        <button
          onClick={del}
          disabled={busy}
          className="rounded-md px-2 py-0.5 text-xs font-extrabold text-no disabled:opacity-50"
        >
          {busy ? "…" : dict.comments.delete}
        </button>
      )}
      {mine && marketOpen && (
        <span className="text-[10px] font-semibold text-faint">
          {left > 0 ? interpolate(dict.posDelete.deletableFor, { t: fmt(left) }) : dict.posDelete.locked}
        </span>
      )}
    </div>
  );
}
