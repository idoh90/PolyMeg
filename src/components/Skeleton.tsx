// Shimmering placeholder block. Pure CSS (see `.gb-shimmer` in globals.css), so
// it works in server components and respects prefers-reduced-motion. Compose these
// into route-level loading skeletons that mirror the real layout.
export default function Shimmer({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`gb-shimmer ${className}`} style={style} />;
}
