"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [joinMode, setJoinMode] = useState<"CODE" | "APPROVAL">("CODE");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, imageUrl, joinMode, password: joinMode === "CODE" ? password : "" }),
    });
    if (res.ok) setCreated(await res.json());
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "לא ניתן ליצור קבוצה.");
    }
    setBusy(false);
  }

  if (created) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-7 text-center">
        <div className="pm-pop mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-yes-b text-4xl">🎉</div>
        <div className="mb-2 text-[22px] font-extrabold">הקבוצה נוצרה!</div>
        <div className="mb-1 text-sm font-semibold text-muted">שתפו את הקוד כדי שיצטרפו:</div>
        <div className="my-3 rounded-2xl border-[1.5px] border-accent-soft bg-accent-soft px-6 py-3 text-3xl font-black tracking-[0.2em] text-accent">
          {created.code}
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(created.code)}
          className="mb-6 text-sm font-bold text-accent"
        >
          העתק קוד
        </button>
        <button
          onClick={() => {
            router.push(`/g/${created.id}`);
            router.refresh();
          }}
          className="w-full max-w-[300px] rounded-[14px] bg-[var(--text)] py-4 text-base font-extrabold text-white"
        >
          כניסה לקבוצה
        </button>
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
        <h1 className="text-2xl font-extrabold">קבוצה חדשה</h1>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">שם הקבוצה</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="החבר׳ה / קהילת הגיימינג…" className="gfield" required />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">תיאור <span className="font-normal text-faint">(לא חובה)</span></span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="gfield resize-none" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">תמונה <span className="font-normal text-faint">(לא חובה)</span></span>
          <div className="flex items-center gap-3">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setImageUrl(await fileToDataUrl(f).catch(() => null));
              }}
              className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-text"
            />
          </div>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">איך מצטרפים?</span>
          <div className="flex gap-1.5 rounded-[14px] bg-surface-2 p-1.5">
            {(["CODE", "APPROVAL"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setJoinMode(m)}
                className={`flex-1 rounded-[10px] py-2.5 text-sm font-extrabold transition ${joinMode === m ? "bg-surface text-text shadow-[0_1px_3px_rgba(15,19,32,.1)]" : "text-muted"}`}
              >
                {m === "CODE" ? "קוד פתוח" : "באישור בעלים"}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-faint">
            {joinMode === "CODE" ? "כל מי שיש לו את הקוד נכנס מיד." : "בקשות הצטרפות יחכו לאישורך."}
          </span>
        </div>

        {joinMode === "CODE" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">סיסמת קבוצה <span className="font-normal text-faint">(לא חובה)</span></span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ריק = ללא סיסמה" className="gfield" />
          </label>
        )}

        {error && <p className="text-sm font-semibold text-no">{error}</p>}

        <button type="submit" disabled={busy} className="mt-1 rounded-[14px] bg-accent py-3.5 text-base font-extrabold text-white disabled:opacity-50">
          {busy ? "יוצר…" : "צור קבוצה"}
        </button>
      </form>

      <style>{`
        .gfield { width:100%; border-radius:14px; border:1.5px solid var(--border); background:var(--surface); padding:13px 15px; font-weight:700; color:var(--text); outline:none; box-shadow:0 1px 2px rgba(15,19,32,.03); }
        .gfield:focus { border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
      `}</style>
    </div>
  );
}
