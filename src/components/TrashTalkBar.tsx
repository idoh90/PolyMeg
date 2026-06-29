"use client";

import { TRASH_TALK_LINES } from "@/lib/social";

// Quick "call your shot" bar shown in the bet sheet. Tapping a line toggles it
// as the position's shout; tapping the active one clears it.
export default function TrashTalkBar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="mb-[18px]">
      <div className="mb-2.5 text-[13px] font-extrabold text-muted">קרא את הצעד שלך (לא חובה)</div>
      <div className="flex flex-wrap gap-2">
        {TRASH_TALK_LINES.map((line) => {
          const on = value === line;
          return (
            <button
              key={line}
              type="button"
              onClick={() => onChange(on ? null : line)}
              className="rounded-full border-[1.5px] px-3 py-2 text-[13px] font-bold transition"
              style={{
                borderColor: on ? "var(--accent)" : "var(--border)",
                background: on ? "var(--accent-soft)" : "var(--surface)",
                color: on ? "var(--accent)" : "var(--muted)",
              }}
            >
              {line}
            </button>
          );
        })}
      </div>
    </div>
  );
}
