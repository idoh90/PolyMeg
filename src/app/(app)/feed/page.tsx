import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/currentUser";
import { autoCloseExpired } from "@/lib/markets";
import { getFeedData } from "@/lib/crossGroup";
import FeedView from "@/components/FeedView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.groups.feedTitle };
}

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await autoCloseExpired();
  const { dict } = await getI18n();
  const data = await getFeedData(user.id, dict);

  return (
    <div className="gb-auto-dark min-h-dvh bg-bg pb-10">
      <FeedView data={data} />
    </div>
  );
}
