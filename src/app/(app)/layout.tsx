import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";

// Account shell: any logged-in page that is NOT inside a specific group
// (groups dashboard, create/join, account). The group shell with the bottom
// nav lives in g/[groupId]/layout.tsx.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getCurrentUserId())) redirect("/login");
  return <div className="mx-auto min-h-dvh max-w-[480px] bg-bg">{children}</div>;
}
