"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Waves, Play, RotateCcw } from "lucide-react";

export const ReactiveStreamsSchema = z.object({
  pipeline: z.enum(["map", "filter", "debounce", "merge"]).default("map"),
});

export type ReactiveStreamsProps = z.infer<typeof ReactiveStreamsSchema>;

type MarbleEvent = {
  id: number;
  value: number;
  position: number; // 0-100 percentage along timeline
  color: string;
  visible: boolean;
  ghost?: boolean; // filtered out
  source?: "A" | "B"; // for merge
};

type AnimStep = {
  inputEvents: MarbleEvent[];
  outputEvents: MarbleEvent[];
};

const COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

const PIPELINE_CONFIG = {
  map: {
    label: "map",
    code: "map(x => x * 2)",
    description: "Transforms every event — doubles each value",
    insight: "map applies a pure function to every event in the stream, emitting one output per input.",
    inputValues: [1, 2, 3, 4],
    outputValues: [2, 4, 6, 8],
    inputPositions: [10, 32, 55, 78],
    outputPositions: [10, 32, 55, 78],
  },
  filter: {
    label: "filter",
    code: "filter(x => x % 2 === 0)",
    description: "Only even numbers pass through — odd ones are dropped",
    insight: "filter drops events that don't match the predicate. No output event is emitted for dropped inputs.",
    inputValues: [1, 2, 3, 4, 5, 6],
    outputValues: [2, 4, 6],
    inputPositions: [8, 22, 36, 50, 64, 78],
    outputPositions: [22, 50, 78],
    ghostPositions: [8, 36, 64],
  },
  debounce: {
    label: "debounce",
    code: "debounce(300ms)",
    description: "Only emits after 300ms of silence — ignores rapid bursts",
    insight: "debounce waits for a quiet period before emitting. Useful for search inputs — only fires after you stop typing.",
    inputValues: [1, 2, 3, 4, 5],
    outputValues: [3, 5],
    inputPositions: [8, 18, 28, 60, 78],
    outputPositions: [38, 88],
    burstGroups: [[8, 18, 28], [60, 78]],
  },
  merge: {
    label: "merge",
    code: "merge(streamA, streamB)",
    description: "Combines two streams — events from both appear in order",
    insight: "merge subscribes to multiple streams simultaneously, emitting events from any source as they arrive.",
    streamA: { values: [1, 3, 5], positions: [10, 38, 70], color: "bg-blue-500" },
    streamB: { values: [2, 4, 6], positions: [24, 55, 85], color: "bg-violet-500" },
    outputOrder: [
      { val: 1, pos: 10, src: "A" as const },
      { val: 2, pos: 24, src: "B" as const },
      { val: 3, pos: 38, src: "A" as const },
      { val: 4, pos: 55, src: "B" as const },
      { val: 5, pos: 70, src: "A" as const },
      { val: 6, pos: 85, src: "B" as const },
    ],
  },
};

