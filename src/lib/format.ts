import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/interpolate";

/** The slice of the dictionary the time helpers need. */
type TimeDict = Dictionary["time"];

/** Current epoch ms. Wrapped so server components can read "now" without
 *  tripping the React purity lint rule on a bare Date.now() in render. */
export function nowMs(): number {
  return Date.now();
}

/** Compact duration like "5 דק׳" / "5 min" — no past/future wrapper. */
export function shortDuration(date: Date, t: TimeDict): string {
  const abs = Math.abs(date.getTime() - Date.now());
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);

  if (mins < 60) return interpolate(t.minutesShort, { n: mins });
  if (hours < 48) return interpolate(t.hoursShort, { n: hours });
  return interpolate(t.days, { n: days });
}

/** Human "time left" / "ago" relative to now, localized via the dictionary. */
export function timeUntil(date: Date, t: TimeDict): string {
  const past = date.getTime() - Date.now() < 0;
  return interpolate(past ? t.ago : t.in, { t: shortDuration(date, t) });
}

export function formatDateTime(date: Date, locale: Locale): string {
  return date.toLocaleString(locale === "he" ? "he-IL" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
