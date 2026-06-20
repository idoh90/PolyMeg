import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import { getMyGroups } from "@/lib/groups";
import Avatar from "@/components/Avatar";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  const { groups, pending } = await getMyGroups(user!.id);

  return (
    <div className="px-[18px] pb-10 pt-4">
      {/* top bar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="text-[26px] font-black tracking-tight">
          GRU<span className="text-accent">bet</span>
        </div>
        <Link href="/account" className="pressable">
          <Avatar name={user!.displayName} src={user!.avatarUrl} size={38} />
        </Link>
      </div>

      <h1 className="mb-4 text-lg font-bold">היי, {user!.displayName} 👋</h1>

      {/* primary actions */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          href="/groups/new"
          className="pressable flex flex-col gap-1 rounded-[18px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
        >
          <span className="text-2xl">➕</span>
          <span className="text-[15px] font-extrabold">קבוצה חדשה</span>
          <span className="text-xs font-semibold text-muted">פתחו שוק לחבר׳ה</span>
        </Link>
        <Link
          href="/groups/join"
          className="pressable flex flex-col gap-1 rounded-[18px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
        >
          <span className="text-2xl">🔑</span>
          <span className="text-[15px] font-extrabold">הצטרפות</span>
          <span className="text-xs font-semibold text-muted">עם קוד הזמנה</span>
        </Link>
      </div>

      {/* my groups */}
      <div className="mb-2.5 text-xs font-extrabold tracking-wide text-faint">הקבוצות שלי</div>
      {groups.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-border p-8 text-center text-sm text-muted">
          עוד אין לך קבוצות — צרו אחת או הצטרפו עם קוד.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/g/${g.id}`}
              className="pressable flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,19,32,.03)]"
            >
              <Avatar name={g.name} src={g.imageUrl} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[15px] font-extrabold">
                  {g.name}
                  {g.role === "OWNER" && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">בעלים</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-muted">
                  {g.memberCount} חברים · {g.openCount} הימורים פתוחים
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* pending */}
      {pending.length > 0 && (
        <>
          <div className="mb-2.5 mt-6 text-xs font-extrabold tracking-wide text-faint">בקשות בהמתנה</div>
          <div className="flex flex-col gap-2.5">
            {pending.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3.5 opacity-80">
                <Avatar name={g.name} src={g.imageUrl} size={40} />
                <div className="flex-1 text-[15px] font-bold">{g.name}</div>
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted">ממתין לאישור</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
