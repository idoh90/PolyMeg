"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agorotToShekels } from "@/lib/money";

type Opt = { id: string; label: string };

export default function PlaceBet({
  marketId,
  options,
  minStake,
}: {
  marketId: string;
  options: Opt[];
  minStake: number; // agorot
}) {
  const router = useRouter();
  const [optionId, setOptionId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const minShekels = agorotToShekels(minStake);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!optionId) return setError("בחר אפשרות קודם.");
    setBusy(true);
    const res = await fetch(`/api/markets/${marketId}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, amount: Number(amount) }),
    });
    if (res.ok) {
      setAmount("");
      setOptionId("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "לא ניתן להניח את ההימור.");
    }
    setBusy(false);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <h3 className="mb-3 font-semibold">הנח את ההימור שלך</h3>
      <div className="mb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 2)}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            type="button"
            key={o.id}
            onClick={() => setOptionId(o.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              optionId === o.id
                ? "border-accent bg-surface-2 text-text"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted">
            ₪
          </span>
          <input
            type="number"
            min={minShekels}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`מינימום ${minShekels}`}
            className="w-full rounded-lg border border-border bg-bg py-2 pe-7 ps-3 outline-none focus:border-accent"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-5 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "קנה"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-no">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        סכום מינימלי ₪{minShekels}. אפשר להוסיף כניסות נוספות בכל עת לפני שההימור
        נסגר.
      </p>
    </form>
  );
}
