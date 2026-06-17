import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import AdminUsers from "@/components/AdminUsers";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/lock");
  if (!user.isAdmin) redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarUrl: true, isAdmin: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-[18px] pb-8 pt-3">
      <h1 className="mb-1 text-2xl font-extrabold">ניהול</h1>
      <p className="mb-5 text-sm text-muted">
        צור חשבונות לחברים שלך ומסור להם את הקודים.
      </p>
      <AdminUsers users={users} />
    </div>
  );
}
