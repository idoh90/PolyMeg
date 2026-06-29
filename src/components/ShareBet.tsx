"use client";

import { useState } from "react";

// Share a bet via the public /b/[id] deep link (rich OG card in WhatsApp etc.).
export default function ShareBet({ id, title }: { id: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/b/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "GRUbet", text: `${title} · GRUbet`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* user dismissed */
    }
  }

  return (
    <button
      onClick={share}
      aria-label="שתף"
      className="pressable flex h-[34px] items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-bold"
    >
      {copied ? (
        "הועתק ✓"
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
          </svg>
          שתף
        </>
      )}
    </button>
  );
}
