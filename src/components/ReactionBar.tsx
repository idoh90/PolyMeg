"use client";

import { useState } from "react";
import { REACTION_EMOJI, type GroupedReaction } from "@/lib/social";

// Emoji toggle bar for a comment or a position. Optimistic; one target only.
export default function ReactionBar({
  commentId,
  positionId,
  initial,
}: {
  commentId?: string;
  positionId?: string;
  initial: GroupedReaction[];
}) {
  const [reactions, setReactions] = useState<GroupedReaction[]>(initial);

  function apply(emoji: string) {
    setReactions((prev) => {
      const cur = prev.find((r) => r.emoji === emoji);
      if (!cur) return [...prev, { emoji, count: 1, mine: true }];
      const count = cur.count + (cur.mine ? -1 : 1);
      const next = prev
        .map((r) => (r.emoji === emoji ? { ...r, count, mine: !cur.mine } : r))
        .filter((r) => r.count > 0);
      return next;
    });
  }

  async function toggle(emoji: string) {
    apply(emoji); // optimistic
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, positionId, emoji }),
    }).catch(() => apply(emoji)); // revert on network failure
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_EMOJI.map((e) => {
        const r = reactions.find((x) => x.emoji === e);
        const on = r?.mine;
        return (
          <button
            key={e}
            type="button"
            onClick={() => toggle(e)}
            className="flex items-center gap-1 rounded-full border px-2 py-1 text-[12.5px] font-bold leading-none transition"
            style={{
              borderColor: on ? "var(--accent)" : "var(--border)",
              background: on ? "var(--accent-soft)" : "var(--surface)",
            }}
          >
            <span className="text-[13px]">{e}</span>
            {r && r.count > 0 && <span className="text-muted">{r.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
