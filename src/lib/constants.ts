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

export const NotificationType = {
  NEW_MARKET: "NEW_MARKET",
  BET_PLACED: "BET_PLACED",
  MARKET_CLOSED: "MARKET_CLOSED",
  MARKET_RESOLVED: "MARKET_RESOLVED",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
