"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Wordmark from "@/components/Wordmark";
import LanguageToggle from "@/components/LanguageToggle";
import { useT } from "@/lib/i18n/provider";

const GoogleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden>
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" />
    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C8 41.6 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.7 27.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 16.1 2 19 2 22s.8 5.9 2.3 8.8l7.4-5.7z" />
    <path fill="#EA4335" d="M24 9.9c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.3 29.9 1 24 1 15.4 1 8 5.4 4.3 13.1l7.4 5.7C13.4 13.8 18.3 9.9 24 9.9z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { dict } = useT();
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
  const errUser = isSignup && username.length > 0 && !userValid ? dict.auth.usernameError : "";
  const errPass = isSignup && password.length > 0 && !passValid ? dict.auth.passwordTooShort : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Debug shortcuts on the login password field.
    if (!isSignup && (password === "1234" || password === "0000")) {
      setBusy(true);
      if (password === "0000") {
        router.push("/login/quick");
        return;
      }
      const dbg = await fetch("/api/auth/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "admin" }),
      });
      if (dbg.ok) {
        router.push("/groups");
        router.refresh();
      } else {
        setError(dict.auth.debugOff);
        setBusy(false);
      }
      return;
    }

    if (!username || !password) {
      setError(dict.auth.fillUserPass);
      return;
    }

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
      setError(d.error ?? dict.auth.somethingWrong);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center px-[26px] py-10">
      <div className="mb-5 flex justify-center">
        <LanguageToggle compact />
      </div>
      <div className="mb-8 text-center">
        <Wordmark size={isSignup ? 28 : 30} />
        <div className="mt-3 text-[14.5px] font-semibold text-muted">{dict.auth.tagline}</div>
      </div>

      <h1 className="mb-4 text-[21px] font-extrabold">{isSignup ? dict.auth.signupTitle : dict.auth.loginTitle}</h1>

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
            <label className="mb-1.5 text-[12.5px] font-extrabold text-muted">{dict.account.displayName}</label>
            <div data-field className="mb-3.5 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} dir="auto" placeholder={dict.auth.displayNamePlaceholder} className="w-full bg-transparent text-[15.5px] font-semibold outline-none" required />
            </div>
          </>
        )}

        <label className="mb-1.5 text-[12.5px] font-extrabold text-muted">{dict.account.username}</label>
        <div data-field className="flex items-center gap-1 rounded-[14px] border-[1.5px] bg-surface px-[15px] py-[13px]" style={{ borderColor: errUser ? "var(--no)" : "var(--border)", marginBottom: isSignup ? 6 : 14 }}>
          {isSignup && <span className="text-[15px] font-bold text-faint">@</span>}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={isSignup ? "username" : dict.auth.usernamePlaceholderLogin}
            autoCapitalize="none"
            autoComplete="username"
            className="w-full bg-transparent text-[15.5px] font-semibold outline-none"
            style={isSignup ? { direction: "ltr", textAlign: "start" } : undefined}
            required={isSignup}
          />
        </div>
        {errUser && <div className="mb-1.5 text-[12px] font-bold text-no">{errUser}</div>}
        {isSignup && <div className="mb-3.5 mt-0.5 text-[11.5px] font-semibold text-faint">{dict.auth.usernameHint}</div>}

        <label className="mb-1.5 text-[12.5px] font-extrabold text-muted">{dict.auth.password}</label>
        <div data-field className="flex items-center rounded-[14px] border-[1.5px] bg-surface px-[15px]" style={{ borderColor: errPass ? "var(--no)" : "var(--border)", marginBottom: isSignup ? 6 : 22 }}>
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? dict.auth.passwordPlaceholderSignup : dict.auth.passwordPlaceholderLogin}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="w-full bg-transparent py-[9px] text-[15.5px] font-semibold outline-none"
            required={isSignup}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="flex p-1.5 text-faint" aria-label={show ? dict.auth.hidePassword : dict.auth.showPassword}>
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
          {busy ? dict.auth.oneMoment : isSignup ? dict.auth.createAccount : dict.auth.login}
        </button>
      </form>

      {/* social auth */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12px] font-bold text-faint">{dict.auth.or}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/groups" })}
        className="pressable flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-border bg-surface py-[13px] text-[15px] font-extrabold"
      >
        <GoogleIcon />
        {dict.auth.continueGoogle}
      </button>
      <button
        type="button"
        disabled
        className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-border bg-surface-2 py-[13px] text-[15px] font-extrabold text-faint"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1-.02 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.1-.8-2.1-3.1zM14.3 6.3c.6-.7 1-1.7.9-2.7-.8.03-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6.9.07 1.8-.5 2.5-1.2z" /></svg>
        {dict.auth.appleSoon}
      </button>

      <div className="mt-5 text-center text-sm font-semibold text-muted">
        {isSignup ? `${dict.auth.haveAccount} ` : `${dict.auth.noAccount} `}
        <button onClick={() => router.push(isSignup ? "/login" : "/signup")} className="font-extrabold text-accent">
          {isSignup ? dict.auth.login : dict.auth.signup}
        </button>
      </div>
    </main>
  );
}
