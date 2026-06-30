import Wordmark from "@/components/Wordmark";
import Shimmer from "@/components/Skeleton";
import { getI18n } from "@/lib/i18n/server";

// Instant loading state for the groups dashboard. Mirrors the real layout so the
// page swaps in without a jump; the group rows shimmer (gb-shimmer) and the real
// content swishes in once the data resolves (see page.tsx entrance animations).
export default async function GroupsLoading() {
  const { dict } = await getI18n();
  return (
    <div className="gb-auto-dark min-h-dvh bg-bg pb-8 pt-1.5">
      {/* top bar */}
      <div className="flex items-center justify-between px-[18px] pb-0.5 pt-2">
        <Wordmark size={22} />
        <Shimmer className="h-10 w-10 rounded-full" />
      </div>

      {/* greeting */}
      <div className="px-[18px] pb-[18px] pt-2">
        <Shimmer className="h-[25px] w-[58%] rounded-[8px]" />
        <Shimmer className="mt-[7px] h-[14px] w-[40%] rounded-[7px]" />
      </div>

      {/* launch cards */}
      <div className="flex gap-[11px] px-[18px] pb-[22px]">
        <Shimmer className="h-[122px] flex-1 rounded-[18px]" />
        <Shimmer className="h-[122px] flex-1 rounded-[18px]" />
      </div>

      {/* section header */}
      <div className="flex items-center justify-between px-[18px] pb-[11px]">
        <span className="text-base font-extrabold">{dict.groups.myGroups}</span>
        <Shimmer className="h-[14px] w-[18px] rounded-[7px]" />
      </div>

      {/* group rows */}
      <div className="flex flex-col gap-[11px] px-[18px]">
        <GroupRowSkeleton delay="0s" widths={["56%", "40%", "31%"]} />
        <GroupRowSkeleton delay="-0.18s" widths={["48%", "36%", "28%"]} />
        <GroupRowSkeleton delay="-0.36s" widths={["52%", "34%", "26%"]} />
      </div>

      {/* footer actions */}
      <div className="flex gap-[10px] px-[18px] pt-[18px]">
        <Shimmer className="h-[42px] flex-1 rounded-[13px]" />
        <Shimmer className="h-[42px] flex-1 rounded-[13px]" />
      </div>
    </div>
  );
}

function GroupRowSkeleton({ delay, widths }: { delay: string; widths: [string, string, string] }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]">
      <Shimmer className="h-12 w-12 flex-none rounded-[14px]" style={{ animationDelay: delay }} />
      <div className="min-w-0 flex-1">
        <Shimmer className="h-[13px] rounded-[7px]" style={{ width: widths[0], animationDelay: delay }} />
        <Shimmer className="mt-[9px] h-[11px] rounded-[6px]" style={{ width: widths[1], animationDelay: delay }} />
        <Shimmer className="mt-[9px] h-[11px] rounded-[6px]" style={{ width: widths[2], animationDelay: delay }} />
      </div>
      <Shimmer className="h-[14px] w-[34px] flex-none rounded-[7px]" style={{ animationDelay: delay }} />
    </div>
  );
}
