import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { defaultLocale, dirOf, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary } from "./index";
import { interpolate, type Vars } from "./interpolate";

/**
 * Resolve the active locale for the current request:
 *   1. persisted User.locale (logged in → cross-device preference)
 *   2. the locale cookie (anonymous / pre-login)
 *   3. the default (Hebrew)
 * Memoized per request via React `cache` so a page with many server components
 * doesn't repeatedly hit the cookie store / DB.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const uid = await getCurrentUserId();
  if (uid) {
    const u = await prisma.user.findUnique({
      where: { id: uid },
      select: { locale: true },
    });
    if (isLocale(u?.locale)) return u.locale;
  }
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return defaultLocale;
});

/** Server-side i18n bundle. `dict` for typed access; `t` for interpolation. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return {
    locale,
    dir: dirOf(locale),
    dict: getDictionary(locale),
    t: (template: string, vars?: Vars) => interpolate(template, vars),
  };
});
