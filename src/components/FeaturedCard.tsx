"use client";

import { useRouter } from "next/navigation";
import { useBetSheet, type SheetMarket } from "@/components/BetSheet";

export interface FeaturedData {
  sheet: SheetMarket;
  emojiImage: string | null;
  title: string;
  timeText: string;
  potText: string;
  betCount: number;
  top: { id: string; label: string; pct: number };
  bot: { id: string; label: string; pct: number };
}

export default function FeaturedCard({ data }: { data: FeaturedData }) {
  const router = useRouter();
  const { open } = useBetSheet();

  return (
    <div
      onClick={() => router.push(`/bets/${data.sheet.id}`)}
      className="pressable relative cursor-pointer overflow-hidden rounded-[22px] p-[18px] text-white shadow-[0_14px_30px_-14px_rgba(15,19,32,.6)]"
      style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
    >
      <div
        className="absolute -left-[30px] -top-10 h-40 w-40 rounded-full"
        style={{ background: "radial-gradient(circle,rgba(43,110,242,.5),transparent 70%)" }}
      />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold tracking-wide text-[#aeb7c9]">
          <span className="rounded-full bg-[rgba(43,110,242,.25)] px-2.5 py-[3px] text-[#9cc0ff]">מומלץ</span>
          <span>{data.timeText}</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white/10 text-[26px]">
            {data.emojiImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.emojiImage} alt="" className="h-full w-full object-cover" />
            ) : (
              "🎲"
            )}
          </div>
          <div dir="auto" className="min-w-0 flex-1 text-[18px] font-extrabold leading-tight">
            {data.title}
          </div>
          <div className="text-center">
            <div className="text-[30px] font-black leading-none text-yes">
              {data.top.pct}
              <span className="text-base">%</span>
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-[#aeb7c9]">{data.top.label}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              open(data.sheet, data.top.id);
            }}
            className="flex-1 rounded-[13px] bg-yes py-[13px] text-[15px] font-extrabold text-[#04130c]"
          >
            קנה {data.top.label} · {data.top.pct}%
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              open(data.sheet, data.bot.id);
            }}
            className="flex-1 rounded-[13px] bg-no py-[13px] text-[15px] font-extrabold text-[#1a0509]"
          >
            קנה {data.bot.label} · {data.bot.pct}%
          </button>
        </div>
        <div className="mt-3 flex justify-between text-xs font-semibold text-[#aeb7c9]">
          <span>קופה {data.potText}</span>
          <span>{data.betCount} הימורים</span>
        </div>
      </div>
    </div>
  );
}
