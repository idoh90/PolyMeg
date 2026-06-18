import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { timeUntil } from "@/lib/format";
import MarkAllRead from "@/components/MarkAllRead";

const NOTIF_ICON: Record<string, string> = {
  NEW_MARKET: "🆕",
  BET_PLACED: "💸",
  MARKET_CLOSED: "🔒",
  MARKET_RESOLVED: "🏁",
};

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
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition active:scale-[0.99] ${
                  n.read
                    ? "border-border bg-surface"
                    : "border-accent/40 bg-surface-2"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg">
                  {NOTIF_ICON[n.type] ?? "🔔"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeUntil(n.createdAt)}</p>
                </div>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
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
