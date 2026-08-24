"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitBranch, ChevronLeft, RotateCcw } from "lucide-react";

export const RecursionSchema = z.object({
  example: z.enum(["factorial", "fibonacci", "countdown"]).default("factorial"),
  n: z.number().default(5),
});

export type RecursionProps = z.infer<typeof RecursionSchema>;

// ── Factorial ──────────────────────────────────────────────────────────────────

interface FactorialFrame {
  n: number;
  phase: "calling" | "base" | "returning";
  returnValue?: number;
}

function buildFactorialFrames(n: number): FactorialFrame[] {
  const frames: FactorialFrame[] = [];
  // Push frames
  for (let i = n; i >= 1; i--) {
    frames.push({ n: i, phase: i === 1 ? "base" : "calling" });
  }
  // Pop frames with return values
  let val = 1;
  for (let i = 1; i <= n; i++) {
    val = val * i;
    if (i > 1 || n === 1) {
      frames.push({ n: i, phase: "returning", returnValue: val });
    }
  }
  return frames;
}

// ── Fibonacci tree ─────────────────────────────────────────────────────────────

interface FibNode {
  n: number;
  depth: number;
  id: string;
  isDuplicate?: boolean;
}

function buildFibTree(n: number): FibNode[] {
  const nodes: FibNode[] = [];
  const seen = new Map<number, number>(); // n -> count

  function dfs(cur: number, depth: number, id: string) {
    const count = (seen.get(cur) ?? 0) + 1;
    seen.set(cur, count);
    nodes.push({ n: cur, depth, id, isDuplicate: count > 1 });
    if (cur <= 1) return;
    dfs(cur - 1, depth + 1, id + "L");
    dfs(cur - 2, depth + 1, id + "R");
  }

  dfs(n, 0, "r");
  return nodes;
}

// ── Countdown ─────────────────────────────────────────────────────────────────

interface CountdownFrame {
  n: number;
  phase: "calling" | "base" | "returning";
}

