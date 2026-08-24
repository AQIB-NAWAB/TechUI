"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { MemoryStick, AlertTriangle, CheckCircle, RefreshCw, XCircle } from "lucide-react";

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

        let gcRan = false;
        if (gcEnabled && t % 10 === 0 && t > 0) {
          gcCountRef.current += 1;
          next = next - leakRateMbPerSec * 3;
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

  const W = 340;
  const H = 100;
  const polyPoints = buildPolyline(data, maxMb, W, H);
  const strokeColor =
    status === "fixed" ? "#10b981" : status === "crashed" ? "#ef4444" : "#f59e0b";
  const yLabels = [maxMb, Math.round(maxMb / 2), 0];

  const statusBadge = {
    leaking: { icon: AlertTriangle, label: "Leaking", className: "text-amber-600 dark:text-amber-400" },
    fixed: { icon: CheckCircle, label: "Fixed", className: "text-emerald-600 dark:text-emerald-400" },
    crashed: { icon: XCircle, label: "Crashed", className: "text-red-500" },
  }[status];

  const StatusBadgeIcon = statusBadge.icon;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full max-w-lg">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <MemoryStick className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Memory Leak</span>
        <span className={cn("flex items-center gap-1 text-[10px] font-semibold", statusBadge.className)}>
          <StatusBadgeIcon className="size-3" /> {statusBadge.label}
        </span>
        {status !== "leaking" && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
            title="Reset simulation"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Watch heap memory climb when code forgets to clean up — like event listeners that never get removed.
      </p>

      <div className="min-h-[280px] px-4 py-4 flex flex-col">
        <div
          className={cn(
            "h-8 mb-2 rounded-lg px-3 flex items-center gap-2 text-xs font-semibold transition-all duration-500 border",
            status === "crashed"
              ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 opacity-100"
              : flashMsg
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 opacity-100"
              : "opacity-0 border-transparent"
          )}
        >
          {status === "crashed" ? (
            <>
              <XCircle className="size-3.5 shrink-0" />
              Out of memory — process killed
            </>
          ) : flashMsg ? (
            <>
              <CheckCircle className="size-3.5 shrink-0" />
              {flashMsg}
            </>
          ) : null}
        </div>

        <div className="flex gap-2 flex-1">
          <div
            className="flex flex-col justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono w-9 text-right"
            style={{ height: H }}
          >
            {yLabels.map((l) => (
              <span key={l}>{l === 0 ? "0" : `${l}M`}</span>
            ))}
          </div>

          <div className="flex-1 border border-zinc-100 dark:border-zinc-800 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-800/50">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              height={H}
              className="overflow-visible"
              preserveAspectRatio="none"
            >
              {[0, 0.5, 1].map((frac) => (
                <line
                  key={frac}
                  x1={0}
                  y1={H * frac}
                  x2={W}
                  y2={H * frac}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-zinc-200 dark:text-zinc-700"
                />
              ))}

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
                    <text x={x + 2} y={H - 4} fontSize={8} fill="#10b981" opacity={0.8}>
                      GC
                    </text>
                  </g>
                );
              })}

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

              {data.length >= 2 && (() => {
                const last = data[data.length - 1]!;
                const x = W;
                const y = H - (last.mb / maxMb) * H;
                return (
                  <circle cx={x} cy={y} r={4} fill={strokeColor} stroke="white" strokeWidth={1.5} />
                );
              })()}
            </svg>

            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 px-1">
              <span>0s</span>
              <span className="font-mono">{processName}</span>
              <span>now</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono">
              Current: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{Math.round(currentMb)} MB</span> / {maxMb} MB
            </span>
            <span
              className={cn(
                "font-semibold transition-all duration-500",
                pct > 80 ? "text-red-500" : pct > 50 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 flex items-center gap-1 min-h-[20px]">
          {status === "leaking" && (
            <>
              <AlertTriangle className="size-3 text-amber-500 shrink-0" />
              Memory climbing — likely an event listener leak
            </>
          )}
          {status === "fixed" && (
            <>
              <CheckCircle className="size-3 text-emerald-500 shrink-0" />
              Heap stabilised — listeners removed
            </>
          )}
          {status === "crashed" && (
            <>
              <XCircle className="size-3 text-red-500 shrink-0" />
              Process terminated (SIGKILL)
            </>
          )}
        </p>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {status === "leaking"
            ? "Memory keeps climbing — fix the leak before the process crashes"
            : status === "crashed"
            ? "Process ran out of memory — reset to try again"
            : "Leak fixed — heap is stable again"}
        </span>
        <button
          onClick={status === "leaking" ? fixLeak : reset}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {status === "leaking" ? "Fix Leak" : "Run Again"}
        </button>
      </div>
    </div>
  );
}
