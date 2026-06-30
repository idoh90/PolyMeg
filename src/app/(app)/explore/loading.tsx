import Shimmer from "@/components/Skeleton";

// Instant loading state for Explore: search header, group filter chips,
// a hero card, then a couple of section lists — mirrors ExploreView's shape.
export default function ExploreLoading() {
  return (
    <div className="gb-auto-dark min-h-dvh bg-bg pb-10">
      {/* header + search */}
      <div className="px-[18px] pt-3">
        <Shimmer className="h-[26px] w-[40%] rounded-[8px]" />
        <Shimmer className="mt-3 h-[44px] w-full rounded-[14px]" />
      </div>

      {/* group filter chips */}
      <div className="flex gap-2 px-[18px] pt-3">
        {["72px", "96px", "84px", "64px"].map((w, i) => (
          <Shimmer key={i} className="h-[30px] rounded-full" style={{ width: w, animationDelay: `${i * -0.12}s` }} />
        ))}
      </div>

      {/* hero */}
      <div className="px-[18px] pt-4">
        <Shimmer className="h-[150px] w-full rounded-[20px]" />
      </div>

      {/* section list */}
      <div className="flex flex-col gap-[11px] px-[18px] pt-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
          >
            <Shimmer className="h-12 w-12 flex-none rounded-[14px]" style={{ animationDelay: `${i * -0.15}s` }} />
            <div className="min-w-0 flex-1">
              <Shimmer className="h-[13px] w-[64%] rounded-[7px]" style={{ animationDelay: `${i * -0.15}s` }} />
              <Shimmer className="mt-[9px] h-[11px] w-[42%] rounded-[6px]" style={{ animationDelay: `${i * -0.15}s` }} />
            </div>
            <Shimmer className="h-[28px] w-[52px] flex-none rounded-[9px]" style={{ animationDelay: `${i * -0.15}s` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
