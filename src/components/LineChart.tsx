"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/lib/i18n/provider";

export type ChartPoint = { x: number; y: number };
export type ChartSeries = { label: string; color: string; points: ChartPoint[] };

interface Props {
  series: ChartSeries[];
  height?: number;
  yMin?: number;
  yMax?: number;
  midline?: number; // emphasized reference line (e.g. 50 on probability charts)
  formatY?: (v: number) => string;
  formatX?: (v: number) => string;
  area?: boolean; // kept for API compat; gradient fill is always drawn
}

const W = 700;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;

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

// Straight segments through px points [[x,y],...]. Clean finance-style line
// (Yahoo/TradingView): exact, no curve overshoot on uneven time gaps.
function linePath(pts: [number, number][]): string {
  if (!pts.length) return "";
  return "M" + pts.map((p) => `${p[0]} ${p[1]}`).join(" L ");
}

export default function LineChart({
  series,
  height = 200,
  yMin,
  yMax,
  midline,
  formatY = (v) => v.toFixed(0),
  formatX,
}: Props) {
  const { dict, locale } = useT();
  const fx =
    formatX ??
    ((v: number) =>
      new Date(v).toLocaleDateString(locale === "he" ? "he-IL" : "en-US", { day: "2-digit", month: "short" }));
  const uid = useId().replace(/:/g, "");
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [tipLeft, setTipLeft] = useState(0);

  // The SVG stretches its 700-wide viewBox to the container width
  // (preserveAspectRatio:none), so circles render as ellipses. Measure the real
  // width and counter-scale dot radii on x so they stay round.
  const hostRef = useRef<HTMLDivElement>(null);
  const [scaleX, setScaleX] = useState(1);
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScaleX(w / W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const rx = (r: number) => (scaleX > 0 ? r / scaleX : r);

  const H = height;
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted">
        {dict.lineChart.notEnoughData}
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
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
    const span = hi - lo || 1;
    lo -= span * 0.12;
    hi += span * 0.12;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  // Headroom so values at the domain edges (e.g. a flat 100% / 0% line) never
  // hug the top/bottom border or clip the end dot.
  const head = (hi - lo) * 0.08;
  lo -= head;
  hi += head;

  const plotLeft = PAD_X;
  const plotW = W - PAD_X * 2;
  const plotTop = PAD_TOP;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const baseY = plotTop + plotH;

  const sx = (x: number) => plotLeft + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => plotTop + (1 - (y - lo) / (hi - lo)) * plotH;

  // light reference gridlines at quarters
  const quarters = [0.25, 0.5, 0.75].map((f) => plotTop + f * plotH);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverX(xMin + frac * (xMax - xMin));
    setTipLeft(frac * rect.width);
  }

  const hoverPx = hoverX === null ? null : sx(hoverX);

  return (
    <div className="relative w-full" ref={hostRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverX(null)}
        style={{ overflow: "visible" }}
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="0.75" stopColor={s.color} stopOpacity="0.03" />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* light gridlines */}
        {quarters.map((gy, i) => (
          <line key={i} x1={plotLeft} x2={plotLeft + plotW} y1={gy} y2={gy} stroke="#eef0f5" strokeWidth={1} />
        ))}
        {midline !== undefined && (
          <line x1={plotLeft} x2={plotLeft + plotW} y1={sy(midline)} y2={sy(midline)} stroke="#cdd3df" strokeWidth={1} />
        )}

        {series.map((s, i) => {
          const px = s.points.map((p) => [+sx(p.x).toFixed(1), +sy(p.y).toFixed(1)] as [number, number]);
          const line = linePath(px);
          const last = px[px.length - 1];
          const areaD = `${line} L ${last[0]} ${baseY} L ${px[0][0]} ${baseY} Z`;
          return (
            <g key={s.label}>
              <path d={areaD} fill={`url(#${uid}-g${i})`} />
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <ellipse cx={last[0]} cy={last[1]} rx={rx(8)} ry={8} fill={s.color} opacity={0.16} />
              <ellipse cx={last[0]} cy={last[1]} rx={rx(4.2)} ry={4.2} fill={s.color} stroke="var(--surface)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}

        {/* crosshair + dots */}
        {hoverPx !== null && (
          <>
            <line x1={hoverPx} x2={hoverPx} y1={plotTop} y2={plotTop + plotH} stroke="var(--muted)" strokeWidth={1} opacity={0.5} />
            {series.map((s) => (
              <ellipse key={s.label} cx={hoverPx} cy={sy(valueAt(s.points, hoverX!))} rx={rx(3.5)} ry={3.5} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            ))}
          </>
        )}

        <text x={plotLeft} y={H - 5} fill="var(--faint)" fontSize={11} fontFamily="var(--font-sans)">
          {fx(xMin)}
        </text>
        <text x={plotLeft + plotW} y={H - 5} fill="var(--faint)" fontSize={11} textAnchor="end" fontFamily="var(--font-sans)">
          {dict.lineChart.now}
        </text>
      </svg>

      {hoverX !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(tipLeft, 60), 9999) }}
        >
          <div className="mb-1 text-muted">{fx(hoverX)}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-muted">{s.label}</span>
              <span className="ms-auto font-semibold">{formatY(valueAt(s.points, hoverX))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
