"use client";

import LineChart, { type ChartSeries } from "./LineChart";
import { formatAgorot } from "@/lib/money";

// Portfolio over time: y is agorot of cumulative realized P/L.
export default function PortfolioChart({ series }: { series: ChartSeries }) {
  return (
    <LineChart
      series={[series]}
      height={220}
      area
      formatY={(v) => formatAgorot(Math.round(v))}
      formatX={(v) =>
        new Date(v).toLocaleDateString("he-IL", { day: "2-digit", month: "short" })
      }
    />
  );
}
