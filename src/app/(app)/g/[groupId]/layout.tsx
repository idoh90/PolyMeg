import Link from "next/link";
import { requireActiveMembership } from "@/lib/membership";
import BottomNav from "@/components/BottomNav";
import { BetSheetProvider } from "@/components/BetSheet";
import Avatar from "@/components/Avatar";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { userId, group } = await requireActiveMembership(groupId);

  return (
    <BetSheetProvider>
      <div className="mx-auto min-h-dvh max-w-[480px] bg-bg pb-[78px]">
        {/* group bar: tap name/avatar → switch groups */}
        <Link
          href="/groups"
          className="pressable sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-surface/90 px-[18px] py-2.5 backdrop-blur"
        >
          <Avatar name={group.name} src={group.imageUrl} size={26} />
          <span className="text-sm font-extrabold">{group.name}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="ms-auto text-xs font-bold text-faint">כל הקבוצות</span>
        </Link>

        <div className="pm-screen">{children}</div>
        <BottomNav myId={userId} groupId={groupId} />
      </div>
    </BetSheetProvider>
  );
}
