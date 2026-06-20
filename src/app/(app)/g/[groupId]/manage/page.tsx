import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireActiveMembership, isAdminRole } from "@/lib/membership";
import ManageGroup from "@/components/ManageGroup";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { membership, group } = await requireActiveMembership(groupId);
  if (!isAdminRole(membership.role)) redirect(`/g/${groupId}`);

  const rows = await prisma.membership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  const map = (m: (typeof rows)[number]) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
  });
  const members = rows.filter((m) => m.status === "ACTIVE").map(map);
  const pending = rows.filter((m) => m.status === "PENDING").map(map);

  return (
    <div className="px-[18px] pb-8 pt-3">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/g/${groupId}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold">ניהול קבוצה</h1>
      </div>

      <ManageGroup
        group={{
          id: group.id,
          name: group.name,
          description: group.description,
          joinMode: group.joinMode,
          code: group.code,
          hasPassword: !!group.passwordHash,
        }}
        members={members}
        pending={pending}
      />
    </div>
  );
}
