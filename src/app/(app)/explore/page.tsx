import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/currentUser";
import { autoCloseExpired } from "@/lib/markets";
import { getExploreData } from "@/lib/crossGroup";
import ExploreView from "@/components/ExploreView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.groups.exploreTitle };
}

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await autoCloseExpired();
  const { dict } = await getI18n();
  const { groups, markets } = await getExploreData(user.id, dict);

  return (
    <div className="gb-auto-dark min-h-dvh bg-bg pb-10">
      <ExploreView groups={groups} markets={markets} />
    </div>
  );
}
