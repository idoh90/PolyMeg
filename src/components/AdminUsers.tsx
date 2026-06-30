"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { useT } from "@/lib/i18n/provider";

type U = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export default function AdminUsers({ users }: { users: U[] }) {
  const { dict } = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState("");

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin, isAdmin }),
    });
    if (res.ok) {
      setName("");
      setPin("");
      setIsAdmin(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? dict.adminUsers.addFailed);
    }
    setBusy(false);
  }

  async function resetUserPin(userId: string) {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pin: resetPin }),
    });
    if (res.ok) {
      setResetFor(null);
      setResetPin("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? dict.adminUsers.resetFailed);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={addUser}
        className="rounded-2xl border border-border bg-surface p-4"
      >
        <h2 className="mb-3 font-semibold">{dict.adminUsers.addMember}</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={dict.manage.name}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
            required
          />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={dict.adminUsers.pinPlaceholder}
            inputMode="numeric"
            className="w-32 rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {dict.adminUsers.add}
          </button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          {dict.adminUsers.makeAdmin}
        </label>
        {error && <p className="mt-2 text-sm text-no">{error}</p>}
      </form>

      <div>
        <h2 className="mb-3 font-semibold">{dict.adminUsers.accounts} ({users.length})</h2>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <Avatar name={u.name} src={u.avatarUrl} size={32} />
              <span className="flex-1 text-sm">
                {u.name}
                {u.isAdmin && (
                  <span className="ms-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-accent">
                    {dict.roles.admin}
                  </span>
                )}
              </span>
              {resetFor === u.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={resetPin}
                    onChange={(e) =>
                      setResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder={dict.adminUsers.newPin}
                    inputMode="numeric"
                    className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => resetUserPin(u.id)}
                    className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-white"
                  >
                    {dict.common.save}
                  </button>
                  <button
                    onClick={() => {
                      setResetFor(null);
                      setResetPin("");
                    }}
                    className="text-sm text-muted"
                  >
                    {dict.common.cancel}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setResetFor(u.id);
                    setError("");
                  }}
                  className="text-sm text-muted hover:text-text"
                >
                  {dict.adminUsers.resetPin}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
