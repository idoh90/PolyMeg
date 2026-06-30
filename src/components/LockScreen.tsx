"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { useT } from "@/lib/i18n/provider";

type PublicUser = { id: string; name: string; avatarUrl: string | null };

export default function LockScreen({ users }: { users: PublicUser[] }) {
  const { dict } = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<PublicUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(fullPin: string) {
    if (!selected) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected.id, pin: fullPin }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? dict.lockScreen.loginFailed);
      setPin("");
      setBusy(false);
    }
  }

  function press(digit: string) {
    if (busy || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) submit(next);
  }

  if (!selected) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
        <h1 className="mb-1 text-center text-3xl font-bold tracking-tight">
          Poly<span className="text-accent">meg</span>
        </h1>
        <p className="mb-8 text-center text-muted">{dict.lockScreen.tapProfile}</p>
        {users.length === 0 ? (
          <p className="text-center text-muted">
            {dict.lockScreen.noAccounts}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelected(u);
                  setError("");
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent hover:bg-surface-2"
              >
                <Avatar name={u.name} src={u.avatarUrl} size={64} />
                <span className="truncate text-sm font-medium">{u.name}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xs flex-col items-center justify-center px-6 py-10">
      <Avatar name={selected.name} src={selected.avatarUrl} size={88} />
      <h2 className="mt-4 text-xl font-semibold">{selected.name}</h2>
      <p className="mb-6 text-muted">{dict.lockScreen.enterPin}</p>

      <div className="mb-6 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border ${
              pin.length > i
                ? "border-accent bg-accent"
                : "border-border bg-transparent"
            }`}
          />
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-no">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadButton key={d} onClick={() => press(d)}>
            {d}
          </PadButton>
        ))}
        <PadButton
          onClick={() => {
            setSelected(null);
            setPin("");
            setError("");
          }}
        >
          <span className="text-sm text-muted">{dict.common.back}</span>
        </PadButton>
        <PadButton onClick={() => press("0")}>0</PadButton>
        <PadButton onClick={() => setPin((p) => p.slice(0, -1))}>⌫</PadButton>
      </div>
    </main>
  );
}

function PadButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-2xl font-medium transition active:scale-95 hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
