"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { MemoryStick, AlertTriangle, CheckCircle, RefreshCw, X } from "lucide-react";

export const MemoryLeakSchema = z.object({
  processName: z.string().default("node server.js"),
  initialMb: z.number().default(128),
  leakRateMbPerSec: z.number().default(8),
  maxMb: z.number().default(512),
  gcEnabled: z.boolean().optional().default(true),
});

export type MemoryLeakProps = z.infer<typeof MemoryLeakSchema>;

type Status = "leaking" | "fixed" | "crashed";

interface DataPoint {
  mb: number;
  gcRan?: boolean;
  t: number;
}

function buildPolyline(points: DataPoint[], maxMb: number, w: number, h: number): string {
  if (points.length < 2) return "";
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((p) => h - (p.mb / maxMb) * h);
  return xs.map((x, i) => `${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(" ");
}

export function MemoryLeak({
  processName = "node server.js",
  initialMb = 128,
  leakRateMbPerSec = 8,
  maxMb = 512,
  gcEnabled = true,
}: MemoryLeakProps) {
  const [status, setStatus] = useState<Status>("leaking");
  const [data, setData] = useState<DataPoint[]>([{ mb: initialMb, t: 0 }]);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const tickRef = useRef(0);
  const gcCountRef = useRef(0);

  const reset = useCallback(() => {
    tickRef.current = 0;
    gcCountRef.current = 0;
    setStatus("leaking");
    setData([{ mb: initialMb, t: 0 }]);
    setFlashMsg(null);
  }, [initialMb]);

  useEffect(() => {
    if (status !== "leaking") return;
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;

      setData((prev) => {
        const last = prev[prev.length - 1]!;
        const jitter = (Math.random() - 0.5) * leakRateMbPerSec * 0.1;
        let next = last.mb + leakRateMbPerSec + jitter;

        // GC every ~10 ticks
        let gcRan = false;
        if (gcEnabled && t % 10 === 0 && t > 0) {
          gcCountRef.current += 1;
          next = next - leakRateMbPerSec * 3; // dip
          gcRan = true;
        }

        next = Math.max(initialMb, Math.min(maxMb, next));

        const newPoint: DataPoint = { mb: next, t, gcRan };
        const updated = [...prev, newPoint].slice(-20);

        if (next >= maxMb) {
          setStatus("crashed");
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, leakRateMbPerSec, maxMb, initialMb, gcEnabled]);

  const fixLeak = () => {
    setStatus("fixed");
    setFlashMsg("Leak fixed — removing dangling listeners");
    setTimeout(() => setFlashMsg(null), 3000);
  };

  const currentMb = data[data.length - 1]?.mb ?? initialMb;
  const pct = Math.min(100, (currentMb / maxMb) * 100);
  const barColor =
    pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-400" : "bg-emerald-500";

  // SVG chart
  const W = 340;
  const H = 100;
  const polyPoints = buildPolyline(data, maxMb, W, H);
  const strokeColor =
    status === "fixed"
      ? "#10b981" // emerald
      : status === "crashed"
      ? "#ef4444"
      : "#f59e0b"; // amber for leaking

  // Y-axis labels
  const yLabels = [maxMb, Math.round(maxMb / 2), 0];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <MemoryStick className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Memory Leak</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{processName}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "leaking" && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" /> Leaking
            </span>
          )}
          {status === "fixed" && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Fixed
            </span>
          )}
          {status === "crashed" && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-500">
              <X className="w-3 h-3" /> Crashed
            </span>
          )}
        </div>
      </div>

      {/* Crash banner */}
      {status === "crashed" && (
        <div className="bg-red-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2">
          <X className="w-3 h-3" /> Out of memory — process killed
        </div>
      )}

      {/* Flash message */}
      {flashMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border-b border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs px-4 py-2 flex items-center gap-1 transition-all duration-500">
          <CheckCircle className="w-3 h-3" /> {flashMsg}
        </div>
      )}

      {/* Chart area */}
      <div className="px-4 pt-4 min-h-[220px]">
        <div className="flex gap-2">
          {/* Y axis */}
          <div className="flex flex-col justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono w-9 text-right pb-4 pt-0" style={{ height: H }}>
            {yLabels.map((l) => (
              <span key={l}>{l === 0 ? "0" : `${l}M`}</span>
            ))}
          </div>

          {/* SVG chart */}
          <div className="flex-1">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              height={H}
              className="overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[0, 0.5, 1].map((frac) => (
                <line
                  key={frac}
                  x1={0}
                  y1={H * frac}
                  x2={W}
                  y2={H * frac}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-zinc-100 dark:text-zinc-800"
                />
              ))}

              {/* GC markers */}
              {data.map((pt, i) => {
                if (!pt.gcRan || data.length < 2) return null;
                const x = (i / (data.length - 1)) * W;
                return (
                  <g key={`gc-${i}`}>
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={H}
                      stroke="#10b981"
                      strokeWidth={1}
                      strokeDasharray="3 2"
                      opacity={0.6}
                    />
                    <text
                      x={x + 2}
                      y={H - 4}
                      fontSize={8}
                      fill="#10b981"
                      opacity={0.8}
                    >
                      GC
                    </text>
                  </g>
                );
              })}

              {/* Memory line */}
              {polyPoints && (
                <polyline
                  points={polyPoints}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Current point dot */}
              {data.length >= 2 && (() => {
                const last = data[data.length - 1]!;
                const x = W;
                const y = H - (last.mb / maxMb) * H;
                return (
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill={strokeColor}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                );
              })()}
            </svg>

            {/* X axis labels */}
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
              <span>0s</span>
              <span>now</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono">
              Current: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{Math.round(currentMb)} MB</span> / {maxMb} MB
            </span>
            <span
              className={
                pct > 80
                  ? "text-red-500 font-semibold"
                  : pct > 50
                  ? "text-amber-500 font-semibold"
                  : "text-emerald-600 dark:text-emerald-400 font-semibold"
              }
            >
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-3 mb-3 flex items-start justify-between gap-2">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            {status === "leaking" && (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                Memory climbing — likely event listener leak
              </>
            )}
            {status === "fixed" && (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                Heap stabilised — listeners removed
              </>
            )}
            {status === "crashed" && (
              <>
                <X className="w-3 h-3 text-red-500 shrink-0" />
                Process terminated (SIGKILL)
              </>
            )}
          </p>
          <div className="flex gap-2 shrink-0">
            {status === "leaking" && (
              <button
                onClick={fixLeak}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Fix Leak
              </button>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
