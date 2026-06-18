// Shared string constants (used instead of native DB enums for portability).

export const MarketStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  RESOLVED: "RESOLVED",
} as const;
export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];

export const NotificationType = {
  NEW_MARKET: "NEW_MARKET",
  BET_PLACED: "BET_PLACED",
  MARKET_CLOSED: "MARKET_CLOSED",
  MARKET_RESOLVED: "MARKET_RESOLVED",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
