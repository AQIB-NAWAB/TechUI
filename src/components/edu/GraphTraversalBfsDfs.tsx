"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitBranch, RefreshCw, StepForward } from "lucide-react";

export const GraphTraversalBfsDfsSchema = z.object({
  name: z.string().optional().default("Graph Traversal"),
  algorithm: z.enum(["bfs", "dfs"]).optional().default("bfs"),
  startNode: z.string().optional().default("A"),
  interactive: z.boolean().optional().default(true),
});

export type GraphTraversalBfsDfsProps = z.infer<typeof GraphTraversalBfsDfsSchema>;

const EDGES: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["D", "E"],
  C: ["F"],
  D: [],
  E: [],
  F: [],
};

const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 50, y: 12 },
  B: { x: 25, y: 45 },
  C: { x: 75, y: 45 },
  D: { x: 12, y: 82 },
  E: { x: 38, y: 82 },
  F: { x: 75, y: 82 },
};

function buildSteps(start: string, algo: "bfs" | "dfs"): { node: string; queue: string[]; stack: string[] }[] {
  const steps: { node: string; queue: string[]; stack: string[] }[] = [];
  const visited = new Set<string>();
  const queue: string[] = [start];
  const stack: string[] = [start];

  if (algo === "bfs") {
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node)) continue;
      visited.add(node);
      steps.push({ node, queue: [...queue], stack: [...stack] });
      for (const neighbor of EDGES[node] ?? []) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }
  } else {
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (visited.has(node)) continue;
      visited.add(node);
      steps.push({ node, queue: [...queue], stack: [...stack] });
      for (const neighbor of [...(EDGES[node] ?? [])].reverse()) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }
  }

  return steps;
}

export function GraphTraversalBfsDfs({
  name = "Graph Traversal",
  algorithm = "bfs",
  startNode = "A",
  interactive = true,
}: GraphTraversalBfsDfsProps) {
  const steps = useMemo(() => buildSteps(startNode, algorithm), [startNode, algorithm]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visited = stepIndex >= 0 ? steps.slice(0, stepIndex + 1).map((s) => s.node) : [];
  const current = stepIndex >= 0 ? steps[stepIndex] : null;
  const isDone = stepIndex >= steps.length - 1;
  const structure = algorithm === "bfs" ? current?.queue ?? [startNode] : current?.stack ?? [startNode];

  useEffect(() => {
    setStepIndex(-1);
    setPlaying(false);
    setFlash(null);
  }, [algorithm, startNode]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        const next = prev + 1;
        setFlash(steps[next].node);
        setTimeout(() => setFlash(null), 500);
        return next;
      });
    }, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, steps]);

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStepIndex(-1);
    setPlaying(false);
    setFlash(null);
  }

  function stepOnce() {
    if (isDone) return;
    const next = stepIndex + 1;
    setStepIndex(next);
    setFlash(steps[next].node);
    setTimeout(() => setFlash(null), 500);
  }

  function autoPlay() {
    if (isDone) reset();
    setPlaying(true);
  }

  const edgeLines = Object.entries(EDGES).flatMap(([from, tos]) =>
    tos.map((to) => ({ from, to }))
  );

  return (
    <div className={cn(
      "rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-500",
      flash ? "border-blue-300 dark:border-blue-800" : "border-zinc-200 dark:border-zinc-800"
    )}>
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <GitBranch className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase">{algorithm}</span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 min-h-[240px] flex gap-5 items-start">
        {/* Graph canvas */}
        <div className="relative w-44 h-36 shrink-0 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            {edgeLines.map(({ from, to }) => {
              const p1 = POSITIONS[from];
              const p2 = POSITIONS[to];
              const visitedEdge = visited.includes(from) && visited.includes(to);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="currentColor"
                  strokeWidth={visitedEdge ? 2 : 1}
                  className={cn(
                    "transition-all duration-500",
                    visitedEdge ? "text-blue-400 dark:text-blue-500" : "text-zinc-200 dark:text-zinc-700"
                  )}
                />
              );
            })}
          </svg>
          {Object.entries(POSITIONS).map(([id, pos]) => {
            const isVisited = visited.includes(id);
            const isCurrent = current?.node === id;
            const isFlashing = flash === id;
            return (
              <div
                key={id}
                className={cn(
                  "absolute size-7 -ml-3.5 -mt-3.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                  isCurrent || isFlashing
                    ? "border-blue-500 bg-blue-500 text-white scale-110 ring-2 ring-blue-300 dark:ring-blue-700"
                    : isVisited
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400"
                )}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {id}
              </div>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Visit order */}
          <div>
            <div className="text-[10px] text-zinc-400 mb-1.5">Visit order</div>
            <div className="flex gap-1.5 flex-wrap min-h-[24px]">
              {visited.length === 0 && (
                <span className="text-[10px] text-zinc-400">No nodes visited yet</span>
              )}
              {visited.map((n, i) => (
                <span
                  key={`${n}-${i}`}
                  className={cn(
                    "size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                    i === visited.length - 1
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  )}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Queue / Stack */}
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
              {algorithm === "bfs" ? "Queue (FIFO)" : "Stack (LIFO)"}
            </div>
            <div className="px-3 py-2 flex gap-1.5 flex-wrap min-h-[36px] items-center">
              {structure.length === 0 && stepIndex >= 0 && (
                <span className="text-[10px] text-zinc-400">Empty</span>
              )}
              {stepIndex < 0 && (
                <span className="text-[10px] font-mono text-zinc-500">{startNode}</span>
              )}
              {stepIndex >= 0 && structure.map((n, i) => (
                <span
                  key={`${n}-${i}`}
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border transition-all duration-500",
                    algorithm === "bfs" && i === 0
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : algorithm === "dfs" && i === structure.length - 1
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                  )}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
              <div className="text-zinc-400">Step</div>
              <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                {stepIndex < 0 ? "—" : `${stepIndex + 1}`} / {steps.length}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
              <div className="text-zinc-400">Start node</div>
              <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{startNode}</div>
            </div>
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {isDone
              ? `${algorithm.toUpperCase()} complete — visited ${visited.length} nodes.`
              : stepIndex < 0
              ? `${algorithm === "bfs" ? "BFS explores level-by-level using a queue." : "DFS dives deep using a stack."} Step through or auto-play.`
              : `Visiting node ${current?.node} — ${algorithm === "bfs" ? "dequeue front, enqueue neighbors" : "pop top, push neighbors"}.`}
          </span>
          <button
            onClick={stepOnce}
            disabled={playing || isDone}
            className="px-3 py-2 rounded-lg text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50"
          >
            <StepForward className="size-4" />
          </button>
          <button
            onClick={autoPlay}
            disabled={playing}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50",
              isDone
                ? "bg-emerald-500 text-white"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {playing ? "Playing…" : isDone ? "Replay" : "Auto-play"}
          </button>
        </div>
      )}
    </div>
  );
}
