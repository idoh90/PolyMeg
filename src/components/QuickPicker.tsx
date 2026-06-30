"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import BackChevron from "@/components/BackChevron";
import { useT } from "@/lib/i18n/provider";

type QUser = { id: string; username: string; displayName: string; avatarUrl: string | null };

const PALETTE = ["#2b6ef2", "#ef7d3a", "#15b87a", "#a855f7", "#ec4899", "#f0a93a", "#06b6d4", "#6366f1"];
function colorFor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function QuickPicker({ users }: { users: QUser[] }) {
  const { dict } = useT();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function pick(u: QUser) {
    setBusyId(u.id);
    const res = await fetch("/api/auth/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id }),
    });
    if (res.ok) {
      router.push("/groups");
      router.refresh();
    } else {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-[26px] py-10">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => router.push("/login")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
          <BackChevron size={17} />
        </button>
        <span className="rounded-full bg-no-b px-2.5 py-1 text-[11px] font-extrabold text-no">{dict.quickPicker.debugMode}</span>
      </div>

      <div className="mb-7 text-center">
        <Wordmark size={26} />
        <div className="mt-3 text-[14.5px] font-semibold text-muted">{dict.quickPicker.pickUser}</div>
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-5">
        {users.map((u) => {
          const initial = u.displayName.trim().charAt(0) || "?";
          const busy = busyId === u.id;
          return (
            <button
              key={u.id}
              onClick={() => pick(u)}
              disabled={busyId !== null}
              className="pressable flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <div className="relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full text-[26px] font-extrabold text-white shadow-[0_6px_16px_-8px_rgba(15,19,32,.4)]" style={{ background: colorFor(u.username) }}>
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
                {busy && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="block h-5 w-5 animate-[pm-spin_.7s_linear_infinite] rounded-full border-[2.5px] border-white/40 border-t-white" />
                  </span>
                )}
              </div>
              <span dir="auto" className="max-w-full truncate text-[13px] font-extrabold">{u.displayName}</span>
            </button>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="mt-6 rounded-[16px] border border-dashed border-border p-8 text-center text-sm font-semibold text-muted">
          {dict.quickPicker.empty}
        </div>
      )}
    </main>
  );
}
