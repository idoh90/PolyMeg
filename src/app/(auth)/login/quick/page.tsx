import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import QuickPicker from "@/components/QuickPicker";

export const dynamic = "force-dynamic";

// Debug quick-login: the old Polymeg "friends" avatar grid. Tap a user to enter
// GRUbet instantly (no password). Reached from the login screen by entering 0000.
export default async function QuickLoginPage() {
  if (process.env.ALLOW_DEBUG_LOGIN === "false") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
    take: 50,
  });

  return <QuickPicker users={users} />;
}
