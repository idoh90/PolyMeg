import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { getMyGroups, type MyGroup } from "@/lib/groups";
import Wordmark from "@/components/Wordmark";
import { getI18n } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/interpolate";
import type { Dictionary } from "@/lib/i18n";

function netText(net: number) {
  const s = net > 0 ? "+" : net < 0 ? "-" : "";
  return `${s}₪${Math.abs(Math.round(net / 100))}`;
}

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { dict } = await getI18n();
  const { groups, pending } = await getMyGroups(user.id);
  const initial = user.displayName.trim().charAt(0) || "?";
  const hasActivity = groups.some((g) => g.unread > 0);

  return (
    <div className="gb-auto-dark min-h-dvh bg-bg pb-8 pt-1.5">
      {/* top bar */}
      <div className="gb-drop flex items-center justify-between px-[18px] pb-0.5 pt-2">
        <Wordmark size={22} />
        <Link
          href="/account"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-accent text-base font-extrabold text-white"
        >
          {initial}
        </Link>
      </div>

      <div className="gb-drop px-[18px] pb-[18px] pt-2" style={{ animationDelay: "0.07s" }}>
        <div className="text-[25px] font-extrabold tracking-[-0.5px]">{interpolate(dict.groups.greeting, { name: user.displayName })}</div>
        <div className="mt-0.5 text-sm font-semibold text-muted">{dict.groups.whatsUp}</div>
      </div>

      {/* cross-group launch cards: גלה / הפיד שלי */}
      <div className="gb-drop flex gap-[11px] px-[18px] pb-[22px]" style={{ animationDelay: "0.14s" }}>
        <Link
          href="/explore"
          className="pressable relative flex flex-1 flex-col gap-[11px] overflow-hidden rounded-[18px] p-4 text-start text-white shadow-[0_12px_26px_-14px_rgba(15,19,32,.6)]"
          style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
        >
          <span
            className="pointer-events-none absolute -top-[30px] h-[110px] w-[110px] rounded-full"
            style={{ insetInlineStart: -26, background: "radial-gradient(circle,rgba(43,110,242,.5),transparent 70%)" }}
          />
          <span className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: "rgba(43,110,242,.3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9cc0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>
          </span>
          <span className="relative text-[15.5px] font-extrabold">{dict.groups.exploreTitle}</span>
          <span className="relative text-[11.5px] font-semibold leading-[1.35] text-[#aeb7c9]">{dict.groups.exploreSub}</span>
          <span className="absolute top-3.5 text-[15px]" style={{ insetInlineEnd: 14 }}>🔥</span>
        </Link>
        <Link
          href="/feed"
          className="pressable relative flex flex-1 flex-col gap-[11px] overflow-hidden rounded-[18px] border border-border bg-surface p-4 text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent-soft">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2.5 7 5-15L17 12h4" /></svg>
          </span>
          <span className="text-[15.5px] font-extrabold">{dict.groups.feedTitle}</span>
          <span className="text-[11.5px] font-semibold leading-[1.35] text-muted">{dict.groups.feedSub}</span>
          {hasActivity && (
            <span className="absolute top-3 h-[9px] w-[9px] rounded-full bg-no" style={{ insetInlineEnd: 13 }} />
          )}
        </Link>
      </div>

      {/* my groups */}
      <div className="gb-drop flex items-center justify-between px-[18px] pb-[11px]" style={{ animationDelay: "0.21s" }}>
        <span className="text-base font-extrabold">{dict.groups.myGroups}</span>
        <span className="text-[13px] font-bold text-muted">{groups.length}</span>
      </div>

      {groups.length === 0 ? (
        <div className="gb-drop mx-[18px] rounded-[18px] border border-dashed border-border p-8 text-center text-sm font-semibold text-muted" style={{ animationDelay: "0.28s" }}>
          {dict.groups.emptyGroups}
        </div>
      ) : (
        <div className="flex flex-col gap-[11px] px-[18px]">
          {groups.map((g, i) => (
            <GroupCard key={g.id} g={g} i={i} dict={dict} />
          ))}
        </div>
      )}

      {/* secondary actions: create / join */}
      <div className="gb-drop flex gap-[10px] px-[18px] pt-[18px]" style={{ animationDelay: "0.42s" }}>
        <Link
          href="/groups/new"
          className="pressable flex flex-1 items-center justify-center gap-[7px] rounded-[13px] border border-border bg-surface px-3 py-[11px] text-[13px] font-extrabold text-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {dict.groups.newGroup}
        </Link>
        <Link
          href="/groups/join"
          className="pressable flex flex-1 items-center justify-center gap-[7px] rounded-[13px] border border-border bg-surface px-3 py-[11px] text-[13px] font-extrabold text-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3M16 6l3 3" /></svg>
          {dict.groups.join}
        </Link>
      </div>

      {/* pending */}
      {pending.length > 0 && (
        <>
          <div className="px-[18px] pb-[11px] pt-6 text-base font-extrabold">{dict.groups.pendingRequests}</div>
          <div className="flex flex-col gap-2.5 px-[18px]">
            {pending.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-3.5 py-[13px]">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-surface text-[22px]">{g.emoji ?? "🎲"}</div>
                <div className="min-w-0 flex-1">
                  <div dir="auto" className="text-[14.5px] font-extrabold">{g.name}</div>
                  {g.category && <div className="mt-0.5 text-xs font-semibold text-faint">{g.category}</div>}
                </div>
                <span className="rounded-full border border-border bg-surface px-2.5 py-1.5 text-[11px] font-extrabold text-muted">{dict.groups.awaitingApproval}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GroupCard({ g, i, dict }: { g: MyGroup; i: number; dict: Dictionary }) {
  const netColor = g.net > 0 ? "var(--yes)" : g.net < 0 ? "var(--no)" : "var(--muted)";
  // Cards swish up staggered after the panel drops in (matches the App-open design).
  return (
    <Link
      href={`/g/${g.id}`}
      className="gb-swish pressable flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
      style={{ animationDelay: `${0.28 + i * 0.09}s` }}
    >
      <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-[14px] bg-surface-2 text-[25px]">
        {g.emoji ?? "🎲"}
        {g.unread > 0 && (
          <span className="absolute -top-[3px] h-[13px] w-[13px] rounded-full border-[2.5px] border-surface bg-no" style={{ insetInlineStart: -3 }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span dir="auto" className="truncate text-[15.5px] font-extrabold">{g.name}</span>
          {g.role !== "MEMBER" && (
            <span className="flex-none rounded-full bg-accent-soft px-[7px] py-0.5 text-[9.5px] font-extrabold text-accent">
              {g.role === "OWNER" ? dict.roles.owner : dict.roles.admin}
            </span>
          )}
        </div>
        <div className="mt-[3px] text-xs font-semibold text-faint">
          {interpolate(dict.groups.members, { n: g.memberCount })}{g.category ? ` · ${g.category}` : ""}
        </div>
        <div className="mt-[5px] text-[12.5px] font-bold text-muted">
          {g.openCount > 0 ? interpolate(dict.groups.openBets, { n: g.openCount }) : dict.groups.noOpenBets}
        </div>
      </div>
      <div className="flex flex-none flex-col items-end gap-2">
        {g.net !== 0 && <span className="text-sm font-extrabold" style={{ color: netColor }}>{netText(g.net)}</span>}
        <svg className="rtl-flip" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </div>
    </Link>
  );
}
