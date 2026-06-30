"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

function fileToDataUrl(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type OwnerGroup = { id: string; name: string; emoji: string | null; role: string };

export default function AccountForm({
  initial,
  ownerGroups,
}: {
  initial: { username: string; displayName: string; avatarUrl: string | null };
  ownerGroups: OwnerGroup[];
}) {
  const { dict } = useT();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const initialCh = displayName.trim().charAt(0) || "?";

  async function save() {
    setBusy(true);
    setMsg("");
    const body: Record<string, unknown> = { displayName, avatarUrl };
    if (newPassword) {
      body.newPassword = newPassword;
      body.currentPassword = currentPassword;
    }
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg(dict.common.saved);
      setNewPassword("");
      setCurrentPassword("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? dict.common.saveFailed);
    }
    setBusy(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      {/* avatar + identity */}
      <div className="mb-6 flex flex-col items-center">
        <label className="relative mb-[13px] h-[86px] w-[86px] cursor-pointer">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-[86px] w-[86px] rounded-full object-cover" />
          ) : (
            <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-accent text-[34px] font-extrabold text-white">{initialCh}</div>
          )}
          <span className="absolute bottom-0 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-surface shadow-[0_2px_6px_rgba(15,19,32,.12)]" style={{ insetInlineStart: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatarUrl(await fileToDataUrl(f).catch(() => avatarUrl)); }} />
        </label>
        <div dir="auto" className="text-[19px] font-extrabold">{displayName}</div>
        <div className="text-[13px] font-semibold text-faint" style={{ direction: "ltr" }}>@{initial.username}</div>
      </div>

      <label className="mb-1.5 block text-[12.5px] font-extrabold text-muted">{dict.account.displayName}</label>
      <div data-field className="mb-3.5 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} dir="auto" className="w-full bg-transparent text-[15.5px] font-bold outline-none" />
      </div>
      <label className="mb-1.5 block text-[12.5px] font-extrabold text-muted">{dict.account.username}</label>
      <div className="mb-[22px] flex items-center rounded-[14px] border-[1.5px] border-border bg-surface-2 px-[15px] py-[13px]">
        <input value={initial.username} disabled className="w-full bg-transparent text-[15.5px] font-semibold text-faint outline-none" style={{ direction: "ltr", textAlign: "start" }} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      </div>

      <div className="mb-2.5 text-[13px] font-extrabold text-muted">{dict.account.changePassword}</div>
      <div data-field className="mb-2.5 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={dict.account.currentPassword} className="w-full bg-transparent text-[15px] font-semibold outline-none" />
      </div>
      <div data-field className="mb-6 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={dict.account.newPassword} className="w-full bg-transparent text-[15px] font-semibold outline-none" />
      </div>

      {ownerGroups.length > 0 && (
        <>
          <div className="mb-2.5 text-[13px] font-extrabold text-muted">{dict.account.groupsIManage}</div>
          <div className="mb-6 overflow-hidden rounded-[16px] border border-border bg-surface">
            {ownerGroups.map((o) => (
              <div key={o.id} className="flex items-center gap-[11px] border-b border-border px-[15px] py-[13px] last:border-b-0">
                <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-surface-2 text-[19px]">{o.emoji ?? "🎲"}</div>
                <span dir="auto" className="flex-1 text-[14.5px] font-bold">{o.name}</span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-extrabold text-accent">{o.role}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {msg && <p className="mb-3 text-sm font-semibold text-muted">{msg}</p>}

      <button onClick={save} disabled={busy} className="mb-3 w-full rounded-[14px] bg-accent py-3.5 text-base font-extrabold text-white disabled:opacity-50">
        {busy ? dict.common.saving : dict.common.saveChanges}
      </button>
      <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-no-b bg-no-b py-[15px] text-[15.5px] font-extrabold text-no">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
        {dict.account.logout}
      </button>
    </div>
  );
}
