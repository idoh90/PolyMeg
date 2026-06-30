"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivityItem, FeedData, ForYouItem, GroupChip, MyPositionItem } from "@/lib/crossGroup";
import { useT } from "@/lib/i18n/provider";
import { interpolate } from "@/lib/i18n/interpolate";
import type { Dictionary } from "@/lib/i18n";
import BackChevron from "@/components/BackChevron";

type Tab = "forYou" | "all" | "mine";

const sideText = (k: "yes" | "no" | "accent") =>
  k === "yes" ? "text-yes" : k === "no" ? "text-no" : "text-accent";
const sideChip = (k: "yes" | "no" | "accent") =>
  k === "yes" ? "bg-yes-b text-yes" : k === "no" ? "bg-no-b text-no" : "bg-accent-soft text-accent";

const BUBBLE = ["#f0405a", "#15b87a", "#2b6ef2", "#f0a93a", "#8b5cf6"];
function bubbleColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % BUBBLE.length;
  return BUBBLE[h];
}

function GroupTag({ group }: { group: GroupChip }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-[7px] py-0.5 text-[9.5px] font-extrabold text-faint">
      <span>{group.emoji ?? "🎲"}</span>
      {group.name}
    </span>
  );
}

function Actor({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" className="h-[38px] w-[38px] shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold text-white"
      style={{ background: bubbleColor(name) }}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}

export default function FeedView({ data }: { data: FeedData }) {
  const { dict } = useT();
  const router = useRouter();
  const initial: Tab = data.forYou.length ? "forYou" : data.activity.length ? "all" : "mine";
  const [tab, setTab] = useState<Tab>(initial);

  const go = (m: { groupId: string; marketId: string }) => router.push(`/g/${m.groupId}/bets/${m.marketId}`);

  return (
    <div>
      {/* header */}
      <div className="flex items-center gap-3 px-[18px] pb-3 pt-3">
        <Link
          href="/groups"
          aria-label={dict.common.back}
          className="pressable flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface"
        >
          <BackChevron />
        </Link>
        <div className="text-[22px] font-extrabold tracking-[-0.5px]">{dict.groups.feedTitle}</div>
      </div>

      {/* segmented */}
      <div className="px-[18px] pb-3.5">
        <div className="flex gap-1 rounded-[13px] border border-border bg-surface-2 p-1">
          <Seg label={dict.feed.forYou} active={tab === "forYou"} onClick={() => setTab("forYou")} />
          <Seg label={dict.feed.allGroups} active={tab === "all"} onClick={() => setTab("all")} />
          <Seg label={dict.feed.mine} active={tab === "mine"} onClick={() => setTab("mine")} />
        </div>
      </div>

      <div className="px-[18px]">
        {tab === "forYou" && <ForYou items={data.forYou} go={go} dict={dict} />}
        {tab === "all" && <AllGroups items={data.activity} go={go} dict={dict} />}
        {tab === "mine" && <Mine positions={data.positions} go={go} dict={dict} />}
      </div>
    </div>
  );
}

function Seg({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-[10px] py-2 text-[13px] font-extrabold transition ${
        active ? "bg-surface text-text shadow-[0_1px_2px_rgba(15,19,32,.06)]" : "text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-[18px] border border-dashed border-border p-10 text-center text-sm font-semibold text-muted">
      {text}
    </div>
  );
}

// ---------- For you ----------
function ForYou({ items, go, dict }: { items: ForYouItem[]; go: (m: { groupId: string; marketId: string }) => void; dict: Dictionary }) {
  if (items.length === 0) return <Empty text={dict.feed.forYouEmpty} />;
  return (
    <>
      <div className="mb-2.5 text-sm font-extrabold text-muted">{dict.feed.forYouTitle}</div>
      <div className="flex flex-col gap-2.5">
        {items.map((it) =>
          it.kind === "moved" ? (
            <button
              key={it.id}
              onClick={() => go(it)}
              className="pressable flex items-center gap-3 rounded-[16px] border-[1.5px] border-yes bg-yes-b p-[13px] text-start"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-[20px]">{it.up ? "📈" : "📉"}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-extrabold leading-tight">{it.up ? dict.feed.positionUp : dict.feed.positionDown}</div>
                <div dir="auto" className="mt-[3px] text-xs font-semibold text-muted">{it.sideLabel} · {it.stakeText} {interpolate(dict.feed.inBet, { title: it.title })}</div>
                <div className="mt-1.5"><GroupTag group={it.group} /></div>
              </div>
              <div className="text-end">
                <div className="text-[13px] font-bold text-faint">{it.fromPct}→{it.toPct}%</div>
                <div className={`mt-0.5 text-[14px] font-black ${it.up ? "text-yes" : "text-no"}`}>{it.deltaText}</div>
              </div>
            </button>
          ) : (
            <button
              key={it.id}
              onClick={() => go(it)}
              className="pressable flex items-center gap-3 rounded-[16px] border border-border bg-surface p-[13px] text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[20px] ${it.won ? "bg-yes-b" : "bg-no-b"}`}>{it.won ? "🎯" : "😬"}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-extrabold leading-tight">{it.won ? dict.feed.calledIt : dict.feed.notThisTime}</div>
                <div dir="auto" className="mt-[3px] text-xs font-semibold text-muted">{interpolate(dict.feed.resolvedBet, { title: it.title })} · {it.sideLabel}</div>
                <div className="mt-1.5"><GroupTag group={it.group} /></div>
              </div>
              <div className={`text-[18px] font-black ${it.won ? "text-yes" : "text-no"}`}>{it.profitText}</div>
            </button>
          ),
        )}
      </div>
    </>
  );
}

// ---------- All groups ----------
function AllGroups({ items, go, dict }: { items: ActivityItem[]; go: (m: { groupId: string; marketId: string }) => void; dict: Dictionary }) {
  if (items.length === 0) return <Empty text={dict.feed.allEmpty} />;
  return (
    <>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-extrabold text-muted">{dict.feed.allGroups}</span>
        <span className="text-[11.5px] font-bold text-faint">{dict.betDetail.recentActivity}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => go(it)}
            className="pressable flex items-start gap-[11px] rounded-[16px] border border-border bg-surface p-[13px] text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
          >
            {it.kind === "resolved" ? (
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl text-[18px]" style={{ background: "linear-gradient(135deg,#ffd24a,#f0a93a)" }}>🏆</span>
            ) : (
              <Actor name={it.actor.name} avatarUrl={it.actor.avatarUrl} />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold leading-snug">
                {it.kind === "bet" && (
                  <>
                    <b>{it.actor.name}</b> {dict.news.betOn}{" "}
                    <span className={`rounded-[7px] px-[7px] py-px text-[12px] font-extrabold ${sideChip(it.sideKind)}`}>{it.sideLabel}</span>{" "}
                    <b>· {it.amountText}</b>
                  </>
                )}
                {it.kind === "open" && (<><b>{it.actor.name}</b> {dict.news.openedBet}</>)}
                {it.kind === "resolved" && (<>{dict.news.resolved} · <b className={sideText(it.winnerKind)}>{it.winnerLabel}</b> {dict.decision.won}</>)}
              </div>
              <div dir="auto" className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[13px]">{it.marketEmoji ?? "🎲"}</span>
                <span className="text-xs font-bold text-muted">{it.marketTitle}</span>
                <GroupTag group={it.group} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {it.kind === "bet" && it.isNew && (
                <span className="rounded-full bg-accent px-[7px] py-px text-[9px] font-black text-white">{dict.news.new}</span>
              )}
              <span className="whitespace-nowrap text-[11px] font-semibold text-faint">{it.timeText}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------- Mine ----------
function Mine({
  positions,
  go,
  dict,
}: {
  positions: FeedData["positions"];
  go: (m: { groupId: string; marketId: string }) => void;
  dict: Dictionary;
}) {
  return (
    <>
      <div
        className="mb-3.5 flex items-center justify-between rounded-[16px] p-[14px_16px] text-white"
        style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
      >
        <div>
          <div className="text-[11.5px] font-bold text-[#aeb7c9]">{dict.profile.openPositions}</div>
          <div className="mt-0.5 text-[22px] font-black">{positions.openStakeText}</div>
        </div>
        <div className="text-end">
          <div className="text-[11.5px] font-bold text-[#aeb7c9]">{dict.feed.unrealized}</div>
          <div
            className="mt-0.5 text-[22px] font-black"
            style={{ color: positions.unrealizedKind === "yes" ? "#23ca8e" : positions.unrealizedKind === "no" ? "#fb5d72" : "#aeb7c9" }}
          >
            {positions.unrealizedText}
          </div>
        </div>
      </div>

      {positions.items.length === 0 ? (
        <Empty text={dict.feed.mineEmpty} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {positions.items.map((p) => (
            <PositionRow key={`${p.marketId}-${p.sideLabel}`} p={p} go={go} dict={dict} />
          ))}
        </div>
      )}
    </>
  );
}

function PositionRow({ p, go, dict }: { p: MyPositionItem; go: (m: { groupId: string; marketId: string }) => void; dict: Dictionary }) {
  return (
    <button
      onClick={() => go(p)}
      className="pressable flex items-center gap-[11px] rounded-[16px] border border-border bg-surface p-[13px] text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-[20px]">{p.emoji ?? "🎲"}</div>
      <div className="min-w-0 flex-1">
        <div dir="auto" className="truncate text-[14px] font-extrabold leading-tight">{p.title}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`rounded-[7px] px-[7px] py-px text-[11px] font-extrabold ${sideChip(p.sideKind)}`}>{p.sideLabel} · {p.stakeText}</span>
          <GroupTag group={p.group} />
        </div>
      </div>
      <div className="shrink-0 text-end">
        {p.status === "OPEN" ? (
          <>
            {p.pct != null && <div className="text-[14px] font-extrabold">{p.pct}%</div>}
            {p.plText && (
              <div className={`mt-0.5 text-[13px] font-extrabold ${p.plKind === "yes" ? "text-yes" : p.plKind === "no" ? "text-no" : "text-muted"}`}>{p.plText}</div>
            )}
          </>
        ) : (
          <span className="rounded-full bg-surface-2 px-[9px] py-[3px] text-[10.5px] font-extrabold text-muted">{dict.market.statusClosed}</span>
        )}
      </div>
    </button>
  );
}
