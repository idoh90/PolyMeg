"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// Generic prompts so any community can relate (replace friend-specific jokes).
const SUGGESTIONS = [
  "ירד גשם בסופ״ש?",
  "מישהו יאחר למפגש הקרוב?",
  "מי ישלם על הפיצה?",
  "ננצח את המשחק הקרוב?",
  "הקבוצה האהובה תנצח השבוע?",
  "מישהו יבטל ברגע האחרון?",
  "נצליח לסיים את המשימה עד הדדליין?",
  "מי יגיע ראשון?",
  "המבחן הקרוב — נעבור?",
  "מישהו ישבור שיא השבוע?",
  "נצא לטיול החודש?",
  "מי ישכח את הארנק?",
  "הסרט החדש יהיה שווה?",
  "נסיים את הסדרה עד סוף השבוע?",
  "מי ינצח בטורניר?",
  "המנצח הערב — מי יהיה?",
  "נגיע ליעד עד סוף החודש?",
  "מישהו יחזור בתשובה על ההחלטה?",
  "מי יאכל הכי הרבה במפגש?",
  "המחיר יעלה החודש?",
  "נצליח להתאסף כולם יחד?",
  "מי יישן הכי מעט השבוע?",
  "מישהו יתחיל הרגל חדש וישרוד שבוע?",
  "הקבוצה תעלה שלב?",
];

const CLOSE_CHIPS = [
  { key: "1", label: "יום", days: 1 },
  { key: "3", label: "3 ימים", days: 3 },
  { key: "7", label: "שבוע", days: 7 },
  { key: "30", label: "חודש", days: 30 },
];

