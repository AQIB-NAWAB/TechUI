"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, RefreshCw } from "lucide-react";

export const CacheStrategiesSchema = z.object({
  strategy: z.enum(["cache-aside", "read-through", "write-through", "write-behind"]).default("cache-aside"),
  hitRate: z.number().min(0).max(100).default(75),
});

export type CacheStrategiesProps = z.infer<typeof CacheStrategiesSchema>;

type Strategy = "cache-aside" | "read-through" | "write-through" | "write-behind";

type AnimStep = {
  from: "app" | "cache" | "db";
  to: "app" | "cache" | "db";
  label: string;
  color: "green" | "amber" | "blue" | "violet";
  parallel?: boolean; // runs at same time as previous step
};

type FlowResult = {
  badge: string;
  badgeColor: string;
  timeLabel: string;
};

type StrategyConfig = {
  name: string;
  short: string;
  hitFlow: AnimStep[];
  missFlow: AnimStep[];
  writeFlow: AnimStep[];
  pro: string;
  con: string;
  description: string;
};

const STRATEGIES: Record<Strategy, StrategyConfig> = {
  "cache-aside": {
    name: "Cache-Aside",
    short: "Cache-Aside",
    description: "App checks cache first; on miss, fetches from DB and stores result",
    hitFlow: [
      { from: "app", to: "cache", label: "GET key", color: "green" },
      { from: "cache", to: "app", label: "HIT → return value", color: "green" },
    ],
    missFlow: [
      { from: "app", to: "cache", label: "GET key", color: "amber" },
      { from: "cache", to: "app", label: "MISS → null", color: "amber" },
      { from: "app", to: "db", label: "SELECT …", color: "blue" },
      { from: "db", to: "app", label: "row data", color: "blue" },
      { from: "app", to: "cache", label: "SET key value", color: "green" },
    ],
    writeFlow: [],
    pro: "App controls caching logic",
    con: "Cache miss always hits DB",
  },
  "read-through": {
    name: "Read-Through",
    short: "Read-Through",
    description: "App always reads from cache; cache fetches from DB on miss automatically",
    hitFlow: [
      { from: "app", to: "cache", label: "READ key", color: "green" },
      { from: "cache", to: "app", label: "HIT → cached value", color: "green" },
    ],
    missFlow: [
      { from: "app", to: "cache", label: "READ key", color: "amber" },
      { from: "cache", to: "db", label: "MISS → fetch from DB", color: "blue" },
      { from: "db", to: "cache", label: "return row", color: "blue" },
      { from: "cache", to: "app", label: "return + cache stored", color: "green" },
    ],
    writeFlow: [],
    pro: "Simple app code — one read target",
    con: "Cold start: first request always slow",
  },
  "write-through": {
    name: "Write-Through",
    short: "Write-Through",
    description: "Every write goes to cache AND database synchronously before returning",
    hitFlow: [],
    missFlow: [],
    writeFlow: [
      { from: "app", to: "cache", label: "WRITE value", color: "violet" },
      { from: "cache", to: "db", label: "persist to DB", color: "blue" },
      { from: "db", to: "cache", label: "confirmed", color: "blue" },
      { from: "cache", to: "app", label: "write complete", color: "green" },
    ],
    pro: "Cache always consistent with DB",
    con: "Write latency = cache + DB time",
  },
  "write-behind": {
    name: "Write-Behind",
    short: "Write-Behind",
    description: "App writes to cache only; cache asynchronously syncs to DB later",
    hitFlow: [],
    missFlow: [],
    writeFlow: [
      { from: "app", to: "cache", label: "WRITE value", color: "violet" },
      { from: "cache", to: "app", label: "ACK immediately", color: "green" },
      { from: "cache", to: "db", label: "async flush (later)", color: "amber" },
    ],
    pro: "Ultra-fast writes — DB write is async",
    con: "Risk of data loss if cache crashes",
  },
};

const ACTOR_LABELS: Record<"app" | "cache" | "db", string> = {
  app: "App",
  cache: "Cache",
  db: "Database",
};

