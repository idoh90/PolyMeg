"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

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

export default function AccountForm({
  initial,
}: {
  initial: { username: string; displayName: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

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
      setMsg("נשמר ✓");
      setNewPassword("");
      setCurrentPassword("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "שמירה נכשלה");
    }
    setBusy(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={displayName} src={avatarUrl} size={64} />
        <label className="pressable cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold">
          שנה תמונה
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setAvatarUrl(await fileToDataUrl(f).catch(() => avatarUrl));
            }}
          />
        </label>
        {avatarUrl && (
          <button onClick={() => setAvatarUrl(null)} className="text-xs font-bold text-no">הסר</button>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">שם תצוגה</span>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="afield" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">שם משתמש</span>
        <input value={initial.username} disabled className="afield opacity-60" />
      </label>

      <div className="rounded-[16px] border border-border bg-surface p-4">
        <div className="mb-2.5 text-sm font-extrabold">שינוי סיסמה</div>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="סיסמה נוכחית" className="afield mb-2" />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="סיסמה חדשה" className="afield" />
      </div>

      {msg && <p className="text-sm font-semibold text-muted">{msg}</p>}

      <button onClick={save} disabled={busy} className="rounded-[14px] bg-accent py-3.5 text-base font-extrabold text-white disabled:opacity-50">
        {busy ? "שומר…" : "שמור שינויים"}
      </button>
      <button onClick={logout} className="rounded-[14px] border border-border bg-surface py-3 text-sm font-bold text-no">
        התנתק
      </button>

      <style>{`
        .afield { width:100%; border-radius:14px; border:1.5px solid var(--border); background:var(--surface); padding:13px 15px; font-weight:700; color:var(--text); outline:none; }
        .afield:focus { border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
      `}</style>
    </div>
  );
}
