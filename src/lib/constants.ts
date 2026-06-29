// Shared string constants (used instead of native DB enums for portability).

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

export const GROUP_CATEGORIES = [
  "חברים", "גיימינג", "ספורט", "עבודה", "משפחה", "לימודים", "קהילה",
] as const;

// One-tap market templates: prefill the create flow. `kind` drives the type
// toggle; `options` seeds multi-choice rows (empty strings = blanks to fill).
export type MarketTemplate = {
  emoji: string;
  title: string;
  kind: "BINARY" | "MULTI" | "SCALAR";
  options?: string[];
  scalarUnit?: string;
};

export const MARKET_TEMPLATES: MarketTemplate[] = [
  { emoji: "⏰", title: "מישהו יאחר הערב?", kind: "BINARY" },
  { emoji: "🌧️", title: "ירד גשם בסופ״ש?", kind: "BINARY" },
  { emoji: "⚽", title: "מי ינצח במשחק?", kind: "MULTI", options: ["קבוצה א׳", "קבוצה ב׳", "תיקו"] },
  { emoji: "🍕", title: "מי מביא אוכל למפגש?", kind: "MULTI", options: ["", "", ""] },
  { emoji: "👥", title: "כמה אנשים יגיעו בשבת?", kind: "SCALAR", scalarUnit: "אנשים" },
  { emoji: "💪", title: "נעמוד ביעד השבוע?", kind: "BINARY" },
];

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
