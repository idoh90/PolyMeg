// "Back" chevron. The glyph points left (the back direction in LTR/English);
// the `.rtl-flip` class mirrors it to point right under [dir="rtl"] (Hebrew),
// so a single component is correct in both reading directions. No locale prop
// needed — the flip is driven purely by the ancestor <html dir>.
export default function BackChevron({
  size = 18,
  stroke = "var(--text)",
}: {
  size?: number;
  stroke?: string;
}) {
  return (
    <svg
      className="rtl-flip"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
