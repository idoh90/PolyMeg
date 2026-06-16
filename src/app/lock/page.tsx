import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import LockScreen from "@/components/LockScreen";

export default async function LockPage() {
  if (await getCurrentUserId()) redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  return <LockScreen users={users} />;
}
