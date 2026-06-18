import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { agorotToShekels } from "@/lib/money";
import EditBetForm from "@/components/EditBetForm";

export default async function EditBetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/lock");

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  if (!market) notFound();
  if (market.creatorId !== user.id && !user.isAdmin) redirect(`/bets/${id}`);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-[18px] pb-8 pt-3">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={`/bets/${id}`}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold">עריכת הימור</h1>
      </div>

      <EditBetForm
        initial={{
          id: market.id,
          title: market.title,
          criteria: market.criteria,
          imageUrl: market.imageUrl,
          minStakeShekels: agorotToShekels(market.minStake),
          closesAtISO: market.closesAt.toISOString(),
          options: market.options.map((o) => ({
            id: o.id,
            label: o.label,
            blockedUserIds: o.blockedUserIds,
          })),
        }}
        users={users}
      />
    </div>
  );
}
