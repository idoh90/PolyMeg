import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

/** Fetch the full logged-in user record, or null if not logged in. */
export async function getCurrentUser() {
  const id = await getCurrentUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