const ACTOR_COLORS: Record<"app" | "cache" | "db", string> = {
  app: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  cache: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  db: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
};

const ACTOR_POSITIONS: Record<"app" | "cache" | "db", number> = {
  app: 0,
  cache: 1,
  db: 2,
};

const ARROW_COLORS: Record<string, string> = {
  green: "bg-emerald-400 dark:bg-emerald-600",
  amber: "bg-amber-400 dark:bg-amber-600",
  blue: "bg-blue-400 dark:bg-blue-600",
  violet: "bg-violet-400 dark:bg-violet-600",
};

const LABEL_COLORS: Record<string, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  violet: "text-violet-600 dark:text-violet-400",
};

function ActorBox({ actor }: { actor: "app" | "cache" | "db" }) {
  return (
    <div
      className={cn(
        "px-3 py-2 rounded-lg text-xs font-bold text-center min-w-[64px] transition-all duration-500",
        ACTOR_COLORS[actor]
      )}
    >
      {ACTOR_LABELS[actor]}
    </div>
  );
}

function FlowArrow({
  step,
  visible,
}: {
  step: AnimStep;
  visible: boolean;
}) {
  const fromPos = ACTOR_POSITIONS[step.from];
  const toPos = ACTOR_POSITIONS[step.to];
  const isRtl = toPos < fromPos;

  return (
    <div
      className={cn(
        "flex items-center gap-1 transition-all duration-500",
        visible ? "opacity-100" : "opacity-0",
        isRtl ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "h-0.5 w-full transition-all duration-700",
          ARROW_COLORS[step.color],
          visible ? "scale-x-100" : "scale-x-0",
          isRtl ? "origin-right" : "origin-left"
        )}
      />
      <span className={cn("text-[10px] shrink-0", isRtl ? "ml-1" : "mr-1", LABEL_COLORS[step.color])}>
        {isRtl ? "◀" : "▶"}
      </span>
    </div>
  );
}

