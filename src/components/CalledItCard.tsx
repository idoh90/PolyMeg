"use client";

import Avatar from "@/components/Avatar";
import type { Receipt, ReceiptPerson } from "@/lib/receipts";

function ShareBtn({ text }: { text: string }) {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const payload = `${text}\n${url}`;
    try {
      if (navigator.share) await navigator.share({ text: payload });
      else {
        await navigator.clipboard.writeText(payload);
        alert("הועתק ✓");
      }
    } catch {
      /* user dismissed share sheet */
    }
  }
  return (
    <button onClick={share} className="pressable flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/15 text-white" aria-label="שתף">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
      </svg>
    </button>
  );
}

function Card({
  person,
  tone,
  tag,
  emoji,
  title,
  shareText,
}: {
  person: ReceiptPerson;
  tone: "win" | "roast";
  tag: string;
  emoji: string | null;
  title: string;
  shareText: string;
}) {
  const bg =
    tone === "win"
      ? "linear-gradient(135deg,#15b87a,#0f8f5f)"
      : "linear-gradient(135deg,#f0405a,#c32741)";
  return (
    <div className="relative overflow-hidden rounded-[18px] p-4 text-white shadow-[0_12px_26px_-16px_rgba(15,19,32,.6)]" style={{ background: bg }}>
      <div className="absolute -left-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <Avatar name={person.name} src={person.avatarUrl} size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/80">{tag}</div>
          <div dir="auto" className="text-[16px] font-extrabold leading-tight">
            {person.name} {tone === "win" ? "🏆" : "🤡"}
          </div>
          <div className="mt-0.5 text-[12px] font-semibold text-white/80">
            {emoji ?? "🎲"} {title}
          </div>
        </div>
        <div className="text-end">
          <div className="text-[20px] font-black leading-none">{person.amount}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-white/80">{person.sideLabel}</div>
        </div>
        <ShareBtn text={shareText} />
      </div>
    </div>
  );
}

export default function CalledItCard({ receipt }: { receipt: Receipt }) {
  if (!receipt.winner && !receipt.loser) return null;
  return (
    <div className="mb-5">
      <div className="mb-2.5 text-[15px] font-extrabold">מי צדק? 🎯</div>
      <div className="flex flex-col gap-2.5">
        {receipt.winner && (
          <Card
            person={receipt.winner}
            tone="win"
            tag="קרא את זה"
            emoji={receipt.emoji}
            title={receipt.marketTitle}
            shareText={`${receipt.winner.name} צדק — ${receipt.winner.amount} · ${receipt.marketTitle}`}
          />
        )}
        {receipt.loser && (
          <Card
            person={receipt.loser}
            tone="roast"
            tag="הכי טעה"
            emoji={receipt.emoji}
            title={receipt.marketTitle}
            shareText={`${receipt.loser.name} פספס בגדול — ${receipt.loser.amount} · ${receipt.marketTitle} 🤡`}
          />
        )}
      </div>
    </div>
  );
}
