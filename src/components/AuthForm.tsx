"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // light client-side validation (signup) for inline field states
  const userValid = /^[a-zA-Z0-9_.]{3,20}$/.test(username);
  const passValid = password.length >= 4;
  const errUser = isSignup && username.length > 0 && !userValid ? "3–20 תווים: אותיות, מספרים, נקודה וקו תחתון" : "";
  const errPass = isSignup && password.length > 0 && !passValid ? "סיסמה קצרה מדי (לפחות 4)" : "";

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
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center px-[26px] py-10">
      <div className="mb-8 text-center">
        <Wordmark size={isSignup ? 28 : 30} />
        <div className="mt-3 text-[14.5px] font-semibold text-muted">שוק הניבויים של החבר׳ה שלך</div>
      </div>

      <h1 className="mb-4 text-[21px] font-extrabold">{isSignup ? "יצירת חשבון" : "התחברות"}</h1>

      {!isSignup && error && (
        <div className="mb-3.5 flex items-center gap-2 rounded-xl bg-no-b px-3.5 py-2.5 text-[13.5px] font-bold text-no">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col">
        {isSignup && (
          <>
            <label className="mb-1.5 text-[12.5px] font-extrabold text-muted">שם תצוגה</label>
            <div data-field className="mb-3.5 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} dir="auto" placeholder="איך יקראו לך בקבוצות" className="w-full bg-transparent text-[15.5px] font-semibold outline-none" required />
            </div>
          </>
        )}

        <label className="mb-1.5 text-[12.5px] font-extrabold text-muted">שם משתמש</label>
        <div data-field className="flex items-center gap-1 rounded-[14px] border-[1.5px] bg-surface px-[15px] py-[13px]" style={{ borderColor: errUser ? "var(--no)" : "var(--border)", marginBottom: isSignup ? 6 : 14 }}>
          {isSignup && <span className="text-[15px] font-bold text-faint">@</span>}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={isSignup ? "username" : "שם המשתמש שלך"}
            autoCapitalize="none"
            autoComplete="username"
            className="w-full bg-transparent text-[15.5px] font-semibold outline-none"
            style={isSignup ? { direction: "ltr", textAlign: "start" } : undefined}
            required
          />
        </div>
        {errUser && <div className="mb-1.5 text-[12px] font-bold text-no">{errUser}</div>}
        {isSignup && <div className="mb-3.5 mt-0.5 text-[11.5px] font-semibold text-faint">3–20 תווים · אותיות, מספרים, נקודה וקו תחתון</div>}

        <label className="mb-1.5 text-[12.5px] font-extrabold text-muted">סיסמה</label>
        <div data-field className="flex items-center rounded-[14px] border-[1.5px] bg-surface px-[15px]" style={{ borderColor: errPass ? "var(--no)" : "var(--border)", marginBottom: isSignup ? 6 : 22 }}>
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "לפחות 4 תווים" : "הסיסמה שלך"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="w-full bg-transparent py-[9px] text-[15.5px] font-semibold outline-none"
            required
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="flex p-1.5 text-faint" aria-label={show ? "הסתר סיסמה" : "הצג סיסמה"}>
            <EyeIcon />
          </button>
        </div>
        {errPass && <div className="mb-1.5 text-[12px] font-bold text-no">{errPass}</div>}

        <button
          type="submit"
          disabled={busy}
          className="mt-3.5 flex items-center justify-center gap-2.5 rounded-[15px] bg-accent py-4 text-[16.5px] font-extrabold text-white shadow-[0_12px_24px_-12px_var(--accent)] disabled:opacity-60"
        >
          {busy && <span className="block h-[17px] w-[17px] animate-[pm-spin_.7s_linear_infinite] rounded-full border-[2.5px] border-white/40 border-t-white" />}
          {busy ? "רגע…" : isSignup ? "צור חשבון" : "התחבר"}
        </button>
      </form>

      <div className="mt-5 text-center text-sm font-semibold text-muted">
        {isSignup ? "כבר יש לי חשבון " : "אין לך חשבון? "}
        <button onClick={() => router.push(isSignup ? "/login" : "/signup")} className="font-extrabold text-accent">
          {isSignup ? "← התחבר" : "הרשמה"}
        </button>
      </div>
    </main>
  );
}
