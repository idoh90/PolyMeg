"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type SwitcherGroup = {
  id: string;
  name: string;
  emoji: string | null;
  membersText: string;
  unread: boolean;
  active: boolean;
};

export default function GroupSwitcher({
  groupId,
  current,
  groups,
  isAdmin,
}: {
  groupId: string;
  current: { name: string; emoji: string | null; membersText: string };
  groups: SwitcherGroup[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pressable flex items-center gap-[9px] rounded-full border border-border bg-surface py-1.5 ps-[9px] pe-[13px] shadow-[0_1px_2px_rgba(15,19,32,.03)]"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-surface-2 text-[18px]">{current.emoji ?? "🎲"}</span>
        <span className="flex flex-col items-start leading-[1.12]">
          <span dir="auto" className="max-w-[130px] truncate text-[14.5px] font-extrabold">{current.name}</span>
          <span className="text-[10.5px] font-semibold text-faint">{current.membersText}</span>
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[45] mx-auto max-w-[480px]">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-[rgba(15,19,32,.5)] pm-fade" />
          <div className="pm-rise absolute inset-x-0 bottom-0 rounded-t-[26px] bg-surface px-[18px] pb-6 pt-2 shadow-[0_-14px_40px_-10px_rgba(15,19,32,.3)]">
            <div className="mx-auto mb-4 mt-1.5 h-[5px] w-10 rounded-full bg-[#d7dbe4]" />
            <div className="mb-3.5 text-[17px] font-extrabold">החלפת קבוצה</div>
            <div className="mb-3 flex flex-col gap-[9px]">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => (g.active ? setOpen(false) : go(`/g/${g.id}`))}
                  className="pressable flex items-center gap-[11px] rounded-[14px] border-[1.5px] p-[11px] text-start"
                  style={{ borderColor: g.active ? "var(--accent)" : "var(--border)", background: g.active ? "var(--accent-soft)" : "var(--surface)" }}
                >
                  <div className="relative flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[12px] bg-surface-2 text-[22px]">
                    {g.emoji ?? "🎲"}
                    {g.unread && <span className="absolute -top-[3px] h-3 w-3 rounded-full border-[2.5px] border-surface bg-no" style={{ insetInlineStart: -3 }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div dir="auto" className="truncate text-[15px] font-extrabold">{g.name}</div>
                    <div className="mt-0.5 text-xs font-semibold text-faint">{g.membersText}</div>
                  </div>
                  {g.active && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  )}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button onClick={() => go(`/g/${groupId}/manage`)} className="pressable mb-[9px] flex w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-surface py-[13px] text-[14.5px] font-extrabold">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
                ניהול הקבוצה
              </button>
            )}
            <button onClick={() => go("/groups")} className="pressable w-full rounded-[14px] border border-border bg-surface py-3.5 text-[15px] font-extrabold text-accent">
              כל הקבוצות
            </button>
          </div>
        </div>
      )}
    </>
  );
}
