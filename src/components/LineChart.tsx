"use client";

import { useState } from "react";

export type ChartPoint = { x: number; y: number };
export type ChartSeries = { label: string; color: string; points: ChartPoint[] };

interface Props {
  series: ChartSeries[];
  height?: number;
  yMin?: number;
  yMax?: number;
  formatY?: (v: number) => string;
  formatX?: (v: number) => string;
  area?: boolean; // fill under the first series (nice for a single portfolio line)
}

const W = 700; // viewBox width; chart scales responsively to its container
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

// Step-aware linear value lookup for a series at an arbitrary x.
function valueAt(points: ChartPoint[], x: number): number {
  if (points.length === 0) return 0;
  if (x <= points[0].x) return points[0].y;
  const last = points[points.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (x <= b.x) {
      const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return last.y;
}

export default function LineChart({
  series,
  height = 200,
  yMin,
  yMax,
  formatY = (v) => v.toFixed(0),
  formatX = (v) => new Date(v).toLocaleDateString("he-IL", { day: "2-digit", month: "short" }),
  area = false,
}: Props) {
  const [hoverX, setHoverX] = useState<number | null>(null); // data-space x
  const [tipLeft, setTipLeft] = useState(0); // px within container

  const H = height;
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted">
        אין עדיין מספיק נתונים להצגה.
      </div>
    );
  }

  const xs = all.map((p) => p.x);
  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  if (xMin === xMax) {
    xMin -= 60_000;
    xMax += 60_000;
  }

  const ys = all.map((p) => p.y);
  let lo = yMin ?? Math.min(...ys);
  let hi = yMax ?? Math.max(...ys);
  if (yMin === undefined && yMax === undefined) {
    // pad and always include 0 for context
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
    const span = hi - lo || 1;
    lo -= span * 0.1;
    hi += span * 0.1;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }

  const plotLeft = PAD_X;
  const plotW = W - PAD_X * 2;
  const plotTop = PAD_TOP;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  const sx = (x: number) => plotLeft + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => plotTop + (1 - (y - lo) / (hi - lo)) * plotH;

  const ticks = 4;
  const gridYs = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverX(xMin + frac * (xMax - xMin));
    setTipLeft(frac * rect.width);
  }

  const hoverPx = hoverX === null ? null : sx(hoverX);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverX(null)}
        style={{ overflow: "visible" }}
      >
        {/* gridlines + y labels */}
        {gridYs.map((gy, i) => (
          <g key={i}>
            <line
              x1={plotLeft}
              x2={plotLeft + plotW}
              y1={sy(gy)}
              y2={sy(gy)}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={Math.abs(gy) < 1e-9 ? "0" : "3 4"}
              opacity={Math.abs(gy) < 1e-9 ? 0.9 : 0.5}
            />
            <text
              x={plotLeft + 2}
              y={sy(gy) - 3}
              fill="var(--muted)"
              fontSize={11}
              fontFamily="var(--font-sans)"
            >
              {formatY(gy)}
            </text>
          </g>
        ))}

        {/* area fill under first series */}
        {area && series[0] && series[0].points.length > 1 && (
          <path
            d={
              `M ${sx(series[0].points[0].x)} ${sy(series[0].points[0].y)} ` +
              series[0].points.map((p) => `L ${sx(p.x)} ${sy(p.y)}`).join(" ") +
              ` L ${sx(series[0].points[series[0].points.length - 1].x)} ${sy(lo)}` +
              ` L ${sx(series[0].points[0].x)} ${sy(lo)} Z`
            }
            fill={series[0].color}
            opacity={0.12}
          />
        )}

        {/* series lines */}
        {series.map((s) => (
          <polyline
            key={s.label}
            points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* crosshair + dots */}
        {hoverPx !== null && (
          <>
            <line
              x1={hoverPx}
              x2={hoverPx}
              y1={plotTop}
              y2={plotTop + plotH}
              stroke="var(--muted)"
              strokeWidth={1}
              opacity={0.6}
            />
            {series.map((s) => (
              <circle
                key={s.label}
                cx={hoverPx}
                cy={sy(valueAt(s.points, hoverX!))}
                r={3.5}
                fill={s.color}
                stroke="var(--bg)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </>
        )}

        {/* x axis end labels */}
        <text x={plotLeft} y={H - 6} fill="var(--muted)" fontSize={11} fontFamily="var(--font-sans)">
          {formatX(xMin)}
        </text>
        <text
          x={plotLeft + plotW}
          y={H - 6}
          fill="var(--muted)"
          fontSize={11}
          textAnchor="end"
          fontFamily="var(--font-sans)"
        >
          {formatX(xMax)}
        </text>
      </svg>

      {/* tooltip */}
      {hoverX !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(tipLeft, 60), 9999),
          }}
        >
          <div className="mb-1 text-muted">{formatX(hoverX)}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-muted">{s.label}</span>
              <span className="ml-auto font-semibold">{formatY(valueAt(s.points, hoverX))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