// In a plain module fn so the create handler stays lint-pure (no Date.now in render).
function closeISO(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

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

export default function NewBetPage() {
  const router = useRouter();
  const groupId = String(useParams().groupId);
  const base = `/g/${groupId}`;
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"binary" | "multi">("binary");
  const [opts, setOpts] = useState<string[]>(["", ""]);
  const [minStake, setMinStake] = useState("5");
  const [closeKey, setCloseKey] = useState("3");
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  // rotate the placeholder suggestion while on step 0
  useEffect(() => {
    if (step !== 0) return;
    const t = setInterval(() => setIdx((i) => i + 1), 2600);
    return () => clearInterval(t);
  }, [step]);

  const suggestion = SUGGESTIONS[((idx % SUGGESTIONS.length) + SUGGESTIONS.length) % SUGGESTIONS.length];
  const finalOpts = mode === "binary" ? ["כן", "לא"] : opts.map((o) => o.trim()).filter(Boolean);
  const canNext = step === 0 ? title.trim().length >= 3 : step === 1 ? finalOpts.length >= 2 : true;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setImageUrl(await fileToDataUrl(f));
    } catch {
      setError("לא ניתן לקרוא את התמונה.");
    }
  }

  async function create() {
    setBusy(true);
    setError("");
    const days = CLOSE_CHIPS.find((c) => c.key === closeKey)?.days ?? 3;
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        title: title.trim(),
        imageUrl,
        minStake: Number(minStake) || 0,
        closesAt: closeISO(days),
        options: finalOpts,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setCreatedId(id);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "לא ניתן ליצור את ההימור.");
    }
    setBusy(false);
  }

  // ---------- success screen ----------
  if (createdId) {
    return (
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-7 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-[16%] flex justify-around">
          {["🎉", "🎲", "✨", "🎉", "💸"].map((c, i) => (
            <span key={i} style={{ animation: `pm-confetti ${1 + i * 0.07}s ease-out ${i * 0.05}s both` }} className="text-lg">
              {c}
            </span>
          ))}
        </div>
        <div className="pm-pop mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-yes-b">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--yes)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="mb-2 text-[23px] font-extrabold">ההימור עלה לאוויר!</div>
        <div dir="auto" className="mb-7 max-w-[280px] text-sm font-semibold leading-relaxed text-muted">
          {title} — החבר׳ה כבר יכולים להמר.
        </div>
        <button
          onClick={() => {
            router.push(`${base}/bets/${createdId}`);
            router.refresh();
          }}
          className="w-full max-w-[300px] rounded-[15px] bg-[var(--text)] py-4 text-base font-extrabold text-white"
        >
          סיום
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-78px)] flex-col">
      {/* header + progress */}
      <div className="px-[18px] pb-3 pt-3">
        <div className="mb-3.5 flex items-center gap-3">
          <button
            onClick={() => (step === 0 ? router.push(base) : setStep(step - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1 text-center text-base font-extrabold">הימור חדש</div>
          <button
            onClick={() => router.push(base)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((s) => (
            <div key={s} className="h-[5px] flex-1 rounded-full transition-colors" style={{ background: s <= step ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {step === 0 && (
          <div className="pm-screen pt-2.5">
            <div className="mb-1.5 text-[13px] font-extrabold tracking-wide text-accent">שלב 1 · הרעיון</div>
            <div className="mb-1.5 text-[23px] font-extrabold">על מה ההימור?</div>
            <div className="mb-[18px] text-sm font-semibold leading-relaxed text-muted">נסחו שאלה ברורה שאפשר להכריע עליה.</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              dir="auto"
              placeholder={suggestion}
              className="field w-full text-base font-bold"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setTitle(suggestion)}
                key={idx}
                className="pm-fade flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-accent-soft bg-accent-soft px-3 py-2.5 text-right text-[13px] font-bold text-accent"
              >
                <span className="shrink-0 text-[15px]">💡</span>
                <span className="min-w-0 flex-1 truncate">{suggestion}</span>
                <span className="shrink-0 text-[11px] font-extrabold text-faint">השתמש</span>
              </button>
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="flex w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
                aria-label="הצעה אחרת"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" />
                </svg>
              </button>
            </div>

            <div className="mb-2.5 mt-6 text-[13px] font-extrabold text-muted">
              תמונה <span className="font-semibold text-faint">(לא חובה)</span>
            </div>
            <label className="block cursor-pointer">
              {imageUrl ? (
                <div className="flex h-[118px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-[1.5px] border-accent-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#c7cdda] bg-surface-2 text-faint">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                  </svg>
                  <div className="text-[12.5px] font-bold">הוסף תמונה</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </label>
            {imageUrl && (
              <button onClick={() => setImageUrl(null)} className="mt-2 text-xs font-bold text-no">
                הסר תמונה
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="pm-screen pt-2.5">
            <div className="mb-1.5 text-[13px] font-extrabold tracking-wide text-accent">שלב 2 · האפשרויות</div>
            <div className="mb-1.5 text-[23px] font-extrabold">איך מכריעים?</div>
            <div className="mb-[18px] text-sm font-semibold leading-relaxed text-muted">כן/לא לשאלה פשוטה, או כמה אפשרויות לבחירה.</div>
            <div className="mb-5 flex gap-1.5 rounded-[14px] bg-surface-2 p-1.5">
              {(["binary", "multi"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-[10px] py-2.5 text-sm font-extrabold transition ${
                    mode === m ? "bg-surface text-text shadow-[0_1px_3px_rgba(15,19,32,.1)]" : "text-muted"
                  }`}
                >
                  {m === "binary" ? "כן / לא" : "בחירה מרובה"}
                </button>
              ))}
            </div>

            {mode === "binary" ? (
              <>
                <div className="flex gap-2.5">
                  <div className="flex-1 rounded-[14px] bg-yes-b py-5 text-center text-lg font-extrabold text-yes">כן</div>
                  <div className="flex-1 rounded-[14px] bg-no-b py-5 text-center text-lg font-extrabold text-no">לא</div>
                </div>
                <div className="mt-3 text-center text-[12.5px] font-semibold text-faint">המשתתפים יקנו צד אחד מהשניים.</div>
              </>
            ) : (
              <div className="flex flex-col gap-2.5">
                {opts.map((o, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[13px] font-extrabold text-accent">
                      {i + 1}
                    </div>
                    <input
                      value={o}
                      onChange={(e) => setOpts((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                      dir="auto"
                      placeholder="שם האפשרות"
                      className="field flex-1 text-[15px] font-bold"
                    />
                    {opts.length > 2 && (
                      <button
                        onClick={() => setOpts((p) => p.filter((_, j) => j !== i))}
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-faint"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {opts.length < 6 && (
                  <button
                    onClick={() => setOpts((p) => [...p, ""])}
                    className="mt-1 w-full rounded-xl border-[1.5px] border-dashed border-[#c7cdda] py-3 text-sm font-extrabold text-accent"
                  >
                    + הוסף אפשרות
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="pm-screen pt-2.5">
            <div className="mb-1.5 text-[13px] font-extrabold tracking-wide text-accent">שלב 3 · פרטים אחרונים</div>
            <div className="mb-[18px] text-[23px] font-extrabold">כמעט שם!</div>

            {/* preview */}
            <div className="relative mb-[22px] overflow-hidden rounded-[18px] p-4 text-white" style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}>
              <div className="absolute -left-5 -top-[30px] h-[120px] w-[120px] rounded-full" style={{ background: "radial-gradient(circle,rgba(43,110,242,.45),transparent 70%)" }} />
              <div className="relative">
                <div className="mb-3.5 flex items-center gap-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-white/10 text-2xl">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "🎲"
                    )}
                  </div>
                  <div dir="auto" className="flex-1 text-[15px] font-extrabold leading-tight">{title || "ההימור שלך"}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {finalOpts.map((l) => {
                    const yes = l === "כן";
                    const no = l === "לא";
                    return (
                      <span
                        key={l}
                        className="rounded-[10px] px-3.5 py-1.5 text-[13px] font-extrabold"
                        style={{
                          background: yes ? "#15b87a" : no ? "#f0405a" : "rgba(255,255,255,.14)",
                          color: yes || no ? "#fff" : "#cdd6e6",
                        }}
                      >
                        {l}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mb-2.5 text-[13px] font-extrabold text-muted">סכום מינימלי להשתתפות</div>
            <div className="field mb-[22px] flex items-center !py-0">
              <span className="text-[22px] font-extrabold text-faint">₪</span>
              <input
                type="number"
                inputMode="decimal"
                value={minStake}
                onChange={(e) => setMinStake(e.target.value)}
                placeholder="5"
                className="w-full bg-transparent px-2.5 py-3 text-right text-[22px] font-extrabold text-text outline-none"
              />
            </div>

            <div className="mb-2.5 text-[13px] font-extrabold text-muted">מתי ההימור נסגר?</div>
            <div className="flex gap-2">
              {CLOSE_CHIPS.map((c) => {
                const on = closeKey === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCloseKey(c.key)}
                    className={`flex-1 rounded-xl border px-1.5 py-3 text-[13.5px] font-extrabold transition ${
                      on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="mt-4 px-1 text-sm font-semibold text-no">{error}</p>}
      </div>

      {/* footer */}
      <div className="border-t border-border bg-surface px-[18px] pb-5 pt-3">
        {step < 2 ? (
          <button
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className="w-full rounded-[15px] bg-[var(--text)] py-4 text-base font-extrabold text-white disabled:opacity-40"
          >
            המשך
          </button>
        ) : (
          <button
            onClick={create}
            disabled={busy}
            className="w-full rounded-[15px] bg-accent py-4 text-base font-extrabold text-white shadow-[0_10px_22px_-10px_var(--accent)] disabled:opacity-50"
          >
            {busy ? "יוצר…" : "🎲 צור הימור"}
          </button>
        )}
      </div>

      <style>{`
        .field {
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          padding: 14px 16px;
          color: var(--text);
          outline: none;
          box-shadow: 0 1px 2px rgba(15,19,32,.03);
        }
        .field:focus, .field:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
      `}</style>
    </div>
  );
}