function FlowDiagram({
  steps,
  activeStep,
  mode,
}: {
  steps: AnimStep[];
  activeStep: number;
  mode: "hit" | "miss" | "write" | "idle";
}) {
  if (mode === "idle" || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-xs text-zinc-400">
        Click Simulate to animate
      </div>
    );
  }

  const actors: ("app" | "cache" | "db")[] = ["app", "cache", "db"];

  // Build a timeline of which arrows are visible at each step
  const arrowVisibility = steps.map((_, i) => i <= activeStep);

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Actor boxes */}
      <div className="flex items-center justify-between px-2">
        {actors.map((a) => (
          <ActorBox key={a} actor={a} />
        ))}
      </div>

      {/* Animated steps */}
      <div className="flex flex-col gap-1.5 px-2">
        {steps.map((step, i) => {
          const fromPos = ACTOR_POSITIONS[step.from];
          const toPos = ACTOR_POSITIONS[step.to];
          const leftPct = (Math.min(fromPos, toPos) / 2) * 100;
          const widthPct = (Math.abs(toPos - fromPos) / 2) * 100;

          return (
            <div key={i} className="relative h-6 flex items-center">
              {/* Step number */}
              <span className="absolute -left-1 text-[9px] text-zinc-300 dark:text-zinc-700 font-mono">{i + 1}</span>

              {/* Arrow container positioned between actors */}
              <div
                className="absolute flex flex-col items-stretch"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  minWidth: "30%",
                }}
              >
                <FlowArrow step={step} visible={arrowVisibility[i]!} />
                {arrowVisibility[i] && (
                  <span
                    className={cn(
                      "text-[9px] text-center truncate transition-all duration-500",
                      LABEL_COLORS[step.color]
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type AnimMode = "hit" | "miss" | "write" | "idle";

export function CacheStrategies({
  strategy: strategyProp = "cache-aside",
  hitRate = 75,
}: CacheStrategiesProps) {
  const [strategy, setStrategy] = useState<Strategy>(strategyProp);
  const [mode, setMode] = useState<AnimMode>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<FlowResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = STRATEGIES[strategy];
  const allStrategies: Strategy[] = ["cache-aside", "read-through", "write-through", "write-behind"];

  const isWriteOnly = strategy === "write-through" || strategy === "write-behind";

  function runFlow(flowMode: AnimMode) {
    if (running) return;
    let steps: AnimStep[] = [];
    if (flowMode === "hit") steps = cfg.hitFlow;
    else if (flowMode === "miss") steps = cfg.missFlow;
    else if (flowMode === "write") steps = cfg.writeFlow;

    if (steps.length === 0) return;

    setMode(flowMode);
    setActiveStep(-1);
    setResult(null);
    setRunning(true);

    let i = 0;
    setActiveStep(0);
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= steps.length) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        setActiveStep(steps.length - 1);

        // Set result badge
        if (flowMode === "hit") {
          setResult({ badge: "HIT", badgeColor: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300", timeLabel: "~5ms from cache" });
        } else if (flowMode === "miss") {
          setResult({ badge: "MISS", badgeColor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300", timeLabel: "~50ms (DB fetch)" });
        } else {
          setResult({ badge: "WRITTEN", badgeColor: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300", timeLabel: strategy === "write-behind" ? "~5ms (async DB)" : "~55ms (sync)" });
        }
      } else {
        setActiveStep(i);
      }
    }, 1000);
  }

  function simulateRead() {
    const isHit = Math.random() * 100 < hitRate;
    runFlow(isHit ? "hit" : "miss");
  }

  function switchStrategy(s: Strategy) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStrategy(s);
    setMode("idle");
    setActiveStep(-1);
    setResult(null);
    setRunning(false);
  }

  const currentSteps =
    mode === "hit" ? cfg.hitFlow
    : mode === "miss" ? cfg.missFlow
    : mode === "write" ? cfg.writeFlow
    : [];

  const tabColors: Record<Strategy, string> = {
    "cache-aside": "bg-blue-600 text-white dark:bg-blue-500",
    "read-through": "bg-emerald-600 text-white dark:bg-emerald-500",
    "write-through": "bg-violet-600 text-white dark:bg-violet-500",
    "write-behind": "bg-amber-500 text-white",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-11 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Zap className="size-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Cache Strategies</span>
        {running && <RefreshCw className="size-3.5 text-zinc-400 animate-spin" />}
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        {allStrategies.map((s) => {
          const isActive = s === strategy;
          return (
            <button
              key={s}
              onClick={() => switchStrategy(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-300",
                isActive
                  ? tabColors[s]
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {STRATEGIES[s].short}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div className="px-4 py-2 border-b border-zinc-50 dark:border-zinc-800/50">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{cfg.description}</p>
      </div>

      {/* Flow diagram */}
      <div className="px-4 py-3 min-h-[200px]">
        {currentSteps.length === 0 && mode === "idle" ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-xs text-zinc-400 gap-1">
            <Zap className="size-5 text-zinc-300 dark:text-zinc-700" />
            <span>Click Simulate to animate the flow</span>
          </div>
        ) : (
          <FlowDiagram steps={currentSteps} activeStep={activeStep} mode={mode} />
        )}

        {/* Result badge */}
        {result && (
          <div className="flex items-center gap-2 mt-3 transition-all duration-500">
            <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full", result.badgeColor)}>
              {result.badge}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{result.timeLabel}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/30">
        {!isWriteOnly && (
          <button
            onClick={simulateRead}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="size-3" />
            Simulate Read
          </button>
        )}
        {cfg.writeFlow.length > 0 && (
          <button
            onClick={() => runFlow("write")}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="size-3" />
            Simulate Write
          </button>
        )}
        {!isWriteOnly && (
          <span className="text-[10px] text-zinc-400 ml-auto">
            hit rate: {hitRate}%
          </span>
        )}
      </div>

      {/* Pro/Con footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
          ✓ {cfg.pro}
        </span>
        <span className="text-[10px] text-red-500 dark:text-red-400">
          ✗ {cfg.con}
        </span>
      </div>
    </div>
  );
}
