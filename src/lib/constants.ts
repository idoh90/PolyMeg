// Shared string constants (used instead of native DB enums for portability).

import type { Dictionary } from "@/lib/i18n";

export const MarketStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  RESOLVED: "RESOLVED",
} as const;
export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];

// Emoji + category options for group/market pickers (community-neutral).
export const EMOJI_OPTIONS = [
  "🎯", "🎮", "🃏", "⚽", "🏀", "🍕", "🎲", "🔥",
  "🏆", "💸", "🎬", "🎓", "🏠", "💼", "🚀", "🐉",
] as const;

/** Localized group-category suggestions for the create-group picker. */
export function groupCategories(dict: Dictionary): readonly string[] {
  return dict.categories.list;
}

// One-tap market templates: prefill the create flow. `kind` drives the type
// toggle; `options` seeds multi-choice rows (empty strings = blanks to fill).
export type MarketTemplate = {
  emoji: string;
  title: string;
  kind: "BINARY" | "MULTI" | "SCALAR";
  options?: string[];
  scalarUnit?: string;
};

/** Localized one-tap market templates for the create flow. */
export function marketTemplates(dict: Dictionary): MarketTemplate[] {
  const t = dict.templates;
  return [
    { emoji: "⏰", title: t.lateTitle, kind: "BINARY" },
    { emoji: "🌧️", title: t.rainTitle, kind: "BINARY" },
    { emoji: "⚽", title: t.matchTitle, kind: "MULTI", options: [...t.matchOptions] },
    { emoji: "🍕", title: t.foodTitle, kind: "MULTI", options: ["", "", ""] },
    { emoji: "👥", title: t.countTitle, kind: "SCALAR", scalarUnit: t.countUnit },
    { emoji: "💪", title: t.goalTitle, kind: "BINARY" },
  ];
}

export const NotificationType = {
  NEW_MARKET: "NEW_MARKET",
  BET_PLACED: "BET_PLACED",
  MARKET_CLOSED: "MARKET_CLOSED",
  MARKET_RESOLVED: "MARKET_RESOLVED",
  COMMENT: "COMMENT",
  MENTION: "MENTION",
  POSITION_REACTION: "POSITION_REACTION",
  BET_AGAINST: "BET_AGAINST",
  SETTLE_REMINDER: "SETTLE_REMINDER",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