function Timeline({
  label,
  events,
  showGhosts,
  ghostPositions,
  animProgress,
  streamColor,
}: {
  label: string;
  events: { value: number | string; position: number; color?: string; ghost?: boolean; source?: "A" | "B" }[];
  showGhosts?: { positions: number[]; values: number[] };
  animProgress: number; // 0-100
  streamColor?: string;
  ghostPositions?: number[];
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-16 shrink-0 text-right">{label}</span>
      <div className="flex-1 relative h-8">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 right-4 h-0.5 bg-zinc-200 dark:bg-zinc-700 -translate-y-1/2" />
        {/* Arrow */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 text-xs">▶</div>

        {/* Ghost events (filtered) */}
        {showGhosts?.positions.map((pos, i) => (
          <div
            key={`ghost-${i}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${Math.min(pos, animProgress) <= pos ? (animProgress >= pos ? pos : -10) : -10}%` }}
          >
            {animProgress >= pos && (
              <div className="size-6 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center opacity-40">
                <span className="text-[9px] font-mono text-zinc-400">{showGhosts.values[i]}</span>
              </div>
            )}
          </div>
        ))}

        {/* Events */}
        {events.map((ev, i) => {
          const show = animProgress >= ev.position;
          const colorClass = ev.source === "B" ? "bg-violet-500" : ev.source === "A" ? "bg-blue-500" : (ev.color || streamColor || COLORS[i % COLORS.length]);
          return (
            <div
              key={i}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500",
                show ? "opacity-100 scale-100" : "opacity-0 scale-50"
              )}
              style={{ left: `${ev.position}%` }}
            >
              <div className={cn("size-6 rounded-full flex items-center justify-center shadow-sm", colorClass)}>
                <span className="text-[9px] font-bold text-white">{ev.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReactiveStreams({ pipeline = "map" }: ReactiveStreamsProps) {
  const [activePipeline, setActivePipeline] = useState<keyof typeof PIPELINE_CONFIG>(pipeline);
  const [animProgress, setAnimProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = PIPELINE_CONFIG[activePipeline];

  const resetAnim = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current);
    setAnimProgress(0);
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    resetAnim();
    setIsAnimating(true);
    let progress = 0;
    animRef.current = setInterval(() => {
      progress += 2;
      setAnimProgress(progress);
      if (progress >= 100) {
        if (animRef.current) clearInterval(animRef.current);
        setIsAnimating(false);
      }
    }, 60);
  }, [resetAnim]);

  useEffect(() => {
    resetAnim();
    setAnimProgress(100); // show full diagram on tab change
  }, [activePipeline, resetAnim]);

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  const tabs = (["map", "filter", "debounce", "merge"] as const);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70">
        <Waves className="size-3.5 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Reactive Streams</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono">marble diagram</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-4 gap-1 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActivePipeline(tab); }}
            className={cn(
              "px-3 py-1.5 text-[11px] font-mono font-semibold rounded-t-md transition-all duration-300 border-b-2",
              activePipeline === tab
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 border-transparent"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Diagram area */}
      <div className="min-h-[280px] px-4 py-4 flex flex-col gap-2">

        {/* Map pipeline */}
        {activePipeline === "map" && (
          <>
            <Timeline
              label="Input"
              events={PIPELINE_CONFIG.map.inputValues.map((v, i) => ({
                value: v,
                position: PIPELINE_CONFIG.map.inputPositions[i]!,
                color: COLORS[i % COLORS.length],
              }))}
              animProgress={animProgress}
            />
            <div className="flex items-center gap-3 py-1">
              <span className="w-16 shrink-0" />
              <div className="flex-1 flex items-center justify-center">
                <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                  {PIPELINE_CONFIG.map.code}
                </code>
              </div>
            </div>
            <Timeline
              label="Output"
              events={PIPELINE_CONFIG.map.outputValues.map((v, i) => ({
                value: v,
                position: PIPELINE_CONFIG.map.outputPositions[i]!,
                color: COLORS[i % COLORS.length],
              }))}
              animProgress={animProgress}
            />
          </>
        )}

        {/* Filter pipeline */}
        {activePipeline === "filter" && (
          <>
            <Timeline
              label="Input"
              events={PIPELINE_CONFIG.filter.inputValues.map((v, i) => ({
                value: v,
                position: PIPELINE_CONFIG.filter.inputPositions[i]!,
                color: v % 2 === 0 ? "bg-emerald-500" : "bg-rose-400",
              }))}
              animProgress={animProgress}
            />
            <div className="flex items-center gap-3 py-1">
              <span className="w-16 shrink-0" />
              <div className="flex-1 flex items-center justify-center">
                <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                  {PIPELINE_CONFIG.filter.code}
                </code>
              </div>
            </div>
            <Timeline
              label="Output"
              events={PIPELINE_CONFIG.filter.outputValues.map((v, i) => ({
                value: v,
                position: PIPELINE_CONFIG.filter.outputPositions[i]!,
                color: "bg-emerald-500",
              }))}
              showGhosts={{
                positions: PIPELINE_CONFIG.filter.ghostPositions!,
                values: [1, 3, 5],
              }}
              animProgress={animProgress}
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-20 flex items-center gap-1">
              <span className="size-3 rounded-full border border-dashed border-zinc-300 inline-block" />
              Odd values dropped — no output emitted
            </p>
          </>
        )}

        {/* Debounce pipeline */}
        {activePipeline === "debounce" && (
          <>
            <Timeline
              label="Input"
              events={PIPELINE_CONFIG.debounce.inputValues.map((v, i) => ({
                value: v,
                position: PIPELINE_CONFIG.debounce.inputPositions[i]!,
                color: PIPELINE_CONFIG.debounce.burstGroups?.[0]?.includes(PIPELINE_CONFIG.debounce.inputPositions[i]!)
                  ? "bg-amber-400"
                  : "bg-violet-500",
              }))}
              animProgress={animProgress}
            />
            <div className="flex items-center gap-3 py-1">
              <span className="w-16 shrink-0" />
              <div className="flex-1 flex items-center justify-center">
                <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                  {PIPELINE_CONFIG.debounce.code}
                </code>
              </div>
            </div>
            <Timeline
              label="Output"
              events={PIPELINE_CONFIG.debounce.outputValues.map((v, i) => ({
                value: v,
                position: PIPELINE_CONFIG.debounce.outputPositions[i]!,
                color: "bg-violet-500",
              }))}
              animProgress={animProgress}
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-20">
              Rapid burst → only last value emits after silence
            </p>
          </>
        )}

        {/* Merge pipeline */}
        {activePipeline === "merge" && cfg && "streamA" in cfg && (
          <>
            <Timeline
              label="Stream A"
              events={cfg.streamA.values.map((v, i) => ({
                value: v,
                position: cfg.streamA.positions[i]!,
                color: "bg-blue-500",
              }))}
              animProgress={animProgress}
            />
            <Timeline
              label="Stream B"
              events={cfg.streamB.values.map((v, i) => ({
                value: v,
                position: cfg.streamB.positions[i]!,
                color: "bg-violet-500",
              }))}
              animProgress={animProgress}
            />
            <div className="flex items-center gap-3 py-1">
              <span className="w-16 shrink-0" />
              <div className="flex-1 flex items-center justify-center">
                <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                  {cfg.code}
                </code>
              </div>
            </div>
            <Timeline
              label="Output"
              events={cfg.outputOrder.map((ev) => ({
                value: ev.val,
                position: ev.pos,
                source: ev.src,
              }))}
              animProgress={animProgress}
            />
          </>
        )}

        {/* Insight callout */}
        <div className="mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-start gap-2">
          <span className="text-[10px] font-bold text-blue-500 shrink-0 mt-0.5">TIP</span>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {"insight" in cfg ? cfg.insight : ""}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
        <button
          onClick={startAnim}
          disabled={isAnimating}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300",
            isAnimating
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          <Play className="size-3" />
          Animate
        </button>
        <button
          onClick={() => { resetAnim(); setAnimProgress(100); }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto font-mono">
          {"code" in cfg ? cfg.code : ""}
        </span>
      </div>
    </div>
  );
}
