"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: string; label: string };

export default function ResolveBet({
  marketId,
  options,
}: {
  marketId: string;
  options: Opt[];
}) {
  const router = useRouter();
  const [winningOptionId, setWinningOptionId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!winningOptionId) return setError("בחר את האפשרות המנצחת.");
    if (
      !confirm(
        "להכריע את ההימור? פעולה זו מחלקת את הקופה ואי אפשר לבטל אותה.",
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/markets/${marketId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winningOptionId }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "לא ניתן להכריע.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[16px] border-[1.5px] border-accent-soft bg-surface p-4">
      <h3 className="mb-1 font-extrabold">הכרע את ההימור</h3>
      <p className="mb-3 text-sm text-muted">
        בחר את האפשרות שבאמת קרתה. הקופה מתחלקת בין כל מי שהימר עליה.
      </p>
      <div className="mb-3 flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setWinningOptionId(o.id)}
            className={`rounded-xl border px-3 py-2.5 text-right text-sm font-bold transition ${
              winningOptionId === o.id
                ? "border-yes bg-yes-b text-yes"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {o.label} ניצח
          </button>
        ))}
      </div>
      {error && <p className="mb-2 text-sm text-no">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="w-full rounded-[13px] bg-yes py-3 font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "מכריע…" : "הכרע וחלק את הקופה"}
      </button>
    </div>
  );
}
