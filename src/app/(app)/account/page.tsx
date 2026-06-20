import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import AccountForm from "@/components/AccountForm";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="px-[18px] pb-10 pt-4">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/groups" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold">החשבון שלי</h1>
      </div>
      <AccountForm
        initial={{ username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl }}
      />
    </div>
  );
}
