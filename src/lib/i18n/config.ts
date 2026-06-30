// Locale configuration. Hebrew is the default/main language (RTL); English is
// the opt-in alternative (LTR). Selection is stored in a cookie (and persisted
// to User.locale when logged in) — there is no locale path segment, so all
// URLs (including shareable /b/[id] links) stay stable across languages.

export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

/** Cookie that holds the visitor's chosen locale (anonymous + pre-login). */
export const LOCALE_COOKIE = "grubet_locale";

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (locales as readonly string[]).includes(x);
}

export type Dir = "rtl" | "ltr";

export function dirOf(locale: Locale): Dir {
  return locale === "he" ? "rtl" : "ltr";
}
