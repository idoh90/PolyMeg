import Link from "next/link";
import { getLeaderboard } from "@/lib/leaderboard";
import { getCurrentUserId } from "@/lib/session";
import { formatAgorot } from "@/lib/money";
import Avatar from "@/components/Avatar";

function signed(n: number) {
  return `${n > 0 ? "+" : ""}${formatAgorot(n)}`;
}

const MEDALS = ["#ffd24a", "#cdd4e0", "#e6a06a"];
const POD_SIZE = [70, 60, 52];
const POD_BAR = [60, 44, 32];

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const [board, meId] = await Promise.all([getLeaderboard(groupId), getCurrentUserId()]);
  const base = `/g/${groupId}`;

  // Podium order: 2nd, 1st, 3rd
  const podium = [board[1], board[0], board[2]].filter(Boolean);

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <h1 className="text-2xl font-extrabold">טבלת המובילים</h1>
      <p className="mb-[18px] mt-1 text-[13.5px] font-semibold text-muted">
        רווח והפסד נטו מכל ההימורים שהוכרעו
      </p>

      {/* podium */}
      {board.length >= 3 && (
        <div className="mb-[22px] flex items-end gap-2.5">
          {podium.map((p) => {
            const realRank = board.indexOf(p);
            const size = POD_SIZE[realRank];
            return (
              <Link
                href={`${base}/u/${p.userId}`}
                key={p.userId}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="relative" style={{ width: size, height: size }}>
                  <Avatar name={p.name} src={p.avatarUrl} size={size} />
                  <span
                    className="absolute -bottom-1.5 left-1/2 flex h-[22px] w-[22px] -translate-x-1/2 items-center justify-center rounded-full border-2 text-[11px] font-black text-[#3a2c00]"
                    style={{ background: MEDALS[realRank], borderColor: "var(--bg)" }}
                  >
                    {realRank + 1}
                  </span>
                </div>
                <div className="mt-1.5 text-[13px] font-extrabold">{p.name}</div>
                <div
                  className="rounded-full px-2.5 py-[3px] text-[13px] font-extrabold"
                  style={{
                    color: p.net > 0 ? "var(--yes)" : p.net < 0 ? "var(--no)" : "var(--muted)",
                    background: p.net > 0 ? "var(--yes-b)" : p.net < 0 ? "var(--no-b)" : "var(--surface-2)",
                  }}
                >
                  {signed(p.net)}
                </div>
                <div
                  className="pm-grow w-full origin-bottom rounded-t-[10px] opacity-[.18]"
                  style={{
                    height: POD_BAR[realRank],
                    background: `linear-gradient(180deg, var(--accent), transparent)`,
                  }}
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* full list */}
      <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
        {board.map((b, i) => (
          <Link
            href={`${base}/u/${b.userId}`}
            key={b.userId}
            className="flex items-center gap-3 border-b border-border px-[15px] py-3.5 last:border-0"
            style={{ background: b.userId === meId ? "var(--accent-soft)" : "var(--surface)" }}
          >
            <span className="w-5 shrink-0 text-center text-sm font-extrabold text-faint">{i + 1}</span>
            <Avatar name={b.name} src={b.avatarUrl} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-extrabold">
                {b.name}
                {b.userId === meId && <span className="font-semibold text-muted"> (אתה)</span>}
              </div>
              <div className="text-xs font-semibold text-faint">
                {b.wins} ניצחונות · {b.bets} הימורים
              </div>
            </div>
            <span
              className="text-[15px] font-extrabold"
              style={{ color: b.net > 0 ? "var(--yes)" : b.net < 0 ? "var(--no)" : "var(--muted)" }}
            >
              {signed(b.net)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
