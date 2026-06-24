import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import { getMyGroups } from "@/lib/groups";
import AccountForm from "@/components/AccountForm";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { groups } = await getMyGroups(user.id);
  const ownerGroups = groups
    .filter((g) => g.role !== "MEMBER")
    .map((g) => ({ id: g.id, name: g.name, emoji: g.emoji, role: g.role === "OWNER" ? "בעלים" : "מנהל" }));

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/groups" className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-[15px] font-extrabold text-muted">החשבון שלי</span>
      </div>
      <AccountForm
        initial={{ username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl }}
        ownerGroups={ownerGroups}
      />
    </div>
  );
}
