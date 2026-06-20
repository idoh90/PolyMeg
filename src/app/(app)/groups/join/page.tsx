"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinGroupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

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
      if (d.status === "ACTIVE") {
        router.push(`/g/${d.groupId}`);
        router.refresh();
        return;
      }
      setPending(true);
    } else {
      setError(d.error ?? "לא ניתן להצטרף.");
    }
    setBusy(false);
  }

  if (pending) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-7 text-center">
        <div className="mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-accent-soft text-4xl">⏳</div>
        <div className="mb-2 text-[22px] font-extrabold">הבקשה נשלחה</div>
        <div className="mb-6 max-w-[280px] text-sm font-semibold text-muted">ממתינים לאישור הבעלים. נודיע לך כשתאושר.</div>
        <Link href="/groups" className="w-full max-w-[300px] rounded-[14px] bg-[var(--text)] py-4 text-center text-base font-extrabold text-white">
          חזרה לקבוצות
        </Link>
      </div>
    );
  }

  return (
    <div className="px-[18px] pb-10 pt-4">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/groups" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold">הצטרפות לקבוצה</h1>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">קוד הקבוצה</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            autoCapitalize="characters"
            className="gfield text-center text-2xl font-black tracking-[0.3em]"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">סיסמה <span className="font-normal text-faint">(אם נדרשת)</span></span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="gfield" />
        </label>

        {error && <p className="text-sm font-semibold text-no">{error}</p>}

        <button type="submit" disabled={busy} className="mt-1 rounded-[14px] bg-accent py-3.5 text-base font-extrabold text-white disabled:opacity-50">
          {busy ? "רגע…" : "הצטרף"}
        </button>
      </form>

      <style>{`
        .gfield { width:100%; border-radius:14px; border:1.5px solid var(--border); background:var(--surface); padding:13px 15px; font-weight:700; color:var(--text); outline:none; box-shadow:0 1px 2px rgba(15,19,32,.03); }
        .gfield:focus { border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
      `}</style>
    </div>
  );
}
