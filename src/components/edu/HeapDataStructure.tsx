"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

export const HeapDataStructureSchema = z.object({
  type: z.enum(["min", "max"]).default("min"),
  initialValues: z.array(z.number()).default([1, 4, 2, 8, 5, 7, 3]),
});

export type HeapDataStructureProps = z.infer<typeof HeapDataStructureSchema>;

// Heapify up from index i
function heapifyUp(arr: number[], i: number, isMin: boolean): number[][] {
  const steps: number[][] = [];
  const heap = [...arr];
  let idx = i;
  while (idx > 0) {
    const parent = Math.floor((idx - 1) / 2);
    const shouldSwap = isMin ? heap[idx] < heap[parent] : heap[idx] > heap[parent];
    if (shouldSwap) {
      steps.push([...heap, idx, parent]); // last two are swap indices
      [heap[idx], heap[parent]] = [heap[parent], heap[idx]];
      idx = parent;
    } else {
      break;
    }
  }
  steps.push([...heap, -1, -1]);
  return steps;
}

// Heapify down from index 0
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

// Tree layout for up to 15 nodes (4 levels)
const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 50, y: 8 },           // 0 - root
  { x: 25, y: 30 },          // 1
  { x: 75, y: 30 },          // 2
  { x: 12, y: 54 },          // 3
  { x: 38, y: 54 },          // 4
  { x: 62, y: 54 },          // 5
  { x: 88, y: 54 },          // 6
  { x: 6,  y: 78 },          // 7
  { x: 19, y: 78 },          // 8
  { x: 31, y: 78 },          // 9
  { x: 44, y: 78 },          // 10
  { x: 56, y: 78 },          // 11
  { x: 69, y: 78 },          // 12
  { x: 81, y: 78 },          // 13
  { x: 94, y: 78 },          // 14
];

const EDGES: Array<[number, number]> = [
  [0,1],[0,2],[1,3],[1,4],[2,5],[2,6],
  [3,7],[3,8],[4,9],[4,10],[5,11],[5,12],[6,13],[6,14],
];

const INSERT_PRESETS = [0, 6, 9, 10, 15, 20, 11, 3, 13, 25];
let insertIdx = 0;

