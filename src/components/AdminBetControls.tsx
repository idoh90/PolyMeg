"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

// Debug-phase admin tools shown on a bet's detail page.
export default function AdminBetControls({
  marketId,
  isResolved,
}: {
  marketId: string;
  isResolved: boolean;
}) {
  const { dict } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function del() {
    if (!confirm(dict.admin.confirmDeleteBet)) return;
    setBusy("del");
    const res = await fetch(`/api/markets/${marketId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      alert(dict.posDelete.deleteFailed);
      setBusy("");
    }
  }

  async function unresolve() {
    if (!confirm(dict.admin.confirmUnresolve)) return;
    setBusy("unres");
    const res = await fetch(`/api/markets/${marketId}/unresolve`, { method: "POST" });
    if (res.ok) router.refresh();
    else alert(dict.admin.cancelFailed);
    setBusy("");
  }

  return (
    <div className="mb-5 rounded-[16px] border border-dashed border-no/50 bg-no-b/40 p-4">
      <div className="mb-2.5 text-[13px] font-extrabold text-no">{dict.admin.debugTools}</div>
      <div className="flex gap-2.5">
        {isResolved && (
          <button
            onClick={unresolve}
            disabled={!!busy}
            className="flex-1 rounded-[11px] border border-border bg-surface py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {busy === "unres" ? dict.admin.unresolving : dict.admin.unresolveBtn}
          </button>
        )}
        <button
          onClick={del}
          disabled={!!busy}
          className="flex-1 rounded-[11px] bg-no py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
        >
          {busy === "del" ? dict.admin.deleting : dict.admin.deleteBet}
        </button>
      </div>
    </div>
  );
}
