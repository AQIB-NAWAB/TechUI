"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers, RotateCcw } from "lucide-react";

export const HeapDataStructureSchema = z.object({
  type: z.enum(["min", "max"]).default("min"),
  initialValues: z.array(z.number()).default([1, 4, 2, 8, 5, 7, 3]),
});

export type HeapDataStructureProps = z.infer<typeof HeapDataStructureSchema>;

function heapifyUp(arr: number[], i: number, isMin: boolean): number[][] {
  const steps: number[][] = [];
  const heap = [...arr];
  let idx = i;
  while (idx > 0) {
    const parent = Math.floor((idx - 1) / 2);
    const shouldSwap = isMin ? heap[idx] < heap[parent] : heap[idx] > heap[parent];
    if (shouldSwap) {
      steps.push([...heap, idx, parent]);
      [heap[idx], heap[parent]] = [heap[parent], heap[idx]];
      idx = parent;
    } else {
      break;
    }
  }
  steps.push([...heap, -1, -1]);
  return steps;
}

function heapifyDown(arr: number[], isMin: boolean): number[][] {
  const steps: number[][] = [];
  const heap = [...arr];
  let idx = 0;
  const n = heap.length;
  while (true) {
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;
    let target = idx;
    if (left < n && (isMin ? heap[left] < heap[target] : heap[left] > heap[target])) target = left;
    if (right < n && (isMin ? heap[right] < heap[target] : heap[right] > heap[target])) target = right;
    if (target === idx) break;
    steps.push([...heap, idx, target]);
    [heap[idx], heap[target]] = [heap[target], heap[idx]];
    idx = target;
  }
  steps.push([...heap, -1, -1]);
  return steps;
}

function buildHeap(values: number[], isMin: boolean): number[] {
  const heap = [...values];
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
    let idx = i;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      const n = heap.length;
      let target = idx;
      if (left < n && (isMin ? heap[left] < heap[target] : heap[left] > heap[target])) target = left;
      if (right < n && (isMin ? heap[right] < heap[target] : heap[right] > heap[target])) target = right;
      if (target === idx) break;
      [heap[idx], heap[target]] = [heap[target], heap[idx]];
      idx = target;
    }
  }
  return heap;
}

const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 50, y: 8 }, { x: 25, y: 30 }, { x: 75, y: 30 },
  { x: 12, y: 54 }, { x: 38, y: 54 }, { x: 62, y: 54 }, { x: 88, y: 54 },
  { x: 6, y: 78 }, { x: 19, y: 78 }, { x: 31, y: 78 }, { x: 44, y: 78 },
  { x: 56, y: 78 }, { x: 69, y: 78 }, { x: 81, y: 78 }, { x: 94, y: 78 },
];

const EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6],
  [3, 7], [3, 8], [4, 9], [4, 10], [5, 11], [5, 12], [6, 13], [6, 14],
];

const INSERT_PRESETS = [0, 6, 9, 10, 15, 20, 11, 3, 13, 25];
let insertIdx = 0;

