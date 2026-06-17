"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "binary" | "custom";

// Read an image File into a downscaled data URL so it stores compactly in the DB.
function fileToDataUrl(file: File, maxSize = 600): Promise<string> {
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

// Default close time: tomorrow, same time, formatted for datetime-local input.
function defaultCloseValue(): string {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewBetPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("binary");
  const [customOptions, setCustomOptions] = useState<string[]>(["", ""]);
  const [minStake, setMinStake] = useState("5");
  const [closesAt, setClosesAt] = useState(defaultCloseValue);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUrl(await fileToDataUrl(file));
    } catch {
      setError("לא ניתן לקרוא את התמונה.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const options =
      mode === "binary"
        ? ["כן", "לא"]
        : customOptions.map((o) => o.trim()).filter(Boolean);

    setBusy(true);
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        criteria,
        imageUrl,
        minStake: Number(minStake),
        closesAt: new Date(closesAt).toISOString(),
        options,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/bets/${id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "לא ניתן ליצור את ההימור.");
      setBusy(false);
    }
  }

  return (
    <div className="px-[18px] pb-8 pt-3">
      <h1 className="mb-5 text-2xl font-extrabold">יצירת הימור חדש</h1>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="כותרת">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ניפגש ביום שישי הקרוב?"
            className="input"
            required
          />
        </Field>

        <Field label="תנאי הכרעה" hint="איך נקבע המנצח?">
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="'כן' אם לפחות 3 מאיתנו נמצאים יחד לפני חצות ביום שישי. אחרת 'לא'."
            rows={3}
            className="input resize-none"
            required
          />
        </Field>

        <Field label="תמונה (לא חובה)">
          <div className="flex items-center gap-3">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="preview"
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-text"
            />
          </div>
        </Field>

        <Field label="אפשרויות">
          <div className="mb-3 flex gap-2">
            <ModeButton active={mode === "binary"} onClick={() => setMode("binary")}>
              כן / לא
            </ModeButton>
            <ModeButton active={mode === "custom"} onClick={() => setMode("custom")}>
              בחירה מרובה
            </ModeButton>
          </div>
          {mode === "binary" ? (
            <div className="flex gap-2">
              <span className="flex-1 rounded-lg border border-border bg-yes-b px-3 py-2 text-yes">
                כן
              </span>
              <span className="flex-1 rounded-lg border border-border bg-no-b px-3 py-2 text-no">
                לא
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {customOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) =>
                      setCustomOptions((prev) =>
                        prev.map((o, j) => (j === i ? e.target.value : o)),
                      )
                    }
                    placeholder={`אפשרות ${i + 1}`}
                    className="input"
                  />
                  {customOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setCustomOptions((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="rounded-lg border border-border px-3 text-muted hover:text-no"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomOptions((prev) => [...prev, ""])}
                className="self-start text-sm text-accent hover:underline"
              >
                + הוסף אפשרות
              </button>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="סכום מינימלי (₪)">
            <input
              type="number"
              min={0}
              step="1"
              value={minStake}
              onChange={(e) => setMinStake(e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="נסגר בתאריך">
            <input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="input"
              required
            />
          </Field>
        </div>

        {error && <p className="text-sm text-no">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "יוצר…" : "צור הימור"}
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--surface);
          padding: 0.5rem 0.75rem;
          color: var(--text);
          outline: none;
        }
        .input:focus { border-color: var(--accent); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active ? "border-accent bg-surface-2" : "border-border text-muted"
      }`}
    >
      {children}
    </button>
  );
}
