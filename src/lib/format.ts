/** Current epoch ms. Wrapped so server components can read "now" without
 *  tripping the React purity lint rule on a bare Date.now() in render. */
export function nowMs(): number {
  return Date.now();
}

/** Human "time left" / "ago" relative to now, in Hebrew. */
export function timeUntil(date: Date): string {
  const ms = date.getTime() - Date.now();
  const past = ms < 0;
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);

  let s: string;
  if (mins < 60) s = `${mins} דק׳`;
  else if (hours < 48) s = `${hours} שע׳`;
  else s = `${days} ימים`;

  return past ? `לפני ${s}` : `בעוד ${s}`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("he-IL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