export function HeapDataStructure({
  type = "min",
  initialValues = [1, 4, 2, 8, 5, 7, 3],
}: HeapDataStructureProps) {
  const isMin = type === "min";
  const [heap, setHeap] = useState<number[]>(() => buildHeap(initialValues, isMin));
  const [highlighted, setHighlighted] = useState<{ swap: number[] }>({ swap: [] });
  const [animating, setAnimating] = useState(false);
  const [lastOp, setLastOp] = useState("");
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHeap(buildHeap(initialValues, isMin));
    setLastOp("");
    setHighlighted({ swap: [] });
  }, [initialValues, isMin]);

  const runSteps = useCallback((steps: number[][], opLabel: string) => {
    setAnimating(true);
    setLastOp(opLabel);
    let i = 0;
    function next() {
      if (i >= steps.length) {
        setHighlighted({ swap: [] });
        setAnimating(false);
        return;
      }
      const step = steps[i];
      const heapPart = step.slice(0, step.length - 2);
      const swapA = step[step.length - 2];
      const swapB = step[step.length - 1];
      setHeap(heapPart);
      setHighlighted({ swap: swapA >= 0 ? [swapA, swapB] : [] });
      i++;
      animRef.current = setTimeout(next, 800);
    }
    next();
  }, []);

  const handleInsert = useCallback(() => {
    if (animating || heap.length >= 15) return;
    const val = INSERT_PRESETS[insertIdx % INSERT_PRESETS.length];
    insertIdx++;
    const newHeap = [...heap, val];
    runSteps(heapifyUp(newHeap, newHeap.length - 1, isMin), `Insert ${val} → sift-up`);
  }, [animating, heap, isMin, runSteps]);

  const handleExtract = useCallback(() => {
    if (animating || heap.length === 0) return;
    const extracted = heap[0];
    if (heap.length === 1) {
      setHeap([]);
      setLastOp(`Extracted ${extracted}`);
      return;
    }
    const newHeap = [...heap];
    newHeap[0] = newHeap[newHeap.length - 1];
    newHeap.pop();
    runSteps(heapifyDown(newHeap, isMin), `Extract ${isMin ? "min" : "max"} (${extracted}) → sift-down`);
  }, [animating, heap, isMin, runSteps]);

  const handleReset = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    setAnimating(false);
    setHeap(buildHeap(initialValues, isMin));
    setLastOp("");
    setHighlighted({ swap: [] });
  }, [initialValues, isMin]);

  const maxNodes = Math.min(heap.length, 15);
  const rootVal = heap[0];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Layers className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          {isMin ? "Min" : "Max"}-Heap
        </span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {heap.length} nodes · O(log n)
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A tree where the root is always the {isMin ? "smallest" : "largest"} value — used for priority queues.
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-2 flex flex-col gap-3">
        <div className={cn(
          "rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-500 min-h-[32px] flex items-center border",
          lastOp
            ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 border-zinc-200 dark:border-zinc-700"
        )}>
          {lastOp || `Root = ${rootVal ?? "—"} (${isMin ? "minimum" : "maximum"} value)`}
          {animating && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
        </div>

        <div className="relative w-full h-[140px] border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/30">
          <svg viewBox="0 0 100 90" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {EDGES.map(([from, to]) => {
              if (from >= maxNodes || to >= maxNodes) return null;
              const p1 = NODE_POSITIONS[from];
              const p2 = NODE_POSITIONS[to];
              const isSwapEdge = highlighted.swap.includes(from) && highlighted.swap.includes(to);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={p1.x} y1={p1.y + 3}
                  x2={p2.x} y2={p2.y - 3}
                  className={cn("transition-all duration-500", isSwapEdge ? "stroke-amber-400" : "stroke-zinc-300 dark:stroke-zinc-700")}
                  strokeWidth="0.8"
                />
              );
            })}
            {heap.slice(0, 15).map((val, idx) => {
              const pos = NODE_POSITIONS[idx];
              const isRoot = idx === 0;
              const isSwap = highlighted.swap.includes(idx);
              return (
                <g key={idx} className="transition-all duration-500">
                  <circle
                    cx={pos.x} cy={pos.y} r={4.2}
                    className={cn(
                      "stroke-[0.8] transition-all duration-500",
                      isSwap ? "fill-amber-100 stroke-amber-500" : isRoot ? "fill-blue-100 stroke-blue-500" : "fill-white dark:fill-zinc-800 stroke-zinc-300"
                    )}
                  />
                  <text x={pos.x} y={pos.y + 1.3} textAnchor="middle" dominantBaseline="middle" fontSize="3.2" fontWeight="700" className="font-mono fill-zinc-700 dark:fill-zinc-300">
                    {val}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap gap-1 min-h-[28px]">
          {heap.slice(0, 15).map((val, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-mono font-bold transition-all duration-500 border",
                highlighted.swap.includes(idx)
                  ? "bg-amber-100 border-amber-400 text-amber-700"
                  : idx === 0
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 text-zinc-600"
              )}
            >
              [{idx}] {val}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
          title="Reset"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          onClick={handleExtract}
          disabled={animating || heap.length === 0}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-500"
        >
          Extract {isMin ? "Min" : "Max"}
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">
          {animating ? "Sifting to restore heap property…" : "Insert a value and watch it bubble up"}
        </span>
        <button
          onClick={handleInsert}
          disabled={animating || heap.length >= 15}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
        >
          Insert
        </button>
      </div>
    </div>
  );
}
