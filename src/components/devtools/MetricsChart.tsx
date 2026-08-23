"use client";

import { useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

export const MetricsChartSchema = z.object({
  title: z.string().optional().default("Request Latency"),
  unit: z.string().optional().default("ms"),
  color: z.enum(["blue", "emerald", "violet", "amber", "red", "cyan"]).optional().default("blue"),
  series: z.array(
    z.object({
      label: z.string(),
      data: z.array(z.number()),
      color: z.enum(["blue", "emerald", "violet", "amber", "red", "cyan"]).optional(),
    })
  ),
  labels: z.array(z.string()).optional(),
  height: z.number().optional().default(120),
  showGrid: z.boolean().optional().default(true),
  showDots: z.boolean().optional().default(false),
  showLegend: z.boolean().optional().default(true),
  showStats: z.boolean().optional().default(true),
  compact: z.boolean().optional().default(false),
});

export type MetricsChartProps = z.infer<typeof MetricsChartSchema>;

const COLOR_CFG = {
  blue:    { stroke: "stroke-blue-500 dark:stroke-blue-400",    fill: "fill-blue-500/10 dark:fill-blue-400/10",    dot: "fill-blue-500",    text: "text-blue-600 dark:text-blue-400",    hex: "#3b82f6" },
  emerald: { stroke: "stroke-emerald-500 dark:stroke-emerald-400", fill: "fill-emerald-500/10 dark:fill-emerald-400/10", dot: "fill-emerald-500", text: "text-emerald-600 dark:text-emerald-400", hex: "#10b981" },
  violet:  { stroke: "stroke-violet-500 dark:stroke-violet-400", fill: "fill-violet-500/10 dark:fill-violet-400/10", dot: "fill-violet-500",  text: "text-violet-600 dark:text-violet-400",  hex: "#8b5cf6" },
  amber:   { stroke: "stroke-amber-500 dark:stroke-amber-400",  fill: "fill-amber-500/10 dark:fill-amber-400/10",  dot: "fill-amber-500",   text: "text-amber-600 dark:text-amber-400",   hex: "#f59e0b" },
  red:     { stroke: "stroke-red-500 dark:stroke-red-400",      fill: "fill-red-500/10 dark:fill-red-400/10",      dot: "fill-red-500",     text: "text-red-600 dark:text-red-400",       hex: "#ef4444" },
  cyan:    { stroke: "stroke-cyan-500 dark:stroke-cyan-400",    fill: "fill-cyan-500/10 dark:fill-cyan-400/10",    dot: "fill-cyan-500",    text: "text-cyan-600 dark:text-cyan-400",     hex: "#06b6d4" },
};

type ColorKey = keyof typeof COLOR_CFG;

function stats(data: number[]) {
  if (data.length === 0) return { min: 0, max: 0, avg: 0, last: 0, trend: 0 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  const last = data[data.length - 1]!;
  const mid = data[Math.floor(data.length / 2)]!;
  const trend = last - mid;
  return { min, max, avg, last, trend };
}

function buildPath(data: number[], min: number, max: number, w: number, h: number, closed = false): string {
  if (data.length < 2) return "";
  const range = max - min || 1;
  const xStep = w / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: i * xStep,
    y: h - ((v - min) / range) * h,
  }));

  // Smooth via bezier control points
  let d = `M ${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
  }
  if (closed) {
    d += ` L ${pts[pts.length - 1]!.x},${h} L ${pts[0]!.x},${h} Z`;
  }
  return d;
}

export function MetricsChart({
  title = "Request Latency",
  unit = "ms",
  color: defaultColor = "blue",
  series,
  labels,
  height = 120,
  showGrid = true,
  showDots = false,
  showLegend = true,
  showStats = true,
  compact = false,
}: MetricsChartProps) {
  const allData = series.flatMap((s) => s.data);
  const globalMin = Math.min(...allData);
  const globalMax = Math.max(...allData);
  const padding = (globalMax - globalMin) * 0.1 || 1;
  const yMin = Math.max(0, globalMin - padding);
  const yMax = globalMax + padding;

  const primaryStats = useMemo(() => stats(series[0]?.data ?? []), [series]);
  const trendIcon = primaryStats.trend > 0
    ? <TrendingUp className="size-3.5" />
    : primaryStats.trend < 0
    ? <TrendingDown className="size-3.5" />
    : <Minus className="size-3.5" />;

  const W = 400;
  const H = height;

  const gridLines = 4;
  const gridYs = Array.from({ length: gridLines }, (_, i) =>
    H - (i / (gridLines - 1)) * H
  );

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <Activity className="size-3.5 text-zinc-400 shrink-0" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
          {showStats && (
            <div className={cn("flex items-center gap-1.5 text-xs font-semibold", COLOR_CFG[defaultColor].text)}>
              {trendIcon}
              <span className="font-mono">{primaryStats.last.toFixed(1)}{unit}</span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="relative px-4 pt-3 pb-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          style={{ height }}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {showGrid && gridYs.map((y, i) => (
            <line
              key={i}
              x1={0} y1={y} x2={W} y2={y}
              className="stroke-zinc-100 dark:stroke-zinc-900"
              strokeWidth={1}
            />
          ))}

          {/* Series */}
          {series.map((s, si) => {
            const col = COLOR_CFG[(s.color ?? defaultColor) as ColorKey];
            const linePath = buildPath(s.data, yMin, yMax, W, H);
            const areaPath = buildPath(s.data, yMin, yMax, W, H, true);
            const xStep = W / Math.max(s.data.length - 1, 1);
            const range = yMax - yMin || 1;

            return (
              <g key={si}>
                {/* Area fill */}
                <path d={areaPath} className={col.fill} />
                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  className={col.stroke}
                  strokeWidth={si === 0 ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={si === 0 ? 1 : 0.7}
                />
                {/* Dots */}
                {showDots && s.data.map((v, i) => (
                  <circle
                    key={i}
                    cx={i * xStep}
                    cy={H - ((v - yMin) / range) * H}
                    r={3}
                    className={col.dot}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 inset-y-3 flex flex-col justify-between pointer-events-none pl-1">
          {[yMax, (yMax + yMin) / 2, yMin].map((v, i) => (
            <span key={i} className="text-[9px] font-mono text-zinc-300 dark:text-zinc-700">
              {v.toFixed(v < 10 ? 1 : 0)}
            </span>
          ))}
        </div>
      </div>

      {/* X labels */}
      {labels && labels.length > 0 && (
        <div className="flex justify-between px-4 pb-2">
          {[labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]].map((l, i) => (
            <span key={i} className="text-[9px] font-mono text-zinc-300 dark:text-zinc-700">{l}</span>
          ))}
        </div>
      )}

      {/* Stats + Legend */}
      {(showStats || showLegend) && !compact && (
        <div className="border-t border-zinc-50 dark:border-zinc-900 px-4 py-2.5 flex items-center gap-4 flex-wrap">
          {showStats && (
            <>
              <StatPill label="avg" value={`${primaryStats.avg.toFixed(1)}${unit}`} />
              <StatPill label="min" value={`${primaryStats.min.toFixed(1)}${unit}`} />
              <StatPill label="max" value={`${primaryStats.max.toFixed(1)}${unit}`} />
              <StatPill label="last" value={`${primaryStats.last.toFixed(1)}${unit}`} />
            </>
          )}
          {showLegend && series.length > 1 && (
            <div className="ml-auto flex items-center gap-3">
              {series.map((s, i) => {
                const col = COLOR_CFG[(s.color ?? defaultColor) as ColorKey];
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className={cn("size-2 rounded-full shrink-0", col.dot)} />
                    <span className="text-zinc-500 dark:text-zinc-400">{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[10px]">
      <span className="text-zinc-400 dark:text-zinc-600">{label} </span>
      <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">{value}</span>
    </div>
  );
}
