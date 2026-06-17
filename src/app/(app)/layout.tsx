import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import BottomNav from "@/components/BottomNav";
import { BetSheetProvider } from "@/components/BetSheet";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/lock");

  return (
    <BetSheetProvider>
      <div className="mx-auto min-h-dvh max-w-[480px] bg-bg pb-[78px]">
        <div className="pm-screen">{children}</div>
        <BottomNav myId={user.id} />
      </div>
    </BetSheetProvider>
  );
}
