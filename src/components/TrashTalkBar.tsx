"use client";

import { TRASH_TALK_LINES, MAX_SHOUT_LEN } from "@/lib/social";

// Quick "call your shot" bar shown in the bet sheet. Tap a preset line to toggle
// it, or type a custom call. The chosen value rides along as the position shout.
export default function TrashTalkBar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const presets = TRASH_TALK_LINES as readonly string[];
  const isPreset = value != null && presets.includes(value);
  const customText = value != null && !isPreset ? value : "";

  return (
    <div className="mb-[18px]">
      <div className="mb-2.5 text-[13px] font-extrabold text-muted">קרא את הצעד שלך (לא חובה)</div>

      <div data-field className="mb-2.5 flex items-center rounded-[14px] border-[1.5px] border-border bg-surface px-[13px] py-2.5">
        <input
          value={customText}
          onChange={(e) => onChange(e.target.value || null)}
          dir="auto"
          maxLength={MAX_SHOUT_LEN}
          placeholder="כתוב קריאה משלך…"
          className="w-full bg-transparent text-[14px] font-semibold outline-none"
        />
        {customText && (
          <button type="button" onClick={() => onChange(null)} className="flex p-1 text-faint" aria-label="נקה">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((line) => {
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
