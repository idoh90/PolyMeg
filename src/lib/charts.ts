import type { ChartSeries } from "@/components/LineChart";
import { agorotToShekels } from "@/lib/money";

// Distinct colors for multiple-choice options. Yes/No get themed colors.
const PALETTE = ["#3aa0ff", "#f0b429", "#a78bfa", "#fb5a5a", "#1ec77d", "#34d3eb"];

export function optionColor(label: string, index: number): string {
  const l = label.toLowerCase();
  if (l === "yes" || l === "כן") return "#1ec77d";
  if (l === "no" || l === "לא") return "#fb5a5a";
  return PALETTE[index % PALETTE.length];
}

export interface ChartPosition {
  optionId: string;
  amount: number;
  createdAt: Date;
}

/**
 * Reconstruct each option's price (its % share of the pot) over time from the
 * sequence of positions — the parimutuel equivalent of Polymarket's odds chart.
 * `endTime` extends the last value to "now" (open bets) or the resolve time.
 */
export function buildPriceHistory(
  options: { id: string; label: string }[],
  positions: ChartPosition[],
  endTime: number,
): ChartSeries[] {
  const sorted = [...positions].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const totals = new Map<string, number>();
  for (const o of options) totals.set(o.id, 0);
  let pot = 0;

  const series: ChartSeries[] = options.map((o, i) => ({
    label: o.label,
    color: optionColor(o.label, i),
    points: [],
  }));
  const seriesById = new Map(series.map((s, i) => [options[i].id, s]));

  for (const p of sorted) {
    pot += p.amount;
    totals.set(p.optionId, (totals.get(p.optionId) ?? 0) + p.amount);
    const t = p.createdAt.getTime();
    for (const o of options) {
      const pct = pot > 0 ? ((totals.get(o.id) ?? 0) / pot) * 100 : 0;
      seriesById.get(o.id)!.points.push({ x: t, y: pct });
    }
  }

  // Extend each line to the chart end so the time axis reads naturally.
  if (sorted.length > 0) {
    for (const s of series) {
      const last = s.points[s.points.length - 1];
      if (last && last.x < endTime) s.points.push({ x: endTime, y: last.y });
    }
  }

  return series;
}

/**
 * Cumulative realized profit/loss over time for a user, built from the
 * resolve-time + profit of each bet they took part in. y is in agorot.
 */
export function buildPortfolioSeries(
  entries: { resolvedAt: Date; profit: number }[],
  startAt: Date,
  endTime: number,
  label: string,
): ChartSeries {
  const sorted = [...entries].sort(
    (a, b) => a.resolvedAt.getTime() - b.resolvedAt.getTime(),
  );
  const points = [{ x: startAt.getTime(), y: 0 }];
  let cum = 0;
  for (const e of sorted) {
    cum += e.profit;
    points.push({ x: e.resolvedAt.getTime(), y: cum });
  }
  const last = points[points.length - 1];
  if (last.x < endTime) points.push({ x: endTime, y: cum });

  return { label, color: cum >= 0 ? "#1ec77d" : "#fb5a5a", points };
}

// Re-export for convenience in callers that format y as shekels.
export { agorotToShekels };
