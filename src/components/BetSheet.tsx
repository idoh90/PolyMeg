"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { formatAgorot, agorotToShekels } from "@/lib/money";
import { sideKind } from "@/lib/markets";
import TrashTalkBar from "@/components/TrashTalkBar";

export interface SheetMarket {
  id: string;
  title: string;
  imageUrl: string | null;
  emoji?: string | null;
  minStake: number; // agorot
  fixedStake?: number | null; // if set, the only allowed stake (agorot)
  kind?: string; // BINARY | MULTI | SCALAR
  scalarMin?: number | null;
  scalarMax?: number | null;
  scalarUnit?: string | null;
  pot: number; // agorot
  options: { id: string; label: string; total: number; pct: number }[];
}

type Ctx = { open: (m: SheetMarket, optionId?: string | null) => void };
const BetSheetCtx = createContext<Ctx>({ open: () => {} });
export const useBetSheet = () => useContext(BetSheetCtx);

const KIND_TEXT = { yes: "text-yes", no: "text-no", accent: "text-accent" };
const KIND_BG = { yes: "bg-yes-b", no: "bg-no-b", accent: "bg-accent-soft" };
const KIND_SOLID = { yes: "bg-yes", no: "bg-no", accent: "bg-accent" };

export function BetSheetProvider({ children }: { children: ReactNode }) {
  const [market, setMarket] = useState<SheetMarket | null>(null);
  const [initialOption, setInitialOption] = useState<string | null>(null);

  return (
    <BetSheetCtx.Provider
      value={{
        open: (m, optionId = null) => {
          setMarket(m);
          setInitialOption(optionId);
        },
      }}
    >
      {children}
      {market && (
        <BetSheet
          market={market}
          initialOption={initialOption}
          onClose={() => setMarket(null)}
        />
      )}
    </BetSheetCtx.Provider>
  );
}

