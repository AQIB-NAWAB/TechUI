"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { Activity, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

export const LoadTestingSchema = z.object({
  targetRps: z.number().default(1000),
  rampDurationSec: z.number().default(60),
  p99LatencyMs: z.number().default(450),
  errorRatePercent: z.number().default(2.3),
  service: z.string().default("POST /api/orders"),
});

export type LoadTestingProps = z.infer<typeof LoadTestingSchema>;

type Phase = "idle" | "ramping" | "sustained" | "degrading" | "complete";

interface RpsPoint {
  rps: number;
  t: number;
}

function buildPolyline(points: RpsPoint[], maxRps: number, w: number, h: number): string {
  if (points.length < 2) return "";
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((p) => h - Math.max(0, (p.rps / maxRps)) * (h - 4));
  return xs.map((x, i) => `${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(" ");
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready",
  ramping: "Ramp-up (0 → target RPS)",
  sustained: "Sustained Load",
  degrading: "Degrading",
  complete: "Complete",
};

export function LoadTesting({
  targetRps = 1000,
  rampDurationSec = 60,
  p99LatencyMs = 450,
  errorRatePercent = 2.3,
  service = "POST /api/orders",
}: LoadTestingProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rpsData, setRpsData] = useState<RpsPoint[]>([{ rps: 0, t: 0 }]);
  const [currentRps, setCurrentRps] = useState(0);
  const [currentLatency, setCurrentLatency] = useState(20);
  const [currentError, setCurrentError] = useState(0);
  const tickRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");

  const reset = useCallback(() => {
    tickRef.current = 0;
    phaseRef.current = "idle";
    setPhase("idle");
    setRpsData([{ rps: 0, t: 0 }]);
    setCurrentRps(0);
    setCurrentLatency(20);
    setCurrentError(0);
  }, []);

  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;

    // Each tick = 500ms
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;

      // Ramp: ~20 ticks to reach target
      const rampTicks = 20;
      const sustainedTicks = 10;
      const degradingTicks = 8;

      let nextRps = 0;
      let nextPhase: Phase = phaseRef.current;

      if (t <= rampTicks) {
        // Ramping phase
        nextPhase = "ramping";
        const progress = t / rampTicks;
        // ease-in curve
        nextRps = targetRps * Math.pow(progress, 1.5);
        // Latency climbs slowly with RPS
        const latencyProgress = progress * 0.5;
        setCurrentLatency(Math.round(20 + latencyProgress * (p99LatencyMs * 0.6)));
        setCurrentError(0);
      } else if (t <= rampTicks + sustainedTicks) {
        // Sustained
        nextPhase = "sustained";
        nextRps = targetRps * (0.95 + Math.random() * 0.05);
        setCurrentLatency(Math.round(p99LatencyMs * 0.7 + Math.random() * 30));
        setCurrentError(errorRatePercent * 0.3);
      } else if (t <= rampTicks + sustainedTicks + degradingTicks) {
        // Degrading
        nextPhase = "degrading";
        const deg = (t - rampTicks - sustainedTicks) / degradingTicks;
        nextRps = targetRps * (0.98 - deg * 0.15);
        setCurrentLatency(Math.round(p99LatencyMs * (0.8 + deg * 0.4)));
        setCurrentError(errorRatePercent * (0.5 + deg * 0.8));
      } else {
        // Complete
        nextPhase = "complete";
        nextRps = 0;
        clearInterval(interval);
      }

      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }

      const capped = Math.max(0, Math.round(nextRps));
      setCurrentRps(capped);
      setRpsData((prev) => [...prev, { rps: capped, t }].slice(-30));
    }, 500);

    return () => clearInterval(interval);
  }, [phase, targetRps, p99LatencyMs, errorRatePercent]);

  const startTest = () => {
    if (phase !== "idle") return;
    reset();
    // Small delay to reset state before starting
    setTimeout(() => {
      phaseRef.current = "ramping";
      setPhase("ramping");
    }, 50);
  };

  // Derived display values
  const latencyPct = Math.min(100, (currentLatency / (p99LatencyMs * 1.2)) * 100);
  const errorPct = Math.min(100, (currentError / (errorRatePercent * 1.5)) * 100);
  const throughputPct = Math.min(100, (currentRps / targetRps) * 100);

  const peakRps = Math.max(...rpsData.map((d) => d.rps));

  const W = 340;
  const H = 80;
  const polyPoints = buildPolyline(rpsData, targetRps * 1.05, W, H);

  const phaseColor: Record<Phase, string> = {
    idle: "text-zinc-400 dark:text-zinc-500",
    ramping: "text-blue-500 dark:text-blue-400",
    sustained: "text-emerald-600 dark:text-emerald-400",
    degrading: "text-amber-500 dark:text-amber-400",
    complete: "text-zinc-500 dark:text-zinc-400",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Load Test</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{service}</span>
        </div>
        <div className="flex items-center gap-2">
          {phase === "ramping" && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-500 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Running
            </span>
          )}
          {phase === "degrading" && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
              <AlertTriangle className="w-3 h-3" /> Errors found
            </span>
          )}
          {phase === "complete" && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Done
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 min-h-[260px]">
        {/* RPS Chart */}
        <div className="flex gap-2 mb-3">
          {/* Y axis */}
          <div
            className="flex flex-col justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono w-10 text-right"
            style={{ height: H }}
          >
            <span>{targetRps}</span>
            <span>{Math.round(targetRps / 2)}</span>
            <span>0</span>
          </div>

          {/* SVG */}
          <div className="flex-1">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              height={H}
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Grid */}
              {[0, 0.5, 1].map((f) => (
                <line
                  key={f}
                  x1={0} y1={H * f} x2={W} y2={H * f}
                  stroke="currentColor" strokeWidth={0.5}
                  className="text-zinc-100 dark:text-zinc-800"
                />
              ))}
              {/* Phase fill regions */}
              {polyPoints && (
                <>
                  <polyline
                    points={`0,${H} ${polyPoints} ${W},${H}`}
                    fill="#3b82f620"
                    stroke="none"
                  />
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                </>
              )}
              {/* Current dot */}
              {rpsData.length >= 2 && (() => {
                const last = rpsData[rpsData.length - 1]!;
                const x = W;
                const y = H - Math.max(0, (last.rps / (targetRps * 1.05))) * (H - 4);
                return (
                  <circle cx={x} cy={y} r={4} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
                );
              })()}
            </svg>
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
              <span>0s</span>
              <span>now</span>
            </div>
          </div>
        </div>

        {/* Metric bars */}
        <div className="space-y-2 mt-2">
          {/* Latency */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 shrink-0">Latency (p99)</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${latencyPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 w-14 text-right">
              {currentLatency}ms
            </span>
          </div>

          {/* Error rate */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 shrink-0">Error Rate</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-500"
                style={{ width: `${errorPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-red-500 w-14 text-right">
              {currentError.toFixed(1)}%
            </span>
          </div>

          {/* Throughput */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 shrink-0">Throughput</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${throughputPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 w-14 text-right">
              {currentRps} RPS
            </span>
          </div>
        </div>

        {/* Summary card (shown when complete) */}
        {phase === "complete" && (
          <div className="mt-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 flex items-center gap-4 text-xs font-mono transition-all duration-500">
            <span className="text-zinc-500 dark:text-zinc-400">Peak</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">{peakRps} RPS</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">p99</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{p99LatencyMs}ms</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">Errors</span>
            <span className="font-semibold text-red-500">{errorRatePercent}%</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 mb-3">
          <span className={`text-xs font-medium ${phaseColor[phase]}`}>
            Phase: {PHASE_LABELS[phase]}
          </span>
          <div className="flex gap-2">
            {(phase === "idle" || phase === "complete") && (
              <button
                onClick={startTest}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Start Test
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
