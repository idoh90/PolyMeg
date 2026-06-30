"use client";

import { createContext, useContext, useMemo } from "react";
import { dirOf, type Dir, type Locale } from "./config";
import { interpolate, type Vars } from "./interpolate";
import type { Dictionary } from "./index";

type I18nValue = {
  locale: Locale;
  dir: Dir;
  dict: Dictionary;
  /** Fill {token} placeholders: t(dict.notifications.newMarket, { name }). */
  t: (template: string, vars?: Vars) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

// Only the ACTIVE locale's dict is passed down (from the root layout), so the
// other language's strings never reach the client bundle/RSC payload.
export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, dir: dirOf(locale), dict, t: interpolate }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** Ergonomic alias used by client components. */
export const useT = useI18n;
