import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

// Set the visitor's UI language. Always writes the cookie (covers anonymous /
// pre-login); also persists to User.locale when logged in so the choice follows
// the account across devices and drives per-recipient notification language.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = body?.locale;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "bad locale" }, { status: 400 });
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  const uid = await getCurrentUserId();
  if (uid) {
    await prisma.user.update({ where: { id: uid }, data: { locale } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
