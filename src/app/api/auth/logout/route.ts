import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  // Also clear an Auth.js (Google) session if one exists.
  try {
    const { signOut } = await import("@/auth");
    await signOut({ redirect: false });
  } catch {
    // no Auth.js session / not configured — ignore
  }
  return NextResponse.json({ ok: true });
}
