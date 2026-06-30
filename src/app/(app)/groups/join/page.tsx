"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import BackChevron from "@/components/BackChevron";

export default function JoinGroupPage() {
  const { dict } = useT();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      if (d.status === "ACTIVE") setJoined(d.groupId);
      else setPending(true);
    } else {
      setError(d.error ?? dict.joinGroup.joinFailed);
    }
    setBusy(false);
  }

  if (joined) {
    return (
      <div className="px-[18px] pb-8 pt-1.5">
        <Header />
        <div className="py-[30px] text-center">
          <div className="pm-pop mx-auto mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-yes-b">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--yes)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div className="mb-2 text-2xl font-extrabold">{dict.joinGroup.joinedTitle}</div>
          <div className="mb-7 text-[14.5px] font-semibold leading-[1.5] text-muted">{dict.joinGroup.joinedBody}</div>
          <button onClick={() => { router.push(`/g/${joined}`); router.refresh(); }} className="pressable w-full rounded-[15px] bg-accent py-4 text-base font-extrabold text-white">
            {dict.newGroup.enterGroup}
          </button>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="px-[18px] pb-8 pt-1.5">
        <Header />
        <div className="py-[30px] text-center">
          <div className="pm-pop mx-auto mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-accent-soft">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </div>
          <div className="mb-2 text-[23px] font-extrabold">{dict.joinGroup.requestSent}</div>
          <div className="mb-7 text-[14.5px] font-semibold leading-[1.55] text-muted">{dict.joinGroup.pendingBody}</div>
          <Link href="/groups" className="pressable block w-full rounded-[15px] border border-border bg-surface py-[15px] text-center text-[15.5px] font-extrabold">
            {dict.joinGroup.backToGroups}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <Header />
      <div className="mb-4 flex h-[62px] w-[62px] items-center justify-center rounded-[18px] bg-accent-soft">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3M16 6l3 3M19 3l2 2" /></svg>
      </div>
      <div className="mb-1 text-2xl font-extrabold">{dict.joinGroup.title}</div>
      <div className="mb-[22px] text-[13.5px] font-semibold text-muted">{dict.joinGroup.subtitle}</div>

      <form onSubmit={submit}>
        <div data-field className="mb-2 flex items-center justify-center rounded-[16px] border-[1.5px] bg-surface p-4" style={{ borderColor: error ? "var(--no)" : "var(--border)" }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={8}
            className="w-full bg-transparent text-center text-[30px] font-extrabold tracking-[8px] outline-none"
            style={{ direction: "ltr", fontFamily: "'SF Mono',ui-monospace,monospace", textTransform: "uppercase" }}
            required
          />
        </div>
        {error && (
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-no">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
            {error}
          </div>
        )}

        <label className="mb-1.5 mt-4 block text-[12.5px] font-extrabold text-muted">{dict.newGroup.groupPassword} <span className="font-semibold text-faint">{dict.joinGroup.ifRequired}</span></label>
        <div data-field className="mb-[22px] rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
          <input value={password} onChange={(e) => setPassword(e.target.value)} dir="auto" placeholder={dict.joinGroup.leaveEmpty} className="w-full bg-transparent text-[15px] font-semibold outline-none" />
        </div>

        <button type="submit" disabled={busy} className="w-full rounded-[15px] bg-accent py-4 text-[16.5px] font-extrabold text-white shadow-[0_12px_24px_-12px_var(--accent)] disabled:opacity-60">
          {busy ? dict.auth.oneMoment : dict.joinGroup.join}
        </button>
      </form>
    </div>
  );
}

function Header() {
  const { dict } = useT();
  return (
    <div className="mb-[18px] flex items-center gap-3">
      <Link href="/groups" className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface">
        <BackChevron />
      </Link>
      <span className="text-[15px] font-extrabold text-muted">{dict.joinGroup.headerTitle}</span>
    </div>
  );
}