function buildCountdownFrames(n: number): CountdownFrame[] {
  const frames: CountdownFrame[] = [];
  for (let i = n; i >= 0; i--) {
    frames.push({ n: i, phase: i === 0 ? "base" : "calling" });
  }
  for (let i = 0; i <= n; i++) {
    frames.push({ n: i, phase: "returning" });
  }
  return frames;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Recursion({
  example = "factorial",
  n = 5,
}: RecursionProps) {
  const clampedN = Math.min(Math.max(n, 1), example === "fibonacci" ? 7 : 8);

  const [tab, setTab] = useState<"factorial" | "fibonacci" | "countdown">(example);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build frames/tree for current tab
  const factFrames = tab === "factorial" ? buildFactorialFrames(clampedN) : [];
  const countFrames = tab === "countdown" ? buildCountdownFrames(clampedN) : [];
  const fibNodes = tab === "fibonacci" ? buildFibTree(clampedN) : [];

  const totalSteps =
    tab === "factorial" ? factFrames.length :
    tab === "countdown" ? countFrames.length :
    fibNodes.length;

  const isDone = stepIndex >= totalSteps - 1;

  // Split factorial/countdown frames into phases
  const callDepth = tab === "factorial" ? clampedN : clampedN + 1;

  // Current visible factorial frames
  const visibleFactFrames: FactorialFrame[] = (() => {
    if (tab !== "factorial") return [];
    // Frames 0..callDepth-1 are "calling" phase, frames callDepth.. are "returning"
    const callPhaseCount = clampedN; // n frames to push
    if (stepIndex < callPhaseCount) {
      return factFrames.slice(0, stepIndex + 1);
    } else {
      const returnIdx = stepIndex - callPhaseCount;
      // Show all call frames, but highlight the ones that have returned
      const base = factFrames.slice(0, callPhaseCount);
      const returnFrames = factFrames.slice(callPhaseCount, callPhaseCount + returnIdx + 1);
      return [...base, ...returnFrames];
    }
  })();

  const visibleCountFrames: CountdownFrame[] = (() => {
    if (tab !== "countdown") return [];
    const callPhaseCount = clampedN + 1;
    if (stepIndex < callPhaseCount) {
      return countFrames.slice(0, stepIndex + 1);
    } else {
      const returnIdx = stepIndex - callPhaseCount;
      const base = countFrames.slice(0, callPhaseCount);
      const returnFrames = countFrames.slice(callPhaseCount, callPhaseCount + returnIdx + 1);
      return [...base, ...returnFrames];
    }
  })();

  const visibleFibNodes = fibNodes.slice(0, stepIndex + 1);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [tab, n]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, tab === "fibonacci" ? 1000 : 1200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, totalSteps, tab]);

  function handlePlayPause() {
    if (isDone) {
      setStepIndex(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }

  // Depth-based indent for factorial/countdown
  function getIndent(depth: number) {
    return depth * 16;
  }

  // For factorial phase detection
  const factCallDepth = clampedN;
  const isFactUnwinding = tab === "factorial" && stepIndex >= factCallDepth;
  const factReturnIdx = isFactUnwinding ? stepIndex - factCallDepth : -1;

  const countCallDepth2 = clampedN + 1;
  const isCountUnwinding = tab === "countdown" && stepIndex >= countCallDepth2;

  // Fibonacci duplicate count for insight
  const totalFibCalls = fibNodes.length;
  const duplicateCalls = fibNodes.filter((n) => n.isDuplicate).length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <GitBranch className="size-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Recursion</span>
        <div className="flex gap-1">
          {(["factorial", "fibonacci", "countdown"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setStepIndex(0); setPlaying(false); }}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-semibold transition-all duration-500",
                tab === t
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {t === "factorial" ? "n!" : t === "fibonacci" ? "fib" : "↓"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A function that calls itself — stack grows until the base case, then unwinds.
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-3 flex flex-col gap-3">

        {/* Phase label */}
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            {tab === "factorial" && (
              isFactUnwinding
                ? <span className="text-amber-600 dark:text-amber-400">Unwinding — values returning up the stack</span>
                : <span className="text-blue-600 dark:text-blue-400">Building call stack — factorial({clampedN})</span>
            )}
            {tab === "countdown" && (
              isCountUnwinding
                ? <span className="text-amber-600 dark:text-amber-400">Returning from base case</span>
                : <span className="text-blue-600 dark:text-blue-400">Building call stack — countdown({clampedN})</span>
            )}
            {tab === "fibonacci" && (
              <span className="text-violet-600 dark:text-violet-400">Call tree — fib({clampedN}) — {visibleFibNodes.length} calls so far</span>
            )}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>

        {/* Factorial call stack */}
        {tab === "factorial" && (
          <div className="flex-1 overflow-y-auto font-mono text-[12px] min-h-[160px] max-h-[200px] space-y-0.5">
            {visibleFactFrames.map((frame, idx) => {
              const isBase = frame.phase === "base";
              const isReturning = frame.phase === "returning";
              const depth = isReturning ? clampedN - frame.n : clampedN - frame.n;
              const isLatest = idx === visibleFactFrames.length - 1;

              return (
                <div
                  key={`${frame.phase}-${frame.n}-${idx}`}
                  style={{ paddingLeft: getIndent(depth) }}
                  className={cn(
                    "flex items-center gap-2 py-0.5 rounded transition-all duration-500",
                    isLatest && "ring-1 ring-inset ring-blue-300 dark:ring-blue-700 bg-blue-50/50 dark:bg-blue-900/10",
                    isBase && "ring-1 ring-inset ring-emerald-400 dark:ring-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/20",
                    isReturning && "bg-amber-50/50 dark:bg-amber-900/10"
                  )}
                >
                  {isReturning ? (
                    <>
                      <span className="text-amber-600 dark:text-amber-400 text-[11px]">↩</span>
                      <span className="text-zinc-500 dark:text-zinc-400">return </span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold">{frame.returnValue}</span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-[10px] ml-1">
                        ← factorial({frame.n})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={cn(
                        "text-[11px]",
                        isBase ? "text-emerald-500" : "text-blue-400"
                      )}>
                        {isBase ? "★" : "→"}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">factorial</span>
                      <span className="text-zinc-500 dark:text-zinc-400">(</span>
                      <span className="text-amber-600 dark:text-amber-300 font-bold">{frame.n}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">)</span>
                      {isBase && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-2 font-semibold">← base case: return 1</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Countdown call stack */}
        {tab === "countdown" && (
          <div className="flex-1 overflow-y-auto font-mono text-[12px] min-h-[160px] max-h-[200px] space-y-0.5">
            {visibleCountFrames.map((frame, idx) => {
              const isBase = frame.phase === "base";
              const isReturning = frame.phase === "returning";
              const depth = isReturning ? clampedN - frame.n : clampedN - frame.n;
              const isLatest = idx === visibleCountFrames.length - 1;

              return (
                <div
                  key={`${frame.phase}-${frame.n}-${idx}`}
                  style={{ paddingLeft: getIndent(depth) }}
                  className={cn(
                    "flex items-center gap-2 py-0.5 rounded transition-all duration-500",
                    isLatest && "ring-1 ring-inset ring-blue-300 dark:ring-blue-700 bg-blue-50/50 dark:bg-blue-900/10",
                    isBase && "ring-1 ring-inset ring-emerald-400 dark:ring-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/20",
                    isReturning && "bg-amber-50/50 dark:bg-amber-900/10"
                  )}
                >
                  {isReturning ? (
                    <>
                      <span className="text-amber-600 dark:text-amber-400 text-[11px]">↩</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">return from countdown({frame.n})</span>
                    </>
                  ) : (
                    <>
                      <span className={cn(
                        "text-[11px]",
                        isBase ? "text-emerald-500" : "text-blue-400"
                      )}>
                        {isBase ? "★" : "→"}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">countdown</span>
                      <span className="text-zinc-500 dark:text-zinc-400">(</span>
                      <span className="text-amber-600 dark:text-amber-300 font-bold">{frame.n}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">)</span>
                      {!isBase && (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-2 text-[10px]">print {frame.n}</span>
                      )}
                      {isBase && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-2 font-semibold">← base case: n=0, stop</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Fibonacci tree */}
        {tab === "fibonacci" && (
          <div className="flex-1 min-h-[160px] max-h-[220px] overflow-auto">
            {/* Group by depth */}
            {(() => {
              const maxDepth = Math.max(...visibleFibNodes.map((n) => n.depth), 0);
              const byDepth: FibNode[][] = [];
              for (let d = 0; d <= maxDepth; d++) {
                byDepth[d] = visibleFibNodes.filter((n) => n.depth === d);
              }
              return (
                <div className="space-y-1 font-mono text-[11px]">
                  {byDepth.map((nodesAtDepth, depth) => (
                    <div
                      key={depth}
                      className="flex flex-wrap gap-1.5 items-center"
                      style={{ paddingLeft: depth * 12 }}
                    >
                      {nodesAtDepth.map((node) => (
                        <span
                          key={node.id}
                          className={cn(
                            "px-1.5 py-0.5 rounded border text-[11px] font-bold transition-all duration-500",
                            node.n <= 1
                              ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                              : node.isDuplicate
                              ? "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400"
                              : "bg-violet-100 dark:bg-violet-900/30 border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300"
                          )}
                          title={node.isDuplicate ? "Duplicate call — wasted work!" : ""}
                        >
                          fib({node.n})
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend for fib */}
        {tab === "fibonacci" && visibleFibNodes.length > 1 && (
          <div className="flex gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 inline-block" />
              <span className="text-zinc-500 dark:text-zinc-400">base case (0,1)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-red-400 bg-red-100 dark:bg-red-900/30 inline-block" />
              <span className="text-zinc-500 dark:text-zinc-400">duplicate call ({duplicateCalls} wasted)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-violet-400 bg-violet-100 dark:bg-violet-900/30 inline-block" />
              <span className="text-zinc-500 dark:text-zinc-400">unique call</span>
            </div>
          </div>
        )}

      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button
          onClick={() => setStepIndex((p) => Math.max(0, p - 1))}
          disabled={stepIndex === 0}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-500"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => { setStepIndex(0); setPlaying(false); }}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          Step {stepIndex + 1}/{totalSteps}
          {tab === "fibonacci" && duplicateCalls > 0 && (
            <span className="text-red-500 ml-1">· {duplicateCalls} duplicate calls</span>
          )}
        </span>
        <button
          onClick={handlePlayPause}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {playing ? "Pause" : isDone ? "Replay" : "Auto-play"}
        </button>
      </div>
    </div>
  );
}
