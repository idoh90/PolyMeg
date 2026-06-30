import Shimmer from "@/components/Skeleton";

// Instant loading state for Feed: back + title header, tab row, then a
// stack of activity rows (avatar + two text lines) — mirrors FeedView's shape.
export default function FeedLoading() {
  return (
    <div className="gb-auto-dark min-h-dvh bg-bg pb-10">
      {/* header */}
      <div className="flex items-center gap-3 px-[18px] pb-3 pt-3">
        <Shimmer className="h-[38px] w-[38px] flex-none rounded-xl" />
        <Shimmer className="h-[22px] w-[38%] rounded-[8px]" />
      </div>

      {/* tabs */}
      <div className="flex gap-2 px-[18px] pb-3">
        {["88px", "72px", "80px"].map((w, i) => (
          <Shimmer key={i} className="h-[34px] rounded-[12px]" style={{ width: w, animationDelay: `${i * -0.12}s` }} />
        ))}
      </div>

      {/* activity rows */}
      <div className="flex flex-col gap-3 px-[18px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-[18px] border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
          >
            <Shimmer className="h-[38px] w-[38px] flex-none rounded-full" style={{ animationDelay: `${i * -0.13}s` }} />
            <div className="min-w-0 flex-1">
              <Shimmer className="h-[12px] w-[70%] rounded-[6px]" style={{ animationDelay: `${i * -0.13}s` }} />
              <Shimmer className="mt-[9px] h-[12px] w-[48%] rounded-[6px]" style={{ animationDelay: `${i * -0.13}s` }} />
              <Shimmer className="mt-[11px] h-[40px] w-full rounded-[12px]" style={{ animationDelay: `${i * -0.13}s` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
