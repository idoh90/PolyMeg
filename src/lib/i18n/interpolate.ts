import type { Locale } from "./config";

export type Vars = Record<string, string | number>;

/**
 * Fill `{token}` placeholders in a dictionary string. Dictionary values are
 * plain strings (so they can cross the Server→Client boundary), and any
 * dynamic value is injected here at the call site:
 *   interpolate(dict.notifications.newMarket, { name, title })
 * Unknown tokens are left intact so missing data is visible, not silently dropped.
 */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

/**
 * Pick the right grammatical form for a count. Both Hebrew and English use a
 * one/other split for the app's copy; `two` is opt-in for the rare Hebrew dual.
 * Callers pass already-resolved (and pre-interpolated) strings.
 */
export function plural(
  _locale: Locale,
  n: number,
  forms: { one: string; other: string; two?: string },
): string {
  if (n === 1) return forms.one;
  if (n === 2 && forms.two) return forms.two;
  return forms.other;
}
