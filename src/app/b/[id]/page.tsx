import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBet, getBaseUrl } from "@/lib/share";
import Wordmark from "@/components/Wordmark";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bet = await getPublicBet(id);
  const base = getBaseUrl();
  if (!bet) return { title: "GRUbet" };

  const desc =
    bet.kind === "SCALAR"
      ? `נחשו את המספר · קופה ${bet.potText} · ${bet.groupName}`
      : `${bet.topLabel} ${bet.topPct}% · קופה ${bet.potText} · ${bet.groupName}`;

  return {
    metadataBase: new URL(base),
    title: `${bet.title} · GRUbet`,
    description: desc,
    openGraph: { title: bet.title, description: desc, type: "website", url: `${base}/b/${id}` },
    twitter: { card: "summary_large_image", title: bet.title, description: desc },
  };
}

export default async function PublicBetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bet = await getPublicBet(id);
  if (!bet) notFound();

  const isScalar = bet.kind === "SCALAR";
  const headline = isScalar
    ? `${bet.scalarMin}–${bet.scalarMax}${bet.scalarUnit ? ` ${bet.scalarUnit}` : ""}`
    : `${bet.topPct}%`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-[26px] py-10">
      <div className="mb-6 flex justify-center">
        <Wordmark size={26} />
      </div>

      {/* hero card (mirrors the OG image) */}
      <div
        className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-[0_24px_60px_-20px_rgba(15,19,32,.6)]"
        style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
      >
        <div className="absolute -left-8 -top-10 h-44 w-44 rounded-full" style={{ background: "radial-gradient(circle,rgba(43,110,242,.5),transparent 70%)" }} />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-extrabold text-[#aeb7c9]">{bet.groupName}</span>
            <span className="text-[12px] font-extrabold text-[#aeb7c9]">GRUbet</span>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-[16px] bg-white/10 text-[32px]">{bet.emoji ?? "🎲"}</div>
            <div dir="auto" className="text-[22px] font-extrabold leading-tight">{bet.title}</div>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-[40px] font-black leading-none text-yes">{headline}</div>
              <div className="mt-1 text-[13px] font-bold text-[#aeb7c9]">{isScalar ? "ניחוש המספר" : bet.topLabel}</div>
            </div>
            <div className="text-end">
              <div className="text-[12px] font-bold text-[#aeb7c9]">קופה</div>
              <div className="text-[24px] font-extrabold">{bet.potText}</div>
            </div>
          </div>
        </div>
      </div>

      <Link
        href={`/g/${bet.groupId}/bets/${bet.id}`}
        className="pressable mt-6 w-full rounded-[15px] bg-accent py-4 text-center text-[16.5px] font-extrabold text-white shadow-[0_12px_24px_-12px_var(--accent)]"
      >
        פתח ב-GRUbet ←
      </Link>
      <div className="mt-3 text-center text-[13px] font-semibold text-muted">
        הצטרפו לקבוצה כדי להמר · {bet.betCount} כבר בפנים
      </div>
    </main>
  );
}
