import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatAgorot } from "@/lib/money";
import { timeUntil, nowMs } from "@/lib/format";
import { sideKind, displayLabel } from "@/lib/markets";
import { MarketStatus } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";

const SIDE_HEX = { yes: "#15b87a", no: "#f0405a", accent: "#2b6ef2" };
const SIDE_SOFT = { yes: "#e6f6ef", no: "#fdebee", accent: "#e9f0fe" };
const AV_PALETTE = ["#2b6ef2", "#ef7d3a", "#15b87a", "#a855f7", "#ec4899", "#f0a93a", "#06b6d4"];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV_PALETTE[h % AV_PALETTE.length];
}

type Actor = { name: string; avatarUrl: string | null };
type Ev = {
  ts: number;
  marketId: string;
  title: string;
  kind: "open" | "buy" | "resolve";
  emoji: string | null;
  actor?: Actor;
  action: string;
  sideLabel?: string;
  sideK?: "yes" | "no" | "accent";
  amount?: number;
};

function dayBucket(ts: number, now: number): "today" | "yesterday" | "earlier" {
  const n = new Date(now);
  const startToday = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  if (ts >= startToday) return "today";
  if (ts >= startToday - 86400000) return "yesterday";
  return "earlier";
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const base = `/g/${groupId}`;
  const { dict } = await getI18n();
  const BUCKET_LABEL = { today: dict.news.today, yesterday: dict.news.yesterday, earlier: dict.news.earlier };
  const [positions, markets] = await Promise.all([
    prisma.position.findMany({
      where: { market: { groupId } },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
        option: { select: { label: true } },
        market: { select: { id: true, title: true, emoji: true } },
      },
    }),
    prisma.market.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        creator: { select: { displayName: true, avatarUrl: true } },
        options: { select: { id: true, label: true } },
      },
    }),
  ]);

  const evs: Ev[] = [];
  for (const p of positions) {
    evs.push({
      ts: p.createdAt.getTime(),
      marketId: p.market.id,
      title: p.market.title,
      emoji: p.market.emoji,
      kind: "buy",
      actor: { name: p.user.displayName, avatarUrl: p.user.avatarUrl },
      action: dict.news.betOn,
      sideLabel: displayLabel(p.option.label, dict),
      sideK: sideKind(p.option.label),
      amount: p.amount,
    });
  }
  for (const m of markets) {
    evs.push({
      ts: m.createdAt.getTime(),
      marketId: m.id,
      title: m.title,
      emoji: m.emoji,
      kind: "open",
      actor: { name: m.creator.displayName, avatarUrl: m.creator.avatarUrl },
      action: dict.news.openedBet,
    });
    if (m.status === MarketStatus.RESOLVED && m.winningOptionId && m.resolvedAt) {
      const w = m.options.find((o) => o.id === m.winningOptionId)?.label ?? "?";
      evs.push({
        ts: m.resolvedAt.getTime(),
        marketId: m.id,
        title: m.title,
        emoji: m.emoji,
        kind: "resolve",
        action: `${dict.news.resolved} · ${displayLabel(w, dict)} ${dict.decision.won}`,
      });
    }
  }
  evs.sort((a, b) => b.ts - a.ts);
  const feed = evs.slice(0, 80);
  const newestTs = feed[0]?.ts;

  const now = nowMs();
  const groups: { key: string; label: string; items: Ev[] }[] = [];
  for (const e of feed) {
    const b = dayBucket(e.ts, now);
    let g = groups.find((x) => x.key === b);
    if (!g) {
      g = { key: b, label: BUCKET_LABEL[b], items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }

  return (
    <div className="px-[18px] pb-8 pt-3">
      <h1 className="text-2xl font-extrabold">{dict.news.title}</h1>
      <p className="mb-4 text-sm text-muted">{dict.news.subtitle}</p>

      {feed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">{dict.news.empty}</p>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="mb-5">
            <div className="mb-2.5 px-0.5 text-xs font-extrabold tracking-wide text-faint">{g.label}</div>
            <div className="flex flex-col gap-2.5">
              {g.items.map((e, i) => (
                <Link
                  key={i}
                  href={`${base}/bets/${e.marketId}`}
                  className="pressable flex items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
                >
                  {e.kind === "resolve" ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: "linear-gradient(135deg,#ffd24a,#f0a93a)" }}>
                      🏆
                    </div>
                  ) : e.actor?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.actor.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold text-white" style={{ background: colorFor(e.actor?.name ?? "?") }}>
                      {(e.actor?.name ?? "?")[0]}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-snug">
                      {e.actor && <span className="font-extrabold">{e.actor.name} </span>}
                      {e.action}
                      {e.sideLabel && e.sideK && (
                        <span
                          className="mx-1 rounded-md px-2 py-0.5 text-xs font-extrabold"
                          style={{ color: SIDE_HEX[e.sideK], background: SIDE_SOFT[e.sideK] }}
                        >
                          {e.sideLabel}
                        </span>
                      )}
                      {e.amount != null && <span className="font-extrabold"> · {formatAgorot(e.amount)}</span>}
                    </div>
                    <div dir="auto" className="mt-1 flex items-center gap-1.5">
                      <span className="text-sm">{e.emoji ?? "🎲"}</span>
                      <span className="truncate text-[12.5px] font-semibold text-muted">{e.title}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {e.ts === newestTs && (
                      <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white">{dict.news.new}</span>
                    )}
                    <span className="whitespace-nowrap text-[11px] font-semibold text-faint">{timeUntil(new Date(e.ts), dict.time)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