function BetSheet({
  market,
  initialOption,
  onClose,
}: {
  market: SheetMarket;
  initialOption: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isScalar = market.kind === "SCALAR";
  const [optionId, setOptionId] = useState<string | null>(initialOption);
  const [amount, setAmount] = useState("");
  const [guess, setGuess] = useState("");
  const [shout, setShout] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const minShekels = agorotToShekels(market.minStake);
  const fixed = market.fixedStake ?? null;
  const sel = isScalar ? (market.options[0] ?? null) : (market.options.find((o) => o.id === optionId) ?? null);
  const amtAg = fixed ?? Math.round((parseFloat(amount) || 0) * 100);
  const guessNum = Number(guess);
  const guessValid =
    !isScalar ||
    (guess !== "" &&
      Number.isFinite(guessNum) &&
      (market.scalarMin == null || guessNum >= market.scalarMin) &&
      (market.scalarMax == null || guessNum <= market.scalarMax));

  const { payout, profit } = useMemo(() => {
    if (!sel || amtAg <= 0) return { payout: 0, profit: 0 };
    const newOptPool = sel.total + amtAg;
    const newPot = market.pot + amtAg;
    const p = newOptPool > 0 ? (amtAg / newOptPool) * newPot : 0;
    return { payout: Math.round(p), profit: Math.round(p - amtAg) };
  }, [sel, amtAg, market.pot]);

  const valid = !!sel && amtAg >= market.minStake && guessValid;

  async function place() {
    if (!valid || !sel) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/markets/${market.id}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionId: sel.id,
        amount: fixed ? agorotToShekels(fixed) : Number(amount),
        shout,
        guess: isScalar ? guessNum : undefined,
      }),
    });
    if (res.ok) {
      setPlaced(true);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "לא ניתן להניח את ההימור.");
    }
    setBusy(false);
  }

  function finish() {
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[480px]">
      <div className="pm-fade absolute inset-0 bg-[rgba(15,19,32,.5)]" onClick={onClose} />
      <div className="pm-rise absolute inset-x-0 bottom-0 rounded-t-[26px] bg-surface px-5 pb-7 pt-2 shadow-[0_-14px_40px_-10px_rgba(15,19,32,.3)]">
        <div className="mx-auto mb-4 mt-1.5 h-[5px] w-10 rounded-full bg-[#d7dbe4]" />

        {placed ? (
          <div className="px-1 pb-2 pt-3.5 text-center">
            <div className="pm-pop mx-auto mb-[18px] flex h-[78px] w-[78px] items-center justify-center rounded-full bg-yes-b">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--yes)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="mb-1.5 text-[21px] font-extrabold">ההימור נקלט! 🎉</div>
            <div className="mb-1.5 text-sm font-semibold text-muted">
              הימרת {formatAgorot(amtAg)} על{" "}
              <span className={`font-extrabold ${KIND_TEXT[sideKind(sel!.label)]}`}>
                {sel!.label}
              </span>
            </div>
            <div dir="auto" className="mb-[22px] text-[13px] font-semibold text-faint">
              {market.title}
            </div>
            <div className="mb-5 flex justify-around rounded-[14px] bg-surface-2 p-3.5">
              <Stat label="זכייה אפשרית" value={formatAgorot(payout)} />
              <Stat label="רווח" value={formatAgorot(profit)} />
            </div>
            <button
              onClick={finish}
              className="w-full rounded-[14px] bg-[var(--text)] py-[15px] text-base font-extrabold text-white"
            >
              סיום
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-[18px] flex items-center gap-2.5">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[22px]">
                {market.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={market.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  market.emoji ?? "🎲"
                )}
              </div>
              <div dir="auto" className="flex-1 text-[15px] font-extrabold leading-tight">
                {market.title}
              </div>
            </div>

            {isScalar ? (
              <>
                <div className="mb-2.5 text-[13px] font-extrabold text-muted">
                  הניחוש שלך{market.scalarUnit ? ` (${market.scalarUnit})` : ""}
                </div>
                <div data-field className="mb-1.5 flex items-center rounded-[14px] border-[1.5px] border-border bg-surface-2 px-4 py-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder={market.scalarMin != null ? String(market.scalarMin) : "0"}
                    className="w-full bg-transparent p-2.5 text-right text-3xl font-extrabold text-text outline-none"
                  />
                </div>
                <div className="mb-[18px] text-[12px] font-semibold text-faint">
                  טווח {market.scalarMin}–{market.scalarMax}
                  {market.scalarUnit ? ` ${market.scalarUnit}` : ""} · הכי קרוב לוקח את הקופה
                </div>
              </>
            ) : (
              <>
                <div className="mb-2.5 text-[13px] font-extrabold text-muted">בחר אפשרות</div>
                <div className="mb-[18px] flex flex-wrap gap-2.5">
                  {market.options.map((o) => {
                    const k = sideKind(o.label);
                    const on = optionId === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setOptionId(o.id)}
                        className={`min-w-[calc(50%-5px)] flex-1 rounded-[13px] border-[1.5px] px-3 py-3.5 text-[15px] font-extrabold transition ${
                          on
                            ? `${KIND_BG[k]} ${KIND_TEXT[k]} border-current`
                            : "border-border bg-surface text-muted"
                        }`}
                      >
                        {o.label} · {o.pct}%
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mb-2.5 text-[13px] font-extrabold text-muted">סכום</div>
            {fixed ? (
              <div className="mb-[18px] flex items-center justify-between rounded-[14px] border-[1.5px] border-border bg-surface-2 px-4 py-3.5">
                <span className="text-[13px] font-extrabold text-muted">סכום קבוע</span>
                <span className="text-2xl font-extrabold">{formatAgorot(fixed)}</span>
              </div>
            ) : (
              <>
                <div className="mb-2.5 flex items-center rounded-[14px] border-[1.5px] border-border bg-surface-2 px-4 py-1">
                  <span className="text-2xl font-extrabold text-faint">₪</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent p-2.5 text-right text-3xl font-extrabold text-text outline-none"
                  />
                </div>
                <div className="mb-[18px] flex gap-2">
                  {[10, 25, 50, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="flex-1 rounded-[11px] border border-border bg-surface py-2.5 text-[13.5px] font-extrabold"
                    >
                      ₪{v}
                    </button>
                  ))}
                </div>
              </>
            )}

            <TrashTalkBar value={shout} onChange={setShout} />

            {isScalar ? (
              <div className="mb-4 rounded-[14px] bg-surface-2 px-4 py-3.5 text-center text-[12.5px] font-semibold text-muted">
                הניחוש הקרוב ביותר לתוצאה לוקח את כל הקופה.
              </div>
            ) : (
              <div className="mb-4 flex justify-between rounded-[14px] bg-surface-2 px-4 py-3.5">
                <Stat label="זכייה אפשרית" value={formatAgorot(payout)} />
                <Stat label="רווח פוטנציאלי" value={formatAgorot(profit)} alignLeft />
              </div>
            )}

            {error && <p className="mb-3 text-center text-sm font-semibold text-no">{error}</p>}

            <button
              onClick={place}
              disabled={!valid || busy}
              className="w-full rounded-[15px] py-4 text-[17px] font-extrabold text-white transition disabled:cursor-default"
              style={{ background: valid ? "var(--text)" : "#c5cad6" }}
            >
              {busy
                ? "רושם…"
                : isScalar && !guessValid
                  ? "הזן ניחוש בטווח"
                  : !sel
                    ? "בחר אפשרות"
                    : amtAg < market.minStake
                      ? `מינימום ₪${minShekels}`
                      : isScalar
                        ? `נחש ${guessNum} · ${formatAgorot(amtAg)}`
                        : `קנה ${sel.label} · ${formatAgorot(amtAg)}`}
            </button>
            <div className="mt-2.5 text-center text-[11.5px] font-semibold text-faint">
              פארימוצ׳ואל · כל ההימורים נכנסים לקופה אחת והזוכים מתחלקים בה
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  alignLeft,
}: {
  label: string;
  value: string;
  alignLeft?: boolean;
}) {
  return (
    <div className={alignLeft ? "text-left" : ""}>
      <div className="text-[11.5px] font-bold text-muted">{label}</div>
      <div className="mt-0.5 text-[19px] font-extrabold text-yes">{value}</div>
    </div>
  );
}

export { KIND_TEXT, KIND_BG, KIND_SOLID };
