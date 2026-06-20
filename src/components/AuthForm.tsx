"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isSignup ? { displayName, username, password } : { username, password }),
    });
    if (res.ok) {
      router.push("/groups");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "משהו השתבש.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-1 text-center text-[34px] font-black tracking-tight">
        GRU<span className="text-accent">bet</span>
      </div>
      <p className="mb-8 text-center text-sm font-semibold text-muted">
        שוק הניבויים של החבר׳ה שלך
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {isSignup && (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="שם תצוגה"
            className="field"
            required
          />
        )}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="שם משתמש"
          autoCapitalize="none"
          autoComplete="username"
          className="field"
          required
        />
        <div className="field flex items-center gap-2 !py-0">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="w-full bg-transparent py-3.5 outline-none"
            required
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="text-xs font-bold text-muted">
            {show ? "הסתר" : "הצג"}
          </button>
        </div>

        {error && <p className="text-sm font-semibold text-no">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-[14px] bg-accent py-3.5 text-base font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "רגע…" : isSignup ? "צור חשבון" : "התחבר"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-muted">
        {isSignup ? "כבר יש לי חשבון " : "אין לך חשבון? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-extrabold text-accent">
          {isSignup ? "התחבר" : "הרשמה"}
        </Link>
      </p>

      <style>{`
        .field { width:100%; border-radius:14px; border:1.5px solid var(--border); background:var(--surface); padding:14px 16px; font-weight:700; color:var(--text); outline:none; box-shadow:0 1px 2px rgba(15,19,32,.03); }
        .field:focus, .field:focus-within { border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
      `}</style>
    </main>
  );
}
