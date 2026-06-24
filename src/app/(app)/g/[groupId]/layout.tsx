import { requireActiveMembership } from "@/lib/membership";
import BottomNav from "@/components/BottomNav";
import { BetSheetProvider } from "@/components/BetSheet";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { userId } = await requireActiveMembership(groupId);

  return (
    <BetSheetProvider>
      <div className="mx-auto min-h-dvh max-w-[480px] bg-bg pb-[78px]">
        <div className="pm-screen">{children}</div>
        <BottomNav myId={userId} groupId={groupId} />
      </div>
    </BetSheetProvider>
  );
}
