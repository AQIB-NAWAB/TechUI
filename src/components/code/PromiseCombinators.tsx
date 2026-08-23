"use client";

import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export const PromiseCombinatorSchema = z.object({
  combinator: z.enum(["all", "allSettled", "race", "any"]).default("all"),
  tasks: z
    .array(
      z.object({
        name: z.string(),
        durationMs: z.number(),
        succeeds: z.boolean().optional().default(true),
      })
    )
    .default([
      { name: "fetchUser", durationMs: 800, succeeds: true },
      { name: "fetchOrders", durationMs: 1400, succeeds: true },
      { name: "fetchProfile", durationMs: 600, succeeds: false },
    ]),
});

export type PromiseCombinatorProps = z.infer<typeof PromiseCombinatorSchema>;

type Combinator = "all" | "allSettled" | "race" | "any";

const TABS: { id: Combinator; label: string }[] = [
  { id: "all", label: "Promise.all" },
  { id: "allSettled", label: "Promise.allSettled" },
  { id: "race", label: "Promise.race" },
  { id: "any", label: "Promise.any" },
];

const COMBINATOR_INFO: Record<
  Combinator,
  { key: string; color: string; description: string }
> = {
  all: {
    key: "Rejects immediately if ANY task fails",
    color: "text-red-600 dark:text-red-400",
    description: "All must succeed. One failure cancels the whole group.",
  },
  allSettled: {
    key: "Always resolves — shows ALL outcomes (fulfilled or rejected)",
    color: "text-emerald-600 dark:text-emerald-400",
    description:
      "Returns [{status, value/reason}] for every task. Never rejects.",
  },
  race: {
    key: "Settles with the FIRST task to finish (success or failure)",
    color: "text-amber-600 dark:text-amber-400",
    description: "First to the finish line wins — even if it failed.",
  },
  any: {
    key: "Resolves with the FIRST success. Only rejects if ALL fail.",
    color: "text-blue-600 dark:text-blue-400",
    description: "Optimistic counterpart to race — ignores failures until all fail.",
  },
};

function getCombinatorSettlement(
  combinator: Combinator,
  tasks: PromiseCombinatorProps["tasks"],
  maxDuration: number
): { ms: number; success: boolean; message: string } {
  const sorted = [...tasks].sort((a, b) => a.durationMs - b.durationMs);

  if (combinator === "all") {
    const firstFail = sorted.find((t) => !t.succeeds);
    if (firstFail) {
      return {
        ms: firstFail.durationMs,
        success: false,
        message: `Rejected at ${firstFail.durationMs}ms — ${firstFail.name} failed`,
      };
    }
    const lastMs = Math.max(...tasks.map((t) => t.durationMs));
    return {
      ms: lastMs,
      success: true,
      message: `Resolved at ${lastMs}ms — all ${tasks.length} tasks succeeded`,
    };
  }

  if (combinator === "allSettled") {
    const lastMs = Math.max(...tasks.map((t) => t.durationMs));
    const succeeded = tasks.filter((t) => t.succeeds).length;
    return {
      ms: lastMs,
      success: true,
      message: `Resolved at ${lastMs}ms — ${succeeded}/${tasks.length} fulfilled, ${tasks.length - succeeded} rejected`,
    };
  }

  if (combinator === "race") {
    const first = sorted[0];
    return {
      ms: first.durationMs,
      success: first.succeeds ?? true,
      message: `${first.succeeds ? "Resolved" : "Rejected"} at ${first.durationMs}ms — ${first.name} finished first`,
    };
  }

  // any
  const firstSuccess = sorted.find((t) => t.succeeds);
  if (firstSuccess) {
    return {
      ms: firstSuccess.durationMs,
      success: true,
      message: `Resolved at ${firstSuccess.durationMs}ms — ${firstSuccess.name} was first success`,
    };
  }
  return {
    ms: maxDuration,
    success: false,
    message: `Rejected — all ${tasks.length} tasks failed (AggregateError)`,
  };
}

