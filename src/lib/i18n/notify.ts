import { defaultLocale, isLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./index";
import { interpolate, type Vars } from "./interpolate";

export type NotifKey = keyof Dictionary["notif"];

/** Coerce a stored (possibly null) User.locale into a valid Locale. */
export function notifLocale(raw: string | null | undefined): Locale {
  return isLocale(raw) ? raw : defaultLocale;
}

/**
 * Build a notification message in the RECIPIENT's locale. Notifications are
 * persisted at send time, so each recipient gets the text in their own language
 * (falling back to the default). The recipient's option/side labels are
 * localized by the caller (via displayLabel with the matching dictionary).
 */
export function notificationMessage(key: NotifKey, locale: Locale, vars?: Vars): string {
  return interpolate(getDictionary(locale).notif[key], vars);
}