export function HeapDataStructure({
  type = "min",
  initialValues = [1, 4, 2, 8, 5, 7, 3],
}: HeapDataStructureProps) {
  const isMin = type === "min";
  const [heap, setHeap] = useState<number[]>(() => buildHeap(initialValues, isMin));
  const [highlighted, setHighlighted] = useState<{ swap: number[]; compare: number[] }>({ swap: [], compare: [] });
  const [animating, setAnimating] = useState(false);
  const [lastOp, setLastOp] = useState<string>("");
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHeap(buildHeap(initialValues, isMin));
    setLastOp("");
    setHighlighted({ swap: [], compare: [] });
  }, [initialValues, isMin]);

  const runSteps = useCallback((steps: number[][], opLabel: string) => {
    setAnimating(true);
    setLastOp(opLabel);
    let i = 0;
    function next() {
      if (i >= steps.length) {
        setHighlighted({ swap: [], compare: [] });
        setAnimating(false);
        return;
      }
      const step = steps[i];
      const heapPart = step.slice(0, step.length - 2);
      const swapA = step[step.length - 2];
      const swapB = step[step.length - 1];
      setHeap(heapPart);
      if (swapA >= 0) {
        setHighlighted({ swap: [swapA, swapB], compare: [] });
      } else {
        setHighlighted({ swap: [], compare: [] });
      }
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
    const steps = heapifyUp(newHeap, newHeap.length - 1, isMin);
    // Start from the new array state
    steps[0] = [...steps[0]]; // already includes newHeap data
    runSteps(steps, `Insert ${val} → sift-${isMin ? "up" : "up"}`);
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
    const steps = heapifyDown(newHeap, isMin);
    runSteps(steps, `Extract ${isMin ? "min" : "max"} (${extracted}) → sift-down`);
  }, [animating, heap, isMin, runSteps]);

  const handleReset = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    setAnimating(false);
    setHeap(buildHeap(initialValues, isMin));
    setLastOp("");
    setHighlighted({ swap: [], compare: [] });
  }, [initialValues, isMin]);

  const maxNodes = Math.min(heap.length, 15);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <TrendingDown className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          {isMin ? "Min" : "Max"}-Heap / Priority Queue
        </span>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {heap.length} nodes · O(log n)
        </span>
      </div>

      {/* Interactive area */}
      <div className="min-h-[300px] flex flex-col px-4 pt-3 pb-3 gap-3">

        {/* Operation status */}
        <div className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-500 min-h-[30px] flex items-center",
          lastOp
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700"
        )}>
          {lastOp || `${isMin ? "Min" : "Max"}-heap ready — root is always the ${isMin ? "smallest" : "largest"} value`}
          {animating && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
        </div>

        {/* Tree SVG */}
        <div className="relative w-full" style={{ height: "160px" }}>
          <svg
            viewBox="0 0 100 90"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Edges */}
            {EDGES.map(([from, to]) => {
              if (from >= maxNodes || to >= maxNodes) return null;
              const p1 = NODE_POSITIONS[from];
              const p2 = NODE_POSITIONS[to];
              const isSwapEdge =
                (highlighted.swap.includes(from) && highlighted.swap.includes(to));
              return (
                <line
                  key={`${from}-${to}`}
                  x1={p1.x} y1={p1.y + 3}
                  x2={p2.x} y2={p2.y - 3}
                  className={cn(
                    "transition-all duration-500",
                    isSwapEdge
                      ? "stroke-amber-400"
                      : "stroke-zinc-300 dark:stroke-zinc-700"
                  )}
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Nodes */}
            {heap.slice(0, 15).map((val, idx) => {
              const pos = NODE_POSITIONS[idx];
              const isRoot = idx === 0;
              const isSwap = highlighted.swap.includes(idx);
              const isCompare = highlighted.compare.includes(idx);

              let fillClass = "fill-white dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600";
              let textClass = "fill-zinc-700 dark:fill-zinc-300";
              if (isRoot && !isSwap) {
                fillClass = "fill-blue-100 dark:fill-blue-900/50 stroke-blue-500";
                textClass = "fill-blue-700 dark:fill-blue-300";
              }
              if (isSwap) {
                fillClass = "fill-amber-100 dark:fill-amber-900/50 stroke-amber-500";
                textClass = "fill-amber-700 dark:fill-amber-300";
              }
              if (isCompare) {
                fillClass = "fill-emerald-100 dark:fill-emerald-900/50 stroke-emerald-500";
                textClass = "fill-emerald-700 dark:fill-emerald-300";
              }

              return (
                <g key={idx} className="transition-all duration-500">
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={4.2}
                    className={cn("stroke-[0.8] transition-all duration-500", fillClass)}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 1.3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="3.2"
                    fontWeight="700"
                    className={cn("transition-all duration-500 font-mono", textClass)}
                  >
                    {val}
                  </text>
                  {isRoot && (
                    <text
                      x={pos.x + 5.5}
                      y={pos.y - 2}
                      textAnchor="start"
                      fontSize="2.2"
                      className="fill-blue-500 dark:fill-blue-400 font-medium"
                    >
                      root
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex items-center gap-2 text-[9px] text-zinc-400">
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> root
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> swapping
            </span>
          </div>
        </div>

        {/* Array representation */}
        <div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1 font-mono">Array representation:</div>
          <div className="flex flex-wrap gap-1">
            {heap.slice(0, 15).map((val, idx) => {
              const isSwap = highlighted.swap.includes(idx);
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs font-mono font-bold transition-all duration-500 border",
                    isSwap
                      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-700 dark:text-amber-300"
                      : idx === 0
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mr-0.5">[{idx}]</span>
                  {val}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <button
            onClick={handleInsert}
            disabled={animating || heap.length >= 15}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Insert (sift-up)
          </button>
          <button
            onClick={handleExtract}
            disabled={animating || heap.length === 0}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Extract {isMin ? "Min" : "Max"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          Heap property: every parent is {isMin ? "smaller" : "larger"} than its children ({isMin ? "min" : "max"}-heap).
          Insert and extract-{isMin ? "min" : "max"} are both <strong className="text-zinc-600 dark:text-zinc-300">O(log n)</strong> — tree height swaps only.
        </div>
      </div>
    </div>
  );
}
