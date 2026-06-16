import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/lock");

  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <div className="min-h-dvh">
      <NavBar
        userId={user.id}
        name={user.name}
        avatarUrl={user.avatarUrl}
        isAdmin={user.isAdmin}
        unread={unread}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
