import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { timeUntil } from "@/lib/format";
import MarkAllRead from "@/components/MarkAllRead";

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();
  const notifications = await prisma.notification.findMany({
    where: { userId: userId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="px-[18px] pb-8 pt-3">
      <MarkAllRead hasUnread={hasUnread} />
      <h1 className="mb-4 text-2xl font-extrabold">התראות</h1>
      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          אין התראות עדיין.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const body = (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  n.read
                    ? "border-border bg-surface"
                    : "border-accent/40 bg-surface-2"
                }`}
              >
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {timeUntil(n.createdAt)}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.marketId ? (
                  <Link href={`/bets/${n.marketId}`}>{body}</Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
