"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useT } from "@/lib/i18n/provider";

type Member = { userId: string; displayName: string; avatarUrl: string | null; role: string };

export default function ManageGroup({
  group,
  members,
  pending,
}: {
  group: { id: string; name: string; description: string | null; joinMode: string; code: string; hasPassword: boolean };
  members: Member[];
  pending: Member[];
}) {
  const { dict } = useT();
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [joinMode, setJoinMode] = useState(group.joinMode);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(group.code);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(d.error ?? dict.common.saveFailed);
    return { ok: res.ok, ...d };
  }

  async function saveSettings() {
    setBusy(true);
    setMsg("");
    const body: Record<string, unknown> = { name, description, joinMode };
    if (password) body.password = password;
    const r = await patch(body);
    if (r.ok) {
      setMsg(dict.common.saved);
      setPassword("");
      router.refresh();
    }
    setBusy(false);
  }

  async function rotateCode() {
    const r = await patch({ rotateCode: true });
    if (r.ok && r.code) setCode(r.code);
  }

  async function memberAction(targetUserId: string, action: string, role?: string) {
    await fetch(`/api/groups/${group.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetUserId, role }),
    });
    router.refresh();
  }

  async function del() {
    if (!confirm(dict.manage.confirmDelete)) return;
    const res = await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/groups");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* join code */}
      <div className="rounded-[16px] border border-border bg-surface p-4">
        <div className="mb-2 text-sm font-extrabold">{dict.manage.joinCode}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border-[1.5px] border-accent-soft bg-accent-soft px-4 py-2.5 text-center text-2xl font-black tracking-[0.2em] text-accent">
            {code}
          </div>
          <button onClick={() => navigator.clipboard?.writeText(code)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold">{dict.manage.copy}</button>
          <button onClick={rotateCode} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold">{dict.manage.new}</button>
        </div>
      </div>

      {/* settings */}
      <div className="rounded-[16px] border border-border bg-surface p-4">
        <div className="mb-3 text-sm font-extrabold">{dict.manage.settings}</div>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold text-muted">{dict.manage.name}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mfield" />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold text-muted">{dict.newGroup.description}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mfield resize-none" />
        </label>
        <div className="mb-3">
          <span className="mb-1 block text-xs font-bold text-muted">{dict.manage.joining}</span>
          <div className="flex gap-1.5 rounded-[14px] bg-surface-2 p-1.5">
            {(["CODE", "APPROVAL"] as const).map((m) => (
              <button key={m} onClick={() => setJoinMode(m)} className={`flex-1 rounded-[10px] py-2 text-sm font-extrabold transition ${joinMode === m ? "bg-surface text-text shadow-[0_1px_3px_rgba(15,19,32,.1)]" : "text-muted"}`}>
                {m === "CODE" ? dict.newGroup.openCode : dict.manage.approval}
              </button>
            ))}
          </div>
        </div>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold text-muted">{dict.newGroup.groupPassword} {group.hasPassword && dict.manage.passwordSet}</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={dict.manage.passwordPlaceholder} className="mfield" />
        </label>
        {msg && <p className="mb-2 text-sm font-semibold text-muted">{msg}</p>}
        <button onClick={saveSettings} disabled={busy} className="w-full rounded-[12px] bg-accent py-2.5 font-extrabold text-white disabled:opacity-50">
          {busy ? dict.common.saving : dict.common.save}
        </button>
      </div>

      {/* pending requests */}
      {pending.length > 0 && (
        <div>
          <div className="mb-2.5 text-sm font-extrabold">{dict.manage.joinRequests} ({pending.length})</div>
          <div className="flex flex-col gap-2">
            {pending.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                <Avatar name={m.displayName} src={m.avatarUrl} size={34} />
                <span className="flex-1 text-sm font-bold">{m.displayName}</span>
                <button onClick={() => memberAction(m.userId, "approve")} className="rounded-lg bg-yes px-3 py-1.5 text-xs font-extrabold text-white">{dict.manage.approve}</button>
                <button onClick={() => memberAction(m.userId, "deny")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-no">{dict.manage.deny}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* members */}
      <div>
        <div className="mb-2.5 text-sm font-extrabold">{dict.manage.members} ({members.length})</div>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
              <Avatar name={m.displayName} src={m.avatarUrl} size={34} />
              <span className="flex-1 text-sm font-bold">
                {m.displayName}
                {m.role !== "MEMBER" && <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">{m.role === "OWNER" ? dict.roles.owner : dict.roles.admin}</span>}
              </span>
              {m.role !== "OWNER" && (
                <>
                  <button onClick={() => memberAction(m.userId, "role", m.role === "ADMIN" ? "MEMBER" : "ADMIN")} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold">
                    {m.role === "ADMIN" ? dict.manage.demote : dict.roles.admin}
                  </button>
                  <button onClick={() => memberAction(m.userId, "remove")} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-no">{dict.manage.remove}</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* danger */}
      <button onClick={del} className="rounded-[12px] border border-no/40 bg-no-b py-2.5 text-sm font-extrabold text-no">
        {dict.manage.deleteGroup}
      </button>

      <style>{`
        .mfield { width:100%; border-radius:12px; border:1.5px solid var(--border); background:var(--surface); padding:10px 13px; font-weight:600; color:var(--text); outline:none; }
        .mfield:focus { border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
      `}</style>
    </div>
  );
}