function isTaskSettledForCombinator(
  combinator: Combinator,
  task: PromiseCombinatorProps["tasks"][number],
  elapsedMs: number,
  tasks: PromiseCombinatorProps["tasks"]
): boolean {
  const settlement = getCombinatorSettlement(combinator, tasks, Math.max(...tasks.map(t => t.durationMs)));
  if (elapsedMs < settlement.ms) return false;
  if (combinator === "all" && !settlement.success) return task.durationMs <= settlement.ms;
  if (combinator === "race") return task.durationMs === Math.min(...tasks.map(t => t.durationMs));
  if (combinator === "any") {
    const firstSuccess = [...tasks].sort((a, b) => a.durationMs - b.durationMs).find(t => t.succeeds);
    if (firstSuccess) return task.durationMs <= firstSuccess.durationMs;
  }
  return true;
}

export function PromiseCombinators({
  combinator: combinatorProp = "all",
  tasks = [
    { name: "fetchUser", durationMs: 800, succeeds: true },
    { name: "fetchOrders", durationMs: 1400, succeeds: true },
    { name: "fetchProfile", durationMs: 600, succeeds: false },
  ],
}: PromiseCombinatorProps) {
  const [activeTab, setActiveTab] = useState<Combinator>(combinatorProp);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [settled, setSettled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setActiveTab(combinatorProp);
  }, [combinatorProp]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const maxDuration = Math.max(...tasks.map((t) => t.durationMs));
  const settlement = getCombinatorSettlement(activeTab, tasks, maxDuration);

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsedMs(0);
    setSettled(false);
  }

  function handleRun() {
    if (running) {
      reset();
      return;
    }
    reset();
    setRunning(true);

    const TICK = 30;
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += TICK;
      setElapsedMs(elapsed);
      if (elapsed >= settlement.ms) {
        clearInterval(intervalRef.current!);
        setSettled(true);
        setRunning(false);
      }
    }, TICK);
  }

  const info = COMBINATOR_INFO[activeTab];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Layers className="w-4 h-4 text-violet-500" />
        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          Promise Combinators
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-zinc-100 dark:border-zinc-800 px-4 pt-3 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all duration-500 border-b-2",
              activeTab === tab.id
                ? "border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="px-4 py-4 min-h-[300px] flex flex-col gap-4">
        {/* Signature */}
        <div className="font-mono text-xs bg-zinc-950 rounded-lg px-3 py-2 text-violet-300">
          Promise.{activeTab}([{tasks.map((t) => t.name).join(", ")}])
        </div>

        {/* Gantt Chart */}
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const widthPct = (task.durationMs / maxDuration) * 100;
            const taskProgress = Math.min(elapsedMs / task.durationMs, 1);
            const taskDone = elapsedMs >= task.durationMs;
            const isSettlementPoint =
              settlement.ms === task.durationMs;
            const succeeds = task.succeeds ?? true;

            let barColor = "bg-blue-500";
            if (taskDone) {
              barColor = succeeds
                ? "bg-emerald-500"
                : "bg-red-500";
            }

            return (
              <div key={task.name} className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 w-28 shrink-0 truncate">
                  {task.name}
                </span>
                <div
                  className="relative h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden flex-1"
                  style={{ minWidth: 80 }}
                >
                  {/* Bar background (full width outline) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded opacity-20"
                    style={{ width: `${widthPct}%`, backgroundColor: "#6366f1" }}
                  />
                  {/* Animated fill */}
                  <div
                    className={cn("absolute inset-y-0 left-0 rounded transition-all duration-[30ms]", barColor)}
                    style={{ width: `${widthPct * taskProgress}%` }}
                  />
                  {/* Settlement vertical tick */}
                  {isSettlementPoint && settled && (
                    <div className="absolute inset-y-0 right-0 w-0.5 bg-yellow-400" />
                  )}
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 w-12 shrink-0 text-right">
                  {task.durationMs}ms
                </span>
                <span className="text-xs w-6 shrink-0">
                  {taskDone
                    ? succeeds
                      ? "✓"
                      : "✗"
                    : elapsedMs > 0
                    ? "…"
                    : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Settlement indicator */}
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-medium transition-all duration-500",
            settled
              ? settlement.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
          )}
        >
          {settled
            ? `${settlement.success ? "✓ Resolved" : "✗ Rejected"}: ${settlement.message}`
            : running
            ? `Running… ${elapsedMs}ms elapsed`
            : "Press Run to animate"}
        </div>

        {/* Key insight */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2">
          <p className={cn("text-xs font-semibold mb-0.5", info.color)}>
            {info.key}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {info.description}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {running ? "Stop" : settled ? "Run Again" : "Run"}
          </button>
          {settled && (
            <button
              onClick={reset}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
