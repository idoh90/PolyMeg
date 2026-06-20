import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export function isAdminRole(role: string | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Membership for a user in a group, or null. */
export async function getMembership(userId: string, groupId: string) {
  return prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

/**
 * Gate a group-scoped page/route: require the logged-in account to be an ACTIVE
 * member of the group. Redirects to /login or /groups otherwise. Returns the
 * userId, the membership, and the group.
 */
export async function requireActiveMembership(groupId: string) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [membership, group] = await Promise.all([
    getMembership(userId, groupId),
    prisma.group.findUnique({ where: { id: groupId } }),
  ]);
  if (!group) redirect("/groups");
  if (!membership || membership.status !== "ACTIVE") redirect("/groups");

  return { userId, membership, group };
}

/** Generate a short, human-friendly join code (no ambiguous chars). */
export function makeJoinCode(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
