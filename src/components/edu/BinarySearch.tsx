"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, RotateCcw, CheckCircle2 } from "lucide-react";

export const BinarySearchSchema = z.object({
  array: z.array(z.number()).default([3, 7, 12, 18, 24, 31, 39, 45, 52, 60, 71, 83, 95]),
  target: z.number().default(39),
});

export type BinarySearchProps = z.infer<typeof BinarySearchSchema>;

interface SearchStep {
  left: number;
  right: number;
  mid: number;
  comparison: "found" | "search-left" | "search-right";
  midValue: number;
}

function buildSteps(array: number[], target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let left = 0;
  let right = array.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = array[mid];
    if (midValue === target) {
      steps.push({ left, right, mid, midValue, comparison: "found" });
      break;
    } else if (midValue < target) {
      steps.push({ left, right, mid, midValue, comparison: "search-right" });
      left = mid + 1;
    } else {
      steps.push({ left, right, mid, midValue, comparison: "search-left" });
      right = mid - 1;
    }
  }

  return steps;
}

function linearSteps(array: number[], target: number): number {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) return i + 1;
  }
  return array.length;
}

export function BinarySearch({
  array = [3, 7, 12, 18, 24, 31, 39, 45, 52, 60, 71, 83, 95],
  target = 39,
}: BinarySearchProps) {
  const steps = buildSteps(array, target);
  const totalSteps = steps.length;
  const notFound = totalSteps === 0 || steps[totalSteps - 1].comparison !== "found";
  const linearCount = linearSteps(array, target);

  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[stepIndex] as SearchStep | undefined;
  const isDone = stepIndex >= totalSteps - 1;

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [array, target]);

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
      }, 1200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, totalSteps]);

  const handleReset = () => {
    setStepIndex(0);
    setPlaying(false);
  };

  const handlePlayPause = () => {
    if (isDone) {
      handleReset();
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const comparisonLabel = (step: SearchStep | undefined): string => {
    if (!step) return "";
    if (step.comparison === "found") return `${step.midValue} = ${target} — Found!`;
    if (step.comparison === "search-right") return `${step.midValue} < ${target} — search right half`;
    return `${step.midValue} > ${target} — search left half`;
  };

  const footerStatus = currentStep
    ? `Step ${stepIndex + 1}/${totalSteps}: ${comparisonLabel(currentStep)}`
    : "Press Auto-play to search the sorted array";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Search className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Binary Search</span>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          target: <span className="text-blue-600 dark:text-blue-400 font-bold">{target}</span>
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Halve the search space each step — O(log n) instead of scanning every element.
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-2 flex flex-col gap-3">
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {array.map((val, idx) => {
              const inRange = currentStep
                ? idx >= currentStep.left && idx <= currentStep.right
                : true;
              const isMid = currentStep ? idx === currentStep.mid : false;
              const isFound = currentStep?.comparison === "found" && isMid;
              const isEliminated = !inRange;

              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xs font-mono font-bold transition-all duration-500",
                      isFound
                        ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-110"
                        : isMid
                        ? "bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300 scale-110"
                        : isEliminated
                        ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 opacity-40"
                        : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    {val}
                  </div>
                  {isMid ? (
                    <div className={cn(
                      "mt-0.5 text-[9px] font-bold tracking-wide",
                      isFound ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                    )}>
                      mid
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[9px] text-transparent">mid</div>
                  )}
                </div>
              );
            })}
          </div>

          {currentStep && (
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Range:{" "}
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                [{array[currentStep.left]}…{array[currentStep.right]}]
              </span>
              {" "}· mid index{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{currentStep.mid}</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-500 border min-h-[44px] flex items-center gap-2",
            !currentStep
              ? "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
              : currentStep.comparison === "found"
              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
              : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
          )}
        >
          {currentStep?.comparison === "found" && <CheckCircle2 className="size-4 shrink-0" />}
          {currentStep ? (
            <>
              {comparisonLabel(currentStep)}
              {notFound && isDone && currentStep.comparison !== "found" && (
                <span className="text-red-500"> — Not found</span>
              )}
            </>
          ) : (
            "Ready to search"
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-500 dark:text-zinc-400">Binary:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{stepIndex + 1} step{stepIndex !== 0 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-400" />
            <span className="text-zinc-500 dark:text-zinc-400">Linear:</span>
            <span className="font-bold text-zinc-600 dark:text-zinc-300 font-mono">{linearCount} step{linearCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button
          onClick={() => setStepIndex((p) => Math.max(0, p - 1))}
          disabled={stepIndex === 0}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-500"
          title="Step back"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
          title="Reset"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
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
