"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExploreMarket, GroupChip } from "@/lib/crossGroup";
import { useT } from "@/lib/i18n/provider";
import { interpolate } from "@/lib/i18n/interpolate";
import BackChevron from "@/components/BackChevron";

const sideChip = (k: "yes" | "no" | "accent") =>
  k === "yes" ? "bg-yes-b text-yes" : k === "no" ? "bg-no-b text-no" : "bg-accent-soft text-accent";

function GroupChipTag({ group, tone = "soft" }: { group: GroupChip; tone?: "soft" | "ghost" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
        tone === "ghost" ? "bg-white/10 text-[#aeb7c9]" : "bg-surface-2 text-muted"
      }`}
    >
      <span>{group.emoji ?? "🎲"}</span>
      {group.name}
    </span>
  );
}

export default function ExploreView({ groups, markets }: { groups: GroupChip[]; markets: ExploreMarket[] }) {
  const { dict } = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const go = (m: { groupId: string; id: string }) => router.push(`/g/${m.groupId}/bets/${m.id}`);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets.filter((m) => {
      if (active !== "all" && m.groupId !== active) return false;
      if (!q) return true;
      return m.title.toLowerCase().includes(q) || m.group.name.toLowerCase().includes(q);
    });
  }, [markets, query, active]);

  const hero = useMemo(() => {
    const cands = filtered.filter((m) => !m.isScalar && m.betCount > 0);
    return [...cands].sort((a, b) => b.betCount - a.betCount || b.pot - a.pot)[0] ?? null;
  }, [filtered]);

  const closingSoon = useMemo(
    () => [...filtered].sort((a, b) => a.closesAtMs - b.closesAtMs).slice(0, 8),
    [filtered],
  );
  const biggestPots = useMemo(
    () => [...filtered].filter((m) => m.pot > 0).sort((a, b) => b.pot - a.pot).slice(0, 5),
    [filtered],
  );
  const mostArgued = useMemo(
    () => [...filtered].filter((m) => m.commentCount > 0).sort((a, b) => b.commentCount - a.commentCount).slice(0, 5),
    [filtered],
  );

  return (
    <div>
      {/* header */}
      <div className="flex items-center gap-3 px-[18px] pb-2.5 pt-3">
        <Link
          href="/groups"
          aria-label={dict.common.back}
          className="pressable flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface"
        >
          <BackChevron />
        </Link>
        <div className="text-[22px] font-extrabold tracking-[-0.5px]">{dict.explore.title}</div>
      </div>

      <div className="px-[18px]">
        {/* search */}
        <div className="mb-3 flex items-center gap-2.5 rounded-[14px] border border-border bg-surface px-3.5 py-[11px]" data-field>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.explore.searchPlaceholder}
            className="w-full bg-transparent text-[14.5px] font-medium text-text outline-none placeholder:text-faint"
          />
        </div>

        {/* group filter chips */}
        {groups.length > 1 && (
          <div className="mb-3.5 flex gap-2 overflow-x-auto">
            <Chip label={dict.group.filterAll} active={active === "all"} onClick={() => setActive("all")} />
            {groups.map((g) => (
              <Chip
                key={g.id}
                label={`${g.emoji ?? "🎲"} ${g.name}`}
                active={active === g.id}
                onClick={() => setActive(g.id)}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-[18px] border border-dashed border-border p-10 text-center text-sm font-semibold text-muted">
            {markets.length === 0 ? dict.explore.emptyNoMarkets : dict.explore.emptyNoMatch}
          </div>
        ) : (
          <>
            {/* HERO — הכי לוהט */}
            {hero && (
              <button
                onClick={() => go(hero)}
                className="pressable relative mb-[18px] block w-full overflow-hidden rounded-[22px] p-[17px] text-start text-white shadow-[0_14px_30px_-14px_rgba(15,19,32,.6)]"
                style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
              >
                <span className="pointer-events-none absolute -top-10 h-40 w-40 rounded-full" style={{ insetInlineStart: -30, background: "radial-gradient(circle,rgba(240,64,90,.45),transparent 70%)" }} />
                <div className="relative mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-[rgba(240,64,90,.25)] px-2.5 py-[3px] text-[11px] font-extrabold tracking-wide text-[#ffd0d8]">{dict.explore.hottest}</span>
                  <GroupChipTag group={hero.group} tone="ghost" />
                </div>
                <div className="relative flex items-start gap-3">
                  <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white/10 text-[26px]">
                    {hero.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      hero.emoji ?? "🎲"
                    )}
                  </div>
                  <div dir="auto" className="min-w-0 flex-1 text-[18px] font-extrabold leading-tight">{hero.title}</div>
                </div>
                <div className="relative mt-3.5 flex gap-2.5">
                  {hero.options.slice(0, 3).map((o, i) => (
                    <div key={o.id} className={`flex-1 rounded-[13px] p-[11px] text-center ${i === 0 ? "bg-white text-[#0f1320]" : "bg-white/[0.12]"}`}>
                      <div className={`truncate text-[11px] font-bold ${i === 0 ? "text-[#737b8c]" : "text-[#aeb7c9]"}`}>{o.label}</div>
                      <div className="mt-px text-[15px] font-extrabold">{o.pct}%</div>
                    </div>
                  ))}
                </div>
                <div className="relative mt-3 flex justify-between text-xs font-semibold text-[#aeb7c9]">
                  <span>{dict.market.pot} {hero.potText} · {interpolate(dict.market.betsCount, { n: hero.betCount })}</span>
                  <span>{hero.commentCount > 0 ? `💬 ${hero.commentCount} · ` : ""}{hero.timeText}</span>
                </div>
              </button>
            )}

            {/* closing soon */}
            {closingSoon.length > 0 && (
              <>
                <SectionHead title={dict.explore.closingSoon} />
                <div className="-mx-[18px] mb-5 flex gap-[11px] overflow-x-auto px-[18px]">
                  {closingSoon.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => go(m)}
                      className="pressable w-[200px] shrink-0 rounded-[16px] border border-border bg-surface p-[13px] text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
                    >
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <GroupChipTag group={m.group} />
                        <span className="shrink-0 rounded-full bg-no-b px-2 py-[3px] text-[10px] font-extrabold text-no">⏱ {m.leftShort}</span>
                      </div>
                      <div dir="auto" className="min-h-[34px] text-[14px] font-extrabold leading-[1.25]">{m.title}</div>
                      {m.isScalar ? (
                        <div className="mt-2.5 rounded-[10px] border border-accent-soft bg-accent-soft py-2 text-center text-[12.5px] font-extrabold text-accent">
                          🔢 {dict.explore.guess} · {m.scalarMin}–{m.scalarMax}
                        </div>
                      ) : m.isBinary ? (
                        <div className="mt-2.5 flex gap-[7px]">
                          {m.options.slice(0, 2).map((o) => (
                            <span key={o.id} className={`flex-1 rounded-[10px] py-[7px] text-center text-[12.5px] font-extrabold ${o.kind === "no" ? "bg-surface-2 text-muted" : sideChip(o.kind)}`}>
                              {o.label} {o.pct}%
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2.5 rounded-[10px] bg-surface-2 px-2.5 py-[7px] text-[12.5px] font-extrabold text-muted">
                          {m.options[0]?.label} {m.options[0]?.pct}%
                        </div>
                      )}
                      <div className="mt-2.5 text-[11px] font-semibold text-faint">{dict.market.pot} {m.potText} · {interpolate(dict.market.betsCount, { n: m.betCount })}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* biggest pots */}
            {biggestPots.length > 0 && (
              <>
                <SectionHead title={dict.explore.biggestPots} />
                <div className="mb-5 flex flex-col gap-[9px]">
                  {biggestPots.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => go(m)}
                      className="pressable flex items-center gap-[11px] rounded-[15px] border border-border bg-surface p-3 text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
                    >
                      <span
                        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-black ${i === 0 ? "text-[#5a3d00]" : "bg-surface-2 text-muted"}`}
                        style={i === 0 ? { background: "linear-gradient(135deg,#ffd24a,#f0a93a)" } : undefined}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div dir="auto" className="truncate text-[14px] font-extrabold leading-tight">{m.title}</div>
                        <div className="mt-[5px]"><GroupChipTag group={m.group} /></div>
                      </div>
                      <div className="text-end">
                        <div className="text-[16px] font-black">{m.potText}</div>
                        <div className="mt-px text-[10.5px] font-semibold text-faint">{interpolate(dict.market.betsCount, { n: m.betCount })}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* most argued */}
            {mostArgued.length > 0 && (
              <>
                <SectionHead title={dict.explore.mostArgued} />
                <div className="flex flex-col gap-[11px]">
                  {mostArgued.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => go(m)}
                      className="pressable rounded-[16px] border border-border bg-surface p-3.5 text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
                    >
                      <div className="flex items-start gap-[11px]">
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[21px]">
                          {m.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            m.emoji ?? "🎲"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div dir="auto" className="text-[14.5px] font-extrabold leading-tight">{m.title}</div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <GroupChipTag group={m.group} />
                            <span className="text-[11.5px] font-bold text-no">💬 {m.commentCount} {dict.comments.title}</span>
                          </div>
                        </div>
                      </div>
                      {m.isBinary && (
                        <div className="mt-3 flex gap-2.5">
                          {m.options.slice(0, 2).map((o) => (
                            <span key={o.id} className={`flex-1 rounded-[11px] py-[9px] text-center text-[13.5px] font-extrabold ${sideChip(o.kind)}`}>
                              {o.label} {o.pct}%
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return <div className="pb-2.5 text-base font-extrabold">{title}</div>;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-[14px] py-[7px] text-[13px] font-bold transition ${
        active ? "bg-accent text-white" : "border border-border bg-surface text-muted"
      }`}
    >
      {label}
    </button>
  );
}
