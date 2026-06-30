import type { Locale } from "./config";
import { he } from "./dictionaries/he";
import { en } from "./dictionaries/en";

/** The translation shape, derived from the Hebrew source of truth. */
export type Dictionary = typeof he;

const dictionaries: Record<Locale, Dictionary> = { he, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
