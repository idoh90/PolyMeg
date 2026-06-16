import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import Avatar from "@/components/Avatar";

export default async function PeoplePage() {
  const [users, meId] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, avatarUrl: true },
      orderBy: { name: "asc" },
    }),
    getCurrentUserId(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">אנשים</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/profile/${u.id}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/60"
          >
            <Avatar name={u.name} src={u.avatarUrl} size={56} />
            <span className="text-sm font-medium">
              {u.name}
              {u.id === meId && <span className="ms-1 text-muted">(אתה)</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
