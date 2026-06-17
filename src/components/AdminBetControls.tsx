"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Debug-phase admin tools shown on a bet's detail page.
export default function AdminBetControls({
  marketId,
  isResolved,
}: {
  marketId: string;
  isResolved: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function del() {
    if (!confirm("למחוק את ההימור לצמיתות? כל ההימורים שבו יימחקו.")) return;
    setBusy("del");
    const res = await fetch(`/api/markets/${marketId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      alert("מחיקה נכשלה");
      setBusy("");
    }
  }

  async function unresolve() {
    if (!confirm("לבטל את ההכרעה? הרווח/הפסד של ההימור הזה יתאפס.")) return;
    setBusy("unres");
    const res = await fetch(`/api/markets/${marketId}/unresolve`, { method: "POST" });
    if (res.ok) router.refresh();
    else alert("ביטול נכשל");
    setBusy("");
  }

  return (
    <div className="mb-5 rounded-[16px] border border-dashed border-no/50 bg-no-b/40 p-4">
      <div className="mb-2.5 text-[13px] font-extrabold text-no">כלי ניהול (דיבוג)</div>
      <div className="flex gap-2.5">
        {isResolved && (
          <button
            onClick={unresolve}
            disabled={!!busy}
            className="flex-1 rounded-[11px] border border-border bg-surface py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {busy === "unres" ? "מבטל…" : "בטל הכרעה (אפס רווח/הפסד)"}
          </button>
        )}
        <button
          onClick={del}
          disabled={!!busy}
          className="flex-1 rounded-[11px] bg-no py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
        >
          {busy === "del" ? "מוחק…" : "מחק הימור"}
        </button>
      </div>
    </div>
  );
}
