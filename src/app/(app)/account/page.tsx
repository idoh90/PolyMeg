import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import { getMyGroups } from "@/lib/groups";
import AccountForm from "@/components/AccountForm";
import BackChevron from "@/components/BackChevron";
import LanguageToggle from "@/components/LanguageToggle";
import { getI18n } from "@/lib/i18n/server";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { dict } = await getI18n();
  const { groups } = await getMyGroups(user.id);
  const ownerGroups = groups
    .filter((g) => g.role !== "MEMBER")
    .map((g) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      role: g.role === "OWNER" ? dict.roles.owner : dict.roles.admin,
    }));

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/groups" className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface">
          <BackChevron />
        </Link>
        <span className="text-[15px] font-extrabold text-muted">{dict.account.title}</span>
      </div>
      <AccountForm
        initial={{ username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl }}
        ownerGroups={ownerGroups}
      />
      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
        <span className="text-[13px] font-extrabold text-muted">{dict.language.title}</span>
        <LanguageToggle />
      </div>
    </div>
  );
}
