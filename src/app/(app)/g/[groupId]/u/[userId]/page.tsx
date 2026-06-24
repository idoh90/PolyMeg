import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getCurrentUserId } from "@/lib/session";
import { isAdminRole } from "@/lib/membership";
import { formatAgorot } from "@/lib/money";
import Avatar from "@/components/Avatar";
import PortfolioChart from "@/components/PortfolioChart";

const SIDE_HEX = { yes: "#15b87a", no: "#f0405a", accent: "#2b6ef2" };
const SIDE_SOFT = { yes: "var(--yes-b)", no: "var(--no-b)", accent: "var(--accent-soft)" };

function signed(n: number) {
  return `${n > 0 ? "+" : ""}${formatAgorot(n)}`;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ groupId: string; userId: string }>;
}) {
  const { groupId, userId } = await params;
  const base = `/g/${groupId}`;
  const [profile, meId] = await Promise.all([getProfile(userId, groupId), getCurrentUserId()]);
  if (!profile) notFound();

  const { user, stats, portfolio, openPositions, history } = profile;
  const isMe = meId === user.id;
  const isAdmin = isAdminRole(user.role);
  const roleLabel = user.role === "OWNER" ? "בעלים" : user.role === "ADMIN" ? "מנהל" : null;
  const hasChart = portfolio.points.length > 2;
  const netColor = stats.realizedNet > 0 ? "var(--yes)" : stats.realizedNet < 0 ? "var(--no)" : "#fff";

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      {/* back (viewing another member) */}
      {!isMe && (
        <div className="mb-4 flex items-center gap-3">
          <Link href={base} className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <span className="text-[15px] font-extrabold text-muted">פרופיל חבר</span>
        </div>
      )}

      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isMe && <Avatar name={user.name} src={user.avatarUrl} size={40} />}
          <h1 className="text-2xl font-extrabold">
            {isMe ? "התיק שלי" : user.name}
            {roleLabel && !isMe && (
              <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">{roleLabel}</span>
            )}
          </h1>
        </div>
        {isMe && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href={`${base}/manage`} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold">
                ניהול
              </Link>
            )}
            <Link href="/account" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-muted">
              חשבון
            </Link>
          </div>
        )}
      </div>

      {/* hero card */}
      <div
        className="relative mb-4 overflow-hidden rounded-[22px] p-5 text-white"
        style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
      >
        <div
          className="absolute -left-5 -top-[50px] h-[170px] w-[170px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(43,110,242,.45),transparent 70%)" }}
        />
        <div className="relative">
          <div className="text-[12.5px] font-bold tracking-wide text-[#aeb7c9]">רווח/הפסד נטו</div>
          <div className="my-1 text-[38px] font-black tracking-tight" style={{ color: netColor }}>
            {signed(stats.realizedNet)}
          </div>
          <div className="mt-3 flex gap-7">
            <div>
              <div className="text-[11px] font-bold text-[#aeb7c9]">פוזיציות פתוחות</div>
              <div className="mt-0.5 text-[17px] font-extrabold">{stats.openCount}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#aeb7c9]">הימרת בסה״כ</div>
              <div className="mt-0.5 text-[17px] font-extrabold">{formatAgorot(stats.totalStaked)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#aeb7c9]">אחוז הצלחה</div>
              <div className="mt-0.5 text-[17px] font-extrabold">
                {stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* value chart */}
      {hasChart && (
        <div className="mb-5 rounded-[18px] border border-border bg-surface p-2 pt-3.5">
          <div className="px-2.5 pb-2 text-[13px] font-extrabold text-muted">שווי לאורך זמן</div>
          <PortfolioChart series={portfolio} />
        </div>
      )}

      {/* trophies placeholder */}
      <div className="mb-5 rounded-[18px] border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">🏆 גביעים</h2>
          <span className="text-xs text-muted">בקרוב</span>
        </div>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border text-2xl opacity-40"
            >
              🏆
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">אירועים מיוחדים ופרסים יופיעו כאן — תנו גביע למי שצדק.</p>
      </div>

      {/* open positions */}
      {openPositions.length > 0 && (
        <>
          <div className="mb-2.5 text-base font-extrabold">פוזיציות פתוחות</div>
          <div className="mb-5 flex flex-col gap-2.5">
            {openPositions.map((p, i) => (
              <Link
                href={`${base}/bets/${p.marketId}`}
                key={i}
                className="rounded-[16px] border border-border bg-surface p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-surface-2 text-xl">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "🎲"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div dir="auto" className="text-sm font-bold leading-tight">{p.title}</div>
                    <div className="mt-1.5 text-xs font-bold">
                      <span
                        className="rounded-md px-2 py-0.5"
                        style={{ color: SIDE_HEX[p.sideKind], background: SIDE_SOFT[p.sideKind] }}
                      >
                        {p.sideLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-faint">הימרת</div>
                    <div className="text-[15px] font-extrabold">{formatAgorot(p.stake)}</div>
                    <div className="mt-0.5 text-[11px] font-bold text-yes">זכייה {formatAgorot(p.toWin)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* history */}
      {history.length > 0 && (
        <>
          <div className="mb-2.5 text-base font-extrabold">היסטוריה</div>
          <div className="flex flex-col">
            {history.map((h, i) => (
              <Link
                href={`${base}/bets/${h.marketId}`}
                key={i}
                className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-0"
              >
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-2 text-[17px]">
                  {h.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🎲"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div dir="auto" className="text-[13.5px] font-bold leading-tight">{h.title}</div>
                  <div className="text-xs font-semibold text-faint">
                    הימרת {h.sideLabel} · {h.won ? "זכית" : "הפסדת"}
                  </div>
                </div>
                <span
                  className="text-[15px] font-extrabold"
                  style={{ color: h.profit > 0 ? "var(--yes)" : h.profit < 0 ? "var(--no)" : "var(--muted)" }}
                >
                  {signed(h.profit)}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {openPositions.length === 0 && history.length === 0 && (
        <p className="rounded-[16px] border border-dashed border-border p-8 text-center text-sm text-muted">
          {isMe ? "עוד לא הימרת. כנס להימור והנח את הראשון!" : "עדיין אין פעילות."}
        </p>
      )}
    </div>
  );
}
