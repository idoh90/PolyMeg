// GruBet wordmark: chart-bars glyph + "Gru" + accent "Bet".
export default function Wordmark({ size = 22 }: { size?: number }) {
  const g = Math.round(size * 1.1);
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.36 }}>
      <svg width={g} height={g} viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="13" width="5" height="8" rx="1.5" fill="var(--accent)" />
        <rect x="9.5" y="8" width="5" height="13" rx="1.5" fill="var(--accent)" />
        <rect x="16" y="3" width="5" height="18" rx="1.5" fill="var(--accent)" />
      </svg>
      <span className="font-black tracking-[-0.5px]" style={{ fontSize: size }}>
        Gru<span className="text-accent">Bet</span>
      </span>
    </span>
  );
}
