import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";

// Account shell: any logged-in page that is NOT inside a specific group
// (groups dashboard, create/join, account). The group shell with the bottom
// nav lives in g/[groupId]/layout.tsx.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate the record exists (not just the cookie id) so a stale session
  // pointing at a deleted user redirects out instead of crashing downstream.
  if (!(await getCurrentUser())) redirect("/login");
  return <div className="mx-auto min-h-dvh max-w-[480px] bg-bg">{children}</div>;
}
