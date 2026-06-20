import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getMembership, isAdminRole } from "@/lib/membership";
import { agorotToShekels } from "@/lib/money";
import EditBetForm from "@/components/EditBetForm";

export default async function EditBetPage({
  params,
}: {
  params: Promise<{ groupId: string; id: string }>;
}) {
  const { groupId, id } = await params;
  const base = `/g/${groupId}`;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [market, membership] = await Promise.all([
    prisma.market.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    }),
    getMembership(user.id, groupId),
  ]);
  if (!market || market.groupId !== groupId) notFound();
  if (market.creatorId !== user.id && !isAdminRole(membership?.role)) redirect(`${base}/bets/${id}`);

  const memberRows = await prisma.membership.findMany({
    where: { groupId, status: "ACTIVE" },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  const users = memberRows.map((m) => ({
    id: m.user.id,
    name: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
  }));

  return (
    <div className="px-[18px] pb-8 pt-3">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={`${base}/bets/${id}`}
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
