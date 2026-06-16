// All money in Polymeg is stored as an integer number of agorot (₪ × 100)
// to avoid floating-point rounding errors. Use these helpers at the edges
// (DB <-> UI) to convert and format.

/** Convert a shekel amount (e.g. 5 or 12.50) to agorot (integer). */
export function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

/** Convert agorot (integer) back to a shekel number. */
export function agorotToShekels(agorot: number): number {
  return agorot / 100;
}

/** Format agorot as a human string, e.g. 1250 -> "₪12.50". */
export function formatAgorot(agorot: number): string {
  const sign = agorot < 0 ? "-" : "";
  const abs = Math.abs(agorot);
  const shekels = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}₪${shekels}.${rem.toString().padStart(2, "0")}`;
}
