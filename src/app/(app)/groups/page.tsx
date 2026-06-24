import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { getMyGroups, type MyGroup } from "@/lib/groups";
import Wordmark from "@/components/Wordmark";

function netText(net: number) {
  const s = net > 0 ? "+" : net < 0 ? "-" : "";
  return `${s}₪${Math.abs(Math.round(net / 100))}`;
}

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { groups, pending } = await getMyGroups(user.id);
  const initial = user.displayName.trim().charAt(0) || "?";

  return (
    <div className="pb-8 pt-1.5">
      {/* top bar */}
      <div className="flex items-center justify-between px-[18px] pb-0.5 pt-2">
        <Wordmark size={22} />
        <Link
          href="/account"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-accent text-base font-extrabold text-white"
        >
          {initial}
        </Link>
      </div>

      <div className="px-[18px] pb-[18px] pt-2">
        <div className="text-[25px] font-extrabold tracking-[-0.5px]">היי, {user.displayName} 👋</div>
        <div className="mt-0.5 text-sm font-semibold text-muted">לאן ניכנס היום?</div>
      </div>

      {/* primary actions */}
      <div className="flex gap-[11px] px-[18px] pb-[22px]">
        <Link
          href="/groups/new"
          className="pressable flex flex-1 flex-col gap-[11px] rounded-[18px] p-4 text-start text-white shadow-[0_12px_26px_-14px_rgba(15,19,32,.6)]"
          style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: "rgba(43,110,242,.3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9cc0ff" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="text-[15px] font-extrabold">קבוצה חדשה</span>
          <span className="text-[11.5px] font-semibold leading-[1.35] text-[#aeb7c9]">צרו קהילה משלכם</span>
        </Link>
        <Link
          href="/groups/join"
          className="pressable flex flex-1 flex-col gap-[11px] rounded-[18px] border border-border bg-surface p-4 text-start shadow-[0_1px_2px_rgba(15,19,32,.03)]"
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent-soft">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3M16 6l3 3M19 3l2 2" /></svg>
          </span>
          <span className="text-[15px] font-extrabold">הצטרפות לקבוצה</span>
          <span className="text-[11.5px] font-semibold leading-[1.35] text-muted">יש לכם קוד? הזינו אותו</span>
        </Link>
      </div>

      {/* my groups */}
      <div className="flex items-center justify-between px-[18px] pb-[11px]">
        <span className="text-base font-extrabold">הקבוצות שלי</span>
        <span className="text-[13px] font-bold text-muted">{groups.length}</span>
      </div>

      {groups.length === 0 ? (
        <div className="mx-[18px] rounded-[18px] border border-dashed border-border p-8 text-center text-sm font-semibold text-muted">
          עוד אין לך קבוצות — צרו אחת או הצטרפו עם קוד.
        </div>
      ) : (
        <div className="flex flex-col gap-[11px] px-[18px]">
          {groups.map((g) => (
            <GroupCard key={g.id} g={g} />
          ))}
        </div>
      )}

      {/* pending */}
      {pending.length > 0 && (
        <>
          <div className="px-[18px] pb-[11px] pt-6 text-base font-extrabold">בקשות בהמתנה</div>
          <div className="flex flex-col gap-2.5 px-[18px]">
            {pending.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-3.5 py-[13px]">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-surface text-[22px]">{g.emoji ?? "🎲"}</div>
                <div className="min-w-0 flex-1">
                  <div dir="auto" className="text-[14.5px] font-extrabold">{g.name}</div>
                  {g.category && <div className="mt-0.5 text-xs font-semibold text-faint">{g.category}</div>}
                </div>
                <span className="rounded-full border border-border bg-surface px-2.5 py-1.5 text-[11px] font-extrabold text-muted">ממתין לאישור</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GroupCard({ g }: { g: MyGroup }) {
  const netColor = g.net > 0 ? "var(--yes)" : g.net < 0 ? "var(--no)" : "var(--muted)";
  return (
    <Link
      href={`/g/${g.id}`}
      className="pressable flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
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
              {g.role === "OWNER" ? "בעלים" : "מנהל"}
            </span>
          )}
        </div>
        <div className="mt-[3px] text-xs font-semibold text-faint">
          {g.memberCount} חברים{g.category ? ` · ${g.category}` : ""}
        </div>
        <div className="mt-[5px] text-[12.5px] font-bold text-muted">
          {g.openCount > 0 ? `${g.openCount} הימורים פתוחים` : "אין הימורים פתוחים"}
        </div>
      </div>
      <div className="flex flex-none flex-col items-end gap-2">
        {g.net !== 0 && <span className="text-sm font-extrabold" style={{ color: netColor }}>{netText(g.net)}</span>}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}><path d="m9 18 6-6-6-6" /></svg>
      </div>
    </Link>
  );
}
