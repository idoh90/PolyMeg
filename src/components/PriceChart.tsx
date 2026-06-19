"use client";

import LineChart, { type ChartSeries } from "./LineChart";

// Bet odds/price chart: y is a 0-100 percentage of the pot.
export default function PriceChart({ series }: { series: ChartSeries[] }) {
  return (
    <LineChart
      series={series}
      height={200}
      yMin={0}
      yMax={100}
      midline={50}
      formatY={(v) => `${Math.round(v)}%`}
      formatX={(v) =>
        new Date(v).toLocaleString("he-IL", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      }
    />
  );
}
