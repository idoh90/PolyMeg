import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { autoCloseExpired, poolFor, isBinaryMarket, sideKind } from "@/lib/markets";
import { getLeaderboard } from "@/lib/leaderboard";
import { getMyGroups } from "@/lib/groups";
import { MarketStatus } from "@/lib/constants";
import { formatAgorot } from "@/lib/money";
import { timeUntil } from "@/lib/format";
import Avatar from "@/components/Avatar";
import MarketCard, { type MarketCardData } from "@/components/MarketCard";
import FeaturedCard, { type FeaturedData } from "@/components/FeaturedCard";
import GroupSwitcher, { type SwitcherGroup } from "@/components/GroupSwitcher";

const FILTERS = [
  { key: "all", label: "הכול" },
  { key: "open", label: "פתוחים" },
  { key: "closed", label: "ממתינים" },
  { key: "resolved", label: "הוכרעו" },
] as const;

const SIDE_HEX = { yes: "#15b87a", no: "#f0405a", accent: "#2b6ef2" };

export default async function GroupHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  await autoCloseExpired();
  const { groupId } = await params;
  const { filter = "all" } = await searchParams;
  const user = await getCurrentUser();
  const base = `/g/${groupId}`;

  const statusFilter =
    filter === "open"
      ? MarketStatus.OPEN
      : filter === "closed"
        ? MarketStatus.CLOSED
        : filter === "resolved"
          ? MarketStatus.RESOLVED
          : undefined;

  const [allMarkets, board, unread, recent, my] = await Promise.all([
    prisma.market.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { displayName: true } },
        options: { orderBy: { sortOrder: "asc" } },
        positions: { select: { optionId: true, amount: true } },
      },
    }),
    getLeaderboard(groupId),
    user
      ? prisma.notification.count({ where: { userId: user.id, groupId, read: false } })
      : Promise.resolve(0),
    prisma.position.findMany({
      where: { market: { groupId } },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        user: { select: { displayName: true } },
        option: { select: { label: true } },
        market: { select: { title: true } },
      },
    }),
    user ? getMyGroups(user.id) : Promise.resolve({ groups: [], pending: [] }),
  ]);

  const current = my.groups.find((g) => g.id === groupId);
  const switcherGroups: SwitcherGroup[] = my.groups.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    membersText: `${g.memberCount} חברים`,
    unread: g.unread > 0,
    active: g.id === groupId,
  }));
  const isAdmin = (current?.role ?? "MEMBER") !== "MEMBER";

  function toCard(m: (typeof allMarkets)[number]): MarketCardData {
    const { options, totalPot } = poolFor(m.options, m.positions, m.winningOptionId);
    return {
      id: m.id,
      groupId,
      title: m.title,
      imageUrl: m.imageUrl,
      emoji: m.emoji,
      creatorName: m.creator.displayName,
      status: m.status,
      minStake: m.minStake,
      pot: totalPot,
      potText: formatAgorot(totalPot),
      timeText:
        m.status === MarketStatus.OPEN
          ? `נסגר ${timeUntil(m.closesAt)}`
          : m.status === MarketStatus.RESOLVED
            ? "הוכרע"
            : "ממתין לתוצאה",
      isBinary: isBinaryMarket(m.options),
      options,
    };
  }

  const visible = (statusFilter ? allMarkets.filter((m) => m.status === statusFilter) : allMarkets).map(
    toCard,
  );

  const featMarket = allMarkets
    .filter((m) => m.status === MarketStatus.OPEN)
    .sort((a, b) => b.positions.length - a.positions.length)[0];
  let featured: FeaturedData | null = null;
  if (featMarket) {
    const { options, totalPot } = poolFor(featMarket.options, featMarket.positions, featMarket.winningOptionId);
    const ranked = [...options].sort((a, b) => b.pct - a.pct);
    const top = ranked[0];
    const bot = ranked[1] ?? ranked[0];
    featured = {
      groupId,
      sheet: {
        id: featMarket.id,
        title: featMarket.title,
        imageUrl: featMarket.imageUrl,
        emoji: featMarket.emoji,
        minStake: featMarket.minStake,
        pot: totalPot,
        options: options.map((o) => ({ id: o.id, label: o.label, total: o.total, pct: o.pct })),
      },
      emojiImage: featMarket.imageUrl,
      emoji: featMarket.emoji,
      title: featMarket.title,
      timeText: `נסגר ${timeUntil(featMarket.closesAt)}`,
      potText: formatAgorot(totalPot),
      betCount: featMarket.positions.length,
      top: { id: top.id, label: top.label, pct: top.pct },
      bot: { id: bot.id, label: bot.label, pct: bot.pct },
    };
  }

  const ticker = recent.map((p) => ({
    user: p.user.displayName,
    side: p.option.label,
    color: SIDE_HEX[sideKind(p.option.label)],
    market: p.market.title,
  }));

  const listTitle =
    filter === "open" ? "הימורים פתוחים" : filter === "closed" ? "ממתינים לתוצאה" : filter === "resolved" ? "הוכרעו" : "כל ההימורים";

  return (
    <div className="pb-8">
      {/* group header: switcher + bell + account */}
      <div className="flex items-center justify-between px-4 pb-3 pt-2">
        <GroupSwitcher
          groupId={groupId}
          current={{
            name: current?.name ?? "",
            emoji: current?.emoji ?? null,
            membersText: `${current?.memberCount ?? 0} חברים`,
          }}
          groups={switcherGroups}
          isAdmin={isAdmin}
        />
        <div className="flex items-center gap-2">
          <Link href={`${base}/notifications`} className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface" aria-label="התראות">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unread > 0 && <span className="absolute left-[7px] top-1.5 h-2 w-2 rounded-full border-[1.5px] border-surface bg-no" />}
          </Link>
          {user && (
            <Link href={`${base}/u/${user.id}`} className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-accent text-[15px] font-extrabold text-white">
              {user.displayName.trim().charAt(0) || "?"}
            </Link>
          )}
        </div>
      </div>

      {/* live ticker */}
      {ticker.length > 0 && (
        <div className="relative mb-3.5 flex h-[34px] items-center overflow-hidden bg-[var(--text)]">
          <span className="absolute right-0 z-[2] flex h-full items-center gap-1.5 bg-[var(--text)] px-3 text-[11px] font-extrabold text-white">
            <span className="h-[7px] w-[7px] rounded-full bg-no" style={{ animation: "pm-fade 1s ease-in-out infinite alternate" }} />
            חי
          </span>
          <div className="pm-marq flex w-max whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex" aria-hidden={dup === 1}>
                {ticker.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[12.5px] font-medium text-[#cdd4e0]">
                    <span className="font-bold text-white">{t.user}</span>
                    קנה
                    <span className="font-bold" style={{ color: t.color }}>{t.side}</span>
                    · <span className="text-[#8b94a6]">{t.market}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-[18px]">
        <div className="mb-3 flex items-center gap-2.5 rounded-[14px] border border-border bg-surface px-3.5 py-[11px] text-faint">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <span className="text-[14.5px] font-medium">חיפוש הימור…</span>
        </div>

        <Link
          href={`${base}/leaderboard`}
          className="pressable mb-3.5 flex items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
        >
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-xl shadow-[0_6px_14px_-6px_#f0a93a]" style={{ background: "linear-gradient(135deg,#ffd24a,#f0a93a)" }}>
            🏆
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold">טבלת המובילים</div>
            <div className="text-xs font-semibold text-faint">מי מוביל ברווחים</div>
          </div>
          <div className="flex flex-row-reverse">
            {board.slice(0, 3).map((b, i) => (
              <div key={b.userId} className="rounded-full ring-2 ring-surface" style={{ marginInlineStart: i === 0 ? 0 : -10 }}>
                <Avatar name={b.name} src={b.avatarUrl} size={30} />
              </div>
            ))}
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>

        <div className="mb-3.5 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? base : `${base}?filter=${f.key}`}
                className={`shrink-0 rounded-full border px-[15px] py-2 text-[13.5px] font-bold transition ${active ? "border-[var(--text)] bg-[var(--text)] text-white" : "border-border bg-surface text-muted"}`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {featured && filter === "all" && (
          <div className="mb-[18px]">
            <FeaturedCard data={featured} />
          </div>
        )}

        <div className="flex items-center justify-between pb-2.5">
          <span className="text-base font-extrabold">{listTitle}</span>
          <span className="text-[13px] font-bold text-muted">{visible.length} הימורים</span>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-border p-10 text-center text-muted">
            <p className="mb-3">אין כאן הימורים עדיין.</p>
            <Link href={`${base}/bets/new`} className="inline-block rounded-full bg-accent px-4 py-2 text-sm font-bold text-white">
              צור את ההימור הראשון
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-[11px]">
            {visible.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
