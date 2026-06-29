"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { EMOJI_OPTIONS, MARKET_TEMPLATES, type MarketTemplate } from "@/lib/constants";

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
  const [emoji, setEmoji] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"binary" | "multi" | "scalar">("binary");
  const [opts, setOpts] = useState<string[]>(["", ""]);
  const [scMin, setScMin] = useState("0");
  const [scMax, setScMax] = useState("20");
  const [scUnit, setScUnit] = useState("");
  const [minStake, setMinStake] = useState("5");
  const [maxStake, setMaxStake] = useState("");
  const [perUserCap, setPerUserCap] = useState("");
  const [fixedMode, setFixedMode] = useState(false);
  const [fixedAmt, setFixedAmt] = useState("10");
  const [recurring, setRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState(7);
  const [cashOut, setCashOut] = useState(false);
  const [closeKey, setCloseKey] = useState("3");
  const [customDate, setCustomDate] = useState("");
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
  const finalOpts =
    mode === "binary" ? ["כן", "לא"] : mode === "scalar" ? ["ניחוש"] : opts.map((o) => o.trim()).filter(Boolean);
  const scalarValid = scMin !== "" && scMax !== "" && Number(scMin) < Number(scMax);
  const canNext =
    step === 0
      ? title.trim().length >= 3
      : step === 1
        ? mode === "scalar"
          ? scalarValid
          : finalOpts.length >= 2
        : true;

  function applyTemplate(t: MarketTemplate) {
    setTitle(t.title);
    setEmoji(t.emoji);
    if (t.kind === "MULTI") {
      setMode("multi");
      setOpts(t.options && t.options.length >= 2 ? [...t.options] : ["", "", ""]);
    } else if (t.kind === "SCALAR") {
      setMode("scalar");
      if (t.scalarUnit) setScUnit(t.scalarUnit);
    } else {
      setMode("binary");
    }
  }

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
    const closesAt = customDate ? new Date(customDate).toISOString() : closeISO(days);
    const fixed = fixedMode && Number(fixedAmt) > 0 ? Number(fixedAmt) : null;
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        title: title.trim(),
        emoji: emoji || null,
        imageUrl,
        minStake: fixed ?? (Number(minStake) || 0),
        maxStake: fixed ? null : maxStake ? Number(maxStake) : null,
        perUserCap: fixed ? null : perUserCap ? Number(perUserCap) : null,
        fixedStake: fixed,
        recurring,
        recurrenceDays: recurring ? recurDays : null,
        cashOutEnabled: mode === "scalar" ? false : cashOut,
        kind: mode === "scalar" ? "SCALAR" : undefined,
        scalarMin: mode === "scalar" ? Number(scMin) : undefined,
        scalarMax: mode === "scalar" ? Number(scMax) : undefined,
        scalarUnit: mode === "scalar" ? scUnit || null : undefined,
        closesAt,
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
            <div className="mb-3 text-sm font-semibold leading-relaxed text-muted">נסחו שאלה ברורה שאפשר להכריע עליה.</div>

            <div className="mb-1.5 text-[12px] font-extrabold text-faint">⚡ התחל מתבנית</div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {MARKET_TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  onClick={() => applyTemplate(t)}
                  className="pressable flex flex-none items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[12.5px] font-bold"
                >
                  <span className="text-[15px]">{t.emoji}</span>
                  <span className="whitespace-nowrap">{t.title}</span>
                </button>
              ))}
            </div>

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
              סמל <span className="font-semibold text-faint">(לא חובה)</span>
            </div>
            <div className="mb-1 flex gap-2 overflow-x-auto pb-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji((cur) => (cur === e ? "" : e))}
                  className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[12px] border-[1.5px] text-[21px]"
                  style={{ borderColor: emoji === e ? "var(--accent)" : "var(--border)", background: emoji === e ? "var(--accent-soft)" : "var(--surface)" }}
                >
                  {e}
                </button>
              ))}
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
              {(["binary", "multi", "scalar"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-extrabold transition ${
                    mode === m ? "bg-surface text-text shadow-[0_1px_3px_rgba(15,19,32,.1)]" : "text-muted"
                  }`}
                >
                  {m === "binary" ? "כן / לא" : m === "multi" ? "בחירה" : "מספר"}
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
            ) : mode === "scalar" ? (
              <div>
                <div className="mb-4 text-sm font-semibold leading-relaxed text-faint">כל משתתף ינחש מספר בטווח. הניחוש הקרוב ביותר לוקח את הקופה.</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="mb-2 text-[13px] font-extrabold text-muted">מינימום</div>
                    <input type="number" inputMode="numeric" value={scMin} onChange={(e) => setScMin(e.target.value)} className="field w-full text-[16px] font-bold" />
                  </div>
                  <div>
                    <div className="mb-2 text-[13px] font-extrabold text-muted">מקסימום</div>
                    <input type="number" inputMode="numeric" value={scMax} onChange={(e) => setScMax(e.target.value)} className="field w-full text-[16px] font-bold" />
                  </div>
                </div>
                <div className="mb-2 mt-3.5 text-[13px] font-extrabold text-muted">
                  יחידה <span className="font-semibold text-faint">(לא חובה)</span>
                </div>
                <input value={scUnit} onChange={(e) => setScUnit(e.target.value)} dir="auto" placeholder="אנשים, גולים, דקות…" className="field w-full text-[15px] font-bold" />
                {!scalarValid && <div className="mt-2.5 text-[12px] font-bold text-no">המקסימום חייב להיות גדול מהמינימום.</div>}
              </div>
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
                      emoji || "🎲"
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

            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[13px] font-extrabold text-muted">{fixedMode ? "סכום קבוע לכולם" : "סכום מינימלי להשתתפות"}</span>
              <button onClick={() => setFixedMode((v) => !v)} className="flex items-center gap-2 text-[12px] font-extrabold text-accent">
                <span className="relative h-[22px] w-[38px] rounded-full transition-colors" style={{ background: fixedMode ? "var(--accent)" : "var(--border)" }}>
                  <span className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all" style={{ insetInlineStart: fixedMode ? 19 : 3 }} />
                </span>
                סכום קבוע
              </button>
            </div>
            <div className="field flex items-center !py-0">
              <span className="text-[22px] font-extrabold text-faint">₪</span>
              <input
                type="number"
                inputMode="decimal"
                value={fixedMode ? fixedAmt : minStake}
                onChange={(e) => (fixedMode ? setFixedAmt(e.target.value) : setMinStake(e.target.value))}
                placeholder={fixedMode ? "10" : "5"}
                className="w-full bg-transparent px-2.5 py-3 text-right text-[22px] font-extrabold text-text outline-none"
              />
            </div>
            <div className="mb-[22px] mt-1.5 text-[11.5px] font-semibold text-faint">
              {fixedMode ? "כולם נכנסים בדיוק בסכום הזה — אין בחירת סכום." : " "}
            </div>

            <div className="mb-2.5 text-[13px] font-extrabold text-muted">מתי ההימור נסגר?</div>
            <div className="flex gap-2" style={{ opacity: customDate ? 0.5 : 1 }}>
              {CLOSE_CHIPS.map((c) => {
                const on = closeKey === c.key && !customDate;
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setCloseKey(c.key);
                      setCustomDate("");
                    }}
                    className={`flex-1 rounded-xl border px-1.5 py-3 text-[13.5px] font-extrabold transition ${
                      on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 text-[12px] font-extrabold text-muted">או תאריך מדויק</div>
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="field mt-1.5 w-full text-[14px] font-bold"
              style={{ direction: "ltr", textAlign: "start" }}
            />
            {customDate && (
              <button onClick={() => setCustomDate("")} className="mt-1.5 text-[11.5px] font-bold text-no">
                נקה תאריך
              </button>
            )}

            {/* stake caps (hidden when a fixed amount is set) */}
            {!fixedMode && (
              <>
                <div className="mt-[22px] grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="mb-2 text-[13px] font-extrabold text-muted">מקס׳ להימור</div>
                    <div className="field flex items-center !py-0">
                      <span className="text-[18px] font-extrabold text-faint">₪</span>
                      <input type="number" inputMode="decimal" value={maxStake} onChange={(e) => setMaxStake(e.target.value)} placeholder="ללא" className="w-full bg-transparent px-2 py-3 text-right text-[18px] font-extrabold outline-none" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[13px] font-extrabold text-muted">תקרה למשתתף</div>
                    <div className="field flex items-center !py-0">
                      <span className="text-[18px] font-extrabold text-faint">₪</span>
                      <input type="number" inputMode="decimal" value={perUserCap} onChange={(e) => setPerUserCap(e.target.value)} placeholder="ללא" className="w-full bg-transparent px-2 py-3 text-right text-[18px] font-extrabold outline-none" />
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 text-[11.5px] font-semibold text-faint">תקרה מונעת ממשתתף יחיד לעוות את הקופה.</div>
              </>
            )}

            {/* recurring */}
            <div className="mt-[22px] rounded-[14px] border border-border bg-surface p-3.5">
              <button onClick={() => setRecurring((v) => !v)} className="flex w-full items-center gap-3 text-start">
                <span className="relative h-[26px] w-[44px] flex-none rounded-full transition-colors" style={{ background: recurring ? "var(--accent)" : "var(--border)" }}>
                  <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all" style={{ insetInlineStart: recurring ? 21 : 3 }} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-extrabold">🔁 הימור חוזר</span>
                  <span className="block text-[11.5px] font-semibold text-faint">נפתח מחדש אוטומטית ובונה רצף</span>
                </span>
              </button>
              {recurring && (
                <div className="mt-3 flex gap-2">
                  {[{ d: 1, l: "יומי" }, { d: 7, l: "שבועי" }, { d: 30, l: "חודשי" }].map((o) => {
                    const on = recurDays === o.d;
                    return (
                      <button
                        key={o.d}
                        onClick={() => setRecurDays(o.d)}
                        className={`flex-1 rounded-xl border py-2.5 text-[13px] font-extrabold transition ${on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted"}`}
                      >
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* cash-out (not for numeric markets) */}
            {mode !== "scalar" && (
              <div className="mt-2.5 rounded-[14px] border border-border bg-surface p-3.5">
                <button onClick={() => setCashOut((v) => !v)} className="flex w-full items-center gap-3 text-start">
                  <span className="relative h-[26px] w-[44px] flex-none rounded-full transition-colors" style={{ background: cashOut ? "var(--accent)" : "var(--border)" }}>
                    <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all" style={{ insetInlineStart: cashOut ? 21 : 3 }} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14.5px] font-extrabold">💵 מכירה מוקדמת</span>
                    <span className="block text-[11.5px] font-semibold text-faint">שחקנים יוכלו למכור פוזיציה לפי השווי הנוכחי לפני ההכרעה</span>
                  </span>
                </button>
              </div>
            )}
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
