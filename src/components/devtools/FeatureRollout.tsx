"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Rocket, ChevronRight, RotateCcw, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export const FeatureRolloutSchema = z.object({
  featureName: z.string().default("New Checkout Flow"),
  targetPercent: z.number().int().min(0).max(100).default(10),
  stages: z.array(z.object({
    label: z.string(),
    percent: z.number(),
    durationHours: z.number(),
  })).default([
    { label: "Internal",  percent: 1,   durationHours: 24 },
    { label: "Beta",      percent: 10,  durationHours: 48 },
    { label: "Canary",    percent: 25,  durationHours: 48 },
    { label: "General",   percent: 100, durationHours: 72 },
  ]),
});

export type FeatureRolloutProps = z.infer<typeof FeatureRolloutSchema>;

interface Metrics {
  errorRate: number;
  conversion: number;
  latencyMs: number;
}

function generateMetrics(percent: number, spiked: boolean): Metrics {
  const seed = percent / 100;
  if (spiked) {
    return {
      errorRate: 3.2 + Math.random() * 1.5,
      conversion: -1.2 - Math.random(),
      latencyMs: 280 + Math.floor(Math.random() * 100),
    };
  }
  return {
    errorRate: 0.1 + seed * 0.15,
    conversion: 1.8 + seed * 2.5,
    latencyMs: 120 + Math.floor(seed * 30),
  };
}

