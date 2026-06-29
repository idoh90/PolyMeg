import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { timeUntil } from "@/lib/format";
import MarkAllRead from "@/components/MarkAllRead";

const NOTIF: Record<string, { icon: string; bg: string }> = {
  NEW_MARKET: { icon: "🆕", bg: "var(--accent-soft)" },
  BET_PLACED: { icon: "💸", bg: "var(--yes-b)" },
  MARKET_CLOSED: { icon: "🔒", bg: "var(--surface-2)" },
  MARKET_RESOLVED: { icon: "🏁", bg: "var(--no-b)" },
  JOIN_REQUEST: { icon: "🙋", bg: "var(--accent-soft)" },
  REQUEST_APPROVED: { icon: "✅", bg: "var(--yes-b)" },
  COMMENT: { icon: "💬", bg: "var(--accent-soft)" },
  MENTION: { icon: "@", bg: "var(--accent-soft)" },
  POSITION_REACTION: { icon: "🔥", bg: "var(--yes-b)" },
  BET_AGAINST: { icon: "⚔️", bg: "var(--no-b)" },
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const base = `/g/${groupId}`;
  const userId = await getCurrentUserId();
  const notifications = await prisma.notification.findMany({
    where: { userId: userId ?? "", groupId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <MarkAllRead hasUnread={hasUnread} />
      <div className="mb-4 flex items-center gap-3">
        <Link href={base} className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-[15px] font-extrabold text-muted">חזרה</span>
      </div>
      <h1 className="text-2xl font-extrabold">התראות</h1>
      <p className="mb-[18px] mt-1 text-[13.5px] font-semibold text-muted">כל העדכונים שלך בקבוצה הזו.</p>

      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">אין התראות עדיין.</p>
      ) : (
        <div className="flex flex-col gap-[9px]">
          {notifications.map((n) => {
            const meta = NOTIF[n.type] ?? { icon: "🔔", bg: "var(--surface-2)" };
            const body = (
              <div className="flex items-start gap-3 rounded-[16px] border border-border bg-surface p-[13px] shadow-[0_1px_2px_rgba(15,19,32,.03)]">
                <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[13px] text-[21px]" style={{ background: meta.bg }}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div dir="auto" className="text-[14px] font-semibold leading-[1.4] text-text">{n.message}</div>
                </div>
                <div className="flex flex-none flex-col items-end gap-[7px]">
                  {!n.read && <span className="h-[9px] w-[9px] rounded-full bg-accent" />}
                  <span className="whitespace-nowrap text-[11px] font-semibold text-faint">{timeUntil(n.createdAt)}</span>
                </div>
              </div>
            );
            return n.marketId ? (
              <Link key={n.id} href={`${base}/bets/${n.marketId}`} className="pressable">{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