export function FeatureRollout({
  featureName = "New Checkout Flow",
  targetPercent: initialTarget = 10,
  stages: initialStages = [
    { label: "Internal",  percent: 1,   durationHours: 24 },
    { label: "Beta",      percent: 10,  durationHours: 48 },
    { label: "Canary",    percent: 25,  durationHours: 48 },
    { label: "General",   percent: 100, durationHours: 72 },
  ],
}: FeatureRolloutProps) {
  const stages = initialStages.slice(0, 6); // cap for UI
  const [stageIdx, setStageIdx] = useState(() => {
    const idx = stages.findIndex((s) => s.percent >= initialTarget);
    return idx >= 0 ? idx : 0;
  });
  const [currentPercent, setCurrentPercent] = useState(stages[stageIdx]?.percent ?? initialTarget);
  const [metrics, setMetrics] = useState<Metrics>(() => generateMetrics(stages[stageIdx]?.percent ?? initialTarget, false));
  const [animating, setAnimating] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [rollbackFlash, setRollbackFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idx = stages.findIndex((s) => s.percent >= initialTarget);
    const resolvedIdx = idx >= 0 ? idx : 0;
    setStageIdx(resolvedIdx);
    setCurrentPercent(stages[resolvedIdx]?.percent ?? initialTarget);
    setMetrics(generateMetrics(stages[resolvedIdx]?.percent ?? initialTarget, false));
    setWarningVisible(false);
    setRollbackFlash(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureName, initialTarget]);

  function advance() {
    if (animating || stageIdx >= stages.length - 1) return;
    setAnimating(true);

    const nextIdx = stageIdx + 1;
    const nextStage = stages[nextIdx];
    const nextPercent = nextStage.percent;

    // ~20% chance of error spike on advance (for demo interest)
    const spiked = Math.random() < 0.25;
    const newMetrics = generateMetrics(nextPercent, spiked);

    timerRef.current = setTimeout(() => {
      setStageIdx(nextIdx);
      setCurrentPercent(nextPercent);
      setMetrics(newMetrics);
      setWarningVisible(spiked);
      setAnimating(false);
    }, 800);
  }

  function rollback() {
    if (animating || stageIdx <= 0) return;
    setAnimating(true);
    setRollbackFlash(true);

    const prevIdx = stageIdx - 1;
    const prevPercent = stages[prevIdx].percent;

    timerRef.current = setTimeout(() => {
      setStageIdx(prevIdx);
      setCurrentPercent(prevPercent);
      setMetrics(generateMetrics(prevPercent, false));
      setWarningVisible(false);
      setAnimating(false);
      setTimeout(() => setRollbackFlash(false), 600);
    }, 800);
  }

  function resetRollout() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStageIdx(0);
    setCurrentPercent(stages[0]?.percent ?? 1);
    setMetrics(generateMetrics(stages[0]?.percent ?? 1, false));
    setWarningVisible(false);
    setRollbackFlash(false);
    setAnimating(false);
  }

  const barWidth = (currentPercent / 100) * 100;
  const errorOk = metrics.errorRate < 1.0;
  const conversionOk = metrics.conversion > 0;

  return (
    <div className={cn(
      "rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
      rollbackFlash
        ? "border-red-400 dark:border-red-500"
        : "border-zinc-200 dark:border-zinc-800"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Rocket className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Feature Rollout</span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[140px]">
          &quot;{featureName}&quot;
        </span>
        <button onClick={resetRollout} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* Stage list */}
      <div className="min-h-[300px] p-4 flex flex-col gap-4">
        <div className="space-y-2">
          {stages.map((stage, i) => {
            const isActive = i === stageIdx;
            const isDone = i < stageIdx;
            const isFuture = i > stageIdx;
            const pct = stage.percent;
            const barFill = isDone || isActive ? (pct / 100) * 100 : 0;

            return (
              <div key={i} className={cn(
                "rounded-lg border px-3 py-2 transition-all duration-500",
                isActive
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                  : isDone
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10"
                  : "border-zinc-100 dark:border-zinc-800 opacity-50"
              )}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn(
                    "text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                    isActive
                      ? "bg-blue-500 text-white"
                      : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  )}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className={cn(
                    "text-[11px] font-semibold flex-1",
                    isActive ? "text-blue-700 dark:text-blue-300" : isFuture ? "text-zinc-400" : "text-emerald-700 dark:text-emerald-300"
                  )}>
                    {stage.label}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      : isDone
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}>
                    {pct}%
                  </span>
                  <span className="text-[9px] text-zinc-400 shrink-0">{stage.durationHours}h</span>
                  {isActive && <ChevronRight className="size-3 text-blue-500 shrink-0" />}
                </div>
                {/* Progress bar for this stage */}
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      isActive ? "bg-blue-500" : isDone ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                    style={{ width: `${barFill}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Global rollout bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              Currently: <span className="text-zinc-700 dark:text-zinc-200">{currentPercent}%</span> of users see &quot;{featureName}&quot;
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{currentPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                rollbackFlash ? "bg-red-500" : "bg-blue-500"
              )}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="text-[9px] text-zinc-400 mt-1">
            Blast radius: only {currentPercent}% of users affected by any bugs
          </div>
        </div>

        {/* Metrics */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            Live metrics ({currentPercent}% of users)
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold font-mono text-zinc-700 dark:text-zinc-200">
                  {metrics.errorRate.toFixed(2)}%
                </span>
                {errorOk
                  ? <TrendingDown className="size-3 text-emerald-500" />
                  : <TrendingUp className="size-3 text-red-500" />
                }
              </div>
              <div className="text-[9px] text-zinc-400">error rate</div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-[11px] font-bold font-mono",
                  conversionOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {metrics.conversion > 0 ? "+" : ""}{metrics.conversion.toFixed(1)}%
                </span>
                {conversionOk
                  ? <TrendingUp className="size-3 text-emerald-500" />
                  : <TrendingDown className="size-3 text-red-500" />
                }
              </div>
              <div className="text-[9px] text-zinc-400">conversion</div>
            </div>
            <div>
              <div className="text-[11px] font-bold font-mono text-zinc-700 dark:text-zinc-200">
                {metrics.latencyMs}ms
              </div>
              <div className="text-[9px] text-zinc-400">p95 latency</div>
            </div>
          </div>

          {warningVisible && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/20 rounded px-2 py-1.5 border border-orange-200 dark:border-orange-800">
              <AlertTriangle className="size-3 shrink-0" />
              Error rate elevated — consider rollback
            </div>
          )}
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 italic border-t border-zinc-100 dark:border-zinc-800 pt-2">
          Gradual rollout limits blast radius — only <strong className="text-zinc-600 dark:text-zinc-300">{currentPercent}%</strong> of users are affected by bugs.
          Full rollback restores all users to old version instantly.
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-2 flex-wrap bg-zinc-50/50 dark:bg-zinc-900/20">
        <button
          onClick={advance}
          disabled={animating || stageIdx >= stages.length - 1}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300",
            animating || stageIdx >= stages.length - 1
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          <Rocket className="size-3.5" />
          {stageIdx >= stages.length - 1 ? "Fully Rolled Out" : "Advance Stage"}
        </button>

        <button
          onClick={rollback}
          disabled={animating || stageIdx <= 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300",
            animating || stageIdx <= 0
              ? "border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
              : "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          )}
        >
          <RotateCcw className="size-3.5" />
          Rollback
        </button>

        {stageIdx >= stages.length - 1 && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-auto">
            100% deployment complete
          </span>
        )}
      </div>
    </div>
  );
}
